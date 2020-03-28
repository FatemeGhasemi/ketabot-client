const axios = require('axios');


const createUser = async (userData) => {

  const result = await axios({
    method: 'POST',
    url: process.env.BASE_URL + '/users',
    headers: {
      "content-Type": "application/json",
      "admin-token": process.env.ADMIN_CODE
    },
    data: {
      telegramId: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      telegramUserName: userData.username
    }
  });
  console.log("result create user client>>>>>>>>", result)

  return result.data


};


const increaseDownloadCount = (userData) => {
  return axios({
    method: 'PUT',
    url: process.env.BASE_URL + '/users/' + userData.id + "/increaseDownloadCount",
    headers: {
      "content-Type": "application/json",
      "admin-token": process.env.ADMIN_CODE
    },
    data: {"telegramId": userData.id}
  })
};


module.exports = {createUser, increaseDownloadCount}