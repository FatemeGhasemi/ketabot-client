const translator = require("../translator");
const utils = require("../utility/utils");
const redisUtility = require('../redis/redis-utility');

const getBookDetail = "gBD";
const downloadBooksParts = "dBP";
const moreBookTitle = "mbt";
const moreBookDetails = "mbd";
const moreBookCategory = "mbc";


const buildInLineKeyboardToShowBookParts = (bookData) => {
    const inlineKeyboardArray = [];
    bookData.message.parts.forEach(part => {
        console.log("parts:", part);
        const randomString = utils.getRandomString(10);
        redisUtility.addValueToMap(randomString, {book: bookData.message, partName: part.partName});
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
    return {
        parse_mode: "Markdown",
        reply_markup: JSON.parse(keyboardStr),
        disable_web_page_preview: true
    };
};


const createKeyboardForEachBook = (bookList, inlineKeyboardArray, callback_data) => {
    bookList.forEach(book => {
        console.log("each book of bookList: ", book);
        callback_data = {
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
};


const moreThanTenBookHandler = (searchType, type, callback_data, bookList, inlineKeyboardArray, begin) => {
    let keyBoardRow = [];
    switch (searchType) {
        case "category":
            type = moreBookCategory;
            callback_data = {
                "type": type,
                "category": bookList[0].category,
                "begin": begin
            };
            break;

        case "details":
            type = moreBookDetails;
            callback_data = {
                "type": type,
                "details": bookList[0].details,
                "begin": begin
            };
            break
    }
    keyBoardRow.push({text: translator.translate("MORE_OPTIONS"), callback_data: JSON.stringify(callback_data)});
    inlineKeyboardArray.push(keyBoardRow)
};


const buildInLineKeyboardToShowSearchedBook = (booksData, searchType, begin = 0) => {
    let inlineKeyboardArray = [];
    let type = "";
    let callback_data;
    let bookList = booksData.books;
    createKeyboardForEachBook(bookList, inlineKeyboardArray, callback_data);

    if (booksData.books.length >= 10) {
        moreThanTenBookHandler(searchType, type, callback_data, bookList, inlineKeyboardArray, begin)
    }

    const keyboardStr = JSON.stringify({
        inline_keyboard: inlineKeyboardArray
    });
    return {parse_mode: "Markdown", reply_markup: JSON.parse(keyboardStr)};
};


module.exports = {buildInLineKeyboardToShowBookParts, buildInLineKeyboardToShowSearchedBook};