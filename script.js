'use strict';

// Space Defender - original game mechanics with responsive touch controls,
// a working lives counter, and optional original ambient synth audio.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');
const playAgainBtn = document.getElementById('playAgain');
const gameHint = document.getElementById('gameHint');

let score = 0;
let lives = 3;
let wave = 1;
let gameOver = false;

const player = {
   x: canvas.width / 2 - 20,
   y: canvas.height - 50,
   width: 40,
   height: 30,
   speed: 6,
   dx: 0
};

const lasers = [];
const invaders = [];

const invaderRows = 3;
const invaderCols = 7;
const invaderWidth = 40;
const invaderHeight = 25;
let invaderSpeed = 1.7;
let invaderDirection = 1;

const keys = { ArrowLeft: false, ArrowRight: false };

function createInvaders() {
   invaders.length = 0;
   for (let row = 0; row < invaderRows; row++) {
      for (let col = 0; col < invaderCols; col++) {
         invaders.push({
            x: col * (invaderWidth + 20) + 50,
            y: row * (invaderHeight + 20) + 50,
            width: invaderWidth,
            height: invaderHeight,
            alive: true
         });
      }
   }
}

function fireLaser() {
   if (gameOver) return;
   lasers.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 15,
      speed: 12
   });
}

document.addEventListener('keydown', (event) => {
   if (['ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
   }
   if (event.code === 'ArrowLeft') keys.ArrowLeft = true;
   if (event.code === 'ArrowRight') keys.ArrowRight = true;
   if (event.code === 'Space' && !event.repeat) fireLaser();
});

document.addEventListener('keyup', (event) => {
   if (event.code === 'ArrowLeft') keys.ArrowLeft = false;
   if (event.code === 'ArrowRight') keys.ArrowRight = false;
});

window.addEventListener('blur', () => {
   keys.ArrowLeft = false;
   keys.ArrowRight = false;
});

// Touch / pointer controls for phones and tablets.
function holdControl(buttonId, keyName) {
   const button = document.getElementById(buttonId);
   button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      keys[keyName] = true;
      button.setPointerCapture(event.pointerId);
   });
   const release = () => { keys[keyName] = false; };
   button.addEventListener('pointerup', release);
   button.addEventListener('pointercancel', release);
   button.addEventListener('lostpointercapture', release);
}
holdControl('moveLeft', 'ArrowLeft');
holdControl('moveRight', 'ArrowRight');

document.getElementById('fire').addEventListener('pointerdown', (event) => {
   event.preventDefault();
   fireLaser();
});

function endGame() {
   gameOver = true;
   playAgainBtn.disabled = false;
   gameHint.textContent = `Mission ended. Final score: ${score}. Launch another mission?`;
}

function update() {
   if (gameOver) return;

   if (keys.ArrowLeft) player.dx = -player.speed;
   else if (keys.ArrowRight) player.dx = player.speed;
   else player.dx = 0;

   player.x += player.dx;
   player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

   for (let i = lasers.length - 1; i >= 0; i--) {
      lasers[i].y -= lasers[i].speed;
      if (lasers[i].y + lasers[i].height < 0) lasers.splice(i, 1);
   }

   let hitWall = false;
   invaders.forEach((invader) => {
      if (!invader.alive) return;
      invader.x += invaderSpeed * invaderDirection;
      if (invader.x + invader.width > canvas.width || invader.x < 0) hitWall = true;
   });

   if (hitWall) {
      invaderDirection *= -1;
      invaders.forEach((invader) => {
         if (invader.alive) invader.y += 15;
      });
   }

   // Check collisions from the end so removing a laser cannot skip another one.
   for (let l = lasers.length - 1; l >= 0; l--) {
      const laser = lasers[l];
      const hitIndex = invaders.findIndex((invader) =>
         invader.alive &&
         laser.x < invader.x + invader.width &&
         laser.x + laser.width > invader.x &&
         laser.y < invader.y + invader.height &&
         laser.y + laser.height > invader.y
      );

      if (hitIndex !== -1) {
         invaders[hitIndex].alive = false;
         lasers.splice(l, 1);
         score += 10;
         scoreEl.textContent = score;
      }
   }

   // Advance to a faster wave after all enemy ships are destroyed.
   if (invaders.length > 0 && invaders.every((invader) => !invader.alive)) {
      wave++;
      waveEl.textContent = wave;
      invaderSpeed += 0.35;
      createInvaders();
      gameHint.textContent = `Wave ${wave}: incoming enemy ships!`;
   }

   // Lose one life if an enemy reaches the defense line.
   const enemyLanded = invaders.some((invader) =>
      invader.alive && invader.y + invader.height >= player.y
   );

   if (enemyLanded) {
      lives--;
      livesEl.textContent = lives;
      if (lives <= 0) {
         endGame();
      } else {
         lasers.length = 0;
         createInvaders();
         invaderDirection = 1;
         gameHint.textContent = `Ship hit! ${lives} ${lives === 1 ? 'life' : 'lives'} remaining.`;
      }
   }
}

function drawShip() {
   ctx.save();
   ctx.shadowColor = '#53f5e9';
   ctx.shadowBlur = 15;
   ctx.fillStyle = '#53f5e9';
   ctx.beginPath();
   ctx.moveTo(player.x + player.width / 2, player.y);
   ctx.lineTo(player.x, player.y + player.height);
   ctx.lineTo(player.x + player.width, player.y + player.height);
   ctx.closePath();
   ctx.fill();
   ctx.restore();
}

function draw() {
   ctx.clearRect(0, 0, canvas.width, canvas.height);

   // Subtle stars inside the playfield.
   ctx.fillStyle = 'rgba(220, 240, 255, 0.55)';
   for (let i = 0; i < 34; i++) {
      const x = (i * 97 + 31) % canvas.width;
      const y = (i * 53 + 19) % canvas.height;
      ctx.fillRect(x, y, 1.5, 1.5);
   }

   if (gameOver) {
      ctx.fillStyle = '#ff6688';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 16;
      ctx.font = 'bold 34px Orbitron, Courier New, monospace';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 8);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#d7e4ff';
      ctx.font = '16px Rajdhani, Courier New, monospace';
      ctx.fillText('Select PLAY AGAIN to restart', canvas.width / 2, canvas.height / 2 + 27);
      return;
   }

   drawShip();

   ctx.save();
   ctx.fillStyle = '#ff547c';
   ctx.shadowColor = '#ff3366';
   ctx.shadowBlur = 12;
   lasers.forEach((laser) => ctx.fillRect(laser.x, laser.y, laser.width, laser.height));
   ctx.restore();

   invaders.forEach((invader) => {
      if (!invader.alive) return;
      ctx.save();
      ctx.fillStyle = '#ffd166';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 9;
      ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#17203b';
      ctx.fillRect(invader.x + 8, invader.y + 6, 6, 6);
      ctx.fillRect(invader.x + invader.width - 14, invader.y + 6, 6, 6);
      ctx.restore();
   });
}

function resetGame() {
   score = 0;
   lives = 3;
   wave = 1;
   gameOver = false;
   invaderSpeed = 1.7;
   invaderDirection = 1;
   player.x = canvas.width / 2 - player.width / 2;
   player.dx = 0;
   lasers.length = 0;
   scoreEl.textContent = score;
   livesEl.textContent = lives;
   waveEl.textContent = wave;
   createInvaders();
   playAgainBtn.disabled = false;
   keys.ArrowLeft = false;
   keys.ArrowRight = false;
   playAgainBtn.blur();
   gameHint.textContent = 'Destroy every enemy ship to advance to the next wave.';
}

playAgainBtn.addEventListener('click', () => {
   // Allow a fresh mission at any time, not only after game over.
   resetGame();
});

// Optional original ambient synth music.
// Audio is created only after the user clicks the button, which satisfies
// browser autoplay rules. The async resume handles browsers that suspend audio.
let audioContext = null;
let masterGain = null;
let oscillators = [];
const audioToggle = document.getElementById('audioToggle');
const volumeSlider = document.getElementById('volume');

async function startAmbientMusic() {
   const AudioContextClass = window.AudioContext || window.webkitAudioContext;
   if (!AudioContextClass) {
      audioToggle.textContent = 'AUDIO UNAVAILABLE';
      audioToggle.disabled = true;
      return;
   }

   try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state !== 'running') {
         await audioContext.resume();
      }

      if (!masterGain) {
         masterGain = audioContext.createGain();
         masterGain.gain.value = Number(volumeSlider.value);
         masterGain.connect(audioContext.destination);

         const filter = audioContext.createBiquadFilter();
         filter.type = 'lowpass';
         filter.frequency.value = 420;
         filter.connect(masterGain);

         // A soft, original three-note sci-fi ambient chord.
         [55, 82.41, 110].forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const voiceGain = audioContext.createGain();
            oscillator.type = index === 1 ? 'triangle' : 'sine';
            oscillator.frequency.value = frequency;
            voiceGain.gain.value = [0.30, 0.13, 0.10][index];
            oscillator.connect(voiceGain);
            voiceGain.connect(filter);
            oscillator.start();
            oscillators.push(oscillator);
         });
      }

      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setTargetAtTime(Number(volumeSlider.value), audioContext.currentTime, 0.08);
      audioToggle.textContent = 'MUSIC ON';
      audioToggle.setAttribute('aria-pressed', 'true');
   } catch (error) {
      console.error('Could not start mission audio:', error);
      audioToggle.textContent = 'TRY MUSIC AGAIN';
      audioToggle.setAttribute('aria-pressed', 'false');
   }
}

function stopAmbientMusic() {
   if (audioContext && masterGain) {
      masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.08);
   }
   audioToggle.textContent = 'ENABLE MUSIC';
   audioToggle.setAttribute('aria-pressed', 'false');
}

audioToggle.addEventListener('click', () => {
   const isOn = audioToggle.getAttribute('aria-pressed') === 'true';
   if (isOn) stopAmbientMusic();
   else startAmbientMusic();
});

volumeSlider.addEventListener('input', () => {
   if (audioContext && masterGain && audioToggle.getAttribute('aria-pressed') === 'true') {
      masterGain.gain.setTargetAtTime(Number(volumeSlider.value), audioContext.currentTime, 0.06);
   }
});

// Start the first wave immediately, matching the original game.
createInvaders();

function gameLoop() {
   update();
   draw();
   requestAnimationFrame(gameLoop);
}
gameLoop();
