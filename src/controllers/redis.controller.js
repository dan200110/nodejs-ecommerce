const redisClient = require('../configs/config.redis');

// Wrap the usage of Redis client in an async function
const useRedisClient = async () => {
    // const redisClient = await redisClientPromise;

    // Ensure the Redis client is not a Promise, as it should be the resolved client
    if (typeof redisClient !== 'object' || redisClient === null) {
        console.error('Error: Redis client not properly resolved.');
        return;
    }

    // Use the Redis client directly
    redisClient.set('key', 'value', (err, reply) => {
        if (err) {
            console.error(`Error setting key: ${err}`);
        } else {
            console.log(`Set key: ${reply}`);
        }
    });

    redisClient.get('key', (err, reply) => {
        if (err) {
            console.error(`Error getting key: ${err}`);
        } else {
            console.log(`Value for key: ${reply}`);
        }
    });

    // redisClient.del('key', (err, reply) => {
    //     if (err) {
    //         console.error(`Error deleting key: ${err}`);
    //     } else {
    //         console.log(`Deleted key: ${reply}`);
    //     }
    // });
};

// Call the function
useRedisClient();
