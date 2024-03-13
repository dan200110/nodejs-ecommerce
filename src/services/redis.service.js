const { promisify } = require('util')
const { reservationInventory } = require('../models/repositories/inventory.repo')
const { reduceQuantityAfterOrderSuccess } = require('../models/repositories/product.repo')
const redisClient = require('../configs/config.redis');
const pexpire = promisify(redisClient.pexpire).bind(redisClient)
const setnxAsync = promisify(redisClient.setnx).bind(redisClient)

const acquireLock = async (productId, quantity, cartId) => {
    const key = `lock_v2023_${productId}`
    const retryTimes = 5
    const expireTime = 1000

    for(let i = 0; i < retryTimes; i++) {
        const result = await setnxAsync(key, expireTime)
        if (result === 1) {
            const isReservation = await reservationInventory({
                productId, quantity, cartId
            })

            const isReduceProductQuantity = await reduceQuantityAfterOrderSuccess({
                productId, quantity
            })

            await pexpire(key, expireTime)
            if(isReservation.modifiedCount && isReduceProductQuantity.modifiedCount){
                return key
            }
            return null;
        } else {
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
    }
}

const releaseLock = async keyLock => {
    const delAsyncKey = promisify(redisClient.del).bind(redisClient)
    return await delAsyncKey(keyLock)
}

module.exports = {
    acquireLock,
    releaseLock
}
