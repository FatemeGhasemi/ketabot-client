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


function getRandomString(stringLength) {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < stringLength; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}


redisClient.on('connect', () => {
    console.log('Redis client connected');
});


redisClient.get(bookClientMap, (error, result) => {
    if (error != null || result == null) {
        map = new HashMap()
    } else {
        map = new HashMap(JSON.parse(result))
    }
})


const deepLink = (text) => {
    return text.split(' ')[1].split('-')[1]
};


const addValueToMap = (key, value) => {
    map.set(key, value)
};

const getValueFromMap = (key) => {
    return map.get(key)

}


module.exports = {

    "getRandomString": getRandomString,
    "addValueToMap": addValueToMap,
    "getValueFromMap": getValueFromMap,
    "deepLink": deepLink
};