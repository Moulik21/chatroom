var mongo = require('mongodb').MongoClient,
   client = require('socket.io').listen(8080).sockets,
   dburi = process.env.MONGOLAB_URI;

mongo.connect(dburi, function(err,db){
  if(err) throw err;

  client.on('connection', function(socket){

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
