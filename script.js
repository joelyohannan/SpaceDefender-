'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const statusEl = document.getElementById('status');
const playAgainBtn = document.getElementById('playAgain');
const musicToggle = document.getElementById('musicToggle');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
let score = 0;
let lives = 3;
let gameOver = false;
let invaderSpeed = 1.35;
let invaderDirection = 1;
let animationFrame = 0;

const player = { x: WIDTH / 2 - 20, y: HEIGHT - 48, width: 40, height: 30, speed: 5.5 };
const lasers = [];
const invaders = [];
const keys = { left: false, right: false };
const invaderRows = 3;
const invaderCols = 7;
const invaderWidth = 40;
const invaderHeight = 25;

function createInvaders() {
  for (let row = 0; row < invaderRows; row++) {
    for (let col = 0; col < invaderCols; col++) {
      invaders.push({
        x: col * (invaderWidth + 20) + 50,
        y: row * (invaderHeight + 20) + 48,
        width: invaderWidth,
        height: invaderHeight,
        alive: true,
        phase: Math.random() * Math.PI * 2
      });
    }
  }
}

function fireLaser() {
  if (gameOver) return;
  lasers.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 15, speed: 8.5 });
}

function setStatus(message) { statusEl.textContent = message; }

document.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = true;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = true;
  if (event.code === 'Space' && !event.repeat) fireLaser();
});
document.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = false;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = false;
});
window.addEventListener('blur', () => { keys.left = false; keys.right = false; });

function bindHold(button, key) {
  const down = (event) => { event.preventDefault(); keys[key] = true; };
  const up = (event) => { event.preventDefault(); keys[key] = false; };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointerleave', up);
  button.addEventListener('pointercancel', up);
}
bindHold(document.getElementById('leftControl'), 'left');
bindHold(document.getElementById('rightControl'), 'right');
document.getElementById('fireControl').addEventListener('pointerdown', (event) => {
  event.preventDefault();
  fireLaser();
});

function endGame(message) {
  gameOver = true;
  setStatus(message);
  playAgainBtn.disabled = false;
}

function update() {
  if (gameOver) return;

  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  player.x = Math.max(0, Math.min(WIDTH - player.width, player.x));

  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].y -= lasers[i].speed;
    if (lasers[i].y + lasers[i].height < 0) lasers.splice(i, 1);
  }

  let hitWall = false;
  invaders.forEach((invader) => {
    if (!invader.alive) return;
    invader.x += invaderSpeed * invaderDirection;
    if (invader.x + invader.width >= WIDTH || invader.x <= 0) hitWall = true;
  });

  if (hitWall) {
    invaderDirection *= -1;
    invaders.forEach((invader) => {
      if (invader.alive) invader.y += 13;
    });
  }

  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    let hit = false;
    for (const invader of invaders) {
      if (!invader.alive) continue;
      if (laser.x < invader.x + invader.width &&
          laser.x + laser.width > invader.x &&
          laser.y < invader.y + invader.height &&
          laser.y + laser.height > invader.y) {
        invader.alive = false;
        hit = true;
        score += 10;
        scoreEl.textContent = score;
        break;
      }
    }
    if (hit) lasers.splice(i, 1);
  }

  if (invaders.every((invader) => !invader.alive)) {
    invaderSpeed += 0.35;
    invaders.length = 0;
    createInvaders();
    setStatus('NEW WAVE INCOMING');
  }

  const landed = invaders.some((invader) => invader.alive && invader.y + invader.height >= player.y);
  if (landed) {
    lives -= 1;
    livesEl.textContent = lives;
    if (lives <= 0) {
      endGame('MISSION FAILED');
    } else {
      // Push the fleet back for one final chance, while preserving the score.
      invaders.forEach((invader) => { if (invader.alive) invader.y = Math.max(35, invader.y - 55); });
      invaderSpeed = Math.max(1.1, invaderSpeed - 0.2);
      setStatus(`SHIP HIT - ${lives} LIFE${lives === 1 ? '' : 'S'} LEFT`);
    }
  }
}

function drawStars() {
  ctx.save();
  for (let i = 0; i < 48; i++) {
    const x = (i * 97 + 31) % WIDTH;
    const y = (i * 61 + animationFrame * 0.25) % HEIGHT;
    ctx.fillStyle = i % 5 === 0 ? 'rgba(89,245,229,.75)' : 'rgba(190,220,255,.45)';
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  ctx.restore();
}

function drawShip() {
  ctx.save();
  ctx.shadowColor = '#59f5e5';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#59f5e5';
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y);
  ctx.lineTo(player.x, player.y + player.height);
  ctx.lineTo(player.x + player.width / 2, player.y + player.height - 8);
  ctx.lineTo(player.x + player.width, player.y + player.height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4ffff';
  ctx.fillRect(player.x + 17, player.y + 15, 6, 8);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawStars();

  if (gameOver) {
    ctx.fillStyle = 'rgba(3, 7, 19, .68)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff5577';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ff6688';
    ctx.font = 'bold 34px Orbitron, Courier New, monospace';
    ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 8);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d9eaff';
    ctx.font = '16px Rajdhani, Arial, sans-serif';
    ctx.fillText('Press PLAY AGAIN to restart your mission', WIDTH / 2, HEIGHT / 2 + 28);
    return;
  }

  drawShip();

  ctx.save();
  ctx.shadowColor = '#ff456f';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ff5577';
  lasers.forEach((laser) => {
    ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
    ctx.fillStyle = '#ffd4e0';
    ctx.fillRect(laser.x + 1, laser.y, 2, laser.height * .55);
    ctx.fillStyle = '#ff5577';
  });
  ctx.restore();

  invaders.forEach((invader) => {
    if (!invader.alive) return;
    const bob = Math.sin(animationFrame * .06 + invader.phase) * 2;
    ctx.save();
    ctx.translate(0, bob);
    ctx.shadowColor = '#ffc857';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffc857';
    ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
    ctx.fillStyle = '#18213b';
    ctx.fillRect(invader.x + 8, invader.y + 7, 6, 6);
    ctx.fillRect(invader.x + invader.width - 14, invader.y + 7, 6, 6);
    ctx.fillRect(invader.x + 14, invader.y + 18, 12, 3);
    ctx.restore();
  });
}

function loop() {
  animationFrame++;
  update();
  draw();
  requestAnimationFrame(loop);
}

function resetGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  invaderSpeed = 1.35;
  invaderDirection = 1;
  player.x = WIDTH / 2 - player.width / 2;
  lasers.length = 0;
  invaders.length = 0;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
  createInvaders();
  setStatus('DEFENSE SYSTEM ONLINE');
  playAgainBtn.disabled = true;
  playAgainBtn.blur();
}
playAgainBtn.addEventListener('click', resetGame);

// A quiet, original synthesized space ambience. Browsers require a user gesture
// before audio can start, so the music begins when the player enables it.
let audioContext = null;
let masterGain = null;
let musicNodes = [];
let musicOn = false;

function startMusic() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    setStatus('AUDIO NOT SUPPORTED IN THIS BROWSER');
    return;
  }
  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.035; // intentionally quiet
    masterGain.connect(audioContext.destination);

    const notes = [110, 164.81, 220, 164.81];
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = index % 2 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? 0.42 : 0.17;
      oscillator.connect(gain);
      gain.connect(masterGain);
      oscillator.start();
      musicNodes.push({ oscillator, gain });
    });
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start();
    musicNodes.push({ oscillator: lfo, gain: lfoGain });
  }
  audioContext.resume();
  musicOn = true;
  musicToggle.innerHTML = '<span aria-hidden="true">♫</span> MUSIC: ON';
  musicToggle.setAttribute('aria-pressed', 'true');
}
function stopMusic() {
  if (audioContext) audioContext.suspend();
  musicOn = false;
  musicToggle.innerHTML = '<span aria-hidden="true">♫</span> MUSIC: OFF';
  musicToggle.setAttribute('aria-pressed', 'false');
}
musicToggle.addEventListener('click', () => musicOn ? stopMusic() : startMusic());

createInvaders();
loop();
