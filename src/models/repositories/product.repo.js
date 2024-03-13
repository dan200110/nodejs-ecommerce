const { product } = require("../product.model")
const {Types} = require("mongoose")
const {convertToObjectIdMongodb} = require("../../utils");
const {BusinessLogicError} = require("../../core/error.response");
const ApiFeatures = require("./../../utils/api-feature.util")

const publishProductByShop = async ({product_shop, product_id}) => {
    // find one
    const foundShop = await product.findOne({
        product_shop: new Types.ObjectId(product_shop),
        _id: new Types.ObjectId(product_id),
    })

    if (!foundShop) return foundShop

    // update isDraft, isPublish
    foundShop.isDraft = false
    foundShop.isPublished = true

    const {modifiedCount} = await foundShop.update(foundShop)

    return modifiedCount;
}

const findAllDraftsForShop = async({query, limit, skip}) => {
    return await queryProduct({query, limit, skip})
}

const findAllPublishForShop = async({query, limit, skip}) => {
    return await queryProduct({query, limit, skip})
}

// search full text
const searchProductByUser = async({keySearch}) => {


    const regexSearch = new RegExp(keySearch)
    return await product.find({
        isPublished: true,
        $text: {$search: regexSearch}
    }, {score: {$meta: 'textScore'}})
        .sort({score: {$meta: 'textScore'}})
        .lean()
}

const findAllProducts = async({limit, sort, page, filter, select}) => {
    const skip = (page - 1) * limit
    const sortBy = sort === 'ctime' ? {_id: -1} : {_id: 1}
    return await product.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .select(select)
        .lean();
}



const findById = async(product_id, unSelect) => {
    return await product.findById(product_id).select(unSelect)
}

const queryProduct = async({query, limit, skip}) => {
    return await product.find(query)
        .populate('product_shop', 'name email -_id')
        .sort({ updateAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec()
}

const updateProductById = async ({
    productId,
    bodyUpdate,
    model,
    isNew = true
}) => {
    return await model.findByIdAndUpdate(productId, bodyUpdate, {
        new: isNew
    })
}

const getProductById = async (productId) => {
    return await product.findOne({_id: convertToObjectIdMongodb(productId)}).lean()
}

const getProductsByIds = async (productIds) => {
    const products = await product.find({ _id: { $in: productIds } });

    // Map the products to an array of relevant details
    const productDetails = products.map(product => ({
      productId: product._id.toString(),
      productName: product.product_name,
      productPrice: product.product_price,
      productThumb: product.product_thumb
      // Add other relevant details as needed
    }));

    return productDetails;
}

const checkProductByServer = async (products) => {
    return await Promise.all(
        products.map( async product => {
            const foundProduct = await getProductById(product.productId)

            if (foundProduct && foundProduct.product_quality >= product.quantity) {
                return {
                    price: foundProduct.product_price,
                    quantity: product.quantity,
                    productId: product.productId
                }
            }

            throw new BusinessLogicError(`Product with ID ${product.productId} error`);
        })
    )
}

/**
 * ?a[gte]=2&b[gt]=3&c[lte]=5&d[lt]=6
 *
 * @param queryInput
 * @return {Promise<void>}
 */
const advancedSearch = async (queryInput) => {
    const excludedFields = ['page', 'sort', 'size', 'fields'];
    excludedFields.forEach(el => delete queryInput[el]);

    //1. advanced filtering
    let queryStr = JSON.stringify(queryInput);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
    queryStr = JSON.parse(queryStr);

    console.log(queryStr)
    let query = product.find(queryStr);

    //2. sorting
    if (queryInput.sort) {
        const sortBy = queryInput.sort.split(',').join(' ')
        console.log(sortBy)
        query = query.sort(sortBy)
    } else {
        query = query.sort('-createdAt')
    }

    //3. field limiting
    if (queryInput.fields) {
        const fields = queryInput.fields.split(',').join(' ')
        query = query.select(fields)
    } else {
        query = query.select('-__v')
    }

    //4. paging
    // page=0&size=10
    const page = queryInput.page * 1 || 1;
    const size = queryInput.size * 1 || 100;
    const offset = (page - 1) * size;

    query = query.skip(offset).limit(size)

    if (queryInput.page) {
        const total = await product.countDocuments();
        if (offset >= total) throw new BusinessLogicError('This page does not exists')
    }

    return await query;
}


const advancedSearchV2 = async (queryInput) => {
    const features = new ApiFeatures(product.find(), queryInput)
        .filter()
        .sort()
        .limitFields()
        .paging()

    return await features.query;
}

const reduceQuantityAfterOrderSuccess = async ({ productId, quantity} ) => {
    const query = {
        _id: convertToObjectIdMongodb(productId),
        product_quality: {$gte: quantity},
        isPublished: true
    }, updateSet = {
        $inc: {
            product_quality: -quantity
        }
    }, options = { upsert: true, new: true }

    return await product.updateOne(query, updateSet)
}

module.exports = {
    findAllDraftsForShop,
    findAllPublishForShop,
    publishProductByShop,
    searchProductByUser,
    findAllProducts,
    findById,
    updateProductById,
    getProductById,
    checkProductByServer,
    advancedSearch,
    advancedSearchV2,
    reduceQuantityAfterOrderSuccess,
    getProductsByIds
}
