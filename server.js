const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { LiveChat } = require('youtube-chat');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let liveChat = null;       // YouTube
let tiktokChat = null;     // TikTok

app.use(express.static('public'));

app.get('/painel',  (req, res) => res.sendFile(__dirname + '/public/painel.html'));
app.get('/overlay', (req, res) => res.sendFile(__dirname + '/public/overlay.html'));

const chatHistory = [];
const MAX_CACHE = 50;

function pushMsg(msgData) {
    chatHistory.push(msgData);
    if (chatHistory.length > MAX_CACHE) chatHistory.shift();
    io.emit('nova_mensagem', msgData);
}

// ─── YouTube ────────────────────────────────────────────────────────────────
function iniciarYoutube(videoId) {
    if (liveChat) {
        liveChat.stop();
        liveChat = null;
    }

    liveChat = new LiveChat({ liveId: videoId });

    liveChat.on("chat", (chatItem) => {
        const msgData = {
            source: 'youtube',
            user: chatItem.author.name,
            message: chatItem.message.map(m => m.text || '').join(''),
            image: chatItem.author.thumbnail?.url || '',
            id: Date.now()
        };
        pushMsg(msgData);
    });

    liveChat.start()
        .then(() => {
            console.log(`[YouTube] Capturando chat da live: ${videoId}`);
            io.emit('status_youtube', { online: true, id: videoId });
        })
        .catch(err => {
            console.error("[YouTube] Erro ao iniciar chat:", err);
            io.emit('status_youtube', { online: false, erro: err.message });
        });
}

function pararYoutube() {
    if (liveChat) {
        liveChat.stop();
        liveChat = null;
        console.log('[YouTube] Chat encerrado.');
    }
    io.emit('status_youtube', { online: false });
}

// ─── TikTok ─────────────────────────────────────────────────────────────────
function iniciarTiktok(username) {
    if (tiktokChat) {
        tiktokChat.disconnect();
        tiktokChat = null;
    }

    // Remove @ se o usuário digitou com @
    const user = username.replace(/^@/, '');

    tiktokChat = new WebcastPushConnection(user);

    tiktokChat.connect()
        .then(state => {
            console.log(`[TikTok] Conectado a @${user} | roomId: ${state.roomId}`);
            io.emit('status_tiktok', { online: true, user });
        })
        .catch(err => {
            console.error("[TikTok] Erro ao conectar:", err);
            io.emit('status_tiktok', { online: false, erro: err.message });
        });

    tiktokChat.on('chat', data => {
        const msgData = {
            source: 'tiktok',
            user: data.uniqueId,
            message: data.comment,
            image: data.profilePictureUrl || '',
            id: Date.now()
        };
        pushMsg(msgData);
    });

    tiktokChat.on('disconnected', () => {
        console.log('[TikTok] Desconectado.');
        io.emit('status_tiktok', { online: false });
    });

    tiktokChat.on('error', err => {
        console.error('[TikTok] Erro:', err);
        io.emit('status_tiktok', { online: false, erro: err.message });
    });
}

function pararTiktok() {
    if (tiktokChat) {
        tiktokChat.disconnect();
        tiktokChat = null;
        console.log('[TikTok] Chat encerrado.');
    }
    io.emit('status_tiktok', { online: false });
}

// ─── Socket.io ──────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    // Envia histórico e status atual para quem acabou de conectar
    socket.emit('historico_chat', chatHistory);
    socket.emit('status_youtube', { online: !!liveChat });
    socket.emit('status_tiktok', { online: !!tiktokChat });

    // YouTube
    socket.on('iniciar_youtube', (urlOuId) => {
        const id = urlOuId.includes('v=')     ? urlOuId.split('v=')[1].split('&')[0]
                 : urlOuId.includes('live/')  ? urlOuId.split('live/')[1].split('?')[0]
                 : urlOuId.trim();
        chatHistory.length = 0;
        iniciarYoutube(id);
    });

    socket.on('parar_youtube', () => pararYoutube());

    // TikTok
    socket.on('iniciar_tiktok', (username) => {
        iniciarTiktok(username.trim());
    });

    socket.on('parar_tiktok', () => pararTiktok());

    // Overlay
    socket.on('selecionar_msg', (data) => {
        io.emit('exibir_no_overlay', data);
    });

    socket.on('limpar_msg', () => {
        io.emit('limpar_overlay');
    });

    // Limpar histórico do chat visível
    socket.on('limpar_historico', () => {
        chatHistory.length = 0;
        io.emit('historico_chat', []);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n--- SERVIDOR ONLINE ---`);
    console.log(`Painel:   http://localhost:${PORT}/painel`);
    console.log(`Overlay:  http://localhost:${PORT}/overlay`);
});