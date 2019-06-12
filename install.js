const Chat = require('./services/chat.service');

(new Chat({
  region: "us-west-2",
  endpoint: "http://localhost:8000"
})).setup();