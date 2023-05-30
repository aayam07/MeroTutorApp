const express = require('express');
const path =require('path');
// const multer  = require('multer')
// const upload = multer()
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session)     //overwrite dot method
//var cookieParser = require('cookie-parser')
const http = require('http');
const socketIO = require('socket.io');
const formatMessage = require('./utils/messages');
const  {userJoin, getCurrentUser, userLeave, getRoomUsers}= require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketIO(server);
// app.use(bodyParser.json());
//For protecting sensitive information
const dotenv = require('dotenv');
dotenv.config({path: './.env'}); 

//Connecting to mysql (make a database named Travewire)
const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DATABASE,
    database: 'TutorWebApp'
});
db.connect((error)=>{
    if(error){
        console.log(error);
    }
    else{
        console.log('Connected to mysql...');
    }
});

//connection of session with database
var sessionStore = new MySQLStore({
    expiration:10800000,
    createDatabaseTable: false,
    schema:{
        tableName: 'sessiontbl',
        columnNames:{
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
},db);



  

//for keeping the files of css 
app.use(express.static("public"));
// app.use(cors())
const botName = 'Tutor Bot';

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:false}));  //get data from forms and make it available in post method ko request ma
app.use(express.json())   //form bata ako data lai json ma parse garxa
app.use(
    session({
        key: 'keyin',
        secret: "this is key that sign cookie",
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
    })
);

// middleware to pass variable to all templates
app.use(function(req, res, next){
    // console.log(req.session.userinfo);
    res.locals.isLoggedIn = req.session.userinfo;
    next()
})

//define all routes

app.use('/', require('./routes/pages'))     
app.use('/auth', require('./routes/auth'))  //'/auth' paxi aako url yeta janxa




// for chatroom
// Run when client connects
io.on('connection', (socket) => {
    // console.log('New Web Socket Connection...');

    socket.on('joinRoom', ({ username, roomId, room}) => {

        const user = userJoin(socket.id, username, roomId, room);
        console.log(username)
        console.log(roomId)
        console.log(room)

        socket.join(user.room)

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to TutorChat!'));  // to emit message to single client

        // Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit(
                'message', 
                formatMessage(botName, `${user.username} has joined the chat`)
            );  // emits to everybody excpet the user who is connecting


        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            roomId: user.roomId,
            users: getRoomUsers(user.room)
        });

    });

    
    // to emit message to all the client in general
    // io.emit()

    
    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        // console.log(msg);

        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });


    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });

        }

    });

});



const port = process.env.PORT || 8000;
server.listen(port, ()=>{console.log(`listening on port ${port}`)});

