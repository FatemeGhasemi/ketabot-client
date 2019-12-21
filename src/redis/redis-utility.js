const HashMap = require('hashmap');
const redis = require("redis");

let redisClient;

const getRedisClient = () => {
    if (!redisClient) {
        redisClient = redis.createClient({
            port: process.env.REDIS_PORT,
            host: process.env.REDIS_HOST,
            name: process.env.REDIS_DB,
            password: process.env.REDIS_PASSWORD
        });
    }
    return redisClient
};
const getFromRedis = (key) => {
    return new Promise((resolve, reject) => {
        getRedisClient().get(key, function (err, result) {
            if (err) {
                return reject(err)
            }
            console.log('----------Redis : ', JSON.parse(result))
            resolve(JSON.parse(result))
        })
    })
};


const setInRedis = (key, data) => {
    return new Promise((resolve, reject) => {
        getRedisClient().set(key, JSON.stringify(data), function (err, result) {
            if (err) {
                return reject(err)
            }
            resolve(result)
        })
    })
};


const removeFromRedis = (key) => {
    return new Promise((resolve, reject) => {
        getRedisClient().del(key, function (err, result) {
            if (err) {
                return reject(err)
            }
            resolve()
        })
    })
}

const setUserState = (key, value) => {
    return setInRedis(key, value)
};

const getUserState = (key) => {
    return getFromRedis(key)
};


module.exports = {
    setUserState,
    getUserState,
};
