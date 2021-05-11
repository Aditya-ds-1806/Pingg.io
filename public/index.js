const socket = io();
const form = document.querySelector('form');
const messages = document.querySelector('#messages');
const createRoom = document.querySelector('#createRoom');
const urlParams = new URLSearchParams(window.location.search);
const closeBtn = document.querySelector('.btn-close');
const DB_NAME = 'pingg.io';
const enc = new TextEncoder();
const dec = new TextDecoder();

createRoom.addEventListener('click', async () => {
    const nickName = document.querySelector('#nickName').value;
    let data = {
        nickName,
        roomName: document.querySelector('#roomName')?.value
    }
    const keyPair = nacl.box.keyPair();
    await insertToDB({ ...keyPair, id: '1' });
    if (urlParams.has('id')) {
        const roomID = urlParams.get('id');
        data = { nickName, roomID };
    }
    socket.emit('joinRoom', data, ({ roomID, roomName }) => {
        if (!urlParams.has('id')) {
            const div = createAlert(`Invite your friend with this link: ${window.location.origin}/?id=${roomID}`);
            document.body.append(div);
        } else {
            console.log('starting key exchange');
            const params = {
                publicKey: keyPair.publicKey,
                getBack: true
            };
            console.log(params);
            socket.emit('keyExchange', params);
        }
        document.querySelector('body header').remove();
        document.querySelector('body main').classList.remove('d-none');
        document.querySelector('#members').textContent = nickName;
        document.querySelector('#roomName').textContent = roomName;
    });
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.querySelector('input').value;
    if (message.trim() === '') return;
    const { secretKey } = await findByID('1');
    const { publicKey } = await findByID('2');
    const nonce = nacl.randomBytes(24);
    const encryptedMessage = nacl.box(enc.encode(message), nonce, publicKey, secretKey);
    const div = createNewMessage(message, false);
    socket.emit('message', { message: encryptedMessage, nonce });
    document.querySelector('input').value = '';
    messages.append(div);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('keyExchange', async ({ publicKey, getBack }) => {
    console.log('received key');
    await insertToDB({ publicKey: new Uint8Array(publicKey), 'id': '2' });
    if (!getBack) return;
    const keyPair = await findByID('1');
    socket.emit('keyExchange', { publicKey: keyPair.publicKey, getBack: false });
    console.log('sent key');
});

socket.on('message', async ({ message, nonce }) => {
    const { secretKey } = await findByID('1');
    const { publicKey } = await findByID('2');
    const decryptedMessage = dec.decode(nacl.box.open(new Uint8Array(message).filter(val => val !== 0), new Uint8Array(nonce), publicKey, secretKey));
    const newMessage = createNewMessage(decryptedMessage);
    messages.append(newMessage);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('joinRoom', ({ nickName, sockets }) => {
    if (nickName) {
        const div = showUserStatus(`${nickName} entered the room`);
        messages.append(div);
    }
    if (sockets) document.querySelector('#members').textContent = sockets.join(', ');
});

socket.on('disconnection', ({ nickName, sockets }) => {
    const div = showUserStatus(`${nickName} left the room`);
    document.querySelector('#members').textContent = sockets.join(', ');
    messages.append(div);
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

function showUserStatus(text) {
    const div = document.createElement('div');
    const p = document.createElement('p');
    div.classList.add('my-3', 'text-center');
    p.classList.add('mb-0', 'd-inline', 'bg-warning', 'text-dark', 'my-3', 'py-2', 'px-3', 'rounded');
    p.textContent = text;
    div.append(p);
    return div;
}

function insertToDB(data) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME);

        req.onerror = (e) => {
            console.log(e);
            reject(e);
        };

        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore("pingg", { keyPath: "id" });
        };

        req.onsuccess = (e) => {
            const db = e.target.result;
            const pingg = db.transaction("pingg", "readwrite").objectStore("pingg");
            pingg.put(data).onsuccess = (e) => {
                resolve(e.target.result);
            };
        }
    });
}

function findByID(id) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME);

        req.onerror = (e) => {
            console.log(e);
            reject(e);
        };

        req.onsuccess = (e) => {
            const db = e.target.result;
            db.transaction("pingg").objectStore("pingg").get(id).onsuccess = function (e) {
                console.log(e.target.result);
                resolve(e.target.result);
            };
        }
    });
}
