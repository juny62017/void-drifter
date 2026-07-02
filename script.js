const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const STATE = {
    MENU: 0,
    PLAYING: 1,
    PAUSED: 2,
    GAME_OVER: 3
};

let currentState = STATE.MENU;
const keys = {};
let lastTime = 0;
let menuTime = 0;
const stars = [];

let score = 0;
const enemies = [];
let spawnTimer = 0;

const player = {
    x: width / 2,
    y: height - 100,
    vx: 0,
    vy: 0,
    moving: false,
    fireTimer: 0,
    fireRate: 150
};

const bulletPool = [];

for (let i = 0; i < 100; i++) {
    bulletPool.push({ active: false, x: 0, y: 0 });
}

function initStars() {
    stars.length = 0;
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 1,
            speed: Math.random() * 0.02 + 0.01
        });
    }
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 2,
            speed: Math.random() * 0.05 + 0.04
        });
    }
    for (let i = 0; i < 20; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 3,
            speed: Math.random() * 0.1 + 0.08
        });
    }
}

initStars();

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initStars();
    
    if (player.x > width) player.x = width - 20;
    if (player.y > height) player.y = height - 20;
});

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function updateStars(dt) {
    for (let i = 0; i < stars.length; i++) {
        stars[i].y += stars[i].speed * dt;
        if (stars[i].y > height) {
            stars[i].y = 0;
            stars[i].x = Math.random() * width;
        }
    }
}

function updatePlayer(dt) {
    player.moving = false;
    let ax = 0;
    let ay = 0;
    const acc = 0.002 * dt;

    if (keys['ArrowUp'] || keys['KeyW']) { ay -= acc; player.moving = true; }
    if (keys['ArrowDown'] || keys['KeyS']) { ay += acc; player.moving = true; }
    if (keys['ArrowLeft'] || keys['KeyA']) { ax -= acc; player.moving = true; }
    if (keys['ArrowRight'] || keys['KeyD']) { ax += acc; player.moving = true; }

    player.vx += ax;
    player.vy += ay;
    
    player.vx *= 0.92;
    player.vy *= 0.92;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    if (player.x < 15) { player.x = 15; player.vx = 0; }
    if (player.x > width - 15) { player.x = width - 15; player.vx = 0; }
    if (player.y < 15) { player.y = 15; player.vy = 0; }
    if (player.y > height - 15) { player.y = height - 15; player.vy = 0; }

    player.fireTimer -= dt;

    if (keys['Space'] && player.fireTimer <= 0) {
        for (let i = 0; i < bulletPool.length; i++) {
            if (!bulletPool[i].active) {
                bulletPool[i].active = true;
                bulletPool[i].x = player.x;
                bulletPool[i].y = player.y - 15;
                player.fireTimer = player.fireRate;
                break;
            }
        }
    }
}

function updateBullets(dt) {
    for (let i = 0; i < bulletPool.length; i++) {
        if (bulletPool[i].active) {
            bulletPool[i].y -= 0.8 * dt;
            if (bulletPool[i].y < -20) {
                bulletPool[i].active = false;
            }
        }
    }
}

function updateSpawns(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        enemies.push({
            type: 'drone',
            x: Math.random() * (width - 60) + 30,
            y: -30,
            vx: 0,
            vy: 0.15,
            hp: 1
        });
        spawnTimer = 1000;
    }
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        
        if (e.y > height + 30) {
            enemies.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        for (let j = 0; j < bulletPool.length; j++) {
            const b = bulletPool[j];
            if (b.active) {
                if (b.x + 2 > e.x - 15 && b.x - 2 < e.x + 15 && b.y > e.y - 15 && b.y - 15 < e.y + 15) {
                    b.active = false;
                    e.hp--;
                    if (e.hp <= 0) {
                        enemies.splice(i, 1);
                        score += 100;
                        break;
                    }
                }
            }
        }
    }
}

function update(dt) {
    updateStars(dt);
    
    if (currentState === STATE.MENU) {
        menuTime += dt;
        if (keys['Enter']) {
            currentState = STATE.PLAYING;
            player.x = width / 2;
            player.y = height - 100;
            player.vx = 0;
            player.vy = 0;
            player.fireTimer = 0;
            score = 0;
            enemies.length = 0;
            spawnTimer = 1000;
            for (let i = 0; i < bulletPool.length; i++) {
                bulletPool[i].active = false;
            }
            keys['Enter'] = false;
        }
    } else if (currentState === STATE.PLAYING) {
        updatePlayer(dt);
        updateBullets(dt);
        updateSpawns(dt);
        updateEnemies(dt);
        checkCollisions();
        
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

function drawStars() {
    ctx.fillStyle = '#E8E4D4';
    for (let i = 0; i < stars.length; i++) {
        ctx.fillRect(stars[i].x, stars[i].y, stars[i].size, stars[i].size);
    }
}

function drawMenu() {
    ctx.fillStyle = '#E8E4D4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = "bold 64px 'Courier New', Courier, monospace";
    ctx.fillText("VOID DRIFTER", width / 2, height / 2 - 50);
    
    if (Math.floor(menuTime / 600) % 2 === 0) {
        ctx.font = "24px 'Courier New', Courier, monospace";
        ctx.fillText("PRESS ENTER TO START", width / 2, height / 2 + 50);
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    if (player.moving) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3FBDCC';
        ctx.fillStyle = '#E8E4D4';
        ctx.beginPath();
        ctx.moveTo(-6, 12);
        ctx.lineTo(6, 12);
        ctx.lineTo(0, 25 + Math.random() * 8);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#3FBDCC';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(15, 15);
    ctx.lineTo(0, 8);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawBullets() {
    ctx.fillStyle = '#3FBDCC';
    for (let i = 0; i < bulletPool.length; i++) {
        if (bulletPool[i].active) {
            ctx.fillRect(bulletPool[i].x - 2, bulletPool[i].y - 15, 4, 15);
        }
    }
}

function drawEnemies() {
    ctx.fillStyle = '#C94F38';
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.type === 'drone') {
            ctx.beginPath();
            ctx.moveTo(e.x, e.y + 15);
            ctx.lineTo(e.x + 15, e.y - 15);
            ctx.lineTo(e.x, e.y - 5);
            ctx.lineTo(e.x - 15, e.y - 15);
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawUI() {
    ctx.fillStyle = '#E8E4D4';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = "bold 20px 'Courier New', Courier, monospace";
    ctx.fillText(`SCORE: ${score}`, 20, 20);
}

function draw() {
    ctx.fillStyle = '#0B0C1E';
    ctx.fillRect(0, 0, width, height);

    drawStars();

    if (currentState === STATE.MENU) {
        drawMenu();
    } else if (currentState === STATE.PLAYING) {
        drawBullets();
        drawEnemies();
        drawPlayer();
        drawUI();
    } else if (currentState === STATE.PAUSED) {
        drawBullets();
        drawEnemies();
        drawPlayer();
        drawUI();
        
        ctx.fillStyle = 'rgba(11, 12, 30, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#E8E4D4';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "32px 'Courier New', Courier, monospace";
        ctx.fillText("PAUSED", width / 2, height / 2);
    } else if (currentState === STATE.GAME_OVER) {
        drawBullets();
        drawEnemies();
        drawPlayer();
        drawUI();
        
        ctx.fillStyle = 'rgba(11, 12, 30, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#E8E4D4';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "32px 'Courier New', Courier, monospace";
        ctx.fillText("GAME OVER", width / 2, height / 2);
    }
}

function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (dt > 0) {
        update(dt);
        draw();
    }

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);