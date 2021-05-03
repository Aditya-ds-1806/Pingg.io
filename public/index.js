const socket = io();
const form = document.querySelector('form');
const messages = document.querySelector('#messages');
const createRoom = document.querySelector('#createRoom');
const urlParams = new URLSearchParams(window.location.search);
const closeBtn = document.querySelector('.btn-close');

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
    socket.emit('joinRoom', data, ({ roomID }) => {
        if (!urlParams.has('id')) {
            div = createAlert(`Invite your friend with this link: ${window.location.origin}/?id=${roomID}`);
            document.body.append(div);
        }
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
    messages.scrollTop = messages.scrollHeight;
});

socket.on('message', ({ message }) => {
    const newMessage = createNewMessage(message);
    messages.append(newMessage);
    messages.scrollTop = messages.scrollHeight;
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

function createAlert(text) {
    const div = document.createElement('div');
    const textNode = document.createTextNode(text);
    const button = document.createElement('button');
    div.classList.add('alert', 'bg-green', 'fixed-top', 'text-dark', 'alert-dismissible', 'fade', 'show', 'rounded-0');
    button.classList.add('btn-close', 'bg-green', 'rounded-0');
    div.setAttribute('role', 'alert');
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-dismiss', 'alert');
    div.append(textNode, button);
    return div;
}
