function getRandomString(stringLength) {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < stringLength; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}


const findBookIdFromText = (text) => {
    return text.split(' ')[1].split('-')[1]
};


const deepLinkGenerator = (bookId) => {
    return process.env.BOT_USERNAME + "/?start=id-" + bookId
};


const generateDownloadLink = (bookPath, partTitle) => {
    return `${process.env.CDN_BASE_URL}/${bookPath}/${partTitle}.mp3`.split(' ').join('_')
}



module.exports = {
    getRandomString,
    findBookIdFromText,
    deepLinkGenerator,
    generateDownloadLink
};
