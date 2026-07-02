const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

const STATE = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3
};

let currentState = STATE.MENU;

const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

let lastTime = 0;

function update(dt) {
    if (currentState === STATE.MENU) {
        if (keys['Enter']) {
            currentState = STATE.PLAYING;
            keys['Enter'] = false;
        }
    } else if (currentState === STATE.PLAYING) {
        if (keys['Escape']) {
            currentState = STATE.PAUSED;
            keys['Escape'] = false;
        }
    } else if (currentState === STATE.PAUSED) {
        if (keys['Escape']) {
            currentState = STATE.PLAYING;
            keys['Escape'] = false;
        }
    }
}

function draw() {
    ctx.fillStyle = '#0B0C1E';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#E8E4D4';
    ctx.font = "20px 'Courier New', Courier, monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (currentState === STATE.MENU) {
        ctx.fillText("PRESS ENTER TO START", width / 2, height / 2);
    } else if (currentState === STATE.PLAYING) {
        ctx.fillText("PLAYING...", width / 2, height / 2);
    } else if (currentState === STATE.PAUSED) {
        ctx.fillText("PAUSED", width / 2, height / 2);
    } else if (currentState === STATE.GAME_OVER) {
        ctx.fillText("GAME OVER", width / 2, height / 2);
    }
}

function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);