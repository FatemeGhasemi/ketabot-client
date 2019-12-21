require('dotenv').config();
const Sentry = require('@sentry/node');
const TelegramBot = require('node-telegram-bot-api');
let bot;
if (process.env.NODE_ENV === 'production') {
    setWebHook();
    Sentry.init({dsn: process.env.HEROCU_DSN});
} else {
    bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});
    Sentry.init({dsn: process.env.LOCAL_DSN})
}

const redisUtility = require('./redis/redis-utility');
const utils = require("./utility/utils");
const translator = require("./translator");
const userRequests = require('./service/user');
const bookRequest = require('./service/book');
const telegramBotWrapper = require('./wrapper/telegram-bot');

const categoriesArray = [translator.translate("STORY"), translator.translate("FOREIGN"),
    translator.translate("SHORT_STORY"), translator.translate("POEM")];

const getBookDetail = "gBD";
const downloadBooksParts = "dBP";
const moreBookTitle = "mbt";
const moreBookDetails = "mbd";
const moreBookCategory = "mbc";


function setWebHook() {
    const options = {
        webHook: {
            port: process.env.PORT
        }
    };
    bot = new TelegramBot(process.env.BOT_TOKEN, options);
    /**
     * For setting webHook in heroku apps , see below link
     * {@link https://github.com/yagop/node-telegram-bot-api/blob/master/examples/webhook/heroku.js GitHub}.
     */
    const webHookUrl = `${process.env.HEROKU_URL}/bot${process.env.BOT_TOKEN}`
    bot.setWebHook(webHookUrl).then(console.log("webHook has been set for bot"));
}

const showMainMenu = async (msg, text) => {
    await bot.sendMessage(msg.from.id, text, {
        "reply_markup": JSON.stringify({
            "keyboard": [
                [translator.translate("SEARCH")],
                [translator.translate("STORY")],
                [translator.translate("FOREIGN")],
                [translator.translate("SHORT_STORY")],
                [translator.translate("POEM")]
            ]
        })
    })
};


bot.getMe().then(function (me) {
    console.log("Hi I am %s !", me.username);
});


const handleStartCommand = async (msg) => {
    try {
        console.log("msg.from1: ",msg.from)
        await userRequests.createUser(msg.from);
        await showMainMenu(msg, translator.translate("CHOOSE_YOUR_WANTED_BOOK_CATEGORY_OR_SEARCH_IT"))
    } catch (e) {
        console.log('handleStartCommand error ', e)
    }
};

const handleDeepLink = async (msg) => {
    try {
        const bookId = utils.findBookIdFromText(msg.text);
        let foundBookData = await bookRequest.findBookById(bookId);
        const inLineKeyboard = telegramBotWrapper.buildInLineKeyboardToShowBookParts(foundBookData);
        await userRequests.createUser(msg.from);
        await bot.sendMessage(msg.from.id, inLineKeyboard[1], inLineKeyboard[0])
    } catch (e) {
        console.log("handle deep link error :", e.message)
    }
};

const handleCategoryMessage = async (msg) => {
    try {
        const eng_msg = translator.convertPersianCategoryToEnglish(msg.text);
        let foundBookData = await bookRequest.findBookByCategory(eng_msg);
        let bookList = foundBookData.books;
        let bookLength = bookList.length;
        if (!bookList || bookLength === 0) {
            await showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
        } else {
            bookList = bookList.reverse();
        }
        const keyboard = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(foundBookData, "category");
        await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard)
    } catch (e) {
        console.log("handle CategoryMessage error :", e.message)

    }
};

const handleDetailsMessage = async (msg) => {
    try {
        const eng_msg = translator.convertPersianCategoryToEnglish(msg.text);
        let foundBookData = await bookRequest.findBookByDetails(eng_msg);
        let bookList = foundBookData.books;
        let bookLength = bookList.length;
        if (!bookList || bookLength === 0) {
            await showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
        } else {
            bookList = bookList.reverse();
        }
        const keyboard = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(foundBookData, "details");
        await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard)
    } catch (e) {
        console.log("handleDetailsMessage err:", e.message)
    }
};


const messageHandler = async (msg) => {
    await userRequests.createUser(msg.from);
    if (msg.text === "/start" || msg.text === "start") {
        console.log("hi to start ")
        await handleStartCommand(msg);
    }
    if (msg.text.includes("start=id-")) {
        await handleDeepLink(msg);
    }
    if (!categoriesArray.includes(msg.text) && (msg.text !== "/start" || msg.text !== "start")) {
        await handleDetailsMessage(msg);
    }
    if (categoriesArray.includes(msg.text)) {
        await handleCategoryMessage(msg);
    }
    if (msg.text === translator.translate("SEARCH")) {
        bot.sendMessage(msg.from.id, translator.translate("SEARCH_YOUR_WANTED_BOOK")).then(console.log("msg.text", msg.text));
    }
};


bot.on("message", async (msg) => {
    await messageHandler(msg)
});


const sendAudio = async (partData, msg) => {
    try {
        userRequests.downloadCount(msg.from);
        let book = partData.book;
        let bookTitle = book.title.split(" ").join("_");
        let partTitle = partData.partName;
        let author = partData.book.author;
        if (author !== "") {
            author = book.author.split(' ').join('_');
        }
        const downloadLink = utils.generateDownloadLink(book.path, partData.partName);
        console.log('download link ', downloadLink);
        await bot.sendChatAction(msg.from.id, "upload_audio");
        await bot.sendAudio(msg.from.id, downloadLink
            , {
                title: partTitle,
                performer: bookTitle,
                caption: "\n\n" + "#" + author + "\n\n " + process.env.CHAT_ID
            });
    } catch (e) {
        console.log("sendAudio ERROR: ", e.message)
    }
};


const handleGetBookDetailsCallbackQuery = async (msg, callback_data) => {
    let bookId = callback_data.id;
    let foundBookData = await bookRequest.findBookById(bookId);
    let author = foundBookData.message.author;
    let description = foundBookData.message.description;
    let title = foundBookData.message.title.split(" ").join("_");
    let msgFinalText = title;
    if (author !== "") {
        author = author.split(' ').join('_');
        msgFinalText += "\n" + author
    }
    if (description !== "") {
        msgFinalText += "\n" + description
    }
    msgFinalText += translator.translate("SHARE_BY_THIS_LINK_MESSAGE") + " \n\n " + utils.deepLinkGenerator(foundBookData.message._id);
    const inLineKeyboard = telegramBotWrapper.buildInLineKeyboardToShowBookParts(foundBookData);
    await userRequests.createUser(msg.from);
    await bot.sendMessage(msg.from.id, msgFinalText, inLineKeyboard);
};


const handleDownloadBookParts = async (msg, callback_data) => {
    let randomString = callback_data.link;
    let partData = redisUtility.getValueFromMap(randomString);
    await sendAudio(partData, msg);
    userRequests.downloadCount({
        "telegramId": msg.from.id
    });
};


const handleMoreBookCategory = async (msg, callback_data) => {
    try {
        let foundBookData = await bookRequest.findBookByCategory(callback_data.category, callback_data.begin + 10, 10);
        let bookList = foundBookData.books;
        let bookLength = bookList.length;
        if (bookLength !== 0) {
            bookList = bookList.reverse();
        }
        if (!bookList || bookLength === 0) {
            await showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
            return;
        }
        const keyboard = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(foundBookData, "category", callback_data.begin + 10);
        await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard);
    } catch (e) {
        console.log("handleMoreBookCategory ERROR:", e.message)
    }
};


const handleMoreBookDetails = async (msg, callback_data) => {
    try {
        let foundBook = await bookRequest.findBookByTitle(callback_data.category, callback_data.begin + 10, 10);
        let bookList = foundBook.books;
        let bookLength = bookList.length;
        if (bookLength !== 0) {
            bookList = bookList.reverse();
        }
        if (!bookList || bookLength === 0) {
            await showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
            return;
        }
        const keyboard = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(bookList, "details");
        await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard);
    } catch (e) {
        console.log("handleMoreBookDetails ERROR: ", e.message)
    }
};


const handleCallbackDataCases = async (msg, callback_data) => {
    try {
        switch (callback_data.type) {
            case getBookDetail:
                await handleGetBookDetailsCallbackQuery(msg, callback_data);
                break;

            case downloadBooksParts:
                await handleDownloadBookParts(msg, callback_data);
                break;

            case moreBookCategory:
                await handleMoreBookCategory(msg, callback_data);
                break;

            case moreBookTitle:
                await handleMoreBookDetails(msg, callback_data)
                break;
        }
    } catch (e) {
        console.log(" handleCallbackDataCases err:", e.message)
    }
};


bot.on("callback_query", async (msg) => {
    try {
        console.log("msg.txt in callback_query: ", msg.text)
        await bot.answerCallbackQuery(msg.id, "", false);
        let callback_data = JSON.parse(msg.data);
        await handleCallbackDataCases(msg, callback_data)
    } catch (e) {
        console.log("callback_query event ERROR: ", e.message)
    }
});
