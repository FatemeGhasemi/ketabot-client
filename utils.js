function getRandomString(stringLength) {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < stringLength; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}


const deepLink = (text) => {
    return text.split(' ')[1].split('-')[1]
};


module.exports = {
    "getRandomString": getRandomString,
    "deepLink": deepLink
};