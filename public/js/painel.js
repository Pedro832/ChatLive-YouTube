const socket = io();

const setupScreen = document.getElementById("setup-screen");
const mainScreen = document.getElementById("main-screen");
const chatDiv = document.getElementById("chat");

const inputYT = document.getElementById("input-youtube");
const inputTT = document.getElementById("input-tiktok");
const btnConectarYT = document.getElementById("btn-conectar-yt");
const btnPararYT = document.getElementById("btn-parar-yt");
const btnConectarTT = document.getElementById("btn-conectar-tt");
const btnPararTT = document.getElementById("btn-parar-tt");
const btnAbrirPainel = document.getElementById("btn-abrir-painel");
const dotYT = document.getElementById("dot-yt");
const dotTT = document.getElementById("dot-tt");

const badgeYT = document.getElementById("badge-yt");
const badgeTT = document.getElementById("badge-tt");
const btnVoltarSetup = document.getElementById("btn-voltar-setup");
const btnLimparChat = document.getElementById("btn-limpar-chat");

let statusYT = false;
let statusTT = false;
let filtroAtivo = "todos";

function showSetup() {
  setupScreen.style.display = "flex";
  mainScreen.style.display = "none";
}

function showMain() {
  setupScreen.style.display = "none";
  mainScreen.style.display = "flex";
}

function atualizarStatusYT(online, erro) {
  statusYT = online;
  dotYT.className = "status-dot " + (online ? "online" : erro ? "erro" : "");
  badgeYT.className = "status-badge " + (online ? "badge-online" : "badge-off");
  badgeYT.textContent = "YouTube " + (online ? "●" : "○");

  btnConectarYT.style.display = online ? "none" : "inline-block";
  btnPararYT.style.display = online ? "inline-block" : "none";

  atualizarBotaoPainel();

  if (erro) mostrarErro("YouTube: " + erro);
}

function atualizarStatusTT(online, erro) {
  statusTT = online;
  dotTT.className = "status-dot " + (online ? "online" : erro ? "erro" : "");
  badgeTT.className = "status-badge " + (online ? "badge-online" : "badge-off");
  badgeTT.textContent = "TikTok " + (online ? "●" : "○");

  btnConectarTT.style.display = online ? "none" : "inline-block";
  btnPararTT.style.display = online ? "inline-block" : "none";

  atualizarBotaoPainel();

  if (erro) mostrarErro("TikTok: " + erro);
}

function atualizarBotaoPainel() {
  btnAbrirPainel.disabled = !(statusYT || statusTT);
}

function mostrarErro(msg) {
  const el = document.createElement("div");
  el.className = "toast-erro";
  el.textContent = "⚠ " + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

btnConectarYT.onclick = () => {
  const val = inputYT.value.trim();
  if (!val) return;
  chatDiv.innerHTML = "";
  socket.emit("iniciar_youtube", val);
};

btnPararYT.onclick = () => {
  socket.emit("parar_youtube");
};

btnConectarTT.onclick = () => {
  const val = inputTT.value.trim();
  if (!val) return;
  socket.emit("iniciar_tiktok", val);
};

btnPararTT.onclick = () => {
  socket.emit("parar_tiktok");
};

btnAbrirPainel.onclick = () => showMain();

btnVoltarSetup.onclick = () => showSetup();

btnLimparChat.onclick = () => {
  if (confirm("Limpar todas as mensagens do painel?")) {
    socket.emit("limpar_historico");
  }
};

document.querySelectorAll(".filtro").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".filtro")
      .forEach((b) => b.classList.remove("ativo"));
    btn.classList.add("ativo");
    filtroAtivo = btn.dataset.src;
    aplicarFiltro();
  };
});

function aplicarFiltro() {
  document.querySelectorAll(".card").forEach((card) => {
    const src = card.dataset.source;
    card.style.display =
      filtroAtivo === "todos" || filtroAtivo === src ? "flex" : "none";
  });
}

function adicionarMensagemNaTela(data) {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.source = data.source || "youtube";

  const isYT = data.source === "youtube";
  const sourceBadge = isYT
    ? `<span class="source-badge source-yt"> 
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
          </svg></span>`
    : `<span class="source-badge source-tt">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
          </svg>
        </span>`;

  const avatar = data.image
    ? `<img src="${data.image}" onerror="this.style.display='none'">`
    : `<div class="avatar-placeholder">${(data.user || "?")[0].toUpperCase()}</div>`;

  div.innerHTML = `
        <div class="card-content">
            ${sourceBadge}
            ${avatar}
            <div>
                <div class="card-user">${data.user}</div>
                <div class="card-msg">${data.message}</div>
            </div>
        </div>
        <button class="btn-remove-card">✕</button>
    `;

  div.onclick = () => {
    limparDestaqueVisual();
    div.classList.add("ativo");
    socket.emit("selecionar_msg", data);
  };

  div.querySelector(".btn-remove-card").onclick = (e) => {
    e.stopPropagation();
    socket.emit("limpar_msg");
    limparDestaqueVisual();
  };

  if (filtroAtivo !== "todos" && filtroAtivo !== div.dataset.source) {
    div.style.display = "none";
  }

  chatDiv.prepend(div);

  const cards = chatDiv.querySelectorAll(".card");
  if (cards.length > 100) cards[cards.length - 1].remove();
}

function limparDestaqueVisual() {
  document
    .querySelectorAll(".card")
    .forEach((c) => c.classList.remove("ativo"));
}

socket.on("historico_chat", (historico) => {
  chatDiv.innerHTML = "";
  historico.forEach((msg) => adicionarMensagemNaTela(msg));
});

socket.on("nova_mensagem", (data) => {
  adicionarMensagemNaTela(data);
});

socket.on("limpar_overlay", () => {
  limparDestaqueVisual();
});

socket.on("status_youtube", ({ online, erro }) => {
  atualizarStatusYT(online, erro);
});

socket.on("status_tiktok", ({ online, erro }) => {
  atualizarStatusTT(online, erro);
});
