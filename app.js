var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
// OFFLINE EDITION: all game and course data is stored on this iPad/browser.
// Ask the browser to retain local storage where the platform supports persistent storage.
try {
    if (navigator.storage && navigator.storage.persist)
        navigator.storage.persist().catch(() => { });
}
catch (e) { }
// Core UI state and helpers restored for offline startup.
const state = { view: 'home', courses: [], match: null, course: null, players: [], scores: [], handicaps: {}, selectedPlayers: 4, currentMode: 'F9', gameMultiplier: 10, baccaratMultiplier: 5, currentHole: 1, currentPlayer: null, isAdmin: false, adminName: '', adminPlayerId: null, viewingAsPlayer: false, editingScore: null, editingScores: null, editingHole: null, scoreMap: {}, courseMap: {}, qr: false, playerViewModal: false, error: '', publishedGames: [] };
const $ = id => document.getElementById(id);
const esc = s => String(s !== null && s !== void 0 ? s : '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[c]));
const DB_KEY = 'golf-game-offline-db-v1';
function dbEmpty() { return { courses: [], matches: [], players: [], scores: [], handicaps: [], joinEntries: [] }; }
function pruneExpiredMatches(db) {
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const expired = (db.matches || []).filter(m => { const t = Date.parse(m.created_at || m.date || ''); return Number.isFinite(t) && t < cutoff; }).map(m => String(m.match_id));
    if (!expired.length)
        return false;
    const gone = new Set(expired);
    db.matches = (db.matches || []).filter(m => !gone.has(String(m.match_id)));
    db.players = (db.players || []).filter(x => !gone.has(String(x.match_id)));
    db.scores = (db.scores || []).filter(x => !gone.has(String(x.match_id)));
    db.handicaps = (db.handicaps || []).filter(x => !gone.has(String(x.match_id)));
    db.joinEntries = (db.joinEntries || []).filter(x => !gone.has(String(x.match_id)));
    // COURSES are permanent and are intentionally never touched.
    return true;
}
function dbRead() {
    let db;
    try {
        db = JSON.parse(localStorage.getItem(DB_KEY) || 'null') || dbEmpty();
    }
    catch (e) {
        db = dbEmpty();
    }
    for (const k of ['courses', 'matches', 'players', 'scores', 'handicaps', 'joinEntries'])
        if (!Array.isArray(db[k]))
            db[k] = [];
    if (pruneExpiredMatches(db)) {
        try {
            dbWrite(db);
        }
        catch (e) {
            console.error('Could not persist 3-day cleanup', e);
        }
    }
    return db;
}
function dbWrite(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function uid(prefix) { return prefix + Math.random().toString(36).slice(2, 10).toUpperCase(); }
function offlineGet(action, params = {}) {
    const db = dbRead(), id = String(params.match_id || '').trim();
    if (action === 'getCourses')
        return { success: true, courses: db.courses.slice().sort((a, b) => a.course_name.localeCompare(b.course_name)) };
    if (action === 'getCourse') {
        const course = db.courses.find(c => c.course_id === params.course_id);
        return course ? { success: true, course } : { success: false, error: 'Course not found' };
    }
    if (action === 'getNextGameId') {
        const d = new Date(), prefix = `${d.getMonth() + 1}${String(d.getDate()).padStart(2, '0')}-`;
        let n = 1;
        while (db.matches.some(m => m.match_id === prefix + n))
            n++;
        return { success: true, match_id: prefix + n };
    }
    if (action === 'listPublishedGames') {
        return { success: true, games: db.joinEntries.filter(j => j.status === 'ACTIVE').map(j => { const m = db.matches.find(x => x.match_id === j.match_id); return m ? { match_id: m.match_id, admin: m.admin, published_at: j.published_at, players: db.players.filter(p => p.match_id === m.match_id).map(p => ({ player_id: p.player_id, name: p.name })) } : null; }).filter(Boolean) };
    }
    if (action === 'getMatch') {
        const m = db.matches.find(x => x.match_id === id);
        if (!m)
            return { success: false, error: 'Game not found' };
        const players = db.players.filter(p => p.match_id === id);
        const course = db.courses.find(c => c.course_id === m.course_id) || null;
        const hs = {};
        const list = db.handicaps.filter(h => h.match_id === id);
        players.forEach((a, i) => players.forEach((b, j) => { if (i < j) {
            const h = list.find(x => x.row_player_id === a.player_id && x.col_player_id === b.player_id);
            hs[`${i}-${j}`] = Number((h === null || h === void 0 ? void 0 : h.strokes) || 0);
        } }));
        return { success: true, match: Object.assign({}, m), players: players.map(p => (Object.assign({}, p))), course, handicaps: hs };
    }
    if (action === 'getScores')
        return id ? { success: true, scores: db.scores.filter(x => x.match_id === id).map((_a) => {
                var { match_id } = _a, x = __rest(_a, ["match_id"]);
                return (Object.assign({}, x));
            }) } : { success: false, error: 'match_id is required' };
    if (action === 'getHandicaps') {
        const players = db.players.filter(p => p.match_id === id), out = {};
        players.forEach((a, i) => players.forEach((b, j) => { if (i < j) {
            const h = db.handicaps.find(x => x.match_id === id && x.row_player_id === a.player_id && x.col_player_id === b.player_id);
            out[`${i}-${j}`] = Number((h === null || h === void 0 ? void 0 : h.strokes) || 0);
        } }));
        return { success: true, handicaps: out };
    }
    return { success: false, error: 'Unsupported offline action: ' + action };
}
async function get(action, params = {}) { return offlineGet(action, params); }
async function post(data) {
    const db = dbRead(), a = data.action, id = String(data.match_id || '').trim(), now = new Date().toISOString();
    let result = { success: true };
    const match = () => db.matches.find(m => m.match_id === id);
    if (a === 'createCourse' || a === 'updateCourse') {
        const name = String(data.course_name || '').trim(), holes = data.holes || [];
        if (!name)
            return { success: false, error: 'Enter a course name.' };
        if (holes.length !== 18)
            return { success: false, error: 'Course must have 18 holes.' };
        if (new Set(holes.map(h => Number(h.si))).size !== 18)
            return { success: false, error: 'SI values must be unique.' };
        if (a === 'createCourse') {
            if (db.courses.some(c => c.course_name.toLowerCase() === name.toLowerCase()))
                return { success: false, error: 'Course already exists' };
            const course = { course_id: uid('C'), course_name: name, holes: holes.map((h, i) => ({ hole: i + 1, par: Number(h.par), si: Number(h.si) })), created_at: now };
            db.courses.push(course);
            result = { success: true, message: 'Course created', course };
        }
        else {
            const c = db.courses.find(c => c.course_id === data.course_id);
            if (!c)
                return { success: false, error: 'Course not found' };
            if (db.courses.some(x => x.course_id !== c.course_id && x.course_name.toLowerCase() === name.toLowerCase()))
                return { success: false, error: 'Course already exists' };
            c.course_name = name;
            c.holes = holes.map((h, i) => ({ hole: i + 1, par: Number(h.par), si: Number(h.si) }));
            result = { success: true, message: 'Course updated', course: c };
        }
    }
    else if (a === 'createMatch') {
        const matchId = String(data.match_id || '').trim(), names = data.players || [];
        if (!matchId)
            return { success: false, error: 'Game ID is required' };
        if (matchId && db.matches.some(m => m.match_id === matchId))
            return { success: false, error: 'Game ID already exists' };
        if (!data.admin || !data.course_id)
            return { success: false, error: 'Admin and Course are required' };
        if (names.length < 2 || names.length > 6)
            return { success: false, error: 'Players must be 2-6' };
        if (!db.courses.some(c => c.course_id === data.course_id))
            return { success: false, error: 'Course not found' };
        const m = { match_id: matchId, date: now, created_at: now, updated_at: now, admin: data.admin, player_count: names.length, course_id: data.course_id, status: 'OPEN', result_doubles: {}, pnl_settings: { game_multiplier: 10, baccarat_multiplier: 5 } };
        db.matches.push(m);
        const ps = names.map((n, i) => ({ match_id: matchId, player_id: uid('P'), name: String(n).trim(), join_code: uid('J').slice(0, 6), baccarat_enabled: (data.baccarat_enabled || [])[i] !== false }));
        db.players.push(...ps);
        for (let i = 0; i < ps.length; i++)
            for (let j = i + 1; j < ps.length; j++) {
                const v = Number((data.handicaps || {})[`${i}-${j}`] || 0);
                db.handicaps.push({ match_id: matchId, row_player_id: ps[i].player_id, col_player_id: ps[j].player_id, strokes: v }, { match_id: matchId, row_player_id: ps[j].player_id, col_player_id: ps[i].player_id, strokes: -v });
            }
        result = { success: true, match_id: matchId, course_id: data.course_id, player_count: names.length, status: 'OPEN', players: ps, handicap_rows: names.length * (names.length - 1) };
    }
    else if (a === 'joinMatch') {
        const m = match();
        if (!m)
            return { success: false, error: 'Game not found' };
        const p = db.players.find(p => p.match_id === id && p.name.toLowerCase() === String(data.name || '').trim().toLowerCase());
        return p ? { success: true, match_id: id, player: p } : { success: false, error: 'Player not found' };
    }
    else if (a === 'saveScore') {
        const m = match(), hole = Number(data.hole), score = data.score === '' || data.score == null ? '' : Number(data.score);
        if (!m)
            return { success: false, error: 'Game not found' };
        if (hole < 1 || hole > 18 || !Number.isInteger(hole))
            return { success: false, error: 'hole must be 1-18' };
        const submitting = db.players.find(p => p.match_id === id && p.player_id === data.submitted_by);
        if (!submitting)
            return { success: false, error: 'Invalid submitting player' };
        if (submitting.name.toLowerCase() !== m.admin.toLowerCase() && data.submitted_by !== data.player_id)
            return { success: false, error: 'Only Admin can edit another player score' };
        let old = db.scores.find(x => x.match_id === id && x.hole === hole && x.player_id === data.player_id);
        if (old) {
            old.score = score;
            old.up = !!data.up;
            old.submitted_by = data.submitted_by;
            old.updated_at = now;
        }
        else
            db.scores.push({ match_id: id, hole, player_id: data.player_id, score, up: !!data.up, submitted_by: data.submitted_by, updated_at: now });
        result = { success: true, message: 'Score saved', match_id: id, hole, player_id: data.player_id };
    }
    else if (a === 'saveScoresBatch') {
        const m = match(), sub = db.players.find(p => p.match_id === id && p.player_id === data.submitted_by);
        if (!m || !sub)
            return { success: false, error: 'Game or player not found' };
        if (sub.name.toLowerCase() !== m.admin.toLowerCase())
            return { success: false, error: 'Only Admin can use batch score entry' };
        for (const x of data.scores || []) {
            const old = db.scores.find(s => s.match_id === id && s.hole === Number(data.hole) && s.player_id === x.player_id);
            if (old) {
                old.score = Number(x.score);
                old.up = !!x.up;
                old.submitted_by = data.submitted_by;
                old.updated_at = now;
            }
            else
                db.scores.push({ match_id: id, hole: Number(data.hole), player_id: x.player_id, score: Number(x.score), up: !!x.up, submitted_by: data.submitted_by, updated_at: now });
        }
        result = { success: true };
    }
    else if (a === 'saveHandicaps') {
        if (!match())
            return { success: false, error: 'Game not found' };
        db.handicaps = db.handicaps.filter(h => h.match_id !== id);
        const pids = data.player_ids || [], hs = data.handicaps || {};
        for (let i = 0; i < pids.length; i++)
            for (let j = i + 1; j < pids.length; j++) {
                const v = Number(hs[`${i}-${j}`] || 0);
                db.handicaps.push({ match_id: id, row_player_id: pids[i], col_player_id: pids[j], strokes: v }, { match_id: id, row_player_id: pids[j], col_player_id: pids[i], strokes: -v });
            }
        result = { success: true, match_id: id, rows_written: pids.length * (pids.length - 1) };
    }
    else if (a === 'saveBaccaratPlayers') {
        if (!match())
            return { success: false, error: 'Game not found' };
        let updated = 0;
        for (const x of data.players || []) {
            const p = db.players.find(p => p.match_id === id && p.player_id === x.player_id);
            if (p) {
                p.baccarat_enabled = x.baccarat_enabled !== false;
                updated++;
            }
        }
        result = { success: updated === (data.players || []).length, updated };
    }
    else if (a === 'saveResultDouble') {
        const m = match();
        if (!m)
            return { success: false, error: 'Game not found' };
        const key = String(data.mode).toUpperCase() + '|' + [data.p1, data.p2].sort().join('|');
        m.result_doubles = m.result_doubles || {};
        if (data.checked)
            m.result_doubles[key] = true;
        else
            delete m.result_doubles[key];
        result = { success: true, result_doubles: m.result_doubles };
    }
    else if (a === 'savePnlSettings') {
        const m = match();
        if (!m)
            return { success: false, error: 'Game not found' };
        m.pnl_settings = { game_multiplier: Number(data.game_multiplier), baccarat_multiplier: Number(data.baccarat_multiplier) };
        result = { success: true, pnl_settings: m.pnl_settings };
    }
    else if (a === 'publishJoinEntry') {
        const m = match();
        if (!m)
            return { success: false, error: 'Game not found' };
        let j = db.joinEntries.find(j => j.match_id === id);
        if (!j) {
            j = { match_id: id };
            db.joinEntries.push(j);
        }
        j.status = 'ACTIVE';
        j.published_at = now;
        result = { success: true, status: 'ACTIVE', match_id: id };
    }
    else if (a === 'removeJoinEntry') {
        const j = db.joinEntries.find(j => j.match_id === id);
        if (j)
            j.status = 'REMOVED';
        result = { success: true, status: 'REMOVED', match_id: id };
    }
    else if (a === 'deleteRecordsOlderThan3Days') {
        const current = match();
        if (!current)
            return { success: false, error: 'Current game not found' };
        const cutoff = Date.now() - 3 * 86400000, old = db.matches.filter(m => new Date(m.date).getTime() < cutoff).map(m => m.match_id);
        db.matches = db.matches.filter(m => !old.includes(m.match_id));
        for (const k of ['players', 'scores', 'handicaps', 'joinEntries'])
            db[k] = db[k].filter(x => !old.includes(x.match_id));
        result = { success: true, deleted_matches: old.length, deleted_players: 0, deleted_scores: 0, deleted_handicaps: 0, deleted_join_entries: 0, courses_preserved: true };
    }
    else
        return { success: false, error: 'Unsupported offline action: ' + a };
    dbWrite(db);
    return result;
}
function localName(gameId) { return localStorage.getItem('golf-name-' + gameId) || ''; }
function saveLocalName(gameId, name) { localStorage.setItem('golf-name-' + gameId, name); }
function saveLastJoin(gameId, name) { localStorage.setItem('golf-last-game-id', String(gameId || '').trim()); localStorage.setItem('golf-last-player-name', String(name || '').trim()); saveLocalName(gameId, name); }
function restoreLastJoin() { return { gameId: localStorage.getItem('golf-last-game-id') || '', name: localStorage.getItem('golf-last-player-name') || '' }; }

function checkForLatestUpdate() {
  var button = document.getElementById('app-update-button');
  var status = document.getElementById('app-update-status');
  function say(message) { if (status) status.textContent = message; }
  function resetButton() {
    if (button) { button.disabled = false; button.textContent = '↻ Get Latest Update'; }
  }
  if (button) { button.disabled = true; button.textContent = 'Checking…'; }
  if (!navigator.onLine) {
    say('Offline: cannot check for updates. Your saved data is untouched.');
    resetButton(); return;
  }
  if (!('serviceWorker' in navigator)) {
    say('This browser does not support Service Worker updates. Your saved data is untouched.');
    resetButton(); return;
  }
  var swUrl = new URL('./sw.js', window.location.href).toString();
  var scopeUrl = new URL('./', window.location.href).toString();
  fetch(swUrl, { cache: 'no-store' }).then(function(response) {
    if (!response.ok) {
      throw new Error('Service worker file not found at: ' + swUrl + ' (HTTP ' + response.status + ')');
    }
    return navigator.serviceWorker.getRegistration(scopeUrl);
  }).then(function(reg) {
    if (reg) return reg;
    say('No registration found. Registering offline cache…');
    return navigator.serviceWorker.register(swUrl, {scope: './'}).then(function() {
      return navigator.serviceWorker.getRegistration(scopeUrl);
    });
  }).then(function(reg) {
    if (!reg) throw new Error('Registration did not appear after registering sw.js');
    say('Checking for latest files…');
    return reg.update().then(function() { return reg; });
  }).then(function(reg) {
    if (reg.waiting) {
      say('New version downloaded. Activating cache…');
      reg.waiting.postMessage('SKIP_WAITING');
      return;
    }
    if (reg.installing) {
      say('New version found. Downloading files…');
      reg.installing.addEventListener('statechange', function() {
        if (reg.waiting) {
          say('Activating new cache…');
          reg.waiting.postMessage('SKIP_WAITING');
        } else if (reg.installing && reg.installing.state === 'installed') {
          say('Offline cache installed. Reload this page to use it.');
          resetButton();
        }
      });
      return;
    }
    say('Update check complete. Homepage version: v21. If you expected a newer version, wait for GitHub Pages to finish publishing and tap again.');
    resetButton();
  }).catch(function(error) {
    say('Update check failed. Your saved data is untouched. (' +
      (error && error.message ? error.message : 'unknown error') + ')');
    resetButton();
  });
}

function render() { document.getElementById('app').innerHTML = state.view === 'home' ? homeView() : state.view === 'new' ? newGameView() : state.view === 'join' ? joinView() : state.view === 'courses' ? coursesView() : state.view === 'courseEditor' ? courseEditorView() : scoreView(); }
function headerPlayerButtons() {
    if (!state.match || !state.players.length || !state.adminPlayerId) return '';
    const admin = state.players.find(p => String(p.player_id) === String(state.adminPlayerId));
    if (!admin) return '';
    const ordered = [admin].concat(state.players.filter(p => String(p.player_id) !== String(admin.player_id)));
    return `<nav class="header-player-list" aria-label="Player perspectives">${ordered.map(p => {
        const selected = state.currentPlayer && String(state.currentPlayer.player_id) === String(p.player_id);
        const id = String(p.player_id).replace(/[^a-zA-Z0-9_-]/g, '');
        return `<button type="button" class="header-player-name ${selected ? 'selected' : ''}" onclick="switchHeaderPlayer('${id}')" aria-pressed="${selected ? 'true' : 'false'}">${esc(p.name)}</button>`;
    }).join('')}</nav>`;
}
function shell(content, opts = {}) {
    const brandContent = opts.back ? `<button class="back" onclick="goHome()" aria-label="Return Home">‹ Home</button>` : `<div class="brand">${state.match ? `GID: ${esc(state.match.match_id)}` : 'Golf Game'}</div>`;
    const playerNames = opts.qr ? headerPlayerButtons() : '';
    return `<div class="app-shell"><header class="header v10-header"><div class="header-brand-wrap">${brandContent}</div>${playerNames}${''}</header>${content}${state.playerViewModal ? playerViewPickerModal() : ''}</div>`;
}
function homeView() { return shell(`<main class="container home home-v61"><section class="home-hero"><img src="./home-golf-hero.jpg" alt="Tom and Jerry enjoying a round of golf" fetchpriority="high"><div class="home-hero-shade"></div><div class="home-hero-caption"><span class="home-eyebrow"><span class="home-dot"></span> YOUR ROUND STARTS HERE</span><h1>Tom &amp; Jerry Group</h1><p>Play together. Track every hole.</p></div></section><section class="home-menu" aria-label="Main menu"><button class="home-menu-card join-card" onclick="show('join')"><span class="home-menu-icon">⛳</span><span class="home-menu-copy"><strong>Join Game</strong><small>Enter a game with your group</small></span><span class="arrow">›</span></button><button class="home-menu-card new-card" onclick="show('new')"><span class="home-menu-icon">🏆</span><span class="home-menu-copy"><strong>New Game</strong><small>Create a round · Admin</small></span><span class="arrow">›</span></button><button class="home-menu-card course-card" onclick="show('courses')"><span class="home-menu-icon">🚩</span><span class="home-menu-copy"><strong>Course Management</strong><small>View and manage course PAR / SI</small></span><span class="arrow">›</span></button></section><div class="home-mode-chips" aria-label="Available game modes"><span>Front 9</span><span>Back 9</span><span>Baccarat</span></div><p class="home-footnote">Offline mode · Data is saved on this iPad only.</p><section class="app-update-panel" aria-label="App version and update"><div id="app-version-label">Home version: v21</div><button id="app-update-button" type="button" onclick="checkForLatestUpdate()">↻ Get Latest Update</button><div id="app-update-status" role="status">Tap to check for the latest version.</div></section></main>`); }
function newGameView() { return shell(`<main class="container"><div class="card"><div class="section-head"><div class="section-title">New Game</div></div><div id="new-error"></div><div class="form-row"><div class="label">Game ID · Enter manually</div><input id="gameId" class="field" placeholder="Enter Game ID (e.g. 21-1)" autocomplete="off" required><div class="help" id="gameIdHelp">Enter a unique Game ID for this match, for example 21-1.</div></div><div class="form-row"><div class="label">Course</div><select id="courseId" class="field"><option value="">Select Course</option>${state.courses.map(c => `<option value="${esc(c.course_id)}">${esc(c.course_name)}</option>`).join('')}</select></div><div class="form-row"><div class="label">Players</div><div class="num-row">${[2, 3, 4, 5, 6].map(n => `<button class="num-btn ${state.selectedPlayers === n ? 'active' : ''}" onclick="selectPlayers(${n})">${n}</button>`).join('')}</div></div><div class="form-row"><div class="label">Player Names</div><div class="player-grid">${Array.from({ length: state.selectedPlayers }, (_, i) => `<input class="field pname" data-i="${i}" placeholder="Player ${i + 1}">`).join('')}</div></div><div class="card" style="margin:16px 0 0;padding:14px;background:#f5faf8;border-color:#d8ebe5"><div class="section-head"><div><div class="section-title" style="font-size:16px">Handicap</div><div style="font-size:12px;color:#667872">Set pair handicaps before Start.</div></div><button class="link-btn" onclick="openHandicap()">Edit ›</button></div></div><button class="start primary" onclick="startGame()">Start</button></div></main>`, { back: true }); loadCoursesIfNeeded(); }
async function loadNextGameId() {
    const field = $('gameId'), help = $('gameIdHelp');
    if (!field)
        return;
    field.value = '';
    field.placeholder = 'Checking…';
    if (help)
        help.textContent = 'Checking today’s game numbers…';
    try {
        const r = await get('getNextGameId');
        if (!r || !r.success || !r.match_id)
            throw new Error((r === null || r === void 0 ? void 0 : r.error) || 'The active Apps Script deployment does not return a Game ID. Please deploy the latest Code.gs as a new Web App version.');
        field.value = String(r.match_id);
        field.placeholder = 'Auto-generated';
        if (help)
            help.textContent = 'Game ID ready: ' + r.match_id;
    }
    catch (e) {
        field.value = '';
        field.placeholder = 'Game ID unavailable';
        if (help)
            help.textContent = e.message || 'Could not fetch an ID. Please retry opening New Game.';
        console.error('Game ID generation failed:', e);
    }
}
function joinView() { const last = restoreLastJoin(); setTimeout(loadPublishedGames, 0); return shell(`<main class="container"><div class="card"><div class="section-title" style="margin-bottom:14px">Join Game</div><div id="published-games"><div class="notice">Loading published games…</div></div><div id="join-error"></div><div class="join-manual-title">Enter Manually</div><div class="form-row"><div class="label">Game ID</div><input id="joinGameId" class="field" placeholder="Enter Game ID" value="${esc(last.gameId)}" autocomplete="off"></div><div class="form-row"><div class="label">Your Name</div><input id="joinName" class="field" placeholder="Enter your name" value="${esc(last.name)}" autocomplete="name"></div><button class="start primary" onclick="joinGame()">Join Game</button><div style="margin-top:12px;color:#697972;font-size:12px">You can always join manually using Game ID and your name.</div></div></main>`, { back: true }); }
async function loadPublishedGames() { const host = $('published-games'); if (!host)
    return; try {
    const r = await get('listPublishedGames');
    if (!r.success)
        throw new Error(r.error || 'Could not load games');
    state.publishedGames = r.games || [];
    host.innerHTML = state.publishedGames.length ? state.publishedGames.map((g, i) => `<section class="published-game"><div class="published-game-head"><strong>Game ${i + 1}</strong><span>Game ID: ${esc(g.match_id)}</span></div><div class="published-player-grid">${g.players.map(p => `<button class="published-player" onclick="joinPublished('${esc(g.match_id)}','${encodeURIComponent(p.name)}')">${esc(p.name)} <span>›</span></button>`).join('')}</div></section>`).join('') : '<div class="notice">No games published by the creator yet.</div>';
}
catch (e) {
    host.innerHTML = '<div class="notice">Could not load published games. You can still join manually below.</div>';
    console.error(e);
} }
async function joinPublished(matchId, encodedName) { const name = decodeURIComponent(encodedName); const id = $('joinGameId'), nm = $('joinName'); if (id)
    id.value = matchId; if (nm)
    nm.value = name; await joinGame(); }
function coursesView() { return shell(`<main class="container"><div class="card"><div class="section-head"><div class="section-title">Course Management</div><button class="link-btn" onclick="newCoursePrompt()">＋ Add Course</button></div><div class="course-list">${state.courses.map(c => `<button class="course-item" onclick="courseDetail('${esc(c.course_id)}')"><span><strong>${esc(c.course_name)}</strong><small>18 holes · Tap to view</small></span><span>›</span></button>`).join('') || '<div class="course-empty">No courses yet. Tap Add Course to create one.</div>'}</div></div></main>`, { back: true }); }
function courseDetail(id) { const c = state.courses.find(x => x.course_id === id); if (!c)
    return; document.getElementById('app').innerHTML = shell(`<main class="container"><div class="card course-detail"><div class="section-head"><div class="section-title">${esc(c.course_name)}</div><button class="link-btn" onclick="editCourse('${esc(c.course_id)}')">✎ Edit</button></div><table><thead><tr><th>Hole</th><th>PAR</th><th>Index</th></tr></thead><tbody>${c.holes.map(h => `<tr><td>${h.hole}</td><td>${h.par}</td><td>${h.si}</td></tr>`).join('')}</tbody></table><button class="start secondary course-back" onclick="show('courses')">Back to Courses</button></div></main>`, { back: true }); }
function courseEditorView() { const c = state.courseDraft; const holeRows = (start, end) => Array.from({ length: end - start + 1 }, (_, offset) => { const i = start + offset - 1; const h = (c.holes || []).find(x => Number(x.hole) === i + 1) || { par: 4, si: i + 1 }; return `<div class="course-hole-row"><b>${i + 1}</b><select class="field course-par" aria-label="Hole ${i + 1} PAR">${[3, 4, 5, 6].map(n => `<option value="${n}" ${Number(h.par) === n ? 'selected' : ''}>${n}</option>`).join('')}</select><select class="field course-si" aria-label="Hole ${i + 1} SI">${Array.from({ length: 18 }, (_, n) => n + 1).map(n => `<option value="${n}" ${Number(h.si) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`; }).join(''); return shell(`<main class="container"><div class="card course-editor"><div class="section-head"><div class="section-title">${c.course_id ? 'Edit Course' : 'Add Course'}</div><button class="link-btn" onclick="show('courses')">Cancel</button></div><div id="course-error"></div><label class="label">Course Name</label><input id="courseName" class="field" maxlength="100" placeholder="Enter course name" value="${esc(c.course_name || '')}"><div class="course-hole-columns"><section class="course-hole-side"><div class="course-nine-title">F9 <small>Holes 1–9</small></div><div class="course-hole-head"><span>Hole</span><span>PAR</span><span>SI</span></div>${holeRows(1, 9)}</section><section class="course-hole-side"><div class="course-nine-title">B9 <small>Holes 10–18</small></div><div class="course-hole-head"><span>Hole</span><span>PAR</span><span>SI</span></div>${holeRows(10, 18)}</section></div><button class="start primary" onclick="saveCourse()">Save Course</button></div></main>`, { back: true }); }
function selectPlayers(n) { state.selectedPlayers = n; render(); }
async function loadCoursesIfNeeded() { if (state.courses.length)
    return; try {
    const r = await get('getCourses');
    if (r.success) {
        state.courses = r.courses;
        updateCourseSelect();
    }
}
catch (e) {
    console.warn('getCourses failed', e);
} }
function updateCourseSelect() { const el = $('courseId'); if (!el)
    return; const current = el.value; el.innerHTML = '<option value="">Select Course</option>' + state.courses.map(c => `<option value="${esc(c.course_id)}">${esc(c.course_name)}</option>`).join(''); if (current)
    el.value = current; }
async function show(v) { state.view = v; state.error = ''; render(); if (v === 'new' || v === 'courses') {
    await loadCoursesIfNeeded();
    if (v === 'courses')
        render();
} }
function goHome() { state.view = 'home'; render(); }
async function startGame() { const err = $('new-error'); err.innerHTML = ''; const gameId = $('gameId').value.trim(), courseId = $('courseId').value, names = [...document.querySelectorAll('.pname')].map(x => x.value.trim()); if (!gameId || !courseId || names.some(n => !n) || new Set(names.map(n => n.toLowerCase())).size !== names.length) {
    err.innerHTML = '<div class="error">Enter Game ID, Course and unique player names.</div>';
    return;
} const r = await post({ action: 'createMatch', match_id: gameId, admin: names[0], course_id: courseId, players: names, handicaps: state.handicaps, baccarat_enabled: state.newBaccaratEnabled || names.map(() => true) }); if (!r.success) {
    err.innerHTML = `<div class="error">${esc(r.error)}</div>`;
    return;
} const actualGameId = r.match_id || gameId; if (Number(r.handicap_rows || 0) !== names.length * (names.length - 1)) {
    err.innerHTML = '<div class="error">Handicap was not saved. Please run setupDatabase() and redeploy the Apps Script.</div>';
    return;
} state.adminName = names[0]; state.isAdmin = true; saveLastJoin(actualGameId, names[0]); const publish = confirm('Add this game to the local Join Game list on this iPad?\n\nThis does not publish or sync the game to other phones.\nOK = Show it in this iPad’s Join Game list.\nCancel = Keep it private.'); if (publish) {
    try {
        const pr = await post({ action: 'publishJoinEntry', match_id: actualGameId, admin: names[0] });
        if (!pr.success)
            throw new Error(pr.error || 'Publish failed');
    }
    catch (e) {
        alert('Game created, but publishing failed: ' + (e.message || e) + '\nYou can retry later from P&L.');
    }
} await openMatch(actualGameId, names[0], true); }
async function joinGame() {
    var _a, _b, _c, _d;
    const err = $('join-error');
    if (!err)
        return;
    err.innerHTML = '';
    const id = ((_a = $('joinGameId')) === null || _a === void 0 ? void 0 : _a.value.trim()) || '', name = ((_b = $('joinName')) === null || _b === void 0 ? void 0 : _b.value.trim()) || '';
    if (!id || !name) {
        err.innerHTML = '<div class="error">Enter Game ID and your name.</div>';
        return;
    }
    const btn = document.querySelector('.join-submit') || ((_d = (_c = document.querySelector('#join-error')) === null || _c === void 0 ? void 0 : _c.parentElement) === null || _d === void 0 ? void 0 : _d.querySelector('button.start'));
    const original = (btn === null || btn === void 0 ? void 0 : btn.textContent) || 'Join';
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Joining…';
        btn.setAttribute('aria-busy', 'true');
    }
    try {
        const r = await Promise.race([post({ action: 'joinMatch', match_id: id, name }), new Promise((_, reject) => setTimeout(() => reject(new Error('Could not open this local game. Check the Game ID and player name.')), 15000))]);
        if (!r || !r.success)
            throw new Error((r === null || r === void 0 ? void 0 : r.error) || 'Could not join this game. Check the Game ID and player name.');
        saveLastJoin(id, name);
        state.adminName = '';
        state.isAdmin = false;
        await openMatch(id, name, false);
    }
    catch (e) {
        console.error('Join Game failed:', e);
        err.innerHTML = `<div class="error">${esc((e === null || e === void 0 ? void 0 : e.message) || 'Join failed. Please try again.')}</div>`;
    }
    finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = original;
            btn.removeAttribute('aria-busy');
        }
    }
}
function baccaratEnabledValue(v) { return !(v === false || v === 0 || String(v).trim().toLowerCase() === 'false' || String(v).trim() === '0' || String(v).trim().toLowerCase() === 'no'); }
async function openMatch(id, name, isAdmin) { var _a, _b, _c, _d; let r, s, lastError; for (let attempt = 0; attempt < 5; attempt++) {
    try {
        [r, s] = await Promise.all([get('getMatch', { match_id: id }), get('getScores', { match_id: id })]);
        if (r && r.success)
            break;
        lastError = r && r.error || 'Game not found';
    }
    catch (e) {
        lastError = e.message || String(e);
    }
    if (attempt < 4)
        await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
} if (!r || !r.success) {
    alert(lastError || 'Game not found');
    return;
} state.match = r.match; state.gameMultiplier = Number((_b = (_a = r.match.pnl_settings) === null || _a === void 0 ? void 0 : _a.game_multiplier) !== null && _b !== void 0 ? _b : 10); state.baccaratMultiplier = Number((_d = (_c = r.match.pnl_settings) === null || _c === void 0 ? void 0 : _c.baccarat_multiplier) !== null && _d !== void 0 ? _d : 5); state.players = (r.players || []).map(p => (Object.assign(Object.assign({}, p), { baccarat_enabled: baccaratEnabledValue(p.baccarat_enabled) }))); state.course = r.course; state.courseMap = {}; (state.course.holes || []).forEach(h => state.courseMap[Number(h.hole)] = h); state.handicaps = r.handicaps || {}; state.scores = s.success ? s.scores : []; state.scoreMap = {}; state.scores.forEach(x => state.scoreMap[`${x.player_id}|${Number(x.hole)}`] = x); state.currentPlayer = state.players.find(p => p.name.toLowerCase() === name.toLowerCase()) || state.players[0]; state.isAdmin = isAdmin || name.toLowerCase() === String(state.match.admin || '').toLowerCase(); state.viewingAsPlayer = false; state.adminPlayerId = state.isAdmin ? state.currentPlayer.player_id : null; state.playerViewModal = false; state.view = 'score'; render(); }
async function refreshMatch() { var _a, _b, _c, _d, _e, _f, _g, _h, _j; if (state.refreshing) return; if (!state.match) { showToast('Open a game first'); return; } state.refreshing = true; showToast('Updating…'); const btn = document.querySelector('.refresh-btn'); if (btn) {
    btn.disabled = true;
    btn.classList.add('spinning');
} try {
    const id = state.match.match_id;
    const currentPlayerId = (_a = state.currentPlayer) === null || _a === void 0 ? void 0 : _a.player_id;
    const [r, s] = await Promise.all([get('getMatch', { match_id: id }), get('getScores', { match_id: id })]);
    if (!r.success)
        throw new Error(r.error || 'Refresh failed');
    state.match = r.match;
    state.gameMultiplier = Number((_d = (_c = (_b = r.match.pnl_settings) === null || _b === void 0 ? void 0 : _b.game_multiplier) !== null && _c !== void 0 ? _c : state.gameMultiplier) !== null && _d !== void 0 ? _d : 10);
    state.baccaratMultiplier = Number((_g = (_f = (_e = r.match.pnl_settings) === null || _e === void 0 ? void 0 : _e.baccarat_multiplier) !== null && _f !== void 0 ? _f : state.baccaratMultiplier) !== null && _g !== void 0 ? _g : 5);
    state.players = (r.players || state.players).map(p => (Object.assign(Object.assign({}, p), { baccarat_enabled: baccaratEnabledValue(p.baccarat_enabled) })));
    state.course = r.course || state.course;
    state.courseMap = {};
    (((_h = state.course) === null || _h === void 0 ? void 0 : _h.holes) || []).forEach(h => state.courseMap[Number(h.hole)] = h);
    state.handicaps = r.handicaps || state.handicaps || {};
    state.scores = s.success ? (s.scores || []) : [];
    state.scoreMap = {};
    state.scores.forEach(x => state.scoreMap[`${x.player_id}|${Number(x.hole)}`] = x);
    state.currentPlayer = state.players.find(p => p.player_id === currentPlayerId) || state.currentPlayer || state.players[0];
    state.isAdmin = state.isAdmin || String(((_j = state.currentPlayer) === null || _j === void 0 ? void 0 : _j.name) || '').toLowerCase() === String(state.match.admin || '').toLowerCase();
    render();
    showToast('Updated');
}
catch (e) {
    console.error(e);
    showToast(e.message || 'Refresh failed');
}
finally {
    state.refreshing = false;
} }
function showToast(message) { let t = document.getElementById('refresh-toast'); if (!t) {
    t = document.createElement('div');
    t.id = 'refresh-toast';
    t.className = 'toast';
    document.body.appendChild(t);
} t.textContent = message; t.classList.add('show'); clearTimeout(window.__refreshToastTimer); window.__refreshToastTimer = setTimeout(() => t.classList.remove('show'), 1200); }
function openHandicap() { const names = [...document.querySelectorAll('.pname')].map(x => x.value.trim()); if (names.length < 2 || names.some(n => !n)) {
    alert('Enter all player names first.');
    return;
} state.handicapContext = 'new'; state.handicapNames = names; state.handicapDraft = Object.assign({}, state.handicaps); state.baccaratDraft = {}; names.forEach((n, i) => { const saved = Array.isArray(state.newBaccaratEnabled) ? state.newBaccaratEnabled[i] : undefined; state.baccaratDraft[String(i)] = saved === undefined ? true : baccaratEnabledValue(saved); }); const div = document.createElement('div'); div.className = 'handicap-modal'; div.id = 'handicapModal'; div.innerHTML = handicapHTML(names); document.body.appendChild(div); bindHandicap(); }
function openMatchHandicap() { if (!state.isAdmin) {
    showToast('Only admin can change handicaps');
    return;
} state.handicapContext = 'match'; state.handicapNames = state.players.map(p => p.name); state.handicapDraft = Object.assign({}, state.handicaps); state.baccaratDraft = {}; state.players.forEach(p => state.baccaratDraft[p.player_id] = baccaratEnabledValue(p.baccarat_enabled)); const div = document.createElement('div'); div.className = 'handicap-modal'; div.id = 'handicapModal'; div.innerHTML = handicapHTML(state.handicapNames); document.body.appendChild(div); bindHandicap(); }
function handicapHTML(names) {
    let h = '<div class="handicap-panel"><div class="modal-top"><div class="section-title">Handicap Matrix</div><button class="close" onclick="closeHandicap()">×</button></div><div class="help">Select the handicap. <b>Negative = give strokes</b>, <b>0 = square</b>, <b>Positive = receive strokes</b>. The reverse side is automatic.</div>';
    h += '<div class="section-title" style="font-size:14px;margin:12px 0 6px">Baccarat Players</div><div class="help">Tick players who participate in Baccarat. Unticked players are excluded from Baccarat points.</div><div class="baccarat-player-list">';
    h += names.map((n, i) => { const p = state.handicapContext === 'match' ? state.players[i] : null; const key = p ? p.player_id : String(i); const checked = state.baccaratDraft && state.baccaratDraft[key] !== false; return `<label class="baccarat-player-option"><input type="checkbox" class="baccarat-participant" data-player-key="${key}" ${checked ? 'checked' : ''}><span>${esc(n)}</span></label>`; }).join('');
    h += '</div><div class="matrix-wrap"><table class="matrix"><thead><tr><th>GIVE</th>' + names.map(n => `<th>${esc(n)}</th>`).join('') + '</tr></thead><tbody>';
    names.forEach((row, i) => { h += `<tr><td>${esc(row)}</td>`; names.forEach((col, j) => { var _a, _b; if (i === j)
        h += '<td class="diag">—</td>';
    else if (j < i) {
        const v = -(Number((_a = state.handicapDraft[`${i}-${j}`]) !== null && _a !== void 0 ? _a : 0));
        h += `<td class="auto-value ${v < 0 ? 'neg' : v > 0 ? 'pos' : 'zero'}">${v > 0 ? '+' : ''}${v}</td>`;
    }
    else {
        const key = `${i}-${j}`, v = Number((_b = state.handicapDraft[key]) !== null && _b !== void 0 ? _b : 0);
        h += `<td><select class="handicap-select ${v < 0 ? 'neg' : v > 0 ? 'pos' : 'zero'}" data-key="${key}">${Array.from({ length: 29 }, (_, k) => k - 14).map(n => `<option value="${n}" ${n === v ? 'selected' : ''}>${n > 0 ? '+' : ''}${n}</option>`).join('')}</select></td>`;
    } }); h += '</tr>'; });
    h += '</tbody></table></div><div class="legend"><span class="neg">● -14 to -1 Give</span><span class="zero">● 0 Square</span><span class="pos">● +1 to +14 Receive</span></div><div class="modal-actions"><button class="cancel" onclick="closeHandicap()">Cancel</button><button class="save" onclick="saveHandicap()">Save</button></div></div>';
    return h;
}
function bindHandicap() { document.querySelectorAll('.handicap-select').forEach(s => s.addEventListener('change', () => { const v = Number(s.value); state.handicapDraft[s.dataset.key] = v; s.className = 'handicap-select ' + (v < 0 ? 'neg' : v > 0 ? 'pos' : 'zero'); document.getElementById('handicapModal').innerHTML = handicapHTML(state.handicapNames); bindHandicap(); })); document.querySelectorAll('.baccarat-participant').forEach(c => c.addEventListener('change', () => { state.baccaratDraft[c.dataset.playerKey] = c.checked; })); }
async function saveHandicap() { const draft = Object.assign({}, state.handicapDraft); if (state.handicapContext === 'match') {
    const btn = document.querySelector('#handicapModal .save');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving…';
    }
    const r = await post({ action: 'saveHandicaps', match_id: state.match.match_id, player_ids: state.players.map(p => p.player_id), handicaps: draft });
    if (!r.success) {
        alert(r.error || 'Could not save handicaps');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Save';
        }
        return;
    }
    let br;
    try {
        br = await post({ action: 'saveBaccaratPlayers', match_id: state.match.match_id, players: state.players.map(p => ({ player_id: p.player_id, baccarat_enabled: baccaratEnabledValue(state.baccaratDraft[p.player_id]) })) });
    }
    catch (e) {
        br = { success: false, error: e.message || String(e) };
    }
    if (!br.success || Number(br.updated) !== state.players.length) {
        alert((br.error || ('Baccarat participation saved for ' + Number(br.updated || 0) + ' of ' + state.players.length + ' players. Update and redeploy the Apps Script, then save again.')));
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Save';
        }
        return;
    }
    state.handicaps = draft;
    state.players.forEach(p => p.baccarat_enabled = baccaratEnabledValue(state.baccaratDraft[p.player_id]));
    closeHandicap();
    render();
    showToast('Handicaps saved');
    return;
} state.handicaps = draft; state.newBaccaratEnabled = state.handicapNames.map((n, i) => state.baccaratDraft[String(i)] !== false); closeHandicap(); }
function closeHandicap() { var _a; (_a = document.getElementById('handicapModal')) === null || _a === void 0 ? void 0 : _a.remove(); }
function displayPlayers() { if (!state.currentPlayer || !state.match)
    return state.players; const me = state.currentPlayer; const admin = state.players.find(p => String(p.name).toLowerCase() === String(state.match.admin || '').toLowerCase()); const ordered = [me]; if (admin && admin.player_id !== me.player_id)
    ordered.push(admin); state.players.forEach(p => { if (!ordered.some(x => x.player_id === p.player_id))
    ordered.push(p); }); return ordered; }
function scoreFor(pid, hole) { return state.scoreMap[`${pid}|${Number(hole)}`] || { score: '', up: false }; }
function courseHole(hole) { return state.courseMap[Number(hole)] || null; }
// Score storage and all scoring calculations stay in gross strokes.
// The scorecard/editor use relative-to-par values.
function relativeScoreBounds(par) { return Number(par) === 3 ? [-2, 5] : Number(par) === 5 ? [-3, 7] : [-2, 6]; }
function scoreInputValue(gross, hole) { var _a; if (gross === '' || gross === null || gross === undefined)
    return ''; return Number(gross) - Number(((_a = courseHole(hole)) === null || _a === void 0 ? void 0 : _a.par) || 4); }
function scoreInputLabel(value) { const n = Number(value); return n > 0 ? String(n) : String(n); }
function grossScoreValue(relativeValue, hole) { var _a; return Number(((_a = courseHole(hole)) === null || _a === void 0 ? void 0 : _a.par) || 4) + Number(relativeValue); }
function scoreInputOptions(hole, currentRelative) { var _a; const par = Number(((_a = courseHole(hole)) === null || _a === void 0 ? void 0 : _a.par) || 4); const [min, max] = relativeScoreBounds(par); return Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => `<button class="score-option ${Number(currentRelative) === n ? 'active' : ''}" onclick="pickScore(${n})">${scoreInputLabel(n)}</button>`).join(''); }
function bulkScoreInputOptions(i, hole, currentRelative) { var _a; const par = Number(((_a = courseHole(hole)) === null || _a === void 0 ? void 0 : _a.par) || 4); const [min, max] = relativeScoreBounds(par); return Array.from({ length: max - min + 1 }, (_, j) => min + j).map(n => `<button class="bulk-score-btn ${Number(currentRelative) === n ? 'active' : ''}" onclick="pickBulkScore(${i},${n})">${scoreInputLabel(n)}</button>`).join(''); }
function getPairHandicap(a, b) { const ia = state.players.findIndex(p => p.player_id === a), ib = state.players.findIndex(p => p.player_id === b); if (ia < 0 || ib < 0)
    return 0; const key = ia < ib ? `${ia}-${ib}` : `${ib}-${ia}`; const base = Number(state.handicaps[key] || 0); return ia < ib ? base : -base; }
function segmentStrokeCount(total, mode) { const n = Math.abs(Number(total) || 0); if (mode === 'F9' || mode === 'B9')
    return n / 2; return n; }
function strokeValueForHole(a, b, hole) { var _a; const hc = getPairHandicap(a, b); if (hc === 0)
    return 0; const mode = hole <= 9 ? 'F9' : 'B9'; const count = segmentStrokeCount(hc, mode); if (!count)
    return 0; const start = hole <= 9 ? 1 : 10; const end = hole <= 9 ? 9 : 18; const candidates = (((_a = state.course) === null || _a === void 0 ? void 0 : _a.holes) || []).filter(x => Number(x.hole) >= start && Number(x.hole) <= end).sort((x, y) => Number(x.si) - Number(y.si)); const absCount = Math.abs(count); const full = Math.floor(absCount); const half = absCount - full; const idx = candidates.findIndex(x => Number(x.hole) === Number(hole)); if (idx < 0 || idx >= full + (half ? 1 : 0))
    return 0; const amount = idx < full ? 1 : 0.5; return hc < 0 ? -amount : amount; }
function strokesFor(a, b, hole) { return strokeValueForHole(a, b, hole); }
function fmtStroke(n) { if (!n)
    return '0'; return `${n > 0 ? '+' : ''}${Number.isInteger(n) ? n : n.toFixed(1)}`; }
function segmentHandicap(a, b, mode) { const hc = getPairHandicap(a, b); const n = segmentStrokeCount(hc, mode); return hc < 0 ? -n : n; }
function relative(a, b, hole) { const sa = Number(scoreFor(a, hole).score), sb = Number(scoreFor(b, hole).score); if (!sa || !sb)
    return 'S'; const stroke = strokesFor(a, b, hole); const adjA = sa - stroke; return adjA < sb ? 'W' : adjA > sb ? 'L' : 'S'; }
function cellClass(viewer, pid, hole) { /* Handicap borders describe the opponent's stroke advantage from the current viewer's perspective. Never paint the viewer's own score cells red/blue. */ if (pid === viewer)
    return ''; const st = strokesFor(viewer, pid, hole); if (st > 0)
    return 'benefit'; if (st < 0)
    return 'disadvantage'; return ''; }
function isBirdie(score, par) { return score && score <= par - 1; }
function scoreRewardMarker(pid, hole, grossScore) {
    const course = courseHole(hole);
    if (!course)
        return false;
    const par = Number(course.par || 4), score = Number(grossScore), rel = score - par;
    // Individual rewards are marked on the hole where they occur.
    if (par === 3 && score === 1)
        return true; // hole-in-one
    if (rel <= -3 || rel === -2 || rel === -1)
        return true; // albatross, eagle, birdie
    // Double 3 / Double 5 is evaluated within the current nine, not across all 18 holes.
    if (par !== 3 && par !== 5)
        return false;
    const roundStart = Number(hole) <= 9 ? 1 : 10;
    const roundEnd = roundStart + 8;
    const roundHoles = Array.from({ length: 9 }, (_, i) => roundStart + i);
    const samePar = roundHoles.filter(h => { var _a; return Number((_a = courseHole(h)) === null || _a === void 0 ? void 0 : _a.par) === par; });
    if (samePar.length < 2 || Number(hole) !== samePar[1])
        return false;
    const first = scoreFor(pid, samePar[0]), second = scoreFor(pid, samePar[1]);
    if (first.score === '' || first.score === null || first.score === undefined || second.score === '' || second.score === null || second.score === undefined)
        return false;
    return Number(first.score) <= par && Number(second.score) <= par;
}
function scoreMarkup(pid, hole) { var _a; const s = scoreFor(pid, hole); if (s.score === '' || s.score === null || s.score === undefined)
    return '<span class="score-empty">–</span>'; const par = Number(((_a = courseHole(hole)) === null || _a === void 0 ? void 0 : _a.par) || 4); const score = Number(s.score); const rel = score - par; const label = scoreInputLabel(rel); const dot = scoreRewardMarker(pid, hole, score) ? '<i class="reward-dot" aria-label="Reward condition"></i>' : ''; if (score <= par)
    return `<span class="score-ring-wrap"><span class="score-ring">${label}</span>${dot}</span>`; return `<span class="score-plain-wrap"><span class="score-plain">${label}</span>${dot}</span>`; }
function pairOutcomes(viewer, opp, mode) { const holes = mode === 'F9' ? Array.from({ length: 9 }, (_, i) => i + 1) : Array.from({ length: 9 }, (_, i) => i + 10); let margin = 0; let decisionAt = null; const rows = []; for (const h of holes) {
    const a = Number(scoreFor(viewer, h).score), b = Number(scoreFor(opp, h).score);
    let r = 'S';
    if (a && b) {
        r = relative(viewer, opp, h);
        if (r === 'W')
            margin++;
        else if (r === 'L')
            margin--;
    }
    const remainingAfter = holes[holes.length - 1] - h;
    if (decisionAt === null && a && b && Math.abs(margin) > remainingAfter)
        decisionAt = h;
    rows.push({ h, r, margin, remainingAfter, decisionAt });
} return { holes, rows, decisionAt, finalMargin: margin }; }
function fmtState(n, wordUp = 'UP', wordDown = 'DW') { if (n > 0)
    return `${n}${wordUp}`; if (n < 0)
    return `${Math.abs(n)}${wordDown}`; return 'SQUARE'; }
function matchStatus(viewer, opp, hole) {
    const mode = state.currentMode === 'B9' ? 'B9' : 'F9';
    const { holes, rows } = pairOutcomes(viewer, opp, mode);
    const idx = rows.findIndex(x => x.h === hole);
    if (idx < 0)
        return '–';
    const row = rows[idx], lastIdx = rows.length - 1;
    const hasScores = i => { const a = Number(scoreFor(viewer, rows[i].h).score), b = Number(scoreFor(opp, rows[i].h).score); return a > 0 && b > 0; };
    // Determine which scoring path starts first. Once Tommy/Buy starts, keep
    // that path for the rest of the segment; GG is only used if it occurs first.
    let triggerIdx = -1, ggIdx = -1;
    for (let i = 0; i < lastIdx; i++) {
        if (!hasScores(i))
            continue;
        if (triggerIdx < 0 && rows[i].margin !== 0 && Math.abs(rows[i].margin) === rows[i].remainingAfter)
            triggerIdx = i;
        if (ggIdx < 0 && Math.abs(rows[i].margin) > rows[i].remainingAfter)
            ggIdx = i;
    }
    const tommyBuyFirst = triggerIdx >= 0 && (ggIdx < 0 || triggerIdx < ggIdx);
    if (ggIdx >= 0 && idx >= ggIdx && !tommyBuyFirst) {
        if (idx === ggIdx)
            return `${Math.abs(row.margin)}${row.margin > 0 ? 'UP' : 'DW'}/GG`;
        let post = 0;
        for (let i = ggIdx + 1; i <= idx; i++) {
            if (rows[i].r === 'W')
                post++;
            else if (rows[i].r === 'L')
                post--;
        }
        return fmtState(post, 'UP', 'DW').replace('SQUARE', 'SQ');
    }
    if (triggerIdx >= 0 && idx >= triggerIdx && tommyBuyFirst) {
        const tr = rows[triggerIdx];
        if (idx < triggerIdx)
            return fmtState(row.margin).replace('SQUARE', 'SQ');
        if (idx === triggerIdx)
            return `${Math.abs(tr.margin)}${tr.margin > 0 ? 'UP' : 'DW'}/${Math.abs(tr.margin)}GO`;
        let decisionIdx = -1;
        for (let i = triggerIdx + 1; i <= idx; i++) {
            if (hasScores(i) && Math.abs(rows[i].margin) > rows[i].remainingAfter) {
                decisionIdx = i;
                break;
            }
        }
        const t = row.margin - tr.margin;
        // Established B9 lookup sequence, locked into Tommy/Buy after it starts.
        if (mode === 'B9' && tr.h === 15 && tr.margin === -3 && idx > triggerIdx &&
            rows.slice(triggerIdx + 1, idx + 1).every(x => x.r === 'S')) {
            if (idx === triggerIdx + 1)
                return 'T+1';
            if (idx === triggerIdx + 2)
                return 'G/T+1';
            if (idx === triggerIdx + 3)
                return 'T+1/B0';
        }
        if (decisionIdx >= 0 && idx >= decisionIdx) {
            if (idx === decisionIdx)
                return `G/T${t > 0 ? '+' : ''}${t}`;
            const b = row.margin - rows[decisionIdx].margin;
            // Show both Tommy and Buy on the final hole after Game is decided.
            return `T${t > 0 ? '+' : ''}${t}/B${b > 0 ? '+' : ''}${b}`;
        }
        return `T${t > 0 ? '+' : ''}${t}`;
    }
    if (idx === lastIdx && idx > 0 && rows[idx - 1].margin === 0 && row.margin !== 0) {
        return `G/1${row.margin > 0 ? 'UP' : 'DW'}`;
    }
    return fmtState(row.margin).replace('SQUARE', 'SQ');
}
function matchStatusMarkup(raw) {
    const text = String(raw);
    const go = text.match(/^(\d+)(UP|DW)\/(\d+)GO$/);
    if (go)
        return `<span class="status-stack"><span>${go[1]}${go[2]}</span><span>${go[3]}GO</span></span>`;
    const gg = text.match(/^(\d+)(UP|DW)\/GG$/);
    if (gg)
        return `<span class="status-stack"><span>${gg[1]}${gg[2]}</span><span>Game Over</span></span>`;
    if (text === 'G')
        return 'Game';
    const gamePair = text.match(/^G\/(.+)$/);
    if (gamePair)
        return `<span class="status-stack"><span>Game</span><span>${gamePair[1]}</span></span>`;
    const tommyBuy = text.match(/^(T[+-]?\d+)\/(B[+-]?\d+)$/);
    if (tommyBuy)
        return `<span class="status-stack"><span>${tommyBuy[1]}</span><span>${tommyBuy[2]}</span></span>`;
    return text === 'SQUARE' ? 'SQ' : text;
}
function matchStatusClass(text) { if (text === 'G' || text.startsWith('G/') || text.endsWith('/GG'))
    return 'status-game'; if (/UP/.test(text) || /T\+|B\+/.test(text))
    return 'status-up'; if (/DW/.test(text) || /T-|B-/.test(text))
    return 'status-down'; return 'status-square'; }
function matchHandicapLabel(viewer, opp) { const mode = state.currentMode === 'B9' ? 'B9' : 'F9'; const n = segmentHandicap(viewer, opp, mode); if (n > 0)
    return `<span class="hcp-receive">Receive ${fmtStroke(n)}</span>`; if (n < 0)
    return `<span class="hcp-give">Give ${fmtStroke(n)}</span>`; return '<span class="hcp-zero">0 strokes</span>'; }
function scoreView() { return shell(`<main class="score-page"><div class="mode-tabs">${['F9', 'B9', 'Baccarat', 'P&L'].map(m => `<button class="mode-tab ${state.currentMode === m ? 'active' : ''}" onclick="setMode('${m}')">${m}</button>`).join('')}</div>${state.currentMode === 'P&L' ? pnlView() : state.currentMode === 'Baccarat' ? baccaratTable() : matchTable()}${!state.viewingAsPlayer && state.editingScores ? bulkScoreEditor() : !state.viewingAsPlayer && state.editingScore ? scoreEditor() : ''}${state.qr ? qrModal() : ''}</main>`, { qr: true }); }
function holesForMode() { return state.currentMode === 'F9' ? Array.from({ length: 9 }, (_, i) => i + 1) : state.currentMode === 'B9' ? Array.from({ length: 9 }, (_, i) => i + 10) : Array.from({ length: 18 }, (_, i) => i + 1); }
function matchTable() { const holes = holesForMode(); const mode = state.currentMode === 'B9' ? 'B9' : 'F9'; const segmentStrokes = pid => holes.reduce((sum, h) => sum + Math.max(0, Number(scoreFor(pid, h).score) || 0), 0); const segmentResult = pid => { var _a; if (pid === state.currentPlayer.player_id)
    return ''; const r = resultForPair(state.currentPlayer.player_id, pid, mode); const key = resultPairKey(mode, state.currentPlayer.player_id, pid); const adjusted = r.total * (((_a = state.match.result_doubles) === null || _a === void 0 ? void 0 : _a[key]) ? 2 : 1); return fmtSigned(adjusted); }; return `<div class="score-scroll"><table class="score-table match-score-table"><thead><tr><th>Holes</th>${holes.map(h => `<th>${h}</th>`).join('')}<th class="nine-total-heading">Total</th></tr><tr><th>Index</th>${holes.map(h => { var _a; return `<th>${((_a = courseHole(h)) === null || _a === void 0 ? void 0 : _a.si) || ''}</th>`; }).join('')}<th class="nine-total-heading"></th></tr><tr><th>PAR</th>${holes.map(h => { var _a; return `<th>${((_a = courseHole(h)) === null || _a === void 0 ? void 0 : _a.par) || ''}</th>`; }).join('')}<th class="nine-total-heading">${holes.reduce((sum, h) => { var _a; return sum + Number(((_a = courseHole(h)) === null || _a === void 0 ? void 0 : _a.par) || 0); }, 0)}</th></tr></thead><tbody>${displayPlayers().map((p, pi) => `<tr class="player-row ${pi % 2 ? 'alt' : ''}"><td class="player-name">${esc(p.name)}${p.player_id === state.currentPlayer.player_id ? '<div class="you">YOU</div>' : `<div class="match-hcp">${matchHandicapLabel(state.currentPlayer.player_id, p.player_id)}</div>`}</td>${holes.map(h => `<td class="score-cell ${cellClass(state.currentPlayer.player_id, p.player_id, h)} ${(!state.viewingAsPlayer && ((p.player_id === state.currentPlayer.player_id) || state.isAdmin)) ? 'editable' : ''}" onclick="editScore('${p.player_id}',${h})">${scoreMarkup(p.player_id, h)}</td>`).join('')}<td class="nine-total-cell"><b>${segmentStrokes(p.player_id) || '–'}</b></td></tr>${p.player_id !== state.currentPlayer.player_id ? `<tr class="stroke-row ${pi % 2 ? 'alt' : ''}"><td class="match-status-label-cell">${mode} Result</td>${holes.map(h => { const raw = matchStatus(state.currentPlayer.player_id, p.player_id, h); const ms = matchStatusMarkup(raw); return `<td class="match-status-cell ${matchStatusClass(raw)}">${ms}</td>`; }).join('')}<td class="nine-result-cell ${resultTone(resultForPair(state.currentPlayer.player_id, p.player_id, mode).total)}"><b>${segmentResult(p.player_id)}</b></td></tr>` : ''}`).join('')}</tbody></table></div>${state.isAdmin ? '<div class="below-handicap-tools"><button class="link-btn" onclick="openMatchHandicap()">⚖ Edit Handicap</button></div>' : ''}${resultPanel()}`; }
const RESULT_TABLES = {
    1: { 'W': 4, 'S': 3, 'L': -1 },
    2: { 'WW': 5, 'WL': 2, 'WS': 4, 'LW': 3, 'LS': 2, 'LL': -1, 'SW': 5, 'SS': 3, 'SL': 1 },
    3: { 'WWW': 5, 'WWS': 5, 'WWL': 4, 'WLW': 4, 'WLL': 1, 'WLS': 2, 'WSW': 5, 'WSL': 2, 'WSS': 4, 'SWW': 5, 'SWL': 3, 'SWS': 5, 'SLW': 3, 'SLL': 1, 'SLS': 1, 'SSW': 5, 'SSL': 1, 'SSS': 3, 'LWW': 5, 'LWL': 1, 'LWS': 3, 'LLW': 2, 'LLL': -1, 'LLS': 2, 'LSW': 4, 'LSL': 1, 'LSS': 2 },
    4: {
        'WWWW': 5, 'WWWL': 5, 'WWWS': 5, 'WWLW': 5, 'WWLL': 2, 'WWLS': 4, 'WWSW': 5, 'WWSL': 4, 'WWSS': 5,
        'WLWW': 5, 'WLWL': 2, 'WLWS': 4, 'WLLW': 2, 'WLLL': 1, 'WLLS': 1, 'WLSW': 4, 'WLSL': 1, 'WLSS': 2,
        'WSWW': 5, 'WSWL': 4, 'WSWS': 5, 'WSLW': 4, 'WSLL': 1, 'WSLS': 2, 'WSSW': 5, 'WSSL': 2, 'WSSS': 4,
        'SWWW': 5, 'SWWL': 5, 'SWWS': 5, 'SWLW': 5, 'SWLL': 1, 'SWLS': 3, 'SWSW': 5, 'SWSL': 3, 'SWSS': 5,
        'SLWW': 5, 'SLWL': 1, 'SLWS': 3, 'SLLW': 1, 'SLLL': 1, 'SLLS': 1, 'SLSW': 3, 'SLSL': 1, 'SLSS': 1,
        'SSWW': 5, 'SSWL': 1, 'SSWS': 3, 'SSLW': 1, 'SSLL': 1, 'SSLS': 1, 'SSSW': 3, 'SSSL': 1, 'SSSS': 3,
        'LWWW': 5, 'LWWL': 3, 'LWWS': 5, 'LWLW': 3, 'LWLL': 1, 'LWLS': 1, 'LWSW': 5, 'LWSL': 1, 'LWSS': 3,
        'LSWW': 5, 'LSWL': 2, 'LSWS': 4, 'LSLW': 2, 'LSLL': 1, 'LSLS': 1, 'LSSW': 4, 'LSSL': 1, 'LSSS': 2,
        'LLWW': 4, 'LLWL': 1, 'LLWS': 2, 'LLLW': 2, 'LLLL': -1, 'LLLS': 2, 'LLSW': 3, 'LLSL': 1, 'LLSS': 2
    }
};
function pairHoleResults(aid, bid, mode) {
    const holes = mode === 'F9' ? Array.from({ length: 9 }, (_, i) => i + 1) : Array.from({ length: 9 }, (_, i) => i + 10);
    let margin = 0;
    const rows = [];
    for (const h of holes) {
        const a = Number(scoreFor(aid, h).score), b = Number(scoreFor(bid, h).score);
        let r = 'S';
        if (a && b)
            r = relative(aid, bid, h);
        if (r === 'W')
            margin++;
        else if (r === 'L')
            margin--;
        const remainingAfter = holes[holes.length - 1] - h;
        rows.push({ h, r, margin, remainingAfter });
    }
    return { holes, rows };
}
function resultForPair(aid, bid, mode) {
    var _a;
    // Before play starts, an empty scorecard must show zero rather than the
    // all-square settlement value (-1). Keep the existing settlement once scores exist.
    const holes = mode === 'F9' ? Array.from({ length: 9 }, (_, i) => i + 1) : Array.from({ length: 9 }, (_, i) => i + 10);
    const hasAnyPairScores = holes.some(h => {
        const a = Number(scoreFor(aid, h).score), b = Number(scoreFor(bid, h).score);
        return a > 0 && b > 0;
    });
    if (!hasAnyPairScores)
        return { game: 0, tommy: 0, buy: 0, bonus: 0, satay: 0, total: 0 };
    // Calculate each pair only from its own scores and directional handicap.
    const { holes: playedHoles, rows } = pairHoleResults(aid, bid, mode);
    const final = rows[rows.length - 1];
    const beforeFinal = rows.length > 1 ? rows[rows.length - 2].margin : 0;
    let decisionIndex = null;
    let startMargin = 0;
    let normalDecisionIndex = -1;
    for (let i = 1; i < rows.length; i++) {
        if (Math.abs(rows[i - 1].margin) > 0 && Math.abs(rows[i - 1].margin) === rows[i - 1].remainingAfter) {
            const prior = rows[i - 1].margin, result = rows[i].r;
            const nextStillToGo = Math.abs(rows[i].margin) > 0 && Math.abs(rows[i].margin) === rows[i].remainingAfter;
            const closes = (prior > 0 && result !== 'L') || (prior < 0 && result === 'W' && !nextStillToGo);
            if (closes) {
                normalDecisionIndex = i;
                break;
            }
        }
    }
    let ggIndex = -1, tommyBuyIndex = -1;
    for (let i = 0; i < rows.length - 1; i++) {
        if (ggIndex < 0 && Math.abs(rows[i].margin) > rows[i].remainingAfter)
            ggIndex = i;
        if (tommyBuyIndex < 0 && rows[i].margin !== 0 && Math.abs(rows[i].margin) === rows[i].remainingAfter)
            tommyBuyIndex = i;
    }
    // The first scoring path to trigger owns the rest of the 9-hole segment.
    // A Tommy/Buy trigger blocks GG later; an earlier GG blocks Tommy/Buy.
    const tommyBuyFirst = tommyBuyIndex >= 0 && (ggIndex < 0 || tommyBuyIndex < ggIndex);
    if (tommyBuyFirst)
        startMargin = rows[tommyBuyIndex].margin;
    for (let i = 0; i < rows.length; i++) {
        if (Math.abs(rows[i].margin) > rows[i].remainingAfter && !tommyBuyFirst) {
            decisionIndex = i;
            startMargin = i === 0 ? 0 : rows[i - 1].margin;
            break;
        }
    }
    let game = 0, tommy = 0, buy = 0, satay = 0;
    if (ggIndex >= 0 && ggIndex < rows.length - 1 && !tommyBuyFirst) {
        decisionIndex = ggIndex;
        const ggMargin = rows[decisionIndex].margin;
        game = ggMargin > 0 ? 3 : -3;
        tommy = 0;
        buy = 0;
        let postMargin = 0;
        for (let i = decisionIndex + 1; i < rows.length; i++) {
            if (rows[i].r === 'W')
                postMargin++;
            else if (rows[i].r === 'L')
                postMargin--;
        }
        satay = postMargin > 0 ? 2 : postMargin < 0 ? -2 : 0;
    }
    else if (tommyBuyFirst || decisionIndex !== null) {
        if (normalDecisionIndex >= 0)
            decisionIndex = normalDecisionIndex;
        else if (tommyBuyFirst && decisionIndex === null) {
            decisionIndex = rows.findIndex((row, i) => i > tommyBuyIndex && Math.abs(row.margin) > row.remainingAfter);
            if (decisionIndex < 0)
                decisionIndex = rows.length - 1;
            // The Tommy/Buy path starts from the recorded TO-GO margin, not from
            // a tied-game baseline; keep the original lookup-table scoring active.
            startMargin = rows[tommyBuyIndex].margin;
        }
        const finalMargin = final.margin;
        if (startMargin === 0) {
            // A tied game decided on the final hole: winner gets Game +/-3 and Tommy +/-1.
            // If the final hole is square, the Game result is a tie (0), not -1.
            if (finalMargin !== 0) {
                game = finalMargin > 0 ? 3 : finalMargin < 0 ? -3 : 0;
                tommy = 0;
                buy = 0;
            }
            else {
                game = 0;
                tommy = 0;
                buy = 0;
            }
        }
        else {
            // Look up the complete sequence from the initial X-UP / X-TO-GO state,
            // not merely the final holes after the game becomes mathematically decided.
            const lookupStartIndex = rows.findIndex((row, i) => i > 0 && Math.abs(rows[i - 1].margin) === rows.length - i);
            const tableStartIndex = lookupStartIndex >= 0 && lookupStartIndex <= decisionIndex
                ? lookupStartIndex : decisionIndex;
            const tableStartMargin = tableStartIndex > 0 ? rows[tableStartIndex - 1].margin : startMargin;
            const seq = rows.slice(tableStartIndex).map(x => x.r).join('');
            const absStart = Math.min(4, Math.max(1, Math.abs(tableStartMargin)));
            const table = RESULT_TABLES[absStart];
            let total;
            if (tableStartMargin > 0) {
                total = table === null || table === void 0 ? void 0 : table[seq];
            }
            else {
                const mirrored = seq.replace(/[WL]/g, c => c === 'W' ? 'L' : c === 'L' ? 'W' : 'S');
                const mirroredTotal = table === null || table === void 0 ? void 0 : table[mirrored];
                total = mirroredTotal == null ? undefined : -mirroredTotal;
            }
            if (total == null) {
                // Fallback only for incomplete/unsupported sequences; preserve the pair's final state.
                total = finalMargin > 0 ? 4 : finalMargin < 0 ? -4 : -1;
            }
            game = finalMargin > 0 ? 3 : finalMargin < 0 ? -3 : 0;
            let bmargin = 0;
            // Buy begins on the hole AFTER the hole where Game is decided.
            for (let i = decisionIndex + 1; i < rows.length; i++) {
                if (rows[i].r === 'W')
                    bmargin++;
                else if (rows[i].r === 'L')
                    bmargin--;
            }
            buy = bmargin > 0 ? 1 : bmargin < 0 ? -1 : 0;
            tommy = total - game - buy;
        }
    }
    else if (Math.abs(beforeFinal) === 1) {
        // 1UP/1TOGO table; mirror it when this pair is one down before the final hole.
        const last = final.r;
        let total;
        if (beforeFinal > 0)
            total = RESULT_TABLES[1][last];
        else {
            const mirrored = last === 'W' ? 'L' : last === 'L' ? 'W' : 'S';
            total = -RESULT_TABLES[1][mirrored];
        }
        game = final.margin > 0 ? 3 : final.margin < 0 ? -3 : 0;
        tommy = total - game;
        buy = 0;
    }
    else if (beforeFinal === 0 && final.margin !== 0) {
        // The final hole alone decides a previously square match.
        game = final.margin > 0 ? 3 : -3;
        tommy = 0;
        buy = 0;
    }
    else {
        // No decisive winner and the match finishes square: Game is tied (0).
        game = 0;
        tommy = 0;
        buy = 0;
    }
    // Preserve the confirmed B9 fixed lookup case: 3DW/3GO at hole 15,
    // followed by square holes 16-18, remains on the Tommy/Buy path.
    if (mode === 'B9' && tommyBuyFirst && ((_a = rows[5]) === null || _a === void 0 ? void 0 : _a.h) === 15 && rows[5].margin === -3 &&
        rows.slice(6).every(x => x.r === 'S')) {
        game = -3;
        tommy = 1;
        buy = 0;
        satay = 0;
    }
    const bonus = bonusBreakdown(aid, mode).bonus - bonusBreakdown(bid, mode).bonus;
    return { game, tommy, buy, bonus, satay, total: game + tommy + buy + bonus + satay };
}
function resultForOpponent(pid, mode) { const me = state.currentPlayer.player_id; return resultForPair(me, pid, mode); }
function resultPairKey(mode, a, b) { return `${mode}|${[String(a), String(b)].sort().join('|')}`; }
async function toggleResultDouble(mode, a, b, checked) { if (!state.isAdmin)
    return; const key = resultPairKey(mode, a, b); const next = Object.assign({}, (state.match.result_doubles || {})); if (checked)
    next[key] = true;
else
    delete next[key]; state.match.result_doubles = next; render(); try {
    const r = await post({ action: 'saveResultDouble', match_id: state.match.match_id, admin: state.currentPlayer.name, mode, p1: a, p2: b, checked });
    if (!r.success)
        throw new Error(r.error || 'Save failed');
    showToast('Double saved');
}
catch (e) {
    if (checked)
        delete next[key];
    else
        next[key] = true;
    state.match.result_doubles = next;
    render();
    alert('Could not save DB setting: ' + (e.message || e));
} }
function resultPanel() {
    const mode = state.currentMode === 'B9' ? 'B9' : 'F9';
    const pairs = [];
    if (state.isAdmin) {
        // Creator/admin can review every head-to-head result.
        for (let i = 0; i < state.players.length; i++)
            for (let j = i + 1; j < state.players.length; j++) {
                const a = state.players[i], b = state.players[j];
                const r = resultForPair(a.player_id, b.player_id, mode);
                const f9 = resultForPair(a.player_id, b.player_id, 'F9').total;
                const b9 = resultForPair(a.player_id, b.player_id, 'B9').total;
                pairs.push({ label: `${a.name} v ${b.name}`, r, f9, b9, a: a.player_id, b: b.player_id });
            }
    }
    else {
        // Non-admin players can only see their own matchups, calculated from their perspective.
        const me = state.currentPlayer;
        if (me)
            for (const opponent of state.players) {
                if (opponent.player_id === me.player_id)
                    continue;
                const r = resultForPair(me.player_id, opponent.player_id, mode);
                const f9 = resultForPair(me.player_id, opponent.player_id, 'F9').total;
                const b9 = resultForPair(me.player_id, opponent.player_id, 'B9').total;
                pairs.push({ label: `${me.name} v ${opponent.name}`, r, f9, b9, a: me.player_id, b: opponent.player_id });
            }
    }
    return `<div class="result-card"><div class="result-title">${mode === 'F9' ? 'Front 9 Result' : 'Back 9 Result'}</div><div class="result-scroll"><table class="result-table"><thead><tr><th>Opponent</th><th class="db-heading">DB</th><th>Game</th><th>Tommy</th><th>Buy</th><th>Fin</th><th>Satay</th><th>F9</th><th>B9</th><th class="grand-total-heading">Total</th></tr></thead><tbody>${pairs.map(x => { var _a, _b; const r = x.r; const key = resultPairKey(mode, x.a, x.b); const doubled = !!((_a = state.match.result_doubles) === null || _a === void 0 ? void 0 : _a[key]); const segment = mode === 'F9' ? Number(x.f9) : Number(x.b9); const adjusted = segment * (doubled ? 2 : 1); const otherMode = mode === 'F9' ? 'B9' : 'F9'; const otherKey = resultPairKey(otherMode, x.a, x.b); const otherDoubled = !!((_b = state.match.result_doubles) === null || _b === void 0 ? void 0 : _b[otherKey]); const f9Doubled = mode === 'F9' ? doubled : otherDoubled; const b9Doubled = mode === 'B9' ? doubled : otherDoubled; const displayF9 = Number(x.f9) * (f9Doubled ? 2 : 1); const displayB9 = Number(x.b9) * (b9Doubled ? 2 : 1); const adjustedTotal = displayF9 + displayB9; const mark = state.isAdmin ? `<label class="db-check"><input type="checkbox" ${doubled ? 'checked' : ''} onchange="toggleResultDouble('${mode}','${x.a}','${x.b}',this.checked)"></label>` : (doubled ? '<b class="db-mark">DB</b>' : '<span class="db-empty">–</span>'); return `<tr><td>${esc(x.label)}</td><td class="db-toggle-cell">${mark}</td><td>${fmtSigned(r.game)}</td><td>${fmtSigned(r.tommy)}</td><td>${fmtSigned(r.buy)}</td><td>${fmtSigned(r.bonus)}</td><td>${fmtSigned(r.satay || 0)}</td><td class="segment-total ${resultTone(displayF9)}"><b>${fmtSigned(displayF9)}</b></td><td class="segment-total ${resultTone(displayB9)}"><b>${fmtSigned(displayB9)}</b></td><td class="grand-total-cell"><b class="grand-total ${resultTone(adjustedTotal)}">${fmtSigned(adjustedTotal)}</b></td></tr>`; }).join('')}</tbody></table></div></div>`;
}
function bonusBreakdown(pid, mode) { const holes = mode === 'F9' ? Array.from({ length: 9 }, (_, i) => i + 1) : Array.from({ length: 9 }, (_, i) => i + 10); const data = { double3: 0, double5: 0, birdie: 0, eagle: 0, hio: 0, bonus: 0 }; const rows = holes.map(h => { var _a; const score = Number(scoreFor(pid, h).score); const par = Number(((_a = courseHole(h)) === null || _a === void 0 ? void 0 : _a.par) || 0); return { score, par }; }); const par3 = rows.filter(x => x.par === 3); const par5 = rows.filter(x => x.par === 5); if (par3.length === 2 && par3.every(x => x.score > 0 && x.score <= x.par))
    data.double3 = 1; if (par5.length === 2 && par5.every(x => x.score > 0 && x.score <= x.par))
    data.double5 = 1; rows.forEach(x => { if (!x.score || !x.par)
    return; if (x.par === 3 && x.score === 1) {
    data.hio += 12;
    return;
} if (x.score <= x.par - 2) {
    data.eagle += 6;
    return;
} if (x.score === x.par - 1)
    data.birdie += 1; }); data.bonus = data.double3 + data.double5 + data.birdie + data.eagle + data.hio; return data; }
function fmtSigned(n) { return n > 0 ? `+${n}` : String(n); }
function resultTone(n) { return Number(n) > 0 ? 'result-win' : Number(n) < 0 ? 'result-loss' : 'result-even'; }
function resultInlineStyle(n) { return Number(n) > 0 ? 'color:#145bd7!important' : Number(n) < 0 ? 'color:#d52d2d!important' : 'color:#18251f!important'; }
function pairBaccaratTotal(aid, bid) {
    // P&L must follow the saved Baccarat participation list. A non-participant
    // must not generate a Baccarat transfer against anyone.
    const a = state.players.find(p => p.player_id === aid), b = state.players.find(p => p.player_id === bid);
    if (!a || !b || !baccaratEnabledValue(a.baccarat_enabled) || !baccaratEnabledValue(b.baccarat_enabled))
        return 0;
    let total = 0;
    for (let h = 1; h <= 18; h++) {
        const pair = baccaratPairPoints(aid, bid, h);
        total += pair.a;
    }
    return total;
}
function pairGameTotal(aid, bid) { var _a, _b; const f9 = resultForPair(aid, bid, 'F9').total; const b9 = resultForPair(aid, bid, 'B9').total; const fKey = resultPairKey('F9', aid, bid), bKey = resultPairKey('B9', aid, bid); return f9 * (((_a = state.match.result_doubles) === null || _a === void 0 ? void 0 : _a[fKey]) ? 2 : 1) + b9 * (((_b = state.match.result_doubles) === null || _b === void 0 ? void 0 : _b[bKey]) ? 2 : 1); }
function pnlView() {
    var _a, _b;
    const gm = Number((_a = state.gameMultiplier) !== null && _a !== void 0 ? _a : 10), bm = Number((_b = state.baccaratMultiplier) !== null && _b !== void 0 ? _b : 5), me = state.currentPlayer;
    const money = n => `${Number(n) > 0 ? '+' : ''}${Number(n)}`;
    const playerRows = state.isAdmin ? state.players : [me].filter(Boolean);
    const opponents = state.isAdmin ? state.players : state.players.filter(p => p.player_id !== (me === null || me === void 0 ? void 0 : me.player_id));
    const gameAmount = (a, b) => pairGameTotal(a.player_id, b.player_id) * gm;
    const baccaratAmount = (a, b) => pairBaccaratTotal(a.player_id, b.player_id) * bm;
    const playerTotal = a => opponents.filter(b => b.player_id !== a.player_id).reduce((sum, b) => sum + gameAmount(a, b), 0) + opponents.filter(b => b.player_id !== a.player_id).reduce((sum, b) => sum + baccaratAmount(a, b), 0);
    const settings = state.isAdmin ? `<div class="pnl-settings"><strong>Multiplier Settings <small>(Creator only)</small></strong><div class="pnl-multipliers"><label>Game multiplier <input id="pnlGameMultiplier" type="number" min="0" step="1" value="${gm}"></label><label>Baccarat multiplier <input id="pnlBaccaratMultiplier" type="number" min="0" step="1" value="${bm}"></label><button class="primary pnl-save" onclick="savePnlSettings()">Save</button></div></div>` : `<div class="pnl-multipliers read-only"><label>Game multiplier <input type="number" value="${gm}" disabled></label><label>Baccarat multiplier <input type="number" value="${bm}" disabled></label></div>`;
    let body = '';
    if (state.isAdmin) {
        const head = `<tr><th>Player</th>${opponents.map(p => `<th>vs ${esc(p.name)}</th>`).join('')}<th>Baccarat</th><th class="pnl-net-head">NET TOTAL</th></tr>`;
        let mobileBody = '';
        body = state.players.map(a => {
            let gameSum = 0, bacSum = 0;
            const cells = opponents.map(b => {
                if (a.player_id === b.player_id)
                    return '<td class="pnl-zero">—</td>';
                const v = gameAmount(a, b);
                gameSum += v;
                return `<td class="${resultTone(v)}" style="${resultInlineStyle(v)}"><b style="${resultInlineStyle(v)}">${money(v)}</b></td>`;
            }).join('');
            const pairRows = opponents.filter(b => a.player_id !== b.player_id).map(b => {
                const v = gameAmount(a, b);
                return `<div class="pnl-mobile-line"><span>${esc(b.name)}</span><strong class="${resultTone(v)}" style="${resultInlineStyle(v)}">${money(v)}</strong></div>`;
            }).join('');
            for (const b of opponents)
                if (a.player_id !== b.player_id)
                    bacSum += baccaratAmount(a, b);
            const net = gameSum + bacSum;
            mobileBody += `<article class="pnl-mobile-player"><h4>${esc(a.name)}</h4>${pairRows}<div class="pnl-mobile-line"><span>Baccarat</span><strong class="${resultTone(bacSum)}">${money(bacSum)}</strong></div><div class="pnl-mobile-line pnl-mobile-net"><span>NET TOTAL</span><strong class="${resultTone(net)}">${money(net)}</strong></div></article>`;
            return `<tr><th>${esc(a.name)}</th>${cells}<td class="${resultTone(bacSum)}" style="${resultInlineStyle(bacSum)}"><b style="${resultInlineStyle(bacSum)}">${money(bacSum)}</b></td><td class="pnl-net ${resultTone(net)}" style="${resultInlineStyle(net)}"><b style="${resultInlineStyle(net)}">${money(net)}</b></td></tr>`;
        }).join('');
        return `<section class="pnl-page"><div class="pnl-heading"><h2>P&amp;L <span>(Total Win / Loss)</span></h2></div>${settings}<div class="pnl-table-wrap"><h3>All Players' P&amp;L <small>(Creator view)</small></h3><div class="pnl-scroll pnl-desktop-only"><table class="pnl-table"><thead>${head}</thead><tbody>${body}</tbody></table></div><div class="pnl-mobile-list">${mobileBody}</div></div><div class="pnl-help"><h3>Calculation</h3><p>Game = (F9 Total + B9 Total after each DB multiplier) × Game multiplier.</p><p>Baccarat = sum of this player's pairwise Baccarat points × Baccarat multiplier.</p><p>NET TOTAL = Game amounts + Baccarat amount. Players can only view their own P&amp;L.</p></div>${state.isAdmin && !state.viewingAsPlayer ? `<div class="join-entry-management"><h3>Join Game Entry Management</h3><p>Game ID: <strong>${esc(state.match.match_id)}</strong></p><button class="danger-outline" onclick="confirmRemoveJoinEntry()">Remove Join Game Entry</button><button class="danger-outline delete-old-data-btn" onclick="confirmDeleteOldData()">Delete Expired Data (3+ Days)</button><p class="delete-data-warning">Deletes match records older than 3 days, including linked players, scores, handicaps and Join Game entries. <strong>COURSES are permanent and will never be deleted.</strong></p></div>` : ''}</section>`;
    }
    const a = me;
    if (!a)
        return '<div class="notice">Player not found.</div>';
    let gameSum = 0, bacSum = 0;
    const rows = opponents.map(b => { const g = gameAmount(a, b), bac = baccaratAmount(a, b); gameSum += g; bacSum += bac; return `<tr><td>${esc(b.name)}</td><td class="${resultTone(g)}" style="${resultInlineStyle(g)}"><b style="${resultInlineStyle(g)}">${money(g)}</b></td></tr>`; }).join('');
    const net = gameSum + bacSum;
    return `<section class="pnl-page"><div class="pnl-heading"><h2>P&amp;L <span>(Total Win / Loss)</span></h2></div>${settings}<div class="pnl-table-wrap"><h3>Player: <strong>${esc(a.name)}</strong></h3><table class="pnl-table pnl-own"><thead><tr><th>Opponent</th><th>Amount</th></tr></thead><tbody>${rows}<tr><td>Baccarat</td><td class="${resultTone(bacSum)}" style="${resultInlineStyle(bacSum)}"><b style="${resultInlineStyle(bacSum)}">${money(bacSum)}</b></td></tr><tr class="pnl-net-row"><th>NET TOTAL</th><td class="pnl-net ${resultTone(net)}" style="${resultInlineStyle(net)}"><b style="${resultInlineStyle(net)}">${money(net)}</b></td></tr></tbody></table></div><div class="pnl-help"><h3>Calculation</h3><p>Game = (F9 Total + B9 Total after each DB multiplier) × Game multiplier.</p><p>Baccarat = sum of this player's pairwise Baccarat points × Baccarat multiplier.</p><p>You can view only your own P&amp;L. Multipliers are controlled by the creator.</p></div></section>`;
}
async function confirmRemoveJoinEntry() { if (!state.isAdmin)
    return; if (!confirm('Remove Join Game Entry?\n\nOther players will no longer see this game in Join Game. The match, scores and course data will remain.'))
    return; const btn = document.querySelector('.join-entry-management button'); if (btn) {
    btn.disabled = true;
    btn.textContent = 'Removing…';
} try {
    const r = await post({ action: 'removeJoinEntry', match_id: state.match.match_id, admin: state.currentPlayer.name });
    if (!r.success)
        throw new Error(r.error || 'Remove failed');
    showToast('Join Game entry removed');
    render();
}
catch (e) {
    alert('Could not remove entry: ' + (e.message || e));
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Remove Join Game Entry';
    }
} }
async function confirmDeleteOldData() { if (!state.isAdmin || state.viewingAsPlayer)
    return; const message = 'DELETE OLD MATCH DATA?\n\nThis permanently deletes match records older than 3 days, including linked players, scores, handicaps and Join Game entries.\n\nIMPORTANT: COURSES and all saved course PAR / Index data are permanent and will NOT be deleted.\n\nContinue?'; if (!confirm(message))
    return; const btn = document.querySelector('.delete-old-data-btn'); if (btn) {
    btn.disabled = true;
    btn.textContent = 'Deleting…';
} try {
    const r = await post({ action: 'deleteRecordsOlderThan3Days', match_id: state.match.match_id, admin: state.currentPlayer.name });
    if (!r.success)
        throw new Error(r.error || 'Delete failed');
    alert('Manual cleanup completed.\nOld matches deleted: ' + Number(r.deleted_matches || 0) + '\nPlayers deleted: ' + Number(r.deleted_players || 0) + '\nScores deleted: ' + Number(r.deleted_scores || 0) + '\nHandicaps deleted: ' + Number(r.deleted_handicaps || 0) + '\nJoin Game entries deleted: ' + Number(r.deleted_join_entries || 0) + '\n\nCOURSES were not changed.');
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Delete Expired Data (3+ Days)';
    }
    render();
}
catch (e) {
    alert('Could not delete old data: ' + (e.message || e));
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Delete Expired Data (3+ Days)';
    }
} }
async function savePnlSettings() { var _a, _b; if (!state.isAdmin)
    return; const gm = Number((_a = document.getElementById('pnlGameMultiplier')) === null || _a === void 0 ? void 0 : _a.value), bm = Number((_b = document.getElementById('pnlBaccaratMultiplier')) === null || _b === void 0 ? void 0 : _b.value); if (!Number.isFinite(gm) || gm < 0 || !Number.isFinite(bm) || bm < 0) {
    alert('Multipliers must be zero or greater.');
    return;
} const btn = document.querySelector('.pnl-save'); if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving…';
} try {
    const r = await post({ action: 'savePnlSettings', match_id: state.match.match_id, admin: state.currentPlayer.name, game_multiplier: gm, baccarat_multiplier: bm });
    if (!r.success)
        throw new Error(r.error || 'Save failed');
    state.gameMultiplier = gm;
    state.baccaratMultiplier = bm;
    state.match.pnl_settings = { game_multiplier: gm, baccarat_multiplier: bm };
    render();
    showToast('P&L multipliers saved');
}
catch (e) {
    alert('Could not save P&L settings: ' + (e.message || e));
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Save';
    }
} }
function baccaratTable() {
    const holes = Array.from({ length: 18 }, (_, i) => i + 1);
    const ordered = displayPlayers();
    const pointCell = (p, h) => {
        const value = baccaratPoints(p.player_id, h);
        const up = !!scoreFor(p.player_id, h).up;
        const editable = state.isAdmin || p.player_id === state.currentPlayer.player_id;
        return `<td class="baccarat-point ${editable ? 'editable' : ''}" onclick="editScore('${p.player_id}',${h})"><span class="${value === 0 ? 'zero-point' : value > 0 ? 'point-positive' : 'point-negative'} ${up ? 'baccarat-up-circle' : ''}">${value === 0 ? '0' : fmtSigned(value)}</span></td>`;
    };
    const rows = holes.map(h => `<tr><th scope="row" class="baccarat-hole-label">${h}</th>${ordered.map(p => pointCell(p, h)).join('')}</tr>`).join('');
    const totals = ordered.map(p => `<td class="baccarat-total"><b>${fmtSigned(holes.reduce((sum, h) => sum + baccaratPoints(p.player_id, h), 0))}</b></td>`).join('');
    return `<div class="score-scroll baccarat-scroll baccarat-vertical-scroll"><table class="score-table baccarat-table baccarat-vertical-table"><thead><tr><th>Holes</th>${ordered.map(p => `<th>${esc(p.name)}${p.player_id === state.currentPlayer.player_id ? '<div class="you">YOU</div>' : ''}</th>`).join('')}</tr></thead><tbody>${rows}<tr class="baccarat-vertical-total"><th scope="row">Total</th>${totals}</tr></tbody></table></div><div class="baccarat-note">A red circle marks a player's UP call. Points are calculated pair-by-pair after handicap strokes.</div>`;
}
function baccaratStrokeValueForHole(a, b, hole) {
    var _a;
    const hc = getPairHandicap(a, b);
    if (!hc)
        return 0;
    const candidates = (((_a = state.course) === null || _a === void 0 ? void 0 : _a.holes) || []).slice().sort((x, y) => Number(x.si) - Number(y.si));
    const abs = Math.abs(hc), full = Math.floor(abs), half = abs - full;
    const idx = candidates.findIndex(x => Number(x.hole) === Number(hole));
    if (idx < 0 || idx >= full + (half ? 1 : 0))
        return 0;
    return (hc < 0 ? -1 : 1) * (idx < full ? 1 : 0.5);
}
function baccaratPairPoints(a, b, hole) {
    var _a;
    const recA = scoreFor(a, hole), recB = scoreFor(b, hole);
    const sa = Number(recA.score), sb = Number(recB.score);
    if (!sa || !sb)
        return { a: 0, b: 0, result: 'S' };
    const par = Number(((_a = courseHole(hole)) === null || _a === void 0 ? void 0 : _a.par) || 4);
    const adjA = sa - baccaratStrokeValueForHole(a, b, hole);
    const adjB = sb;
    if (adjA === adjB)
        return { a: 0, b: 0, result: 'S' };
    const winner = adjA < adjB ? a : b, loser = winner === a ? b : a;
    const winRec = winner === a ? recA : recB;
    const loseRec = loser === a ? recA : recB;
    const winScore = Number(winRec.score);
    // Base multiplier follows the winner's gross score. HIO uses ×16 and still applies UP multipliers.
    let scoreMultiplier = 1;
    if (par === 3 && winScore === 1)
        scoreMultiplier = 16;
    else if (winScore <= par - 3)
        scoreMultiplier = 8; // Albatross or better
    else if (winScore <= par - 2)
        scoreMultiplier = 4; // Eagle
    else if (winScore === par - 1)
        scoreMultiplier = 2; // Birdie
    const winnerUp = !!winRec.up;
    const loserUp = !!loseRec.up;
    const upMultiplier = winnerUp && loserUp ? 4 : (winnerUp || loserUp ? 2 : 1);
    const points = scoreMultiplier * upMultiplier;
    return winner === a ? { a: points, b: -points, result: 'W' } : { a: -points, b: points, result: 'L' };
}
function baccaratPoints(pid, hole) {
    // A player who opted out of Baccarat must not earn or lose Baccarat points.
    // Check both the row owner and each opponent, since the UI still lists all match players.
    const owner = state.players.find(p => p.player_id === pid);
    const isEnabled = p => !!p && baccaratEnabledValue(p.baccarat_enabled);
    if (!isEnabled(owner))
        return 0;
    let total = 0;
    for (const p of state.players) {
        if (p.player_id === pid || !isEnabled(p))
            continue;
        const pair = baccaratPairPoints(pid, p.player_id, hole);
        total += pair.a;
    }
    return total;
}
function setMode(m) { state.currentMode = m; if (m === 'B9')
    state.currentHole = 10;
else if (m === 'F9')
    state.currentHole = 1; render(); }
function prevHole() { state.currentHole = Math.max(state.currentMode === 'B9' ? 10 : 1, state.currentHole - 1); render(); }
function nextHole() { const max = state.currentMode === 'F9' ? 9 : 18; state.currentHole = Math.min(max, state.currentHole + 1); render(); }
function editScore(pid, hole) { if (state.viewingAsPlayer)
    return; if (pid !== state.currentPlayer.player_id && !state.isAdmin)
    return; if (state.isAdmin) {
    state.editingHole = hole;
    state.editingScores = state.players.map(p => { const rec = scoreFor(p.player_id, hole); return { pid: p.player_id, name: p.name, score: scoreInputValue(rec.score, hole), up: !!rec.up }; });
    state.editingScore = null;
    render();
}
else {
    const rec = scoreFor(pid, hole);
    state.editingScore = { pid, hole, score: scoreInputValue(rec.score, hole), up: !!rec.up };
    render();
} }
function scoreEditor() { var _a, _b; const e = state.editingScore; const par = Number(((_a = courseHole(e.hole)) === null || _a === void 0 ? void 0 : _a.par) || 4); return `<div class="score-editor"><div class="editor-panel"><div class="editor-title">Edit Score</div><div class="editor-sub">${esc(((_b = state.players.find(p => p.player_id === e.pid)) === null || _b === void 0 ? void 0 : _b.name) || '')} · Hole ${e.hole} · PAR ${par} · Relative to PAR</div><div class="score-picker">${scoreInputOptions(e.hole, e.score)}</div><label class="up-row"><input id="editUp" type="checkbox" ${e.up ? 'checked' : ''}> UP</label><div class="editor-actions"><button class="cancel-score" onclick="cancelEdit()">Cancel</button><button class="save-score" onclick="saveEditedScore()">Save</button></div></div></div>`; }
function bulkScoreEditor() { var _a; const hole = state.editingHole; const rows = state.editingScores || []; const par = Number(((_a = courseHole(hole)) === null || _a === void 0 ? void 0 : _a.par) || 4); return `<div class="score-editor"><div class="editor-panel bulk-editor"><div class="editor-title">Admin · Hole ${hole}</div><div class="editor-sub">PAR ${par} · Enter relative-to-PAR scores and UP.</div><div class="bulk-list">${rows.map((r, i) => `<div class="bulk-row"><div class="bulk-name">${esc(r.name)}</div><div class="bulk-score">${bulkScoreInputOptions(i, hole, r.score)}</div><label class="bulk-up"><input type="checkbox" ${r.up ? 'checked' : ''} onchange="pickBulkUp(${i},this.checked)"> UP</label></div>`).join('')}</div><div class="editor-actions"><button class="cancel-score" onclick="cancelBulkEdit()">Cancel</button><button class="save-score" onclick="saveBulkScores()">Save All</button></div></div></div>`; }
function pickScore(n) { state.editingScore.score = n; render(); }
function cancelEdit() { state.editingScore = null; render(); }
function pickBulkScore(i, n) { state.editingScores[i].score = n; render(); }
function pickBulkUp(i, v) { state.editingScores[i].up = v; }
async function saveEditedScore() { if (state.savingScore)
    return; const e = state.editingScore; if (!e)
    return; const up = document.getElementById('editUp').checked; const gross = grossScoreValue(e.score, e.hole); state.savingScore = true; const btn = document.querySelector('.save-score'); if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving…';
} try {
    const r = await post({ action: 'saveScore', match_id: state.match.match_id, hole: e.hole, player_id: e.pid, score: gross, up, submitted_by: state.currentPlayer.player_id });
    if (!r.success) {
        alert(r.error || 'Save failed. Please try again.');
        return;
    }
    const old = state.scores.find(s => s.player_id === e.pid && Number(s.hole) === e.hole);
    if (old) {
        old.score = gross;
        old.up = up;
    }
    else {
        const added = { player_id: e.pid, hole: e.hole, score: gross, up };
        state.scores.push(added);
    }
    state.scoreMap[`${e.pid}|${e.hole}`] = state.scores.find(x => x.player_id === e.pid && Number(x.hole) === Number(e.hole));
    state.editingScore = null;
    render();
}
catch (err) {
    alert(err.message || 'Network error. Your score was not confirmed saved.');
}
finally {
    state.savingScore = false;
} }
async function saveBulkScores() { const rows = state.editingScores || []; if (rows.some(r => r.score === '' || r.score === null || r.score === undefined)) {
    alert('Enter a score for every player.');
    return;
} const payload = rows.map(x => ({ player_id: x.pid, score: grossScoreValue(x.score, state.editingHole), up: !!x.up })); let r = await post({ action: 'saveScoresBatch', match_id: state.match.match_id, hole: state.editingHole, scores: payload, submitted_by: state.currentPlayer.player_id }); if (!r.success && String(r.error || '').includes('Unknown action: saveScoresBatch')) {
    const results = await Promise.all(payload.map(x => post({ action: 'saveScore', match_id: state.match.match_id, hole: state.editingHole, player_id: x.player_id, score: x.score, up: x.up, submitted_by: state.currentPlayer.player_id })));
    const bad = results.find(x => !x.success);
    if (bad)
        r = bad;
    else
        r = { success: true };
} if (!r.success) {
    alert(r.error || 'Save failed');
    return;
} payload.forEach(x => { const old = state.scores.find(s => s.player_id === x.player_id && Number(s.hole) === state.editingHole); if (old) {
    old.score = Number(x.score);
    old.up = !!x.up;
}
else {
    const added = { player_id: x.player_id, hole: state.editingHole, score: Number(x.score), up: !!x.up };
    state.scores.push(added);
} state.scoreMap[`${x.player_id}|${state.editingHole}`] = state.scores.find(s => s.player_id === x.player_id && Number(s.hole) === Number(state.editingHole)); }); state.editingScores = null; state.editingHole = null; render(); }
function cancelBulkEdit() { state.editingScores = null; state.editingHole = null; render(); }
function qrModal() { return `<div class="handicap-modal" onclick="if(event.target===this)state.qr=false,render()"><div class="handicap-panel" style="text-align:center"><div class="modal-top"><div class="section-title">Join Game</div><button class="close" onclick="state.qr=false;render()">×</button></div><div style="width:220px;height:220px;margin:20px auto;background:repeating-linear-gradient(45deg,#111 0 4px,#fff 4px 8px);border:14px solid #fff;box-shadow:0 0 0 1px #ddd"></div><div style="font-size:24px;font-weight:900">${esc(state.match.match_id)}</div><div class="help">Scan this QR code to join the game</div><div class="notice">Players ${state.players.length} · Joined ${state.players.length} / ${state.match.player_count}</div></div></div>`; }
function openPlayerViewPicker() { if (!state.isAdmin || state.viewingAsPlayer)
    return; state.playerViewModal = true; render(); }
function closePlayerViewPicker() { state.playerViewModal = false; render(); }
function startViewingPlayer(playerId) { if (!state.isAdmin || state.viewingAsPlayer)
    return; const player = state.players.find(p => String(p.player_id) === String(playerId)); if (!player)
    return; if (String(player.player_id) === String(state.adminPlayerId)) {
    state.playerViewModal = false;
    render();
    return;
} state.playerViewModal = false; state.viewingAsPlayer = true; state.currentPlayer = player; state.isAdmin = false; state.editingScore = null; state.editingScores = null; state.editingHole = null; state.qr = false; render(); }
function switchHeaderPlayer(playerId) {
    if (!state.adminPlayerId) return;
    const player = state.players.find(p => String(p.player_id) === String(playerId));
    if (!player) return;
    const isAdminPlayer = String(player.player_id) === String(state.adminPlayerId);
    state.currentPlayer = player;
    state.isAdmin = isAdminPlayer;
    state.viewingAsPlayer = !isAdminPlayer;
    state.playerViewModal = false;
    state.editingScore = null;
    state.editingScores = null;
    state.editingHole = null;
    state.qr = false;
    render();
}
function returnAdminView() { if (!state.viewingAsPlayer)
    return; const admin = state.players.find(p => String(p.player_id) === String(state.adminPlayerId)) || state.players.find(p => { var _a; return String(p.name).toLowerCase() === String(((_a = state.match) === null || _a === void 0 ? void 0 : _a.admin) || '').toLowerCase(); }); state.currentPlayer = admin || state.currentPlayer; state.isAdmin = !!admin; state.viewingAsPlayer = false; state.playerViewModal = false; state.editingScore = null; state.editingScores = null; state.editingHole = null; render(); }
function playerViewPickerModal() { if (!state.isAdmin || !state.playerViewModal)
    return ''; return `<div class="player-view-overlay" onclick="if(event.target===this)closePlayerViewPicker()"><section class="player-view-dialog" role="dialog" aria-modal="true" aria-label="View as player"><div class="player-view-dialog-head"><div><h2>View as Player</h2><p>Read-only preview · no scores can be changed</p></div><button class="player-view-close" onclick="closePlayerViewPicker()" aria-label="Close">×</button></div><div class="player-view-list">${state.players.map(p => `<button class="player-view-option ${String(p.player_id) === String(state.adminPlayerId) ? 'admin-player' : ''}" onclick="startViewingPlayer('${String(p.player_id).replace(/['\\]/g, '')}')"><span class="player-view-avatar">${esc((p.name || '?').slice(0, 1).toUpperCase())}</span><span class="player-view-name">${esc(p.name)}${String(p.player_id) === String(state.adminPlayerId) ? '<small>Admin / current view</small>' : ''}</span><span class="player-view-arrow">›</span></button>`).join('')}</div><div class="player-view-note">Viewing a player changes only what you see. It does not change login identity or match data.</div></section></div>`; }
function openQR() { state.qr = true; render(); }
function newCoursePrompt() { state.courseDraft = { course_id: '', course_name: '', holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 4, si: i + 1 })) }; state.view = 'courseEditor'; render(); }
function editCourse(id) { const c = state.courses.find(x => x.course_id === id); if (!c)
    return; state.courseDraft = { course_id: c.course_id, course_name: c.course_name, holes: c.holes.map(h => (Object.assign({}, h))) }; state.view = 'courseEditor'; render(); }
async function saveCourse() { if (state.savingCourse)
    return; const name = $('courseName').value.trim(), err = $('course-error'); err.innerHTML = ''; if (!name) {
    err.innerHTML = '<div class="error">Enter a course name.</div>';
    return;
} const pars = [...document.querySelectorAll('.course-par')].map(x => Number(x.value)); const sis = [...document.querySelectorAll('.course-si')].map(x => Number(x.value)); if (pars.length !== 18 || sis.length !== 18 || new Set(sis).size !== 18) {
    err.innerHTML = '<div class="error">Please set a unique SI from 1 to 18 for all holes.</div>';
    return;
} const holes = pars.map((par, i) => ({ hole: i + 1, par, si: sis[i] })); const payload = { action: state.courseDraft.course_id ? 'updateCourse' : 'createCourse', course_id: state.courseDraft.course_id, course_name: name, holes }; const btn = document.querySelector('.course-editor .start'); state.savingCourse = true; if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving…';
} try {
    const r = await post(payload);
    if (!r.success) {
        err.innerHTML = `<div class="error">${esc(r.error || 'Unable to save course.')}</div>`;
        return;
    }
    const fresh = await get('getCourses');
    if (fresh.success)
        state.courses = fresh.courses || [];
    state.view = 'courses';
    render();
    showToast(state.courseDraft.course_id ? 'Course updated' : 'Course added');
}
catch (e) {
    err.innerHTML = `<div class="error">${esc(e.message || 'Network error. Please try again.')}</div>`;
}
finally {
    state.savingCourse = false;
    const b = document.querySelector('.course-editor .start');
    if (b) {
        b.disabled = false;
        b.textContent = 'Save Course';
    }
} }
/* v96: Garmin-style loading feedback for save/join actions. No game logic changed. */
(function installGarminLoading() {
    let loadingDepth = 0, activeLabel = 'Please wait…';
    function ensureLoading() {
        let el = document.getElementById('garmin-loading-overlay');
        if (el)
            return el;
        el = document.createElement('div');
        el.id = 'garmin-loading-overlay';
        el.className = 'garmin-loading-overlay';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.innerHTML = '<section class="garmin-loading-card"><div class="garmin-loading-ring"><span></span></div><div class="garmin-loading-title" id="garmin-loading-title">Please wait…</div><div class="garmin-loading-subtitle">Please wait. Do not tap again.</div><div class="garmin-loading-track"><span></span></div><div class="garmin-loading-foot"><span>PROCESSING</span><span class="garmin-loading-dots">•••</span></div></section>';
        document.body.appendChild(el);
        return el;
    }
    window.__golfShowLoading = function (label) { loadingDepth++; activeLabel = label || 'Please wait…'; const el = ensureLoading(); const title = document.getElementById('garmin-loading-title'); if (title)
        title.textContent = activeLabel; el.classList.add('visible'); document.body.classList.add('golf-loading-active'); };
    window.__golfHideLoading = function () { loadingDepth = Math.max(0, loadingDepth - 1); if (loadingDepth === 0) {
        const el = document.getElementById('garmin-loading-overlay');
        if (el)
            el.classList.remove('visible');
        document.body.classList.remove('golf-loading-active');
    } };
    const actions = {
        startGame: 'Creating Game…', joinGame: 'Joining Game…', saveCourse: 'Saving Course…',
        saveHandicap: 'Saving Settings…', saveEditedScore: 'Saving Score…', saveBulkScores: 'Saving Scores…',
        savePnlSettings: 'Saving P&L…', confirmRemoveJoinEntry: 'Updating Join Game…', toggleResultDouble: 'Saving Result…'
    };
    Object.entries(actions).forEach(([name, label]) => {
        const original = window[name];
        if (typeof original !== 'function')
            return;
        window[name] = async function (...args) {
            if (window.__golfLoadingBusy && name !== 'joinGame')
                return;
            window.__golfLoadingBusy = true;
            window.__golfShowLoading(label);
            try {
                return await original.apply(this, args);
            }
            finally {
                window.__golfHideLoading();
                window.__golfLoadingBusy = false;
            }
        };
    });
})();
loadCoursesIfNeeded();
render();
