const AWS = require('aws-sdk');
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});
const app = require('./app');
const port = parseInt(process.env.PORT || 0, 10) || 3000;

app.listen(port, () => console.log(`Running locally (listening on port ${port})`))