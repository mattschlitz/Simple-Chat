# Simple Chat

## Local Installation

To run the application locally, you will need to download a copy of [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html). There are instructions on this site for starting the database. The quickest way is to simply launch the JAR file by running the following in a terminal:

```bash
java -Djava.library.path=./DynamoDBLocal_b -jar DynamoDBLocal.jar -sharedDb
```

Once the local version is running, create the database structure by using the install script.

```bash
node install.js
```

After the database structure has been created, you can launch the local web server.

```bash
node index-local.js
```

## Remote Installation

Coming soon...