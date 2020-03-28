const axios = require('axios');


const createBook = async (data) => {
    try {
        const result = await axios({
            method: 'POST',
            url: process.env.BASE_URL + "/books",
            headers: {
                "content-Type": "application/json",
                "admin-token": process.env.ADMIN_CODE
            },
            data: {
                title: data.title,
                path: data.path,
                cost: data.cost,
                description: data.description,
                publisher: data.publisher,
                author: data.author,
                publishedYear: data.publishedYear,
                translator: data.translator,
                voiceActor: data.voiceActor,
                category: data.category,
                tags: data.tags,
                language: data.language,
                downloadCount: data.downloadCount,
                type: data.type,
                cover: data.cover,
                parts: data.parts,
                sourceLink: data.sourceLink,
                isActive: data.isActive
            }
        });
        return result.data
    } catch (e) {
        console.log("ERROR AXIOS: ", e)
    }
};

const findBookByCategory = async (category, begin = 0, total=10 ) => {
    try {
        const result = await axios({
            method: 'GET',
            url: process.env.BASE_URL + '/books',
            params: {
                category: category,
                begin,
                total:total
            }
        });
        return result.data
    } catch (e) {
        console.log("findBookByCategory ERROR: ", e.message)
    }

};


const findBookByTitle = async (title) => {
    const result = await axios({
        method: 'GET',
        url: process.env.BASE_URL + '/books',
        params: {
            title: title,
        }
    });
    return result.data
};


const findBookByDetails = async (details, begin = 0, total = 10) => {
    try {
        const result = await axios({
            method: 'GET',
            url: process.env.BASE_URL + '/books',
            params: {
                details: details,
                begin, total
            }
        });
        return result.data
    }catch (e) {
        console.log("findBookByDetails ERROR: ",e.message)
    }
};


const findBookById = async (id) => {
    const result = await axios({
        method: 'GET',
        url: process.env.BASE_URL + '/books',
        params: {
           bookId: id,
        }
    });
    return result.data
};


module.exports = {findBookByCategory, findBookByDetails, findBookById, findBookByTitle, createBook}