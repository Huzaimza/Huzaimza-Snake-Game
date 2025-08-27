/* Huzaimza Snake Game - script.js
   Features: keyboard + touch + swipe, color picks, difficulty, high score (localStorage)
*/

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const box = 20; // tile size
const gridCount = 20; // 20x20 grid
canvas.width = box * gridCount;
canvas.height = box * gridCount;

let snake = [];
let food = {};
let dir = null;
let score = 0;
let gameInterval = null;
let gameSpeed = 100;
let snakeColor = '#00ff00';
let foodColor = '#ff0000';
let bgColor = '#000000';
let controlMode = 'keyboard';
const bestKey = 'huzaimza_best_score';
let bestScore = parseInt(localStorage.getItem(bestKey)||'0', 10) || 0;

// Swipe detection vars
let touchStartX = 0, touchStartY = 0;
const swipeThreshold = 30; // px

// DOM refs
const menu = document.getElementById('menu');
const touchControls = document.getElementById('touchControls');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreShow = document.getElementById('bestScoreShow');

function initNewGame() {
  snake = [{ x: 9 * box, y: 9 * box }];
  placeFood();
  dir = null;
  score = 0;
  // remove previous listeners to avoid duplicates
  window.removeEventListener('keydown', onKey);
  window.addEventListener('keydown', onKey);
  // touch swipe listeners
  canvas.removeEventListener('touchstart', onTouchStart);
  canvas.removeEventListener('touchmove', onTouchMove);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: true });
}

function startGame(speed) {
  // read UI selections
  const sc = document.getElementById('snakeColor').value;
  const fc = document.getElementById('foodColor').value;
  const bc = document.getElementById('bgColor').value;
  const cm = document.getElementById('controlMode').value;

  snakeColor = sc || '#00ff00';
  foodColor = fc || '#ff0000';
  bgColor = bc || '#000000';
  controlMode = cm || 'keyboard';
  gameSpeed = speed;

  menu.style.display = 'none';
  gameOverScreen.style.display = 'none';
  canvas.style.display = 'block';
  touchControls.style.display = (controlMode === 'touch') ? 'block' : 'none';

  initNewGame();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, gameSpeed);
  // attach touch control buttons if touch mode
  attachTouchButtons();
}

function restartGame() {
  startGame(gameSpeed);
}

function backToMenu() {
  if (gameInterval) clearInterval(gameInterval);
  menu.style.display = 'block';
  gameOverScreen.style.display = 'none';
  canvas.style.display = 'none';
  touchControls.style.display = 'none';
  // remove key listener
  window.removeEventListener('keydown', onKey);
  canvas.removeEventListener('touchstart', onTouchStart);
  canvas.removeEventListener('touchmove', onTouchMove);
}

function placeFood() {
  // ensure food not on the snake
  let valid = false;
  while (!valid) {
    const x = Math.floor(Math.random() * gridCount) * box;
    const y = Math.floor(Math.random() * gridCount) * box;
    valid = !snake.some(s => s.x === x && s.y === y);
    if (valid) {
      food = { x, y };
    }
  }
}

function onKey(e) {
  if (controlMode !== 'keyboard') return;
  const key = e.key;
  if (key === 'a' && dir !== 'RIGHT') dir = 'LEFT';
  else if (key === 'w' && dir !== 'DOWN') dir = 'UP';
  else if (key === 'd' && dir !== 'LEFT') dir = 'RIGHT';
  else if (key === 's' && dir !== 'UP') dir = 'DOWN';
}

function setDirection(d) {
  // used by touch buttons
  if (d === 'LEFT' && dir !== 'RIGHT') dir = 'LEFT';
  else if (d === 'UP' && dir !== 'DOWN') dir = 'UP';
  else if (d === 'RIGHT' && dir !== 'LEFT') dir = 'RIGHT';
  else if (d === 'DOWN' && dir !== 'UP') dir = 'DOWN';
}

function attachTouchButtons(){
  // connect control buttons
  const btns = document.querySelectorAll('.control-btn');
  btns.forEach(b=>{
    b.onclick = ()=> setDirection(b.dataset.dir);
  });
}

function gameLoop() {
  // fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // draw food
  ctx.fillStyle = foodColor;
  ctx.fillRect(food.x, food.y, box, box);

  // draw snake
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = (i === 0) ? shadeColor(snakeColor, -10) : snakeColor;
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  // move snake head
  let headX = snake[0].x;
  let headY = snake[0].y;
  if (dir === 'LEFT') headX -= box;
  if (dir === 'RIGHT') headX += box;
  if (dir === 'UP') headY -= box;
  if (dir === 'DOWN') headY += box;

  // If direction not set yet, don't move
  if (dir === null) {
    // just show score & best
    drawHUD();
    return;
  }

  // food collision
  if (headX === food.x && headY === food.y) {
    score++;
    placeFood();
  } else {
    snake.pop();
  }

  const newHead = { x: headX, y: headY };

  // check collisions
  if (headX < 0 || headY < 0 || headX >= canvas.width || headY >= canvas.height || collision(newHead)) {
    // game over
    clearInterval(gameInterval);
    gameInterval = null;
    onGameOver();
    return;
  }

  snake.unshift(newHead);
  drawHUD();
}

function drawHUD() {
  ctx.fillStyle = 'white';
  ctx.font = '18px Arial';
  ctx.fillText('Score: '+score, 8, 20);
  ctx.fillText('Best: '+bestScore, canvas.width - 90, 20);
}

function collision(head) {
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) return true;
  }
  return false;
}

function onGameOver() {
  canvas.style.display = 'none';
  touchControls.style.display = 'none';
  // update best and localStorage
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(bestKey, String(bestScore));
  }
  finalScoreEl.innerText = `Game Over! Your Score: ${score}`;
  bestScoreShow.innerText = `Best Score: ${bestScore}`;
  gameOverScreen.style.display = 'block';
}

/* TOUCH / SWIPE HANDLERS */
function onTouchStart(e) {
  if (!e.touches || e.touches.length === 0) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function onTouchMove(e) {
  if (!e.touches || e.touches.length === 0) return;
  const x = e.touches[0].clientX;
  const y = e.touches[0].clientY;
  const dx = x - touchStartX;
  const dy = y - touchStartY;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
    if (dx > 0) setDirection('RIGHT'); else setDirection('LEFT');
    touchStartX = x; touchStartY = y; // reset to avoid repeated triggers
  } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > swipeThreshold) {
    if (dy > 0) setDirection('DOWN'); else setDirection('UP');
    touchStartX = x; touchStartY = y;
  }
}

/* utility: slightly darken or lighten color for head shading */
function shadeColor(hex, percent) {
  // hex like #rrggbb
  let c = hex.replace('#','');
  if (c.length === 3) c = c.split('').map(s=>s+s).join('');
  const num = parseInt(c,16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00FF) + percent;
  let b = (num & 0x0000FF) + percent;
  r = Math.max(0,Math.min(255,r));
  g = Math.max(0,Math.min(255,g));
  b = Math.max(0,Math.min(255,b));
  return "#" + ( (1<<24) + (r<<16) + (g<<8) + b ).toString(16).slice(1);
}

/* hook up UI button click for control buttons (works while menu is shown too) */
document.addEventListener('click', (e)=>{
  const t = e.target;
  if (t.classList && t.classList.contains('control-btn')) {
    const d = t.dataset.dir;
    setDirection(d);
  }
});

// initialize bestScore display on menu entry
(function init(){
  // load best score from localStorage
  bestScore = parseInt(localStorage.getItem(bestKey)||'0',10) || 0;
  // nothing else — menu waits for user to start
})();
