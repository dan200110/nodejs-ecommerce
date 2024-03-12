const { convertToObjectIdMongodb } = require('../../utils')
const inventoryModel = require('../inventory.model')
const {Types} = require('mongoose')

const insertInventory = async ({

    productId, shopId, stock, location = 'unKnow'
}) => {
    return await inventoryModel.create({
        inventory_product_id: new Types.ObjectId(productId),
        inventory_location: location,
        inventory_shop_id: new Types.ObjectId(shopId),
        inventory_stock: stock,
    })
}

const reservationInventory = async ({ productId, quantity, cartId} ) => {
    const query = {
        inventory_product_id: convertToObjectIdMongodb(productId),
        inventory_stock: {$gte: quantity}
    }, updateSet = {
        $inc: {
            inventory_stock: -quantity
        },
        $push: {
            inventory_reservations: {
                quantity,
                cartId,
                createdOn
            }
        }
    }, options = { upsert: true, new: true }

    return await inventoryModel.updateOne(query, updateSet)
}
module.exports = {
    insertInventory,
    reservationInventory
}
