const axios = require('axios');


const createUser = async (userData) => {
  console.log("hi to client create user")
  console.log("url>>>>>>>",process.env.BASE_URL+'/users')

  const result = await axios({
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
  console.log("result create user client>>>>>>>>", result)

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