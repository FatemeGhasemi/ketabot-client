function getRandomString(stringLength) {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < stringLength; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}




const redis = require("redis")
const redisClient = redis.createClient()
const HashMap = require('hashmap');
let map;
const bookClientMap = "bookMap";
redisClient.get(bookClientMap, function (error, result) {
    if (error != null || result == null) {
        map = new HashMap()
    } else {
        map = new HashMap(JSON.parse(result))
    }
})



const deepLink=(text)=>{
    return text.split(' ')[1].split('-')[1]
};


const addValueToMap=(key, value) =>{
    map.set(key,value) 
};

function getValueFromMap(key) {
    return map.get(key)
   
}










module.exports ={

    "getRandomString":getRandomString,
    "addValueToMap": addValueToMap,
    "getValueFromMap":getValueFromMap,
    "deepLink":deepLink
};