const HashMap = require('hashmap');
const redis = require("redis");
const redisClient = redis.createClient({
    port:process.env.REDIS_PORT,
    host:process.env.REDIS_HOST,
    name:process.env.REDIS_DB,
    password:process.env.REDIS_PASSWORD
});

let map;
const bookClientMap = "bookMap";

redisClient.get(bookClientMap, function (error, result) {
    if (error != null || result == null) {
        map = new HashMap()
    } else {
        map = new HashMap(JSON.parse(result))
    }
});

const addValueToMap = (key, value) => {
    map.set(key, value)
};

const getValueFromMap = (key) => {
    return map.get(key)
};


module.exports = {
    "addValueToMap": addValueToMap,
    "getValueFromMap": getValueFromMap,
};