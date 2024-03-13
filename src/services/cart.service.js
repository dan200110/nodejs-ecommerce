const cartModel = require('../models/cart.model')
const {getProductById, getProductsByIds} = require("../models/repositories/product.repo");
const {Api404Error} = require("../core/error.response");
const { convertToObjectIdMongodb } = require('../utils');

/**
 * - Add product to cart - user
 * - Reduce product quantity by one - user
 * - increase product quantity by one - user
 * - get cart - user
 * - delete cart - user
 * - delete cart item - user
 */
class CartService {

    static async createUserCart({userId, product}) {
        const query = {
            cart_user_id: userId, cart_state: 'active'
        }

        const updateOrInsert = {
            $addToSet: {
                cart_products: product
            }
        }, options = {upsert: true, new: true}


        return await cartModel.findOneAndUpdate(query, updateOrInsert, options)
    }


    static async updateUserCartQuantity({userId, product}) {
        const {productId, quantity} = product
        const query = {
            cart_user_id: userId,
            'cart_products.productId': productId,
            cart_state: 'active'
        }, updateSet = {
            $inc: {
                'cart_products.$.quantity': quantity
            }
        }, options = {upsert: true, new: true}
        return await cartModel.findOneAndUpdate(query, updateSet, options)
    }

    static async addToCart({ userId, product = {} }){
        const userCart = await cartModel.findOne({
            cart_user_id: userId
        })

        if (!userCart) {
            // create cart for User
            return await CartService.createUserCart({userId, product})
        }

        // Check if the product is already in the cart
        const isProductInCart = userCart.cart_products.some(
            (cartProduct) => cartProduct.productId === product.productId
        );

        if (!isProductInCart) {
            // Add the product to cart_products
            userCart.cart_products.push(product);
            return await userCart.save();
        }

        // gio hang ton tai, va co san pham nay thi update quantity
        return await CartService.updateUserCartQuantity({userId, product})
    }

    // update cart
    /**
     * shop_order_ids: [
     *  {
     *      userId,
     *      shopId,
     *      item_products: [
     *          {
     *              quantity,
     *              price,
     *              shopId,
     *              old_quantity,
     *              productId
     *          }
     *      ],
     *      version
     *  }
     * ]
     */
    static async addToCartV2({userId, shop_order_ids = []}) {

        console.log("########### Call add to cart v2", userId);
        const {productId, quantity, old_quantity} = shop_order_ids[0]?.item_products[0]

        // check product
        const foundProduct = await getProductById(productId)
        if (!foundProduct) throw new Api404Error('Product not found')

        // compare
        if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId) {
            throw new Api404Error('Product do not belong to the shop')
        }

        if (quantity === 0) {
            // todo deleted
        }


        return await CartService.updateUserCartQuantity({
            userId,
            product: {
                productId,
                quantity: quantity - old_quantity
            }
        })
    }

    static async deleteItemInCart({userId, productId}) {
        const query = {cart_user_id: userId, cart_state: 'active'}
        const updateSet = {
            $pull: {
                cart_products: {
                    productId
                }
            }
        }

        return await cartModel.updateOne(query, updateSet)
    }

    static async getListUserCart({ userId }) {
        const userCart = await cartModel.findOne({
            cart_user_id: +userId
        }).lean();

        if (userCart && userCart.cart_products.length > 0) {
            // Extract product IDs from the cart
            const productIds = userCart.cart_products.map(product => product.productId);

            // Fetch product details in a single batch query
            const productDetails = await getProductsByIds(productIds);

            // Combine product details with the cart
            userCart.cart_products = userCart.cart_products.map(product => {
                const details = productDetails.find(detail => detail.productId === product.productId);
                return { ...product, ...details };
            });

            // Include the count of products
            userCart.cart_count_product = userCart.cart_products.length;
        }

        return userCart;
    }
}

module.exports = {
    CartService,
}
