import { normalizeAlias } from './score-rules.js';
import { recordLocalResult, getLocalBest, getRememberedAlias, getPendingResult, saveResult, loadLeaderboard, isRankingAvailable } from './score-service.js';
import { KeyboardControls } from './keyboard-controls.js';
import { Game } from './game.js';
import { PoseControls } from './pose-controls.js';

// This entry owns the DOM. Game/Player/PoseControls remain independent modules
// so a future island can host the same rules through a challenge adapter.
const el = id => document.getElementById(id);
const status = el('status'), setup = el('setup'), notice = el('notice');
const game = new Game(el('renderDiv'), (score, coins) => { el('coin-value').textContent = String(coins); el('score-value').textContent = String(score); }, score => {
  resumeAfterMode = false; el('quick-mode').hidden = false; phase = 'over'; el('result').hidden = false;
  showResult(score);
  el('pause').hidden = true; notice.hidden = true; el('power-status').hidden = true;
}, remaining => {
  el('power-status').hidden = remaining <= 0;
  el('power-seconds').textContent = `${Math.ceil(remaining)} s`;
  el('power-status').classList.toggle('expiring', remaining > 0 && remaining <= 2);
  el('power-meter').value = remaining;
});
const pose = new PoseControls(game.player);
const keyboard = new KeyboardControls(game.player);
let resumeAfterMode = false;
let currentResult = null, resultSaved = false, savingResult = false, leaderboardRequest = 0, aliasDraft = '';
let mode = null, cameraReady = false, ready = false, practice = new Set();
let tracker, phase = 'setup', disposed = false, cameraAttempt = 0;
let countdownLeft = 0, countdownDigit = 0, uiFrame, previousFrame = performance.now();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function beginCountdown() {
  if (disposed || phase === 'countdown') return;
  phase = 'countdown'; countdownLeft = 3; countdownDigit = 0;
  setup.hidden = true; el('result').hidden = true; el('pause').hidden = true;
  el('countdown').hidden = false; message('');
}
function updatePresentation(now) {
  if (disposed) return;
  const dt = Math.min((now - previousFrame) / 1000, 0.1); previousFrame = now;
  if (!document.hidden) {
    if ((phase === 'running' || phase === 'practice') && mode === 'keyboard') keyboard.update(dt);
    else keyboard.reset();
    if (phase === 'countdown') {
      const digit = Math.ceil(countdownLeft);
      if (digit !== countdownDigit && digit > 0) {
        countdownDigit = digit; el('countdown-number').textContent = String(digit);
        if (!reducedMotion.matches) el('countdown-number').animate([
          {transform:'scale(.65) rotate(-8deg)',opacity:0},
          {transform:'scale(1.12) rotate(3deg)',opacity:1,offset:.3},
          {transform:'scale(1) rotate(0)',opacity:1}
        ],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});
      }
      countdownLeft = Math.max(0, countdownLeft - dt);
      if (countdownLeft === 0) { el('countdown').hidden = true; start(); }
    }
    if (phase === 'practice') {
      game.player.update(dt);
      if (game.player.currentLane === 0) practice.add('left');
      if (game.player.currentLane === 2) practice.add('right');
      if (game.player.isJumping) practice.add('jump');
      el('move-guide').classList.toggle('done', practice.has('left') && practice.has('right'));
      el('jump-guide').classList.toggle('done', practice.has('jump'));

    }
    if (!game.running) {
      game.sceneSetup.galaxy.update(dt * 0.35);
      game.renderer.render(game.scene,game.camera);
    }
  }
  uiFrame = requestAnimationFrame(updatePresentation);
}
uiFrame = requestAnimationFrame(updatePresentation);
function message(text) { notice.textContent = text; notice.hidden = !text; }
function start() {
  if (disposed || !game.player.modelLoaded) return;
  pose.reset();
  setup.hidden = true; el('result').hidden = true; el('pause').hidden = false; el('quick-mode').hidden = true;
  setPauseControl(false); phase = 'running'; message('');
  if (resumeAfterMode) { game.resume(); resumeAfterMode = false; } else game.start();
  game.renderer.domElement.tabIndex = -1; game.renderer.domElement.focus();
}
function pause(text = 'En pausa. Pulsa Reanudar para continuar.') {
  if (phase !== 'running') return;
  game.pause(); phase = 'paused'; setPauseControl(true); message(text);
}
Promise.all([game.player.ready, game.sceneSetup.stonePath.ready, game.lavaManager.ready, game.powerups.ready, game.coins.ready]).then(() => {
  if (disposed) return;
  game.renderer.render(game.scene,game.camera);
  ready = true; status.textContent = '';
  el('recover-ranking').hidden = !getPendingResult();
  try { const saved = localStorage.getItem('mimix-control-mode'); if (saved === 'camera' || saved === 'keyboard') selectMode(saved); } catch { /* Storage is optional. */ }
  el('camera').disabled = el('keyboard').disabled = false;
}).catch(() => { status.textContent = 'No se pudo cargar el escenario o el cuy. Recarga la página para reintentar.'; });
function selectMode(next) {
  if (!ready || disposed) return;
  if (next === mode && phase !== 'setup' && phase !== 'practice') return;
  if (phase === 'running' || phase === 'paused') { game.pause(); resumeAfterMode = true; }
  el('pause').hidden = true; el('countdown').hidden = true; setup.hidden = false;
  cameraAttempt++; tracker?.stop(); tracker = null; cameraReady = false;
  keyboard.reset(); pose.reset(); if (!resumeAfterMode) { game.player.reset(); game.player.stopRunAnimation(); }
  phase = 'setup'; mode = next; practice.clear();
  el('camera-preview').hidden = true;
  el('quick-mode').hidden = true;
  el('quick-camera').setAttribute('aria-pressed', String(mode === 'camera'));
  el('quick-keyboard').setAttribute('aria-pressed', String(mode === 'keyboard'));
  el('begin').setAttribute('aria-label', resumeAfterMode ? 'Continuar' : 'Comenzar');
  el('begin').title = resumeAfterMode ? 'Continuar' : 'Comenzar';
  el('tutorial').hidden = resumeAfterMode;
  el('tutorial-back').hidden = true;
  setup.dataset.mode = mode; setup.classList.remove('practicing', 'camera-loading');
  setup.removeAttribute('aria-busy');
  el('move-guide').classList.remove('done'); el('jump-guide').classList.remove('done');
  el('mode-guide').hidden = false;
  el('setup-title').textContent = 'Formas de juego';
  el('camera').setAttribute('aria-pressed', String(mode === 'camera'));
  el('keyboard').setAttribute('aria-pressed', String(mode === 'keyboard'));
  status.textContent = '';
  el('begin').disabled = el('tutorial').disabled = false;
  el('tutorial').textContent = 'Tutorial';
  try { localStorage.setItem('mimix-control-mode', mode); } catch { /* Storage is optional. */ }
}
el('keyboard').onclick = () => selectMode('keyboard');
el('camera').onclick = () => selectMode('camera');
function selectResultMode(next) {
  if (phase !== 'over' || next === mode) return;
  selectMode(next);
  phase = 'over'; setup.hidden = true; el('quick-mode').hidden = false;
}
el('quick-camera').onclick = () => selectResultMode('camera');
el('quick-keyboard').onclick = () => selectResultMode('keyboard');
el('tutorial-back').onclick = () => selectMode(mode);
async function activateCamera() {
  if (cameraReady) return true;
  const attempt = ++cameraAttempt;
  setup.classList.add('camera-loading');
  setup.setAttribute('aria-busy', 'true');
  el('tutorial-back').hidden = false;
  el('begin').disabled = el('tutorial').disabled = true;
  status.textContent = 'Activando cámara…';
  try {
    const { PoseTracker } = await import('./poseTracker.js');
    if (disposed || attempt !== cameraAttempt) return;
    pose.reset();
    tracker = new PoseTracker(el('camera-preview'), (x,y) => {
      if (phase === 'running' || phase === 'practice') pose.update(x,y);
    });
    await tracker.initialize();
    if (attempt !== cameraAttempt || disposed) return;
    cameraReady = true;
    el('camera-preview').hidden = false;
    status.textContent = '';
    el('begin').disabled = el('tutorial').disabled = false;
    return true;
  } catch (error) {
    if (attempt !== cameraAttempt || disposed) return;
    console.error('No se pudo iniciar el control por cámara:', error);
    const detail = tracker?.stage === 'detector'
      ? 'La cámara abrió, pero no pudimos cargar el detector de movimiento. Comprueba tu conexión y reintenta.'
      : error.name === 'NotAllowedError'
        ? 'El navegador bloqueó la cámara. Permite su acceso para este sitio y vuelve a intentarlo.'
        : error.name === 'NotFoundError'
          ? 'No encontramos una cámara conectada. Conecta una y vuelve a intentarlo.'
          : error.name === 'NotReadableError'
            ? 'No podemos acceder a la cámara. Cierra otras aplicaciones que la estén usando y reintenta.'
            : error.message === 'CameraUnavailable'
              ? 'Este navegador no permite usar la cámara aquí. Abre el juego en localhost o mediante HTTPS en un navegador compatible.'
              : 'No pudimos iniciar la cámara. Puedes reintentar o jugar con teclado.';
    tracker?.stop(); tracker = null; el('camera-preview').hidden = true;
    el('begin').disabled = el('tutorial').disabled = false; status.textContent = detail;
    return false;
  } finally {
    if (!disposed && attempt === cameraAttempt) {
      setup.classList.remove('camera-loading');
      setup.removeAttribute('aria-busy');
      el('tutorial-back').hidden = !setup.classList.contains('practicing');
    }
  }
}
async function prepare(practicing) {
  if (!mode || !ready || setup.classList.contains('camera-loading')) return;
  const selected = mode;
  if (mode === 'camera' && !await activateCamera()) return;
  if (disposed || selected !== mode) return;
  if (!practicing) { beginCountdown(); return; }
  phase = 'practice'; practice.clear(); keyboard.reset(); pose.reset(); game.player.reset();
  setup.classList.add('practicing');
  status.textContent = '';
  el('tutorial-back').hidden = false;
  el('tutorial').hidden = true;
  game.renderer.domElement.tabIndex = -1; game.renderer.domElement.focus();
}
el('begin').onclick = () => prepare(false);
el('tutorial').onclick = () => prepare(true);
el('restart').onclick = () => {
  if (mode === 'camera' && !cameraReady) {
    phase = 'setup'; setup.hidden = false; el('result').hidden = true; el('quick-mode').hidden = true;
  }
  prepare(false);
};
el('pause').onclick = () => {
  if (phase === 'running') pause();
  else if (phase === 'paused') {
    phase = 'running'; game.resume(); setPauseControl(false); message('');
  }
};
function key(event) {
  if ((phase !== 'running' && phase !== 'practice') || mode !== 'keyboard' || event.target.closest?.('button,a')) return;
  if (keyboard.press(event.code)) event.preventDefault();
}
function keyup(event) { keyboard.release(event.code); }
function blur() { keyboard.reset(); pause(); }
function visibility() { if (document.hidden) pause(); }
function dispose() {
  if (disposed) return;
  disposed = true; cancelAnimationFrame(uiFrame); cameraAttempt++; tracker?.stop(); game.dispose();
  window.removeEventListener('keydown',key); window.removeEventListener('keyup',keyup); window.removeEventListener('blur',blur); document.removeEventListener('visibilitychange',visibility);
}
window.addEventListener('keydown',key); window.addEventListener('keyup',keyup); window.addEventListener('blur',blur); document.addEventListener('visibilitychange',visibility);
window.addEventListener('pagehide',dispose,{once:true});
window.addEventListener('pageshow',event => { if(event.persisted) location.reload(); });

function setPauseControl(paused) {
  const button = el('pause');
  const label = paused ? 'Reanudar' : 'Pausar';
  button.classList.toggle('is-paused', paused);
  button.setAttribute('aria-label', label);
  button.title = label;
}


// Keep the finished run intact across alias edits, retries and control-mode changes.
const number = value => Math.floor(value || 0).toLocaleString('es-PE');
function showResult(score) {
  currentResult = recordLocalResult({ score, coins: game.coinCount, durationSeconds: game.runSeconds, mode });
  resultSaved = false; savingResult = false; aliasDraft = getRememberedAlias() || '';
  el('final-score').textContent = number(currentResult.score);
  el('final-coins').textContent = number(currentResult.coins);
  const best = getLocalBest();
  el('local-best').textContent = `Récord en este equipo: ${number(best.score)} puntos`;
  el('save-ranking').textContent = 'Guardar en ranking';
  el('save-ranking').disabled = !isRankingAvailable();
  el('ranking-availability').textContent = isRankingAvailable() ? '' : 'Ranking no disponible. Tu récord queda en este equipo.';
}
function showAlias() {
  if (!currentResult || resultSaved) return;
  el('ranking-alias').value = aliasDraft;
  el('ranking-alias').disabled = savingResult;
  el('ranking-alias').removeAttribute('aria-invalid');
  el('alias-status').textContent = savingResult ? 'Guardando…' : '';
  el('alias-save').textContent = savingResult ? 'Guardando…' : 'Guardar';
  el('alias-save').disabled = savingResult;
  if (savingResult) el('alias-form').setAttribute('aria-busy', 'true');
  else el('alias-form').removeAttribute('aria-busy');
  el('alias-dialog').showModal();
  el('ranking-alias').focus();
}
el('recover-ranking').onclick = () => {
  const pending = getPendingResult();
  if (!pending || savingResult) return;
  currentResult = pending; resultSaved = false; aliasDraft = pending.alias;
  showAlias();
};
el('ranking-alias').oninput = () => { aliasDraft = el('ranking-alias').value; };
el('save-ranking').onclick = showAlias;
el('alias-back').onclick = () => el('alias-dialog').close();
el('alias-form').onsubmit = async event => {
  event.preventDefault();
  if (!currentResult || savingResult || resultSaved) return;
  let alias;
  try { alias = normalizeAlias(el('ranking-alias').value).alias; } catch {
    el('alias-status').textContent = 'Usa entre 3 y 20 caracteres: letras, números, espacios, _ o -.';
    el('ranking-alias').setAttribute('aria-invalid', 'true');
    el('ranking-alias').focus();
    return;
  }
  const run = currentResult;
  savingResult = true;
  el('ranking-alias').removeAttribute('aria-invalid');
  el('ranking-alias').disabled = true;
  el('alias-save').disabled = true;
  el('alias-save').textContent = 'Guardando…';
  el('alias-status').textContent = 'Guardando…';
  el('alias-form').setAttribute('aria-busy', 'true');
  try {
    await saveResult({ ...run, alias });
    if (disposed || currentResult !== run) return;
    resultSaved = true;
    el('recover-ranking').hidden = !getPendingResult();
    el('alias-status').textContent = '¡Guardado!';
    el('alias-save').textContent = '¡Guardado!';
    el('save-ranking').textContent = '¡Guardado!';
    el('save-ranking').disabled = true;
    el('alias-back').focus();
  } catch {
    if (disposed || currentResult !== run) return;
    el('alias-status').textContent = 'No se pudo guardar. Tu partida sigue aquí; vuelve a intentarlo.';
    el('alias-save').textContent = 'Reintentar';
  } finally {
    if (currentResult === run) {
      savingResult = false;
      el('alias-form').removeAttribute('aria-busy');
      el('ranking-alias').disabled = resultSaved;
      el('alias-save').disabled = resultSaved;
    }
  }
};
el('open-ranking').onclick = () => {
  el('leaderboard-dialog').showModal();
  refreshLeaderboard();
};
el('leaderboard-back').onclick = () => el('leaderboard-dialog').close();
el('leaderboard-dialog').addEventListener('close', () => { leaderboardRequest++; });
el('leaderboard-retry').onclick = refreshLeaderboard;
async function refreshLeaderboard() {
  const request = ++leaderboardRequest;
  el('leaderboard-rows').replaceChildren();
  el('leaderboard-table-wrap').hidden = true;
  el('leaderboard-retry').hidden = true;
  if (!isRankingAvailable()) {
    el('leaderboard-status').textContent = 'El ranking aún no está disponible. Puedes seguir jugando.';
    return;
  }
  el('leaderboard-status').textContent = 'Cargando puntajes…';
  try {
    const entries = await loadLeaderboard({ limit: 10 });
    if (disposed || request !== leaderboardRequest) return;
    for (const [index, entry] of entries.slice(0, 10).entries()) {
      const row = document.createElement('tr');
      for (const value of [index + 1, entry.alias, number(entry.score), number(entry.coins)]) {
        const cell = document.createElement('td');
        cell.textContent = String(value); row.append(cell);
      }
      el('leaderboard-rows').append(row);
    }
    el('leaderboard-table-wrap').hidden = entries.length === 0;
    el('leaderboard-status').textContent = entries.length ? '' : 'Sé el primero en guardar tu puntaje.';
  } catch {
    if (disposed || request !== leaderboardRequest) return;
    el('leaderboard-status').textContent = 'No se pudo cargar el ranking.';
    el('leaderboard-retry').hidden = false;
  }
}
