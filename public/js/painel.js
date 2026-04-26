const socket = io();
const setupScreen = document.getElementById("setup-screen");
const mainScreen = document.getElementById("main-screen");
const inputUrl = document.getElementById("live-url");
const btnConectar = document.getElementById("btn-conectar");
const btnTrocar = document.getElementById("btn-trocar-live");
const chatDiv = document.getElementById("chat");

function showSetup() {
    setupScreen.style.display = "flex";
    mainScreen.style.display = "none";
}

function showMain() {
    setupScreen.style.display = "none";
    mainScreen.style.display = "flex";
}

btnConectar.onclick = () => {
    const valor = inputUrl.value.trim();
    if (valor) {
        socket.emit("mudar_live", valor);
        chatDiv.innerHTML = "";
        showMain();
    }
};

btnTrocar.onclick = () => {
    if (confirm("Deseja desconectar desta live e trocar o ID?")) {
        showSetup();
    }
};

function adicionarMensagemNaTela(data) {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
            <div class="card-content">
                <img src="${data.image}"> 
                <div>
                    <div style="font-size: 0.8rem; color: #aaa; margin-bottom: 2px;">${data.user}</div>
                    <div style="line-height: 1.4">${data.message}</div>
                </div>
            </div>
            <button class="btn-remove-card">REMOVER</button>
        `;

    div.onclick = () => {
        limparDestaqueVisual();
        div.classList.add("ativo");
        socket.emit("selecionar_msg", data);
    };

    const btnRemove = div.querySelector(".btn-remove-card");
    btnRemove.onclick = (e) => {
        e.stopPropagation();
        socket.emit("limpar_msg");
        limparDestaqueVisual();
    };

    chatDiv.prepend(div);
}

function limparDestaqueVisual() {
    document
        .querySelectorAll(".card")
        .forEach((c) => c.classList.remove("ativo"));
}

socket.on("historico_chat", (historico) => {
    if (historico.length > 0) showMain();
    chatDiv.innerHTML = "";
    historico.forEach((msg) => adicionarMensagemNaTela(msg));
});

socket.on("nova_mensagem", (data) => {
    adicionarMensagemNaTela(data);
});

socket.on("limpar_overlay", () => {
    limparDestaqueVisual();
});