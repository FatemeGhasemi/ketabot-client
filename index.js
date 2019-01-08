require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
let bot;
if (process.env.NODE_ENV === 'production') {
    // const webHookUrl = process.env.HEROKU_URL +  bot.token
    const options = {
        webHook: {
            // Port to which you should bind is assigned to $PORT variable
            // See: https://devcenter.heroku.com/articles/dynos#local-environment-variables
            port: process.env.PORT
            // you do NOT need to set up certificates since Heroku provides
            // the SSL certs already (https://<app-name>.herokuapp.com)
            // Also no need to pass IP because on Heroku you need to bind to 0.0.0.0
        }
    };
// Heroku routes from port :443 to $PORT
// Add URL of your app to env variable or enable Dyno Metadata
// to get this automatically
    const bot = new TelegramBot(process.env.BOT_TOKEN, options);
    const webHookUrl = `${process.env.HEROKU_URL}/bot${process.env.BOT_TOKEN}`
// See: https://devcenter.heroku.com/articles/dyno-metadata
    console.log('webHook url  ',  webHookUrl)

// This informs the Telegram servers of the new webhook.
// Note: we do not need to pass in the cert, as it already provided
    bot.setWebHook(webHookUrl).then(console.log("webHook has been set for bot"));
} else {
    bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});
}

const redisUtility = require('./redis/redis-utility');
const utils = require('./utils');
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


const showMainMenu = async (msg, text) => {
    try {
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
    } catch (e) {
        throw e.message
    }
};


bot.getMe().then(function (me) {
    console.log("Hi I am %s !", me.username);
});


const handleStartCommand = async (msg) => {
    try {
        await userRequests.createUser(msg.from);
        await showMainMenu(msg, translator.translate("CHOOSE_YOUR_WANTED_BOOK_CATEGORY_OR_SEARCH_IT"))
    } catch (e) {
        console.log('handleStartCommand error ', e)
    }
};

const handleDeepLink = async (msg) => {
    try {
        const bookId = utils.deepLink(msg.text);
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
    console.log("msg.text: ", msg.text)
    if (msg.text === "/start" || msg.text === "start") {
        try {
            await handleStartCommand(msg);
        } catch (e) {
            throw e
        }
    }

    if (msg.text.includes("start=id-")) {
        try {
            await handleDeepLink(msg);
        } catch (e) {
            throw e.message
        }
    }

    if (!categoriesArray.includes(msg.text) && (msg.text !== "/start" || msg.text !== "start")) {
        try {
            await handleDetailsMessage(msg);
        } catch (e) {
            throw e.message
        }
    }

    if (categoriesArray.includes(msg.text)) {
        try {
            await handleCategoryMessage(msg);
        } catch (e) {
            throw e.message
        }
    }

    if (msg.text === translator.translate("SEARCH")) {
        try {
            bot.sendMessage(msg.from.id, translator.translate("SEARCH_YOUR_WANTED_BOOK")).then(console.log("msg.text", msg.text));
        } catch (e) {
            throw e.message
        }
    }
};


bot.on("message", async (msg) => {
    await messageHandler(msg)
});

const generateDownloadLink = (bookPath, partTitle) => {
    return `${process.env.CDN_BASE_URL}/${bookPath}/${partTitle}.mp3`.split(' ').join('_')
}

const sendAudio = async (partData, msg) => {
    try {
        let book = partData.book;
        const downloadLink = generateDownloadLink(book.path, partData.partName)
        // console.log('partData.book ', partData.book);
        // console.log(' partData', partData);
        console.log('download link ', downloadLink);
        let author = partData.book.author;
        if (author !== undefined) {
            author = book.author.split(' ').join('_')
        }
        let bookTitle = partData.book.title;
        let partTitle = partData.book.partName;
        await bot.sendChatAction(msg.from.id, "upload_audio");
        await bot.sendAudio(msg.from.id, downloadLink, {
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
    let msgMiddleText = foundBookData.message.title + " \n ";
    let author = foundBookData.message.author;
    let description = foundBookData.message.description;
    if (description !== "") {
        msgMiddleText += description + " \n\n"
    }
    if (author !== undefined) {
        author = author.split(' ').join('_');
        msgMiddleText += "#" + author + "\n"
    }

    const inLineKeyboard = telegramBotWrapper.buildInLineKeyboardToShowBookParts(foundBookData);
    await userRequests.createUser(msg.from);

    const msgFinalText = (msgMiddleText + translator.translate("SHARE_BY_THIS_LINK_MESSAGE") + " \n\n " + process.env.BOT_USERNAME + foundBookData.message._id);
    console.log("msg:", msgFinalText);
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
        let bookLength1 = bookList.length;
        if (bookLength1 !== 0) {
            bookList = bookList.reverse();
        }
        if (!bookList || bookLength1 === 0) {
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
        await userRequests.createUser(msg.from);
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

        await bot.answerCallbackQuery(msg.id, "", false);
        let callback_data = JSON.parse(msg.data);
        await handleCallbackDataCases(msg, callback_data)
    } catch (e) {
        console.log("callback_query event ERROR: ", e.message)
    }
});
