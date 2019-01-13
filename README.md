# Ketabot-client
This is a bot for downloading audio-books, you can bot in here: https://t.me/ketaabot
(bot is still has bugs and is under development)

This bot use this Api for getting books https://ketabot.herokuapp.com/api-docs (this projects is also open source . https://github.com/FatemeGhasemi/ketabot-server)

## Running locally 
 * First of all create a `.env` file in root of project with content like below:
 

    `BOT_TOKEN = your bot token`
    `BOT_USERNAME = your bot username`
    `BASE_URL = url`
    `ADMIN_CODE=admin token`
    `CHAT_ID= your bot chat_id`
    `REDIS_HOST = localhost`
    `REDIS_PORT=6379`
    `REDIS_DB=0`
    `REDIS_PASSWORD=""`
 
     
     
 * Install dependencies  
 
       npm i
 
 * Run project
 
       npm start 
