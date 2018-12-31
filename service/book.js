const axios = require('axios');


const createBook = (data) => {
    return axios({
        method: 'POST',
        url: process.env.BASE_URL + '/books',
        headers: {
            "content-Type": "application/json",
            "admin-token": process.env.ADMIN_CODE
        },
        data: {
            "title": data.title,
            "path": data.path,
            "cost": data.cost,
            "description": data.description,
            "publisher": data.publisher,
            "author": data.author,
            "publishedYear": data.publishedYear,
            "translator": data.translator,
            "voiceActor": data.voiceActor,
            "category": data.category,
            "tags": data.tags,
            "language": data.language,
            "downloadCount": data.downloadCount,
            "type": data.type,
            "cover": data.cover,
            "parts": data.parts,
            "sourceLink": data.sourceLink,
            "isActive": data.isActive
        }
    })
};

const findBookByCategory = (category, begin = 0, total = 10) => {
    return axios({
        method: 'GET',
        url: process.env.BASE_URL + '/books',
        qs: {
            category: category,
            begin, total
        }

    });
};


const findBookByTitle = (title) => {
    return axios({
        method: 'GET',
        url: process.env.BASE_URL + '/books',
        qs: {
            title: title,
        }
    });
};


const findBookByDetails = (details, begin = 0, total = 10) => {
    return axios({
        method: 'GET',
        url: process.env.BASE_URL + '/books',
        qs: {
            details: details,
            begin, total
        }
    });
};


const findBookById = (id) => {
    return axios({
        method: 'GET',
        url: process.env.BASE_URL + '/books',
        qs: {
            details: id,
        }
    });
};


module.exports = {findBookByCategory, findBookByDetails, findBookById, findBookByTitle, createBook}