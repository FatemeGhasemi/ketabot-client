const english = require("./english");
const persian = require("./persian");
const PERSIAN = "persian"
const ENGLISH = "english"

const translate = (word, language = PERSIAN) => {
    let mapping
    switch (language) {
        case PERSIAN:
            mapping = persian
            break
        case ENGLISH:
            mapping = english
            break
        default:
            mapping = persian

    }
    return mapping[word.toUpperCase()] || word
};


const categoryMapping = {
    'story': 'داستان',
    'foreignStory': 'داستان خارجی'
}

const reverseCategoryMapping = {
    'داستان': 'story',
    'داستان خارجی': 'foreignStory'
}


const convertPersianCategoryToEnglish = (persianCategory) => {
    return reverseCategoryMapping[persianCategory] || persianCategory
}


module.exports = {translate, ENGLISH, PERSIAN, convertPersianCategoryToEnglish};