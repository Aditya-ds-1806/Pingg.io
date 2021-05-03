const socket = io();
const form = document.querySelector('form');
const messages = document.querySelector('#messages');
const createRoom = document.querySelector('#createRoom');
const urlParams = new URLSearchParams(window.location.search);

createRoom.addEventListener('click', () => {
    const nickName = document.querySelector('#nickName').value;
    let data = {
        nickName,
        roomName: document.querySelector('#roomName')?.value
    }
    if (urlParams.has('id')) {
        const roomID = urlParams.get('id');
        data = { nickName, roomID }
    }
    socket.emit('joinRoom', data, () => {
        document.querySelector('body header').remove();
        document.querySelector('body main').classList.remove('d-none');
    });
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = document.querySelector('input').value;
    const div = createNewMessage(message, false);
    socket.emit('message', { message });
    document.querySelector('input').value = '';
    messages.append(div);
});

socket.on('message', ({ message }) => {
    const newMessage = createNewMessage(message);
    messages.append(newMessage);
});

function createNewMessage(text, alignLeft = true) {
    const div = document.createElement('div');
    const p = document.createElement('p');
    if (alignLeft) {
        div.classList.add('bg-dark', 'my-3', 'py-2', 'px-3', 'w-75', 'rounded');
    } else {
        div.classList.add('bg-green', 'text-dark', 'my-3', 'py-2', 'px-3', 'w-75', 'rounded', 'ms-auto');
    }
    p.classList.add('mb-0');
    p.textContent = text;
    div.append(p);
    return div;
}
