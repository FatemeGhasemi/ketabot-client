require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.BOT_TOKEN, {polling: true});

const utils = require('./utils');
const translator = require("./translator");
const userRequests = require('./service/user');
const bookRequest = require('./service/book');
const bookController = require('./wrapper/telegram-bot');

const categoriesArray = [translator.translate("STORY"), translator.translate("FOREIGN"),
    translator.translate("SHORT_STORY"), translator.translate("POEM")];

const getBookDetail = "gBD";
const downloadBooksParts = "dBP";
const moreBookTitle = "mbt";
const moreBookDetails = "mbd";
const moreBookCategory = "mbc";



const showMainMenu = (msg, text) => {
    bot.sendMessage(msg.from.id, text, {
        "reply_markup": {
            "keyboard": [[[translator.translate("SEARCH")]], [[translator.translate("STORY")]],
                [[translator.translate("FOREIGN")]], [translator.translate("SHORT_STORY")], [translator.translate("POEM")],]
        }

    }).then(console.log("main menu show correctly"));
};


bot.getMe().then(function (me) {
    console.log("Hi I am %s !", me.username);
});


const handleStartCommand = async (msg) => {
    await userRequests.createUser(msg.from);
    showMainMenu(msg, translator.translate("CHOOSE_YOUR_WANTED_BOOK_CATEGORY_OR_SEARCH_IT"))
};

const handleDeepLink = async (msg) => {
    const bookId = utils.deepLink(msg.text);
    let foundBookData = await bookRequest.findBookById(bookId);
    const inLineKeyboard = bookController.buildInLineKeyboardToShowBookParts(foundBookData);
    await userRequests.createUser(msg.from);
    bot.sendMessage(msg.from.id, inLineKeyboard[1], inLineKeyboard[0]).then(console.log("msgText:", inLineKeyboard[1]))
};

const handleCategoryMessage = async (msg) => {
    let foundBookData = await bookRequest.findBookByCategory(msg.text);
    let bookList = foundBookData.books;
    let bookLength = bookList.length;
    if (bookLength !== 0) {
        bookList = bookList.reverse();
    }
    if (!bookList || bookLength === 0) {
        showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
    }
    const keyboard = bookController.buildInLineKeyboardToShowSearchedBook(bookList, "category");
    bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard).then(console.log("bookList:", bookList))
};

const handleDetailsMessage = async (msg) => {
    let foundBookData = await bookRequest.findBookByDetails(msg.text);
    let bookList = foundBookData.books;
    let bookLength = bookList.length;
    if (bookLength !== 0) {
        bookList = bookList.reverse();
    }
    if (!bookList || bookLength === 0) {
        showMainMenu(msg, translator.translate("THERE_IS_NO_SUCH_A_BOOK"));
    }
    const keyboard = bookController.buildInLineKeyboardToShowSearchedBook(bookList, "details");
    bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard).then(console.log("bookList:", bookList))
};

const messageHandler = async (msg) => {
    if (msg.text === "/start" || msg.text === "start") {
        await handleStartCommand(msg);
    }

    if (msg.text.includes("start=id-")) {
        await handleDeepLink(msg);
    }

    if (!categoriesArray[msg.text] && msg.text !== "/start" || msg.text !== "start") {
        await handleDetailsMessage(msg);
    }

    if (categoriesArray[msg.text]) {
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
        caption: "\n\n" + "#" + author + "\n\n "+ process.env.CHAT_ID
    });
};


bot.on("callback_query", async (msg) => {
    await bot.answerCallbackQuery(msg.id, "", false);

    let callback_data = JSON.parse(msg.data);
    switch (callback_data.type) {
        case  moreBooksDetails:
            let bookId = callback_data.id;
            let foundBookData = await bookRequest.findBookById(bookId);
            const inLineKeyboard = bookController.buildInLineKeyboardToShowBookParts(foundBookData);
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
            const keyboard = bookController.buildInLineKeyboardToShowSearchedBook(bookList, "category");
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
            const keyboard1 = bookController.buildInLineKeyboardToShowSearchedBook(bookList1, "category");
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
            const keyboard2 = bookController.buildInLineKeyboardToShowSearchedBook(bookList, "details");
            await bot.sendMessage(msg.from.id, translator.translate("FOUND_BOOK_LIST"), keyboard2);
            break;
    }


});
