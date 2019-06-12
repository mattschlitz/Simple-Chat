const express = require('express');
const app = express();
const Chat = require('./services/chat.service');
const ErrorResponse = require('./helpers/error-response.helper');


const UUID4 = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const JSONParser = express.json();
const chatService = new Chat();

app.use('/ping', JSONParser, function(request, response){
  response.send("Hello World");
});

app.get('/chats/:idOrUsername', async function(request, response) {
  try {
    if(request.params.idOrUsername.match(UUID4)){
      response.send(await chatService.getById(request.params.idOrUsername));
    }
    else {
      response.send(await chatService.readAllForUser(request.params.idOrUsername));
    }
  } catch (e) {
    if(e instanceof ErrorResponse){
      response.status(e.statusCode).send(e.error);
    }
    else {
      // TODO: Replace with proper logging
      console.error("ERROR:", e);
      response.status(500).send({"Error": "Internal Server Error"});
    }
  }
});

app.post('/chats', JSONParser, async function(request, response, next) {
  try {
    response.status(201).send(await chatService.create(request.body));
  } catch(e) {
    if(e instanceof ErrorResponse){
      response.status(e.statusCode).send(e.error);
    }
    else {
      // TODO: Replace with proper logging
      console.error("ERROR:", e);
      response.status(500).send({"Error": "Internal Server Error"});
    }
  }
});

module.exports = app
