'use strict'

const { BusinessLogicError } = require("../core/error.response")
const { inventoryModel } = require("../models/inventory.model")
const { getProductById } = require("../models/repositories/product.repo")
class InventoryService  {
    static async addStockToInventory({
        stock,
        productId,
        shopId,
        location = 'my default location'
    }) {
        const product = await getProductById(productId)
        if(!product) throw new BusinessLogicError('The product does not exists')

        const query = { inventory_shop_id: shopId, inventory_product_id: productId },
        updateSet = {
            $inc: {
                inventory_stock: stock
            },
            $set: {
                inventory_location: location
            }
        }, options = {upsert: true, new: true}

        return await inventoryModel.findOneAndUpdate( query, updateSet, options)
    }
}

module.exports = InventoryService
