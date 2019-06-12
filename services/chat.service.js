const uuid = require('uuid');
const AWS = require("aws-sdk");
const CHAT_TABLE = 'Chat';
const ErrorResponse = require('../helpers/error-response.helper');

/**
 * @class Chat - Service for writing to / reading from chat messages
 */
class Chat {
    /**
     * @param {*} config - The configuration to use when connecting DynamoDB
     */
    constructor(){
        this.dynamodb = new AWS.DynamoDB();
        this.docClient = new AWS.DynamoDB.DocumentClient();
    }
    /**
     * setup() - Helper for creating the table structure in DynamoDB
     */
    setup(){
        var params = {
            TableName : CHAT_TABLE,
            KeySchema: [       
                { AttributeName: "id", KeyType: "HASH"}
            ],
            AttributeDefinitions: [       
                { AttributeName: "id", AttributeType: "S" },
                { AttributeName: "username", AttributeType: "S" },
                { AttributeName: "expiration_date", AttributeType: "N" }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: "UnexpiredRequests",
                    KeySchema: [
                        {AttributeName: "username", KeyType: "HASH"},
                        {AttributeName: "expiration_date", KeyType: "RANGE"},
                    ],
                    Projection: { 
                      NonKeyAttributes: [ "id" ],
                      ProjectionType: "INCLUDE"
                    },
                    ProvisionedThroughput: {
                       ReadCapacityUnits: 10,
                       WriteCapacityUnits: 10
                    }
                }
            ],
            ProvisionedThroughput: {       
                ReadCapacityUnits: 10, 
                WriteCapacityUnits: 10
            }
        };
        
        this.dynamodb.createTable(params, function(err, data) {
            if (err) {
                console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
            }
        });
    }
    /**
     * 
     * @param {string} id - The id to retrieve by
     * @returns Promise<{username, text, expiration_date}> - The record that was stored  
     */
    getById(id){
        const params = {
            TableName: CHAT_TABLE,
            Key:{id}
        };

        return new Promise((resolve, reject) => 
            this.docClient.get(params, (err, data) => {
                if(err){
                    reject(err);
                }
                else if(!data.Item){
                    reject(new ErrorResponse("Resource could not be found", 404));
                }
                else {
                    const record = data.Item;
                    resolve({
                        username: record.username,
                        text: record.text,
                        expiration_date: (new Date(record.expiration_date)).toISOString()
                    });
                }
            })
        );
    }
    create(record){
        const errors = [];
        if(!('username' in record) || !(record.username + '').length){
            errors.push("Username is required");
        }
        else if(typeof record.username != 'string'){
            errors.push("Username must be a string");
        }
        if(!('text' in record) || !(record.text + '').length){
            errors.push("Text is required");
        }
        else if(typeof record.text != 'string'){
            errors.push("Text must be a string");
        }
        const timeout = 'timeout' in record ? record.timeout : 60;
        if(typeof timeout != 'number'){
            errors.push("Timeout must be a number");
        }
        if(errors.length){
            throw new ErrorResponse(
                {Error: 'Validation Errors', Details: errors}, 
                400
            );
        }
        const id = uuid.v4();
        var params = {
            TableName:CHAT_TABLE,
            Item:{
                id,
                username: record.username,
                text: record.text,
                expiration_date: Date.now() + timeout*1000
            }
        };
        return new Promise((resolve, reject) => this.docClient.put(
            params, err => err ? reject(err) : resolve({id})
        ));
    }
    readAllForUser(username){
        const now = Date.now();
        const params = {
            TableName: CHAT_TABLE,
            ProjectionExpression: "#id, #txt",
            FilterExpression: "expiration_date >= :now and username = :username",
            ExpressionAttributeNames:{
                '#txt': 'text',
                '#id': 'id'
            },
            ExpressionAttributeValues: {
                 ":now": now,
                 ":username": username
            }
        };
        
        return new Promise((resolve, reject) => {
            const records = [];
            const docClient = this.docClient;
            docClient.scan(params, onScan);
            function onScan(err, data) {
                if (err) {
                    reject(err);
                } else {
                    let promises = data.Items.map(
                        record => new Promise((resolve, reject) => {
                            docClient.update({
                                TableName:CHAT_TABLE,
                                Key: {id: record.id},
                                UpdateExpression: "SET expiration_date = :now",
                                ExpressionAttributeValues:{
                                    ":now" :now
                                },
                                ReturnValues:"UPDATED_NEW"
                            }, err => {
                                err ? reject(err) : resolve()
                            })
                        }).then(
                            () => records.push(record),
                            err => console.error(err)
                        )
                    );
                    Promise.all(promises).then(
                        () => {
                            if (typeof data.LastEvaluatedKey != "undefined") {
                                params.ExclusiveStartKey = data.LastEvaluatedKey;
                                docClient.scan(params, onScan);
                            }
                            else {
                                resolve(records);
                            }
                        }
                    );
                }
            }
        });
    }
}

module.exports = Chat;