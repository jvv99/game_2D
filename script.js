const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

// ==========================================
// CONFIGURAÇÕES
// ==========================================

const BALL_R = 13;
const CORNER_POCKET_R = 29;
const MIDDLE_POCKET_R = 25;

const FRICTION = 0.985;
const MIN_SPEED = 0.08;
const MAX_POWER = 18;

const ballColors = {
    1: "#f5d742",
    2: "#304ffe",
    3: "#d62828",
    4: "#7b2cbf",
    5: "#f77f00",
    6: "#008f39",
    7: "#7f1d1d",
    8: "#111111",
    9: "#f5d742",
    10: "#304ffe",
    11: "#d62828",
    12: "#7b2cbf",
    13: "#f77f00",
    14: "#008f39",
    15: "#7f1d1d"
};

// ==========================================
// ESTADO DO JOGO
// ==========================================

let balls = [];

let currentPlayer = 1;

let player1Group = null;
let player2Group = null;

let player1Score = 0;
let player2Score = 0;

let aiming = false;
let shotInProgress = false;

let aimX = 0;
let aimY = 0;

let power = 0;

let cueBallPocketed = false;

let shotPocketed = [];

let gameOver = false;

// ==========================================
// BURACOS
// ==========================================

const pockets = [
    {
        x: 22,
        y: 22,
        r: CORNER_POCKET_R
    },
    {
        x: W / 2,
        y: 15,
        r: MIDDLE_POCKET_R
    },
    {
        x: W - 22,
        y: 22,
        r: CORNER_POCKET_R
    },
    {
        x: 22,
        y: H - 22,
        r: CORNER_POCKET_R
    },
    {
        x: W / 2,
        y: H - 15,
        r: MIDDLE_POCKET_R
    },
    {
        x: W - 22,
        y: H - 22,
        r: CORNER_POCKET_R
    }
];

// ==========================================
// CRIAR BOLA
// ==========================================

function createBall(number, x, y) {

    return {
        number,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: BALL_R,
        pocketed: false
    };
}

// ==========================================
// CONFIGURAR JOGO
// ==========================================

function setupGame() {

    balls = [];

    // Bola branca
    balls.push(
        createBall(
            0,
            250,
            H / 2
        )
    );

    // Triângulo
    const startX = 780;
    const startY = H / 2;

    const spacing = BALL_R * 2 + 1;

    let number = 1;

    for (let row = 0; row < 5; row++) {

        for (let col = 0; col <= row; col++) {

            const x =
                startX +
                row * spacing * 0.87;

            const y =
                startY -
                row * spacing / 2 +
                col * spacing;

            balls.push(
                createBall(
                    number,
                    x,
                    y
                )
            );

            number++;
        }
    }

    currentPlayer = 1;

    player1Group = null;
    player2Group = null;

    player1Score = 0;
    player2Score = 0;

    aiming = false;
    shotInProgress = false;

    power = 0;

    cueBallPocketed = false;

    shotPocketed = [];

    gameOver = false;

    hideWinner();

    setStatus(
        "Jogador 1 começa. Mire e arraste para dar a tacada."
    );

    updateUI();
}

// ==========================================
// NOVA PARTIDA
// ==========================================

function resetGame() {
    setupGame();
}

// ==========================================
// GRUPO DAS BOLAS
// ==========================================

function getBallGroup(number) {

    if (number >= 1 && number <= 7) {
        return "solidas";
    }

    if (number >= 9 && number <= 15) {
        return "listradas";
    }

    return null;
}

// ==========================================
// DEFINIR GRUPOS
// ==========================================

function assignGroup(group) {

    if (
        player1Group === null &&
        player2Group === null
    ) {

        player1Group = group;

        player2Group =
            group === "solidas"
                ? "listradas"
                : "solidas";

        updateUI();

        return;
    }

    if (player1Group === null) {

        player1Group = group;

        updateUI();

        return;
    }

    if (player2Group === null) {

        player2Group = group;

        updateUI();
    }
}

// ==========================================
// ATUALIZAR PLACAR
// ==========================================

function updateScores() {

    player1Score = 0;
    player2Score = 0;

    if (player1Group) {

        player1Score =
            balls.filter(ball =>
                !ball.pocketed &&
                getBallGroup(ball.number) ===
                    player1Group
            ).length;
    }

    if (player2Group) {

        player2Score =
            balls.filter(ball =>
                !ball.pocketed &&
                getBallGroup(ball.number) ===
                    player2Group
            ).length;
    }
}

// ==========================================
// ATUALIZAR INTERFACE
// ==========================================

function updateUI() {

    updateScores();

    turnName.textContent =
        `Jogador ${currentPlayer}`;

    // Jogador 1
    if (player1Group) {

        type1.textContent =
            `Definição: ${
                player1Group === "solidas"
                    ? "Lisas"
                    : "Listradas"
            }`;

    } else {

        type1.textContent =
            "Definição: aguardando";
    }

    // Jogador 2
    if (player2Group) {

        type2.textContent =
            `Definição: ${
                player2Group === "solidas"
                    ? "Lisas"
                    : "Listradas"
            }`;

    } else {

        type2.textContent =
            "Definição: aguardando";
    }

    // Bolas restantes
    score1.textContent =
        player1Group
            ? player1Score
            : "-";

    score2.textContent =
        player2Group
            ? player2Score
            : "-";

    // Jogador ativo
    player1Panel.classList.toggle(
        "active",
        currentPlayer === 1
    );

    player2Panel.classList.toggle(
        "active",
        currentPlayer === 2
    );

    // Força
    powerFill.style.width =
        `${power}%`;
}

// ==========================================
// STATUS
// ==========================================

function setStatus(text) {
    status.textContent = text;
}

// ==========================================
// DESENHAR MESA
// ==========================================

function drawTable() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    ctx.fillStyle = "#176b3a";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.strokeStyle = "#0b4727";

    ctx.lineWidth = 12;

    ctx.strokeRect(
        6,
        6,
        W - 12,
        H - 12
    );

    // Bolsas
    for (const pocket of pockets) {

        ctx.beginPath();

        ctx.arc(
            pocket.x,
            pocket.y,
            pocket.r,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#050505";

        ctx.fill();
    }
}

// ==========================================
// DESENHAR BOLA
// ==========================================

function drawBall(ball) {

    if (ball.pocketed) {
        return;
    }

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );

    // Bola branca
    if (ball.number === 0) {

        ctx.fillStyle = "#ffffff";

        ctx.fill();

    } else {

        const group =
            getBallGroup(ball.number);

        // Listradas
        if (group === "listradas") {

            ctx.fillStyle = "#ffffff";

            ctx.fill();

            ctx.save();

            ctx.beginPath();

            ctx.arc(
                ball.x,
                ball.y,
                ball.radius,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.fillStyle =
                ballColors[ball.number];

            ctx.fillRect(
                ball.x - ball.radius,
                ball.y - 5,
                ball.radius * 2,
                10
            );

            ctx.restore();

        } else {

            ctx.fillStyle =
                ballColors[ball.number];

            ctx.fill();
        }
    }

    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 1;

    ctx.stroke();

    // Número
    if (ball.number !== 0) {

        ctx.fillStyle = "#ffffff";

        ctx.beginPath();

        ctx.arc(
            ball.x,
            ball.y,
            6,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#111111";

        ctx.font =
            "bold 7px Arial";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            ball.number,
            ball.x,
            ball.y
        );
    }

    ctx.restore();
}

// ==========================================
// LINHA DE MIRA
// ==========================================

function drawAim() {

    if (
        !aiming ||
        shotInProgress
    ) {
        return;
    }

    const cueBall =
        balls.find(
            ball => ball.number === 0
        );

    if (
        !cueBall ||
        cueBall.pocketed
    ) {
        return;
    }

    const dx =
        aimX - cueBall.x;

    const dy =
        aimY - cueBall.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    if (distance < 1) {
        return;
    }

    // DIREÇÃO DA TACADA
    const nx = dx / distance;
    const ny = dy / distance;

    ctx.save();

    // Linha fica NA FRENTE da bola
    ctx.beginPath();

    ctx.moveTo(
        cueBall.x,
        cueBall.y
    );

    ctx.lineTo(
        cueBall.x + nx * 220,
        cueBall.y + ny * 220
    );

    ctx.strokeStyle =
        "rgba(255,255,255,0.7)";

    ctx.setLineDash([
        8,
        8
    ]);

    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.restore();
}

// ==========================================
// TACO
// ==========================================

function drawCueStick() {

    if (
        !aiming ||
        shotInProgress
    ) {
        return;
    }

    const cueBall =
        balls.find(
            ball => ball.number === 0
        );

    if (
        !cueBall ||
        cueBall.pocketed
    ) {
        return;
    }

    const dx =
        aimX - cueBall.x;

    const dy =
        aimY - cueBall.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    if (distance < 1) {
        return;
    }

    // DIREÇÃO DA TACADA
    const nx = dx / distance;
    const ny = dy / distance;

    // Quanto maior a força,
    // mais o taco se afasta
    const cueDistance =
        35 + power * 0.8;

    // Ponta do taco fica ATRÁS
    // da bola branca
    const tipX =
        cueBall.x -
        nx * cueDistance;

    const tipY =
        cueBall.y -
        ny * cueDistance;

    // Parte traseira do taco
    const backX =
        cueBall.x -
        nx * (cueDistance + 230);

    const backY =
        cueBall.y -
        ny * (cueDistance + 230);

    ctx.save();

    // Corpo do taco
    ctx.beginPath();

    ctx.moveTo(
        tipX,
        tipY
    );

    ctx.lineTo(
        backX,
        backY
    );

    ctx.strokeStyle =
        "#d8a15d";

    ctx.lineWidth = 7;

    ctx.lineCap = "round";

    ctx.stroke();

    // Ponta do taco
    ctx.beginPath();

    ctx.moveTo(
        tipX,
        tipY
    );

    ctx.lineTo(
        tipX - nx * 12,
        tipY - ny * 12
    );

    ctx.strokeStyle =
        "#f0e4c0";

    ctx.lineWidth = 4;

    ctx.stroke();

    ctx.restore();
}

// ==========================================
// DESENHAR TUDO
// ==========================================

function draw() {

    drawTable();

    for (const ball of balls) {
        drawBall(ball);
    }

    // Primeiro a linha
    drawAim();

    // Depois o taco
    drawCueStick();

    requestAnimationFrame(draw);
}

// ==========================================
// FÍSICA
// ==========================================

function updatePhysics() {

    let moving = false;

    for (const ball of balls) {

        if (ball.pocketed) {
            continue;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        ball.vx *= FRICTION;
        ball.vy *= FRICTION;

        if (
            Math.abs(ball.vx) <
            MIN_SPEED
        ) {
            ball.vx = 0;
        }

        if (
            Math.abs(ball.vy) <
            MIN_SPEED
        ) {
            ball.vy = 0;
        }

        if (
            Math.abs(ball.vx) > 0 ||
            Math.abs(ball.vy) > 0
        ) {
            moving = true;
        }

        checkPocket(ball);

        if (ball.pocketed) {
            continue;
        }

        // Parede esquerda
        if (
            ball.x - BALL_R < 12
        ) {

            ball.x =
                12 + BALL_R;

            ball.vx *= -0.85;
        }

        // Parede direita
        if (
            ball.x + BALL_R >
            W - 12
        ) {

            ball.x =
                W - 12 - BALL_R;

            ball.vx *= -0.85;
        }

        // Parede superior
        if (
            ball.y - BALL_R < 12
        ) {

            ball.y =
                12 + BALL_R;

            ball.vy *= -0.85;
        }

        // Parede inferior
        if (
            ball.y + BALL_R >
            H - 12
        ) {

            ball.y =
                H - 12 - BALL_R;

            ball.vy *= -0.85;
        }
    }

    checkBallCollisions();

    if (
        shotInProgress &&
        !moving &&
        allBallsStopped()
    ) {

        finishTurn();
    }
}

// ==========================================
// COLISÃO ENTRE BOLAS
// ==========================================

function checkBallCollisions() {

    for (
        let i = 0;
        i < balls.length;
        i++
    ) {

        const a = balls[i];

        if (a.pocketed) {
            continue;
        }

        for (
            let j = i + 1;
            j < balls.length;
            j++
        ) {

            const b = balls[j];

            if (b.pocketed) {
                continue;
            }

            const dx =
                b.x - a.x;

            const dy =
                b.y - a.y;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            const minDistance =
                a.radius +
                b.radius;

            if (
                distance === 0 ||
                distance > minDistance
            ) {
                continue;
            }

            const nx =
                dx / distance;

            const ny =
                dy / distance;

            const overlap =
                minDistance -
                distance;

            a.x -=
                nx * overlap / 2;

            a.y -=
                ny * overlap / 2;

            b.x +=
                nx * overlap / 2;

            b.y +=
                ny * overlap / 2;

            const rvx =
                b.vx - a.vx;

            const rvy =
                b.vy - a.vy;

            const velocityAlongNormal =
                rvx * nx +
                rvy * ny;

            if (
                velocityAlongNormal > 0
            ) {
                continue;
            }

            const impulse =
                -velocityAlongNormal;

            a.vx -=
                impulse * nx;

            a.vy -=
                impulse * ny;

            b.vx +=
                impulse * nx;

            b.vy +=
                impulse * ny;
        }
    }
}

// ==========================================
// VERIFICAR BOLSA
// ==========================================

function checkPocket(ball) {

    for (const pocket of pockets) {

        const dx =
            ball.x - pocket.x;

        const dy =
            ball.y - pocket.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (
            distance <
            pocket.r
        ) {

            ball.pocketed = true;

            ball.vx = 0;
            ball.vy = 0;

            if (ball.number === 0) {

                cueBallPocketed = true;

            } else {

                shotPocketed.push(
                    ball.number
                );
            }

            break;
        }
    }
}

// ==========================================
// TODAS AS BOLAS PARADAS
// ==========================================

function allBallsStopped() {

    for (const ball of balls) {

        if (ball.pocketed) {
            continue;
        }

        if (
            Math.abs(ball.vx) >
                MIN_SPEED ||
            Math.abs(ball.vy) >
                MIN_SPEED
        ) {
            return false;
        }
    }

    return true;
}

// ==========================================
// RECOLOCAR BOLA BRANCA
// ==========================================

function respawnCueBall() {

    const cueBall =
        balls.find(
            ball => ball.number === 0
        );

    if (!cueBall) {
        return;
    }

    cueBall.pocketed = false;

    cueBall.x = 250;
    cueBall.y = H / 2;

    cueBall.vx = 0;
    cueBall.vy = 0;
}

// ==========================================
// BOLAS RESTANTES DO GRUPO
// ==========================================

function hasRemainingGroupBalls(group) {

    return balls.some(ball =>
        !ball.pocketed &&
        getBallGroup(ball.number) ===
            group
    );
}

// ==========================================
// FINAL DA TACADA
// ==========================================

function finishTurn() {

    shotInProgress = false;

    // Bola branca caiu
    if (cueBallPocketed) {

        cueBallPocketed = false;

        shotPocketed = [];

        setStatus(
            `Jogador ${currentPlayer} errou a tacada.`
        );

        setTimeout(() => {

            respawnCueBall();

            switchPlayer();

        }, 500);

        return;
    }

    // Nenhuma bola caiu
    if (
        shotPocketed.length === 0
    ) {

        setStatus(
            `Jogador ${currentPlayer} não encaçapou nenhuma bola.`
        );

        switchPlayer();

        return;
    }

    // ======================================
    // PRIMEIRA DEFINIÇÃO
    // ======================================

    if (
        player1Group === null &&
        player2Group === null
    ) {

        for (
            const number of shotPocketed
        ) {

            const group =
                getBallGroup(number);

            if (
                group === "solidas" ||
                group === "listradas"
            ) {

                assignGroup(group);

                break;
            }
        }
    }

    const myGroup =
        currentPlayer === 1
            ? player1Group
            : player2Group;

    let validPocket = false;
    let eightBallPocketed = false;

    // ======================================
    // ANALISAR BOLAS
    // ======================================

    for (
        const number of shotPocketed
    ) {

        if (number === 8) {

            eightBallPocketed = true;

            continue;
        }

        const group =
            getBallGroup(number);

        if (group === myGroup) {

            validPocket = true;
        }
    }

    updateUI();

    // ======================================
    // BOLA 8
    // ======================================

    if (eightBallPocketed) {

        if (
            myGroup &&
            hasRemainingGroupBalls(
                myGroup
            )
        ) {

            endGame(
                currentPlayer === 1
                    ? 2
                    : 1,

                `O Jogador ${currentPlayer} encaçapou a bola 8 antes de limpar suas bolas.`
            );

            return;
        }

        if (!myGroup) {

            endGame(
                currentPlayer === 1
                    ? 2
                    : 1,

                `O Jogador ${currentPlayer} encaçapou a bola 8 antes da definição das bolas.`
            );

            return;
        }

        endGame(
            currentPlayer,

            `O Jogador ${currentPlayer} limpou suas bolas e encaçapou a bola 8 corretamente.`
        );

        return;
    }

    shotPocketed = [];

    // Continua jogando
    if (validPocket) {

        setStatus(
            `Jogador ${currentPlayer} encaçapou uma bola e continua jogando.`
        );

        updateUI();

        return;
    }

    // Passa a vez
    switchPlayer();
}

// ==========================================
// TROCAR JOGADOR
// ==========================================

function switchPlayer() {

    currentPlayer =
        currentPlayer === 1
            ? 2
            : 1;

    power = 0;

    shotPocketed = [];

    aiming = false;

    setStatus(
        `Vez do Jogador ${currentPlayer}. Mire e arraste para dar a tacada.`
    );

    updateUI();
}

// ==========================================
// FINALIZAR PARTIDA
// ==========================================

function endGame(
    winner,
    reason
) {

    gameOver = true;

    shotInProgress = false;

    aiming = false;

    winnerTitle.textContent =
        `Jogador ${winner} venceu!`;

    winnerText.textContent =
        reason;

    messageOverlay.classList.remove(
        "hidden"
    );
}

// ==========================================
// ESCONDER MODAL
// ==========================================

function hideWinner() {

    messageOverlay.classList.add(
        "hidden"
    );
}

// ==========================================
// POSIÇÃO DO MOUSE
// ==========================================

function getMousePosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    const scaleX =
        W / rect.width;

    const scaleY =
        H / rect.height;

    return {
        x:
            (event.clientX -
                rect.left) *
            scaleX,

        y:
            (event.clientY -
                rect.top) *
            scaleY
    };
}

// ==========================================
// COMEÇAR A MIRAR
// ==========================================

canvas.addEventListener(
    "mousedown",
    event => {

        if (
            shotInProgress ||
            gameOver
        ) {
            return;
        }

        const cueBall =
            balls.find(
                ball => ball.number === 0
            );

        if (
            !cueBall ||
            cueBall.pocketed
        ) {
            return;
        }

        const mouse =
            getMousePosition(event);

        aimX = mouse.x;
        aimY = mouse.y;

        aiming = true;

        power = 0;

        updateUI();
    }
);

// ==========================================
// MOUSE DENTRO DO CANVAS
// ==========================================

canvas.addEventListener(
    "mousemove",
    event => {

        if (!aiming) {
            return;
        }

        const mouse =
            getMousePosition(event);

        aimX = mouse.x;
        aimY = mouse.y;

        const cueBall =
            balls.find(
                ball => ball.number === 0
            );

        if (!cueBall) {
            return;
        }

        const dx =
            aimX - cueBall.x;

        const dy =
            aimY - cueBall.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        power =
            Math.min(
                100,
                distance / 3
            );

        updateUI();
    }
);

// ==========================================
// MOUSE FORA DO CANVAS
// ==========================================

window.addEventListener(
    "mousemove",
    event => {

        if (!aiming) {
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        const scaleX =
            W / rect.width;

        const scaleY =
            H / rect.height;

        aimX =
            (event.clientX -
                rect.left) *
            scaleX;

        aimY =
            (event.clientY -
                rect.top) *
            scaleY;

        const cueBall =
            balls.find(
                ball => ball.number === 0
            );

        if (!cueBall) {
            return;
        }

        const dx =
            aimX - cueBall.x;

        const dy =
            aimY - cueBall.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        power =
            Math.min(
                100,
                distance / 3
            );

        updateUI();
    }
);

// ==========================================
// SOLTAR MOUSE
// ==========================================

window.addEventListener(
    "mouseup",
    () => {

        if (!aiming) {
            return;
        }

        aiming = false;

        if (
            shotInProgress ||
            gameOver
        ) {
            return;
        }

        const cueBall =
            balls.find(
                ball => ball.number === 0
            );

        if (
            !cueBall ||
            cueBall.pocketed
        ) {
            return;
        }

        const dx =
            aimX - cueBall.x;

        const dy =
            aimY - cueBall.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (distance < 5) {

            power = 0;

            updateUI();

            return;
        }

        // Direção correta da tacada
        const nx =
            dx / distance;

        const ny =
            dy / distance;

        const force =
            Math.min(
                MAX_POWER,

                Math.max(
                    1,
                    power /
                        100 *
                        MAX_POWER
                )
            );

        // A bola vai PARA onde o mouse aponta
        cueBall.vx =
            nx * force;

        cueBall.vy =
            ny * force;

        shotInProgress = true;

        shotPocketed = [];

        cueBallPocketed = false;

        power = 0;

        setStatus(
            `Jogador ${currentPlayer} está dando a tacada...`
        );

        updateUI();
    }
);

// ==========================================
// BOTÃO NOVA PARTIDA
// ==========================================

newGameBtn.addEventListener(
    "click",
    () => {
        resetGame();
    }
);

// ==========================================
// BOTÃO JOGAR NOVAMENTE
// ==========================================

restartBtn.addEventListener(
    "click",
    () => {
        resetGame();
    }
);

// ==========================================
// LOOP DA FÍSICA
// ==========================================

function gameLoop() {

    updatePhysics();

    requestAnimationFrame(
        gameLoop
    );
}

// ==========================================
// INICIAR
// ==========================================

setupGame();

draw();

gameLoop();