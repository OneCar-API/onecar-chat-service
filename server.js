const { Socket } = require('dgram');
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');//

// Database

const mongoose = require('mongoose');

mongoose.connect('mongodb://root:mongo123@localhost:27017/socketchat?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false');

const Message = mongoose.model('Message', 
{
  room_id: String,
  from_id: String,
  from_name: String,
  to_id: String,
  to_name: String,
  text: String,
  sent_at: Date,
});

const Room = mongoose.model('Room', 
{
  room_id: String,
  from_id: String,
  from_name: String,
  to_id: String,
  to_name: String,
});

// Express e socket

let params = {};
let user_id;

app.use('/chat', (req, res) => {
    params = req.query;
    res.render('index.html');//renderiza a view
});

app.use('/chats', (req, res) => {
    user_id = req.query.user_id;
    res.render('chats.html');//renderiza a view
});


io.on('connection', socket =>{
    console.log(`Socket conectado: ${socket.id}`)//conecta o socket
    let idsUsers = [new String(params.to_id), new String(params.from_id)].sort();
    let room_id = idsUsers[0] + idsUsers[1];

    if (room_id) {
        socket.join(room_id);
        Message.find({ room_id }, (error, data) => {
            if (error) {
                console.log(error);
            } else {
                socket.emit('previousMessages', data);
            }
        });
    }

    Room.find({ room_id, from_id: params.from_id }, (error, data) => {
        if (error) {
            console.log(error);
            return;
        }
        if (data.length < 1) {
            const newRoom = new Room({
                room_id,
                from_id: params.from_id,
                from_name: params.from_name,
                to_id: params.to_id,
                to_name: params.to_name,
            });
    
            newRoom.save(function (err) {
                if (err) console.log(err);
              });
        }
    });

    if (user_id) {
        Room.find({from_id: user_id}, (error, data) => {
            if (error) {
                console.log(error);
                socket.emit('previousChats', []);
                return;
            }
            if (data) {
                socket.emit('previousChats', data);
            }
        });
    }

    socket.on('sendMessage', data =>{
        const message = new Message({
            room_id,
            from_id: data.from_id,
            from_name: data.from_name,
            to_id: data.to_id,
            to_name: data.to_name,
            text: data.text,
            sent_at: Date.now()
        });

        message.save(function (err) {
            if (err) console.log(err);
          });
        if (room_id) {
            console.log(room_id);
            io.to(room_id).emit('receivedMessage', message);
        }
    });
});

server.listen(9000, () => {
    console.log("Servidor iniciado")
});