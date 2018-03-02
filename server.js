var mongo   = require('mongodb').MongoClient,
     http   = require('http'),
    express = require('express'),
       io   = require('socket.io'),
     path   = require('path');

   var dburi = process.env.DATABASE_URL,
         app = express(),
         server = http.createServer(app),
         client = io.listen(server);

   app.set('view engine', 'ejs'),
   app.engine('.html', require('ejs').__express),
   app.set('views', __dirname + '/views'),
   app.set('view engine', 'html'),
   app.use(express.static(path.join(__dirname, 'public'))),
   server.listen(process.env.PORT || 3000);

   // assuming io is the Socket.IO server object
   // io.configure(function () {
   //   io.set("transports", ["xhr-polling"]);
   //   io.set("polling duration", 10);
   // });

mongo.connect(dburi, function(err,db){
  if(err) throw err;

  app.get('/', function (req, res) {
    res.render('index');
    //res.sendFile(__dirname + '/public/index.html');
    //console.log(__dirname);
  });

  client.sockets.on('connection', function(socket){

    //console.log('Somebody has connected');
    var col = db.collection('messages'),//collection
        sendStatus = function(s){
          socket.emit('status',s);
        };
    var totalMessages = 0;
    //Emit all the messages (with some limit) to the client whent they first connect
   col.find().sort({_id: -1}).limit(7)﻿.toArray(function(err, result) {
      if(err) throw err;

      socket.emit('output', result);
    });

    //Wait for input
    socket.on('input', function(data) {
      //console.log(data);

      //put the input into database
      var name = data.name,
          message = data.message
          whitespacePattern = /^\s*$/;

      if(whitespacePattern.test(name) || whitespacePattern.test(message)){
        sendStatus('Name and Message is required.');
        console.log('Invalid');
      } else {
        col.insert({name: name, message: message}, function(){
          //Emit latest message to all clients
          client.emit('output', [data]);
          sendStatus({
            message: "Message Sent",
            clear: true
          });
          console.log('Inserted');
        });
      }

    });
  });

});
