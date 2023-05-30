const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

// Get username and room form URL
const { username, roomId, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

// console.log(username, room);

const socket = io();



// Join chatroom
socket.emit('joinRoom', { username, roomId, room});

// Get room and users
socket.on('roomUsers', ({ room, roomId, users }) => {
    // roomName is the roomId in our app
    outputRoomName(room);
    // outputRoomId(roomId);
    outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
    console.log(message);
    outputMessage(message);


    // Scroll down on each new message
    chatMessages.scrollTop = chatMessages.scrollHeight;

});


// Message submit event listener
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();  // prevents the form to submit to a file

    // Get message text
    const msg = e.target.elements.msg.value;

    // Emit message to the server
    socket.emit('chatMessage', msg);

    // Clear inputs
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();

});

// Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}


// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

// // Add room name to DOM
// function outputRoomId(roomId) {
//     roomName.innerText = roomId;
// }


// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}