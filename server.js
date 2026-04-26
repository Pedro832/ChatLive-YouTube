const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { LiveChat } = require('youtube-chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let liveChat;

app.use(express.static('public'));

app.get('/painel', (req, res) => res.sendFile(__dirname + '/public/painel.html'));
app.get('/overlay', (req, res) => res.sendFile(__dirname + '/public/overlay.html'));

const chatHistory = [];
const MAX_CACHE = 50;

function iniciarCaptura(videoId) {
    if (liveChat) {
        liveChat.stop();
    }

    liveChat = new LiveChat({ liveId: videoId });

    liveChat.on("chat", (chatItem) => {
        const msgData = {
            user: chatItem.author.name,
            message: chatItem.message[0].text,
            image: chatItem.author.thumbnail.url,
            id: Date.now()
        };
        chatHistory.push(msgData);
        if (chatHistory.length > 50) chatHistory.shift();
        io.emit('nova_mensagem', msgData);
    });

    liveChat.start()
        .then(() => console.log(`[!] Capturando chat da live: ${videoId}`))
        .catch(err => console.error("Erro ao iniciar chat:", err));
}

io.on('connection', (socket) => {
    socket.on('mudar_live', (urlOuId) => {
        const id = urlOuId.includes('v=') ? urlOuId.split('v=')[1].split('&')[0] : 
                   urlOuId.includes('live/') ? urlOuId.split('live/')[1].split('?')[0] : urlOuId;
        
        chatHistory.length = 0;
        iniciarCaptura(id);
    });

    socket.emit('historico_chat', chatHistory);

    socket.on('selecionar_msg', (data) => {
        io.emit('exibir_no_overlay', data);
    });

    socket.on('limpar_msg', () => {
        io.emit('limpar_overlay');
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n--- SERVIDOR JS ONLINE ---`);
    console.log(`Painel: http://localhost:${PORT}/painel`);
    console.log(`Overlay: http://localhost:${PORT}/overlay`);
});