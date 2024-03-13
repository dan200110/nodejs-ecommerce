const redis = require('redis');
const { redis: { host, port, username, password } } = require('./config');

class RedisConf {
    constructor() {
        this.connect();
    }

    connect() {
        this.client = redis.createClient({
            port: port,
            host: 'ec-redis'
        });

        this.client.on('connect', () => {
            console.log(`Connected: Redis connected host ${host} port ${port}!`);
        });

        this.client.on('error', (error) => {
            console.log(`Error: Redis connection error - ${error}`);
        });
    }

    static getInstance() {
        if (!RedisConf.instance) {
            RedisConf.instance = new RedisConf();
        }

        return RedisConf.instance.client;
    }
}

module.exports = RedisConf.getInstance();
