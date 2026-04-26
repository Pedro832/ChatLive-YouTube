const socket = io();
const box = document.getElementById("box");
const userImg = document.getElementById("user-img");
const userName = document.getElementById("user");
const textMsg = document.getElementById("text");

let estaVisivel = false;

function mostrar(data) {
    userImg.src = data.image;
    userName.innerText = data.user;
    textMsg.innerText = data.message;

    box.style.visibility = "visible";
    box.classList.remove("animar-saida");
    box.classList.add("animar-entrada");
    estaVisivel = true;
}

function esconder() {
    if (!estaVisivel) return;

    box.classList.remove("animar-entrada");
    box.classList.add("animar-saida");

    setTimeout(() => {
        if (box.classList.contains("animar-saida")) {
            box.style.visibility = "hidden";
            estaVisivel = false;
        }
    }, 500);
}

socket.on("exibir_no_overlay", (data) => {
    if (estaVisivel) {
        box.classList.remove("animar-entrada");
        box.classList.add("animar-saida");

        setTimeout(() => {
            mostrar(data);
        }, 400);
    } else {
        mostrar(data);
    }
});

socket.on("limpar_overlay", () => {
    esconder();
});