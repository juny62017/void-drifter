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
let lives = 3;
const enemies = [];
let spawnTimer = 0;

const player = {
    x: width / 2,
    y: height - 100,
    vx: 0,
    vy: 0,
    moving: false,
    fireTimer: 0,
    fireRate: 150,
    invulnerableTimer: 0
};

const bulletPool = [];
const enemyBulletPool = [];

for (let i = 0; i < 100; i++) {
    bulletPool.push({ active: false, x: 0, y: 0 });
    enemyBulletPool.push({ active: false, x: 0, y: 0, vx: 0, vy: 0 });
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
    if (player.invulnerableTimer > 0) {
        player.invulnerableTimer -= dt;
    }

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

    for (let i = 0; i < enemyBulletPool.length; i++) {
        if (enemyBulletPool[i].active) {
            enemyBulletPool[i].x += enemyBulletPool[i].vx * dt;
            enemyBulletPool[i].y += enemyBulletPool[i].vy * dt;
            if (enemyBulletPool[i].y > height + 20 || enemyBulletPool[i].x < -20 || enemyBulletPool[i].x > width + 20) {
                enemyBulletPool[i].active = false;
            }
        }
    }
}

function updateSpawns(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        const rand = Math.random();
        let type = 'drone';
        if (rand > 0.8) type = 'turret';
        else if (rand > 0.5) type = 'weaver';

        const startX = Math.random() * (width - 60) + 30;

        enemies.push({
            type: type,
            x: startX,
            startX: startX,
            y: -30,
            vx: 0,
            vy: type === 'drone' ? 0.15 : (type === 'weaver' ? 0.1 : 0.05),
            hp: type === 'turret' ? 3 : 1,
            timer: 0,
            fireTimer: 1000 + Math.random() * 1000
        });
        spawnTimer = 1000;
    }
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.timer += dt;
        
        if (e.type === 'weaver') {
            e.x = e.startX + Math.sin(e.timer * 0.003) * 80;
            e.y += e.vy * dt;
        } else if (e.type === 'turret') {
            e.y += e.vy * dt;
            e.fireTimer -= dt;
            if (e.fireTimer <= 0 && e.y > 50 && e.y < height / 2) {
                for (let j = 0; j < enemyBulletPool.length; j++) {
                    if (!enemyBulletPool[j].active) {
                        const eb = enemyBulletPool[j];
                        eb.active = true;
                        eb.x = e.x;
                        eb.y = e.y;
                        const dx = player.x - e.x;
                        const dy = player.y - e.y;
                        const mag = Math.sqrt(dx * dx + dy * dy);
                        eb.vx = (dx / mag) * 0.3;
                        eb.vy = (dy / mag) * 0.3;
                        break;
                    }
                }
                e.fireTimer = 2000;
            }
        } else {
            e.y += e.vy * dt;
        }
        
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
                        score += e.type === 'turret' ? 300 : (e.type === 'weaver' ? 200 : 100);
                        break;
                    }
                }
            }
        }
    }
}

function checkPlayerHits() {
    if (player.invulnerableTimer > 0) return;

    let hit = false;

    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
            hit = true;
            break;
        }
    }

    for (let i = 0; i < enemyBulletPool.length; i++) {
        const b = enemyBulletPool[i];
        if (b.active) {
            const dx = player.x - b.x;
            const dy = player.y - b.y;
            if (Math.sqrt(dx * dx + dy * dy) < 15) {
                hit = true;
                b.active = false;
                break;
            }
        }
    }

    if (hit) {
        lives--;
        player.invulnerableTimer = 1500;
        if (lives < 0) {
            currentState = STATE.GAME_OVER;
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
            player.invulnerableTimer = 0;
            score = 0;
            lives = 3;
            enemies.length = 0;
            spawnTimer = 1000;
            for (let i = 0; i < bulletPool.length; i++) {
                bulletPool[i].active = false;
            }
            for (let i = 0; i < enemyBulletPool.length; i++) {
                enemyBulletPool[i].active = false;
            }
            keys['Enter'] = false;
        }
    } else if (currentState === STATE.PLAYING) {
        updatePlayer(dt);
        updateBullets(dt);
        updateSpawns(dt);
        updateEnemies(dt);
        checkCollisions();
        checkPlayerHits();
        
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
    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 100) % 2 === 0) {
        return;
    }

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

    ctx.fillStyle = '#C94F38';
    for (let i = 0; i < enemyBulletPool.length; i++) {
        if (enemyBulletPool[i].active) {
            ctx.beginPath();
            ctx.arc(enemyBulletPool[i].x, enemyBulletPool[i].y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawEnemies() {
    ctx.fillStyle = '#C94F38';
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        ctx.save();
        ctx.translate(e.x, e.y);
        
        if (e.type === 'drone') {
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(15, -15);
            ctx.lineTo(0, -5);
            ctx.lineTo(-15, -15);
            ctx.closePath();
            ctx.fill();
        } else if (e.type === 'weaver') {
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(15, 0);
            ctx.lineTo(0, -15);
            ctx.lineTo(-15, 0);
            ctx.closePath();
            ctx.fill();
        } else if (e.type === 'turret') {
            ctx.fillRect(-12, -12, 24, 24);
            ctx.fillStyle = '#E8E4D4';
            ctx.fillRect(-4, 0, 8, 18);
        }
        
        ctx.restore();
    }
}

function drawUI() {
    ctx.fillStyle = '#E8E4D4';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = "bold 20px 'Courier New', Courier, monospace";
    ctx.fillText(`SCORE: ${score}`, 20, 20);

    for (let i = 0; i < lives; i++) {
        ctx.save();
        ctx.translate(width - 40 - i * 30, 30);
        ctx.scale(0.8, 0.8);
        ctx.fillStyle = '#3FBDCC';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(10, 10);
        ctx.lineTo(0, 5);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
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
        ctx.fillText("GAME OVER", width / 2, height / 2 - 20);
        ctx.font = "20px 'Courier New', Courier, monospace";
        ctx.fillText("PRESS ENTER TO RESTART", width / 2, height / 2 + 30);
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