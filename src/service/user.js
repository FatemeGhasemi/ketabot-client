const axios = require('axios');


const createUser = async (userData) => {
    const result =  await axios({
        method: 'POST',
        url: process.env.BASE_URL + '/users',
        headers: {
            "content-Type": "application/json",
            "admin-token": process.env.ADMIN_CODE
        },
        data: {
            "telegramId": userData.id,
            "firstName": userData.first_name,
            "lastName": userData.last_name,
            "telegramUserName": userData.username
        }
    });

    return result.data


};


const downloadCount = (userData) => {
    return axios({
        method: 'PUT',
        url: process.env.BASE_URL + '/users',
        headers: {
            "content-Type": "application/json",
            "admin-token": process.env.ADMIN_CODE
        },
        data: {"telegramId": userData.id}
    })
};


module.exports = {createUser, downloadCount}