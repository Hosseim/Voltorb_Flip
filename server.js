var express = require('express');
var app = express();
var server = require('http').Server(app);

var path = require('path');
 
// app.use(express.static(__dirname + '/public'));
app.use(express.static('js'));
app.use(express.static('json'));
app.use(express.static('css'));
app.use(express.static('assets'));
app.use(express.static('menus'));
app.use(express.static('fonts'));
 
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
