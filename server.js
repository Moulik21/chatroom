var mongo = require('mongodb').MongoClient,
   //client = require('socket.io').listen(8080).sockets,
   dburi = process.env.MONGOLAB_URI,
   express = require('express'),
   app = express(),
   server = require('http').createServer(app),
   io = require('socket.io').listen(server);
   server.listen(process.env.PORT || 8080);

mongo.connect(dburi, function(err,db){
  if(err) throw err;

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
    //console.log(__dirname);
  });

  io.sockets.on('connection', function(socket){

    //console.log('Somebody has connected');
    var col = db.collection('messages'),//collection
        sendStatus = function(s){
          socket.emit('status',s);
        };

    //Emit all the messages (with some limit) to the client whent they first connect
    col.find().limit(7).sort({_id: 1}).toArray(function(err, result) {
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
          io.emit('output', [data]);
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
