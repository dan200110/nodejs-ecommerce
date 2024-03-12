'use strict'

const redis = require('redis')
const { promisify } = require('util')
const { reservationInventory } = require('../models/repositories/inventory.repo')
const redisClient = redis.createClient()
const pexpire = promisify(redisClient.pexpire).bind(redisClient)
const setnxAsync = promisify(redisClient.setnx).bind(redisClient)

const acquireLock = async (productId, quantity, cartId) => {
    const key = `lock_v2023_${productId}`
    const retryTimes = 5
    const expireTime = 1000

    console.log('product id is', productId);
    console.log('quantity id is', quantity);
    console.log('cartId id is', cartId);
    console.log('key id is', key);



    for(let i = 0; i < retryTimes; i++) {
        const result = await setnxAsync(key, expireTime)
        console.log('result setnx is', result);
        if (result === 1) {
            const isReservation = await reservationInventory({
                productId, quantity, cartId
            })
            if(isReservation.modifiedCount){
                await pexpire(key, expireTime)
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
