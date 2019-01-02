require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});

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
    await bot.sendMessage(msg.from.id, inLineKeyboard[1], inLineKeyboard[0])}
    catch (e) {
        console.log("handle deep link error :",e.message)
    }
};

const handleCategoryMessage = async (msg) => {
    try {
        let foundBookData = await bookRequest.findBookByCategory(msg.text);
        let bookList = foundBookData.books;
        let bookLength = bookList.length;
        if (bookLength !== 0) {
            bookList = bookList.reverse();
        }
        if (!bookList || bookLength === 0) {
            await showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
        }
        const keyboard = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(bookList, "category");
        await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard)
    } catch (e) {
        console.log("handle CategoryMessage error :",e.message)

    }
};

const handleDetailsMessage = async (msg) => {
    try {
        let foundBookData = await bookRequest.findBookByDetails(msg.text);
        let bookList = foundBookData.book;
        let bookLength = bookList.length;
        if (bookLength !== 0) {
            bookList = bookList.reverse();
        }
        if (!bookList || bookLength === 0) {
            await showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
        }
        const keyboard = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(bookList, getBookDetail);
        bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard).then(console.log("bookList:", bookList))
    } catch (e) {
        console.log("handleDetailsMessage error :",e.message)

    }
};

const messageHandler = async (msg) => {
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


const sendAudio = async (partData, msg) => {
    try {
        let dlLink = partData.dLink;
        let book = partData.book;
        let author;
        if (book.author) {
            author = book.author.split(' ').join('_')
        }
        let bookTitle = book.title;
        let partTitle = partData.partName;
        await bot.sendChatAction(msg.from.id, "upload_audio")
        await bot.sendAudio(msg.from.id, dlLink, {
            title: partTitle,
            performer: bookTitle,
            caption: "\n\n" + "#" + author + "\n\n " + process.env.CHAT_ID
        });
    } catch (e) {
        throw e.message
    }
};


bot.on("callback_query", async (msg) => {
    await bot.answerCallbackQuery(msg.id, "", false);

    let callback_data = JSON.parse(msg.data);
    switch (callback_data.type) {
        case  moreBookDetails:
            let bookId = callback_data.id;
            let foundBookData = await bookRequest.findBookById(bookId);
            const inLineKeyboard = telegramBotWrapper.buildInLineKeyboardToShowBookParts(foundBookData);
            await userRequests.createUser(msg.from);
            await bot.sendMessage(msg.from.id, inLineKeyboard[1], inLineKeyboard[0]);
            break;

        case downloadBooksParts:
            let randomString = callback_data.link;
            let partData = utils.getValueFromMap(randomString);
            bot.getChatMember(process.env.CHAT_ID, msg.from.id).then(async (result) => {
                if (result.status !== "kicked" && result.status !== "left") {
                    await sendAudio(partData, msg);
                    await userRequests.createUser(msg.from);

                    return;
                }
                await bot.sendMessage(msg.from.id, translator.translate("JOIN_CHANNEL_ALERT") + "\n\n" + process.env.BOT_USERNAME)

            }).catch(async (error) => {
                console.log("error of getChatMember:", error);
                await sendAudio(partData, msg);
                userRequests.downloadCount({
                    "telegramId": msg.from.id
                });
            });
            break;

        case moreBookCategory:
            let foundBookDataa = await bookRequest.findBookByCategory(msg.text, callback_data.begin + 10, 10);
            let bookList = foundBookDataa.books;
            let bookLength = bookList.length;
            if (bookLength !== 0) {
                bookList = bookList.reverse();
            }
            if (!bookList || bookLength === 0) {
                showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
                return;
            }
            const keyboard = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(bookList, "category");
            await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard);
            break;


        case moreBookTitle:
            let foundBook = await bookRequest.findBookByTitle(msg.text);
            let bookList1 = foundBook.books;
            let bookLength1 = bookList1.length;
            if (bookLength1 !== 0) {
                bookList1 = bookList1.reverse();
            }
            if (!bookList1 || bookLength1 === 0) {
                showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
                return;
            }
            const keyboard1 = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(bookList1, "category");
            await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard1);
            break;


        case moreBookDetails:
            await bookRequest.findBookByDetails(msg.text, callback_data.begin + 10, 10);
            let bookList2 = foundBookData.books;
            let bookLength2 = bookList2.length;
            if (bookLength2 !== 0) {
                bookList2 = bookList2.reverse();
            }
            if (!bookList2 || bookLength2 === 0) {
                showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
                return;
            }
            const keyboard2 = telegramBotWrapper.buildInLineKeyboardToShowSearchedBook(bookList, "details");
            await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard2);
            break;
    }


});
