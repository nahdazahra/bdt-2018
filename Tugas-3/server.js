const express = require('express');
const app = express();

app.listen(3000, function() {
	console.log('listen to port 3000')
	console.log(__dirname)
})

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html')
})

app.post('identitas', (req, res) => {
	console.log('nginput data')
})