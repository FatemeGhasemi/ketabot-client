const translator = require("../translator");
const downloadBooksParts = "dBP";
const getBookDetail = "gBD";
const moreBooksDetails = "mbd";



const buildInLineKeyboardToShowBookParts = (bookData) => {
    let inlineKeyboardArray = [];
    bookData.parts.forEach(part => {
        const randomString = utils.getRandomString(10);
        utils.addValueToMap(randomString, {dLink: part.downloadLink, book: bookData, partName: part.partName});
        const callback_data = {
            "type": downloadBooksParts,
            "link": randomString
        };
        const KeyboardRow = [];
        KeyboardRow.push({text: part.partName, callback_data: JSON.stringify(callback_data)});
        inlineKeyboardArray.push(KeyboardRow);
    });
    const keyboardStr = JSON.stringify({
        inline_keyboard: inlineKeyboardArray
    });
    const keyboard = {
        parse_mode: "Markdown",
        reply_markup: JSON.parse(keyboardStr),
        disable_web_page_preview: true
    };
    if (bookData.description === "") {
        bookData.description = bookData.title
    }
    let author = bookData.author.split(' ').join('_');
    const msgText = (bookData.title + " \n " + bookData.description + " \n\n#" + author + "\n" +
        translator.translate("INLINE_KEYBOARD_TEXT_MESSAGE") + " \n\n " + process.env.BOT_USERNAME + bookData.id);

    return {keyboard, msgText}
};


const buildInLineKeyboardToShowSearchedBook = (booksData,searchType) => {
    let inlineKeyboardArray = [];
    booksData.forEach(book => {
        let callback_data = {
            "type": getBookDetail,
            "id": book._id
        };
        let keyBoardRow = [];
        keyBoardRow.push({
            text: book.title + " - " + book.author,
            callback_data: JSON.stringify(callback_data)
        });
        inlineKeyboardArray.push(keyBoardRow)
    });

    let callback_data = {
        "type": moreBooksDetails,
        searchType: booksData.searchType.replace('"',""),
        "begin": booksData.begin
    };
    if (booksData.books.length >= 10) {
        let keyBoardRow = [];
        keyBoardRow.push({text: translator.translate("MORE_OPTIONS"), callback_data: JSON.stringify(callback_data)});
        inlineKeyboardArray.push(keyBoardRow)
    }

    const keyboardStr = JSON.stringify({
        inline_keyboard: inlineKeyboardArray
    });

    return {parse_mode: "Markdown", reply_markup: JSON.parse(keyboardStr)};
};


module.exports = {buildInLineKeyboardToShowBookParts, buildInLineKeyboardToShowSearchedBook};