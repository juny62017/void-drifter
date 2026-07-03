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
    GAME_OVER: 3,
    WAVE_TRANSITION: 4
};

let currentState = STATE.MENU;
const keys = {};
let lastTime = 0;
let menuTime = 0;
const stars = [];

let score = 0;
let highScore = localStorage.getItem('voidDrifterHighScore') || 0;
let multiplier = 1;
let consecutiveKills = 0;
let lives = 3;
const enemies = [];
const powerUps = [];
const particles = [];
let spawnTimer = 0;

let currentWave = 0;
let enemiesSpawned = 0;
let waveTimer = 0;

const WAVES = [
    { count: 10, rate: 1200, types: ['drone'] },
    { count: 15, rate: 1000, types: ['drone'] },
    { count: 15, rate: 1000, types: ['drone', 'weaver'] },
    { count: 20, rate: 900, types: ['drone', 'weaver'] },
    { count: 15, rate: 1100, types: ['drone', 'turret'] },
    { count: 25, rate: 800, types: ['drone', 'weaver', 'turret'] },
    { count: 30, rate: 700, types: ['drone', 'weaver'] },
    { count: 25, rate: 800, types: ['weaver', 'turret'] },
    { count: 35, rate: 650, types: ['drone', 'weaver', 'turret'] },
    { count: 40, rate: 600, types: ['drone', 'weaver'] },
    { count: 30, rate: 700, types: ['turret', 'weaver'] },
    { count: 50, rate: 500, types: ['drone', 'weaver', 'turret'] }
];

const player = {
    x: width / 2,
    y: height - 100,
    vx: 0,
    vy: 0,
    moving: false,
    fireTimer: 0,
    fireRate: 150,
    invulnerableTimer: 0,
    hasShield: false,
    rapidFireTimer: 0,
    wideShotTimer: 0,
    hitFlashTimer: 0
};

const bulletPool = [];
const enemyBulletPool = [];

for (let i = 0; i < 200; i++) {
    bulletPool.push({ active: false, x: 0, y: 0, vx: 0 });
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

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= 0.002 * dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function updatePlayer(dt) {
    if (player.invulnerableTimer > 0) {
        player.invulnerableTimer -= dt;
    }
    if (player.rapidFireTimer > 0) {
        player.rapidFireTimer -= dt;
    }
    if (player.wideShotTimer > 0) {
        player.wideShotTimer -= dt;
    }
    if (player.hitFlashTimer > 0) {
        player.hitFlashTimer -= dt;
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
    
    const currentFireRate = player.rapidFireTimer > 0 ? player.fireRate / 2 : player.fireRate;

    if (keys['Space'] && player.fireTimer <= 0) {
        const spawnB = (vx, offset) => {
            for (let i = 0; i < bulletPool.length; i++) {
                if (!bulletPool[i].active) {
                    bulletPool[i].active = true;
                    bulletPool[i].x = player.x + offset;
                    bulletPool[i].y = player.y - 15;
                    bulletPool[i].vx = vx;
                    break;
                }
            }
        };

        if (player.wideShotTimer > 0) {
            spawnB(0, 0);
            spawnB(-0.2, -10);
            spawnB(0.2, 10);
        } else {
            spawnB(0, 0);
        }
        
        player.fireTimer = currentFireRate;
    }
}

function updateBullets(dt) {
    for (let i = 0; i < bulletPool.length; i++) {
        if (bulletPool[i].active) {
            bulletPool[i].y -= 0.8 * dt;
            bulletPool[i].x += bulletPool[i].vx * dt;
            if (bulletPool[i].y < -20 || bulletPool[i].x < -20 || bulletPool[i].x > width + 20) {
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

function updatePowerUps(dt) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        p.y += p.vy * dt;
        
        if (p.y > height + 20) {
            powerUps.splice(i, 1);
            continue;
        }
        
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
            if (p.type === 'shield') player.hasShield = true;
            else if (p.type === 'rapid') player.rapidFireTimer = 10000;
            else if (p.type === 'wide') player.wideShotTimer = 10000;
            powerUps.splice(i, 1);
        }
    }
}

function updateSpawns(dt) {
    const wave = WAVES[currentWave];
    if (enemiesSpawned >= wave.count) return;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
        const type = wave.types[Math.floor(Math.random() * wave.types.length)];
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
            fireTimer: 1000 + Math.random() * 1000,
            dissolve: 0
        });
        
        enemiesSpawned++;
        spawnTimer = wave.rate;
    }
}

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        
        if (e.dissolve < 1) {
            e.dissolve += 0.002 * dt;
            if (e.dissolve > 1) {
                e.dissolve = 1;
            }
        }
        
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
                        for (let p = 0; p < 20; p++) {
                            particles.push({
                                x: e.x,
                                y: e.y,
                                vx: (Math.random() - 0.5) * 0.6,
                                vy: (Math.random() - 0.5) * 0.6,
                                life: 1
                            });
                        }

                        if (Math.random() < 0.1) {
                            const types = ['shield', 'rapid', 'wide'];
                            powerUps.push({
                                type: types[Math.floor(Math.random() * types.length)],
                                x: e.x,
                                y: e.y,
                                vy: 0.1
                            });
                        }

                        enemies.splice(i, 1);
                        
                        consecutiveKills++;
                        multiplier = 1 + Math.floor(consecutiveKills / 5);
                        if (multiplier > 5) multiplier = 5;
                        
                        const basePoints = e.type === 'turret' ? 300 : (e.type === 'weaver' ? 200 : 100);
                        score += basePoints * multiplier;
                        break;
                    }
                }
            }
        }
    }
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('voidDrifterHighScore', highScore);
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
        if (player.hasShield) {
            player.hasShield = false;
            player.invulnerableTimer = 1500;
        } else {
            lives--;
            player.invulnerableTimer = 1500;
            player.hitFlashTimer = 100;
            player.rapidFireTimer = 0;
            player.wideShotTimer = 0;
            consecutiveKills = 0;
            multiplier = 1;
            
            if (lives < 0) {
                saveHighScore();
                currentState = STATE.GAME_OVER;
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
            player.invulnerableTimer = 0;
            player.hasShield = false;
            player.rapidFireTimer = 0;
            player.wideShotTimer = 0;
            player.hitFlashTimer = 0;
            score = 0;
            consecutiveKills = 0;
            multiplier = 1;
            lives = 3;
            currentWave = 0;
            enemiesSpawned = 0;
            enemies.length = 0;
            powerUps.length = 0;
            particles.length = 0;
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
        updatePowerUps(dt);
        updateParticles(dt);
        updateSpawns(dt);
        updateEnemies(dt);
        checkCollisions();
        checkPlayerHits();

        if (enemiesSpawned >= WAVES[currentWave].count && enemies.length === 0) {
            if (currentWave < WAVES.length - 1) {
                currentState = STATE.WAVE_TRANSITION;
                waveTimer = 3000;
            } else {
                saveHighScore();
                currentState = STATE.GAME_OVER;
            }
        }
        
        if (keys['Escape']) {
            currentState = STATE.PAUSED;
            keys['Escape'] = false;
        }
    } else if (currentState === STATE.WAVE_TRANSITION) {
        updatePlayer(dt);
        updateBullets(dt);
        updatePowerUps(dt);
        updateParticles(dt);
        
        waveTimer -= dt;
        if (waveTimer <= 0) {
            currentWave++;
            enemiesSpawned = 0;
            spawnTimer = 1000;
            currentState = STATE.PLAYING;
        }
    } else if (currentState === STATE.PAUSED) {
        if (keys['Escape']) {
            currentState = STATE.PLAYING;
            keys['Escape'] = false;
        }
    } else if (currentState === STATE.GAME_OVER) {
        if (keys['Enter']) {
            currentState = STATE.MENU;
            keys['Enter'] = false;
        }
    }
}

function drawStars() {
    ctx.fillStyle = '#E8E4D4';
    for (let i = 0; i < stars.length; i++) {
        ctx.fillRect(stars[i].x, stars[i].y, stars[i].size, stars[i].size);
    }
}

function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        ctx.fillStyle = '#C94F38';
        ctx.globalAlpha = particles[i].life;
        ctx.fillRect(particles[i].x - 2, particles[i].y - 2, 4, 4);
    }
    ctx.globalAlpha = 1.0;
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

    ctx.fillStyle = player.hitFlashTimer > 0 ? '#E8E4D4' : '#3FBDCC';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(15, 15);
    ctx.lineTo(0, 8);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();

    if (player.hasShield) {
        ctx.strokeStyle = '#3FBDCC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function drawBullets() {
    ctx.fillStyle = '#3FBDCC';
    for (let i = 0; i < bulletPool.length; i++) {
        if (bulletPool[i].active) {
            ctx.save();
            ctx.translate(bulletPool[i].x, bulletPool[i].y);
            ctx.rotate(Math.atan2(bulletPool[i].vx, -0.8));
            ctx.fillRect(-2, -10, 4, 15);
            ctx.restore();
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

function drawPowerUps() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "bold 16px 'Courier New', Courier, monospace";
    
    for (let i = 0; i < powerUps.length; i++) {
        const p = powerUps[i];
        ctx.fillStyle = '#3FBDCC';
        ctx.fillRect(p.x - 12, p.y - 12, 24, 24);
        
        ctx.fillStyle = '#0B0C1E';
        let letter = 'S';
        if (p.type === 'rapid') letter = 'R';
        else if (p.type === 'wide') letter = 'W';
        
        ctx.fillText(letter, p.x, p.y + 2);
    }
}

function drawEnemies() {
    ctx.fillStyle = '#C94F38';
    for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        ctx.save();
        ctx.globalAlpha = e.dissolve;
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
    
    ctx.font = "bold 24px 'Courier New', Courier, monospace";
    ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, 20, 20);
    
    ctx.font = "16px 'Courier New', Courier, monospace";
    ctx.fillText(`HIGH:  ${highScore.toString().padStart(6, '0')}`, 20, 50);

    if (multiplier > 1) {
        ctx.fillStyle = '#3FBDCC';
        ctx.font = "bold 20px 'Courier New', Courier, monospace";
        ctx.fillText(`MULT: x${multiplier}`, 20, 80);
        ctx.fillStyle = '#E8E4D4';
    }

    ctx.textAlign = 'center';
    ctx.font = "bold 20px 'Courier New', Courier, monospace";
    ctx.fillText(`WAVE ${currentWave + 1}/${WAVES.length}`, width / 2, 20);

    for (let i = 0; i < lives; i++) {
        ctx.save();
        ctx.translate(width - 30 - i * 35, 30);
        ctx.scale(0.9, 0.9);
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

    let uiY = height - 40;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3FBDCC';
    ctx.font = "bold 18px 'Courier New', Courier, monospace";

    if (player.hasShield) {
        ctx.fillText("SHIELD: ACTIVE", 20, uiY);
        uiY -= 25;
    }
    if (player.wideShotTimer > 0) {
        const secs = Math.ceil(player.wideShotTimer / 1000);
        ctx.fillText(`WIDE SHOT: ${secs}s`, 20, uiY);
        uiY -= 25;
    }
    if (player.rapidFireTimer > 0) {
        const secs = Math.ceil(player.rapidFireTimer / 1000);
        ctx.fillText(`RAPID FIRE: ${secs}s`, 20, uiY);
    }
}

function draw() {
    ctx.fillStyle = '#0B0C1E';
    ctx.fillRect(0, 0, width, height);

    drawStars();

    if (currentState === STATE.MENU) {
        drawMenu();
    } else if (currentState === STATE.PLAYING) {
        drawPowerUps();
        drawBullets();
        drawEnemies();
        drawParticles();
        drawPlayer();
        drawUI();
    } else if (currentState === STATE.WAVE_TRANSITION) {
        drawPowerUps();
        drawBullets();
        drawParticles();
        drawPlayer();
        drawUI();
        
        ctx.fillStyle = '#E8E4D4';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "bold 32px 'Courier New', Courier, monospace";
        ctx.fillText(`WAVE ${currentWave + 1} CLEARED`, width / 2, height / 2 - 20);
        
        if (Math.floor(waveTimer / 400) % 2 === 0) {
            ctx.font = "20px 'Courier New', Courier, monospace";
            ctx.fillText(`PREPARE FOR WAVE ${currentWave + 2}`, width / 2, height / 2 + 30);
        }
    } else if (currentState === STATE.PAUSED) {
        drawPowerUps();
        drawBullets();
        drawEnemies();
        drawParticles();
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
        drawPowerUps();
        drawBullets();
        drawEnemies();
        drawParticles();
        drawPlayer();
        drawUI();
        
        ctx.fillStyle = 'rgba(11, 12, 30, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#E8E4D4';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "32px 'Courier New', Courier, monospace";
        
        if (currentWave >= WAVES.length - 1 && enemies.length === 0) {
            ctx.fillText("MISSION ACCOMPLISHED", width / 2, height / 2 - 20);
        } else {
            ctx.fillText("GAME OVER", width / 2, height / 2 - 20);
        }
        
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