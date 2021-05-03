const express = require('express');
const socketio = require('socket.io');
const { nanoid } = require('nanoid');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    if (req.query.id) {
        return res.render('index', { roomName: false, btnText: 'Join Room' });
    }
    return res.render('index', { roomName: true, btnText: 'Create Room' });
});

const server = app.listen(process.env.PORT || 3000, process.env.IP, () => {
    console.log(`Server listening on port ${process.env.PORT || 3000}`);
});

const io = socketio(server);

io.on('connection', socket => {
    console.log('connected');
    socket.on('message', (message) => {
        const { roomID } = socket;
        socket.to(roomID).emit('message', message);
    });
    socket.on('joinRoom', async ({ nickName, roomName, roomID }, ack) => {
        socket.nickName = nickName;
        let sockets, id = roomID;
        if (roomID) {
            socket.join(roomID);
            socket.roomID = roomID;
            console.log(`Joined room: ${roomID}`);
            sockets = Array.from(await io.in(roomID).allSockets()).map(socket => io.sockets.sockets.get(socket).nickName);
            ack({ roomID });
        } else {
            id = nanoid(15);
            socket.join(id);
            socket.roomID = id;
            socket.roomName = roomName;
            console.log(`Created room: ${id}`);
            sockets = Array.from(await io.in(id).allSockets()).map(socket => io.sockets.sockets.get(socket).nickName);
            ack({ roomID: id });
        }
        io.in(id).emit('joinRoom', { sockets });
        socket.to(id).emit('joinRoom', { nickName });
    });
});
