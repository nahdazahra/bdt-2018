const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const dbURI = "mongodb://node:node1@trialcluster-shard-00-00-t8xza.mongodb.net:27017,trialcluster-shard-00-01-t8xza.mongodb.net:27017,trialcluster-shard-00-02-t8xza.mongodb.net:27017/test?ssl=true&replicaSet=trialCluster-shard-0&authSource=admin&retryWrites=true";

var db

MongoClient.connect(dbURI, { useNewUrlParser: true })

app.use(bodyParser.urlencoded({extended: true}))

app.listen(3000, function() {
	console.log('listen to port 3000')
	console.log(__dirname)
})

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
})

app.post('/identitas', (req, res) => {
	console.log(req.body)
})