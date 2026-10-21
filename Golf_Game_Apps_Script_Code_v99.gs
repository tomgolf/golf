/*******************************************************
 * GOLF GAME - Google Apps Script
 * Clean full version
 *
 * Database:
 *   MATCHES
 *   PLAYERS
 *   SCORES
 *   COURSES
 *   HANDICAPS
 *
 * Rules:
 *   - COURSES is permanent
 *   - Match data can later be cleaned after 3 days
 *   - No course delete API
 *   - Course can be added / edited
 *   - Game ID is manually entered
 *   - Players: 2 to 6
 *******************************************************/

const SHEETS = {
  MATCHES: 'MATCHES',
  PLAYERS: 'PLAYERS',
  SCORES: 'SCORES',
  COURSES: 'COURSES',
  HANDICAPS: 'HANDICAPS',
  JOIN_ENTRIES: 'JOIN_ENTRIES'
};

const MAX_PLAYERS = 6;

/* =====================================================
 * 1. DATABASE SETUP
 * ===================================================== */

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  createSheetIfMissing_(ss, SHEETS.MATCHES, [
    'match_id',
    'date',
    'admin',
    'player_count',
    'course_id',
    'status',
    'created_at',
    'updated_at'
  ]);

  createSheetIfMissing_(ss, SHEETS.PLAYERS, [
    'match_id',
    'player_id',
    'name',
    'join_code',
    'created_at',
    'baccarat_enabled'
  ]);

  createSheetIfMissing_(ss, SHEETS.SCORES, [
    'match_id',
    'hole',
    'player_id',
    'score',
    'up',
    'submitted_by',
    'created_at',
    'updated_at'
  ]);

  createSheetIfMissing_(ss, SHEETS.COURSES, [
    'course_id',
    'course_name',
    'hole',
    'par',
    'si',
    'created_at',
    'updated_at'
  ]);

  createSheetIfMissing_(ss, SHEETS.HANDICAPS, [
    'match_id',
    'row_player_id',
    'col_player_id',
    'strokes',
    'created_at',
    'updated_at'
  ]);

  // Add course_id to an older MATCHES sheet if it is missing.
  ensureHeader_(ss.getSheetByName(SHEETS.MATCHES), 'course_id');
  ensureHeader_(ss.getSheetByName(SHEETS.MATCHES), 'result_doubles');
  ensureHeader_(ss.getSheetByName(SHEETS.PLAYERS), 'baccarat_enabled');
  createSheetIfMissing_(ss, SHEETS.JOIN_ENTRIES, ['match_id','admin','status','published_at','updated_at']);

  return {
    success: true,
    message: 'Database setup complete'
  };
}

function createSheetIfMissing_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const lastColumn = Math.max(sheet.getLastColumn(), headers.length);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  headers.forEach(function(header, index) {
    if (currentHeaders[index] !== header) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });

  sheet.setFrozenRows(1);
}

function ensureHeader_(sheet, headerName) {
  if (!sheet) return;

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  if (headers.indexOf(headerName) === -1) {
    sheet.getRange(1, lastColumn + 1).setValue(headerName);
  }
}

/* =====================================================
 * 2. WEB API - GET
 * ===================================================== */

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || '';

    let result;

    if (action === 'getNextGameId') {
      result = getNextGameId_();

    } else if (action === 'getCourses') {
      result = getCourses_();

    } else if (action === 'getCourse') {
      result = getCourse_(params.course_id);

    } else if (action === 'getMatch') {
      result = getMatch_(params.match_id);

    } else if (action === 'getScores') {
      result = getScores_(params.match_id);

    } else if (action === 'getHandicaps') {
      result = getHandicaps_(params.match_id);

    } else if (action === 'listPublishedGames') {
      result = listPublishedGames_();

    } else {
      result = {
        success: true,
        message: 'Golf Game API is running'
      };
    }

    // JSONP: ?callback=xxx
    if (params.callback) {
      return jsonp_(result, params.callback);
    }

    return json_(result);

  } catch (err) {
    const result = {
      success: false,
      error: String(err && err.message ? err.message : err)
    };

    if (e && e.parameter && e.parameter.callback) {
      return jsonp_(result, e.parameter.callback);
    }

    return json_(result);
  }
}

/* =====================================================
 * 3. WEB API - POST
 * ===================================================== */

function doPost(e) {
  try {
    const data = parsePostData_(e);
    const action = data.action || '';

    let result;

    if (action === 'createCourse') {
      result = createCourse_(data);

    } else if (action === 'updateCourse') {
      result = updateCourse_(data);

    } else if (action === 'createMatch') {
      result = createMatch_(data);

    } else if (action === 'joinMatch') {
      result = joinMatch_(data);

    } else if (action === 'saveScore') {
      result = saveScore_(data);

    } else if (action === 'saveScoresBatch') {
      result = saveScoresBatch_(data);

    } else if (action === 'saveHandicaps') {
      result = saveHandicaps_(data);

    } else if (action === 'saveBaccaratPlayers') {
      result = saveBaccaratPlayers_(data);

    } else if (action === 'saveResultDouble') {
      result = saveResultDouble_(data);

    } else if (action === 'savePnlSettings') {
      result = savePnlSettings_(data);

    } else if (action === 'publishJoinEntry') {
      result = publishJoinEntry_(data);

    } else if (action === 'removeJoinEntry') {
      result = removeJoinEntry_(data);

    } else if (action === 'deleteRecordsOlderThan7Days') {
      result = deleteRecordsOlderThan7Days_(data);

    } else {
      result = {
        success: false,
        error: 'Unknown action: ' + action
      };
    }

    return json_(result);

  } catch (err) {
    return json_({
      success: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function parsePostData_(e) {
  if (!e || !e.postData) {
    throw new Error('No POST data');
  }

  const text = e.postData.contents || '';

  if (!text) {
    throw new Error('Empty POST data');
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // Also accept form-urlencoded POST.
    return e.parameter || {};
  }
}

/* =====================================================
 * 4. JSON HELPERS
 * ===================================================== */

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonp_(obj, callback) {
  // Only allow a normal JS callback name.
  if (!/^[A-Za-z_$][A-Za-z0-9_$\.]*$/.test(callback)) {
    return json_({
      success: false,
      error: 'Invalid callback'
    });
  }

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(obj) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/* =====================================================
 * 5. COURSES - READ
 * ===================================================== */

function getCourses_() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEETS.COURSES);

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      success: true,
      courses: []
    };
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const rows = values.slice(1);

  const idx = headerIndex_(headers);

  const map = {};

  rows.forEach(function(row) {
    const courseId = String(row[idx.course_id] || '').trim();
    if (!courseId) return;

    if (!map[courseId]) {
      map[courseId] = {
        course_id: courseId,
        course_name: String(row[idx.course_name] || ''),
        holes: []
      };
    }

    const hole = Number(row[idx.hole]);
    if (hole >= 1 && hole <= 18) {
      map[courseId].holes.push({
        hole: hole,
        par: Number(row[idx.par]),
        si: Number(row[idx.si])
      });
    }
  });

  const courses = Object.keys(map).map(function(id) {
    const course = map[id];

    course.holes.sort(function(a, b) {
      return a.hole - b.hole;
    });

    return course;
  });

  courses.sort(function(a, b) {
    return a.course_name.localeCompare(b.course_name);
  });

  return {
    success: true,
    courses: courses
  };
}

function getCourse_(courseId) {
  courseId = String(courseId || '').trim();

  if (!courseId) {
    return {
      success: false,
      error: 'course_id is required'
    };
  }

  const courses = getCourses_().courses;

  for (let i = 0; i < courses.length; i++) {
    if (courses[i].course_id === courseId) {
      return {
        success: true,
        course: courses[i]
      };
    }
  }

  return {
    success: false,
    error: 'Course not found'
  };
}

/* =====================================================
 * 6. COURSES - CREATE
 * ===================================================== */

function createCourse_(data) {
  const courseName = String(data.course_name || '').trim();
  const holes = data.holes || [];

  if (!courseName) {
    return {
      success: false,
      error: 'course_name is required'
    };
  }

  validateHoles_(holes);

  const existing = findCourseByName_(courseName);

  if (existing) {
    return {
      success: false,
      error: 'Course already exists',
      course_id: existing.course_id
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.COURSES);

  if (!sheet) {
    throw new Error('COURSES sheet not found. Run setupDatabase() first.');
  }

  const now = new Date();
  const courseId = generateCourseId_();

  const rows = holes.map(function(h, i) {
    return [
      courseId,
      courseName,
      i + 1,
      Number(h.par),
      Number(h.si),
      now,
      now
    ];
  });

  sheet
    .getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
    .setValues(rows);

  return {
    success: true,
    message: 'Course created',
    course: {
      course_id: courseId,
      course_name: courseName,
      holes: holes.map(function(h, i) {
        return {
          hole: i + 1,
          par: Number(h.par),
          si: Number(h.si)
        };
      })
    }
  };
}

/* =====================================================
 * 7. COURSES - EDIT
 * ===================================================== */

function updateCourse_(data) {
  const courseId = String(data.course_id || '').trim();
  const courseName = String(data.course_name || '').trim();
  const holes = data.holes || [];

  if (!courseId) {
    return {
      success: false,
      error: 'course_id is required'
    };
  }

  if (!courseName) {
    return {
      success: false,
      error: 'course_name is required'
    };
  }

  validateHoles_(holes);

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEETS.COURSES);

  if (!sheet) {
    throw new Error('COURSES sheet not found');
  }

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return {
      success: false,
      error: 'Course not found'
    };
  }

  const headers = values[0].map(String);
  const idx = headerIndex_(headers);

  const matchingRows = [];

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idx.course_id] || '').trim() === courseId) {
      matchingRows.push(r + 1);
    }
  }

  if (matchingRows.length === 0) {
    return {
      success: false,
      error: 'Course not found'
    };
  }

  const now = new Date();

  // Keep the same course_id, replace its 18 course rows.
  matchingRows.forEach(function(rowNumber) {
    sheet.getRange(rowNumber, 1, 1, 7).clearContent();
  });

  const rows = holes.map(function(h, i) {
    return [
      courseId,
      courseName,
      i + 1,
      Number(h.par),
      Number(h.si),
      values[matchingRows[0] - 1][idx.created_at] || now,
      now
    ];
  });

  // Rebuild safely at the end of the existing data.
  const firstAppendRow = sheet.getLastRow() + 1;

  sheet
    .getRange(firstAppendRow, 1, rows.length, rows[0].length)
    .setValues(rows);

  return {
    success: true,
    message: 'Course updated',
    course: {
      course_id: courseId,
      course_name: courseName,
      holes: holes.map(function(h, i) {
        return {
          hole: i + 1,
          par: Number(h.par),
          si: Number(h.si)
        };
      })
    }
  };
}

function validateHoles_(holes) {
  if (!Array.isArray(holes) || holes.length !== 18) {
    throw new Error('Exactly 18 holes are required');
  }

  const sis = [];

  holes.forEach(function(h, index) {
    const par = Number(h.par);
    const si = Number(h.si);

    if (![3, 4, 5, 6].includes(par)) {
      throw new Error('Hole ' + (index + 1) + ': PAR must be 3, 4, 5 or 6');
    }

    if (!Number.isInteger(si) || si < 1 || si > 18) {
      throw new Error('Hole ' + (index + 1) + ': SI must be 1-18');
    }

    sis.push(si);
  });

  const unique = new Set(sis);

  if (unique.size !== 18) {
    throw new Error('SI 1-18 must each appear exactly once');
  }
}

function findCourseByName_(courseName) {
  const wanted = String(courseName || '').trim().toLowerCase();

  if (!wanted) return null;

  const courses = getCourses_().courses;

  for (let i = 0; i < courses.length; i++) {
    if (String(courses[i].course_name).trim().toLowerCase() === wanted) {
      return courses[i];
    }
  }

  return null;
}

function generateCourseId_() {
  const date = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || 'Asia/Singapore',
    'yyMMdd'
  );

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return 'C' + date + '-' + code;
}

/* =====================================================
 * GAME ID: day-of-month + daily sequence, e.g. 21-1
 * ===================================================== */
function getNextGameId_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.MATCHES);
  const tz = Session.getScriptTimeZone() || 'Asia/Singapore';
  const day = Utilities.formatDate(new Date(), tz, 'd');
  let maxSeq = 0;
  if (sheet && sheet.getLastRow() > 1) {
    const values = sheet.getDataRange().getValues();
    const headers = values[0].map(String);
    const idx = headerIndex_(headers);
    for (let r = 1; r < values.length; r++) {
      const id = String(values[r][idx.match_id] || '').trim();
      const m = id.match(/^(\d{1,2})-(\d+)$/);
      if (m && Number(m[1]) === Number(day)) maxSeq = Math.max(maxSeq, Number(m[2]));
    }
  }
  return {success:true, match_id:day + '-' + (maxSeq + 1), day:Number(day), sequence:maxSeq+1};
}

/* =====================================================
 * 8. MATCH - CREATE
 * ===================================================== */

function createMatch_(data) {
  let matchId = String(data.match_id || '').trim();
  const admin = String(data.admin || '').trim();
  const courseId = String(data.course_id || '').trim();
  const players = Array.isArray(data.players) ? data.players : [];
  const baccaratEnabled = Array.isArray(data.baccarat_enabled) ? data.baccarat_enabled : players.map(function(){ return true; });

  if (!matchId) matchId = getNextGameId_().match_id;

  if (!admin) {
    return {
      success: false,
      error: 'Admin is required'
    };
  }

  if (!courseId) {
    return {
      success: false,
      error: 'Course is required'
    };
  }

  if (players.length < 2 || players.length > MAX_PLAYERS) {
    return {
      success: false,
      error: 'Players must be 2-6'
    };
  }

  if (getMatchRaw_(matchId)) {
    return {
      success: false,
      error: 'Game ID already exists'
    };
  }

  const course = getCourse_(courseId);

  if (!course.success) {
    return {
      success: false,
      error: 'Course not found'
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const matchSheet = ss.getSheetByName(SHEETS.MATCHES);
  const playerSheet = ss.getSheetByName(SHEETS.PLAYERS);

  if (!matchSheet || !playerSheet) {
    throw new Error('Run setupDatabase() first');
  }

  const now = new Date();

  matchSheet.appendRow([
    matchId,
    now,
    admin,
    players.length,
    courseId,
    'OPEN',
    now,
    now
  ]);

  const createdPlayers = [];

  players.forEach(function(player, index) {
    const name = String(
      typeof player === 'string' ? player : player.name || ''
    ).trim();

    if (!name) {
      throw new Error('Player ' + (index + 1) + ' name is required');
    }

    const playerId = generatePlayerId_();
    const joinCode = generateJoinCode_();

    playerSheet.appendRow([
      matchId,
      playerId,
      name,
      joinCode,
      now,
      baccaratEnabled[index] !== false
    ]);

    createdPlayers.push({player_id: playerId, name: name, baccarat_enabled: baccaratEnabled[index] !== false});
  });

  // Save the pair handicap matrix immediately after player IDs exist.
  // The client sends one value for each upper-triangle pair (e.g. 0-1).
  // The reverse row is always written automatically as the opposite value.
  const handicapResult = saveHandicaps_({
    match_id: matchId,
    player_ids: createdPlayers.map(function(p){ return p.player_id; }),
    handicaps: data.handicaps || {}
  });

  if (!handicapResult.success) {
    throw new Error('Handicap save failed: ' + handicapResult.error);
  }

  return {
    success: true,
    match_id: matchId,
    course_id: courseId,
    player_count: players.length,
    status: 'OPEN',
    players: createdPlayers,
    handicap_rows: handicapResult.rows_written || 0
  };
}

function getMatch_(matchId) {
  matchId = String(matchId || '').trim();

  if (!matchId) {
    return {
      success: false,
      error: 'match_id is required'
    };
  }

  const match = getMatchRaw_(matchId);

  if (!match) {
    return {
      success: false,
      error: 'Game not found'
    };
  }

  const players = getPlayers_(matchId);
  const course = getCourse_(match.course_id);

  return {
    success: true,
    match: {
      match_id: match.match_id,
      date: match.date,
      admin: match.admin,
      player_count: match.player_count,
      course_id: match.course_id,
      status: match.status,
      result_doubles: match.result_doubles || {},
      pnl_settings: match.pnl_settings || {game_multiplier:10,baccarat_multiplier:5}
    },
    players: players,
    course: course.success ? course.course : null,
    handicaps: getHandicaps_(matchId).handicaps
  };
}

function parsePnlSettings_(headers, row) {
  const i = headers.indexOf('pnl_settings');
  if (i < 0 || !row[i]) return {game_multiplier:10,baccarat_multiplier:5};
  try { const v = JSON.parse(String(row[i])); return {game_multiplier:Math.max(0,Number(v.game_multiplier ?? 10)),baccarat_multiplier:Math.max(0,Number(v.baccarat_multiplier ?? 5))}; } catch(e) { return {game_multiplier:10,baccarat_multiplier:5}; }
}

function savePnlSettings_(data) {
  const matchId = String(data.match_id || '').trim();
  const admin = String(data.admin || '').trim();
  const gameMultiplier = Number(data.game_multiplier);
  const baccaratMultiplier = Number(data.baccarat_multiplier);
  if (!matchId || !Number.isFinite(gameMultiplier) || gameMultiplier < 0 || !Number.isFinite(baccaratMultiplier) || baccaratMultiplier < 0) return {success:false,error:'Invalid P&L multipliers'};
  const match = getMatchRaw_(matchId);
  if (!match) return {success:false,error:'Game not found'};
  if (admin.toLowerCase() !== String(match.admin || '').trim().toLowerCase()) return {success:false,error:'Only the creator can change P&L multipliers'};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.MATCHES);
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  let col = headers.indexOf('pnl_settings') + 1;
  if (!col) { col = sheet.getLastColumn()+1; sheet.getRange(1,col).setValue('pnl_settings'); }
  const settings = {game_multiplier:gameMultiplier,baccarat_multiplier:baccaratMultiplier};
  sheet.getRange(match.row,col).setValue(JSON.stringify(settings));
  return {success:true,pnl_settings:settings};
}

function parseResultDoubles_(headers, row) {
  const i = headers.indexOf('result_doubles');
  if (i < 0 || !row[i]) return {};
  try { const value = JSON.parse(String(row[i])); return value && typeof value === 'object' ? value : {}; } catch (e) { return {}; }
}

function saveResultDouble_(data) {
  const matchId = String(data.match_id || '').trim();
  const mode = String(data.mode || '').toUpperCase();
  const p1 = String(data.p1 || '').trim();
  const p2 = String(data.p2 || '').trim();
  if (!matchId || !['F9','B9'].includes(mode) || !p1 || !p2 || p1 === p2) return {success:false,error:'Invalid DB setting'};
  const match = getMatchRaw_(matchId);
  if (!match) return {success:false,error:'Game not found'};
  if (String(data.admin || '').trim().toLowerCase() !== String(match.admin || '').trim().toLowerCase()) return {success:false,error:'Only the creator can change DB settings'};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.MATCHES);
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  let col = headers.indexOf('result_doubles') + 1;
  if (!col) { col = sheet.getLastColumn()+1; sheet.getRange(1,col).setValue('result_doubles'); }
  const raw = sheet.getRange(match.row,col).getValue();
  let doubles = {}; try { doubles = raw ? JSON.parse(String(raw)) : {}; } catch(e) {}
  const key = mode + '|' + [p1,p2].sort().join('|');
  if (data.checked) doubles[key] = true; else delete doubles[key];
  sheet.getRange(match.row,col).setValue(JSON.stringify(doubles));
  return {success:true,result_doubles:doubles};
}

function getMatchRaw_(matchId) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEETS.MATCHES);

  if (!sheet || sheet.getLastRow() < 2) return null;

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idx = headerIndex_(headers);

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idx.match_id] || '').trim() === matchId) {
      return {
        row: r + 1,
        match_id: String(values[r][idx.match_id] || ''),
        date: values[r][idx.date],
        admin: String(values[r][idx.admin] || ''),
        player_count: Number(values[r][idx.player_count] || 0),
        course_id: String(values[r][idx.course_id] || ''),
        status: String(values[r][idx.status] || ''),
        result_doubles: parseResultDoubles_(headers, values[r]),
        pnl_settings: parsePnlSettings_(headers, values[r])
      };
    }
  }

  return null;
}

/* =====================================================
 * 9. PLAYERS
 * ===================================================== */

function joinMatch_(data) {
  const matchId = String(data.match_id || '').trim();
  const joinCode = String(data.join_code || '').trim();
  const name = String(data.name || '').trim();

  if (!matchId) {
    return {
      success: false,
      error: 'Game ID is required'
    };
  }

  const match = getMatchRaw_(matchId);

  if (!match) {
    return {
      success: false,
      error: 'Game not found'
    };
  }

  const players = getPlayers_(matchId);

  // If join_code is supplied, return that player.
  if (joinCode) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].join_code === joinCode) {
        return {
          success: true,
          match_id: matchId,
          player: players[i]
        };
      }
    }

    return {
      success: false,
      error: 'Invalid join code'
    };
  }

  // Otherwise find by player name.
  if (name) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].name.toLowerCase() === name.toLowerCase()) {
        return {
          success: true,
          match_id: matchId,
          player: players[i]
        };
      }
    }
  }

  return {
    success: false,
    error: 'Player not found'
  };
}

function saveBaccaratPlayers_(data) {
  const matchId = String(data.match_id || '').trim();
  const players = Array.isArray(data.players) ? data.players : [];
  if (!matchId || !players.length) return {success:false, error:'match_id and players are required'};
  if (!getMatchRaw_(matchId)) return {success:false, error:'Game not found'};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.PLAYERS);
  if (!sheet) throw new Error('PLAYERS sheet not found');
  ensureHeader_(sheet, 'baccarat_enabled');
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idx = headerIndex_(headers);
  let updated = 0;
  const missing = [];
  players.forEach(function(p) {
    const pid = String(p.player_id || '').trim();
    let found = false;
    if (!pid) { missing.push('(missing player_id)'); return; }
    for (let r = 1; r < values.length; r++) {
      if (String(values[r][idx.match_id] || '').trim() === matchId && String(values[r][idx.player_id] || '').trim() === pid) {
        const raw = p.baccarat_enabled;
        const enabled = !(raw === false || raw === 0 || String(raw).trim().toLowerCase() === 'false' || String(raw).trim() === '0' || String(raw).trim().toLowerCase() === 'no');
        sheet.getRange(r + 1, idx.baccarat_enabled + 1).setValue(enabled);
        updated++;
        found = true;
        break;
      }
    }
    if (!found) missing.push(pid);
  });
  SpreadsheetApp.flush();
  if (missing.length) return {success:false, match_id:matchId, updated:updated, error:'Could not find matching player rows: ' + missing.join(', ')};
  return {success:true, match_id:matchId, updated:updated};
}

function getPlayers_(matchId) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEETS.PLAYERS);

  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idx = headerIndex_(headers);

  const result = [];

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idx.match_id] || '').trim() === matchId) {
      result.push({
        player_id: String(values[r][idx.player_id] || ''),
        name: String(values[r][idx.name] || ''),
        join_code: String(values[r][idx.join_code] || ''),
        baccarat_enabled: idx.baccarat_enabled == null ? true : !(values[r][idx.baccarat_enabled] === false || values[r][idx.baccarat_enabled] === 0 || String(values[r][idx.baccarat_enabled]).trim().toLowerCase() === 'false' || String(values[r][idx.baccarat_enabled]).trim() === '0' || String(values[r][idx.baccarat_enabled]).trim().toLowerCase() === 'no')
      });
    }
  }

  return result;
}

function generatePlayerId_() {
  return 'P' + Utilities.getUuid().replace(/-/g, '').substring(0, 8);
}

function generateJoinCode_() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/* =====================================================
 * 10. SCORES
 * ===================================================== */

function saveScore_(data) {
  const matchId = String(data.match_id || '').trim();
  const hole = Number(data.hole);
  const playerId = String(data.player_id || '').trim();
  const score = data.score === '' || data.score == null
    ? ''
    : Number(data.score);
  const up = data.up === true || data.up === 'true' || data.up === 1 || data.up === '1';
  const submittedBy = String(data.submitted_by || playerId).trim();

  if (!matchId || !playerId) {
    return {
      success: false,
      error: 'match_id and player_id are required'
    };
  }

  if (!Number.isInteger(hole) || hole < 1 || hole > 18) {
    return {
      success: false,
      error: 'hole must be 1-18'
    };
  }

  if (score !== '' && (!Number.isFinite(score) || score < 1 || score > 20)) {
    return {
      success: false,
      error: 'Invalid score'
    };
  }

  const match = getMatchRaw_(matchId);

  if (!match) {
    return {
      success: false,
      error: 'Game not found'
    };
  }

  const submittedPlayer = findPlayerById_(matchId, submittedBy);
  if (!submittedPlayer) {
    return {
      success: false,
      error: 'Invalid submitting player'
    };
  }

  const isAdmin = String(submittedPlayer.name).trim().toLowerCase() === String(match.admin).trim().toLowerCase();
  if (!isAdmin && submittedBy !== playerId) {
    return {
      success: false,
      error: 'Only Admin can edit another player score'
    };
  }

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEETS.SCORES);

  if (!sheet) {
    throw new Error('SCORES sheet not found');
  }

  const now = new Date();
  const values = sheet.getDataRange().getValues();

  let targetRow = -1;

  if (values.length >= 2) {
    const headers = values[0].map(String);
    const idx = headerIndex_(headers);

    for (let r = 1; r < values.length; r++) {
      if (
        String(values[r][idx.match_id] || '') === matchId &&
        Number(values[r][idx.hole]) === hole &&
        String(values[r][idx.player_id] || '') === playerId
      ) {
        targetRow = r + 1;
        break;
      }
    }
  }

  const row = [
    matchId,
    hole,
    playerId,
    score,
    up,
    submittedBy,
    now,
    now
  ];

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return {
    success: true,
    message: 'Score saved',
    match_id: matchId,
    hole: hole,
    player_id: playerId
  };
}


function saveScoresBatch_(data) {
  const matchId = String(data.match_id || '').trim();
  const hole = Number(data.hole);
  const submittedBy = String(data.submitted_by || '').trim();
  const items = Array.isArray(data.scores) ? data.scores : [];

  if (!matchId || !submittedBy || !Number.isInteger(hole) || hole < 1 || hole > 18 || !items.length) {
    return {success:false, error:'match_id, hole, submitted_by and scores are required'};
  }

  const match = getMatchRaw_(matchId);
  if (!match) return {success:false, error:'Game not found'};

  const submittedPlayer = findPlayerById_(matchId, submittedBy);
  if (!submittedPlayer) return {success:false, error:'Invalid submitting player'};
  const isAdmin = String(submittedPlayer.name).trim().toLowerCase() === String(match.admin).trim().toLowerCase();
  if (!isAdmin) return {success:false, error:'Only Admin can use batch score entry'};

  const players = getPlayers_(matchId);
  const allowed = {};
  players.forEach(p => allowed[p.player_id] = true);

  const clean = [];
  const seen = {};
  for (const item of items) {
    const playerId = String(item.player_id || '').trim();
    const score = item.score === '' || item.score == null ? '' : Number(item.score);
    const up = item.up === true || item.up === 'true' || item.up === 1 || item.up === '1';
    if (!allowed[playerId]) return {success:false, error:'Invalid player in batch'};
    if (seen[playerId]) return {success:false, error:'Duplicate player in batch'};
    if (score !== '' && (!Number.isFinite(score) || score < 1 || score > 20)) return {success:false, error:'Invalid score'};
    seen[playerId] = true;
    clean.push({playerId, score, up});
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SCORES);
  if (!sheet) throw new Error('SCORES sheet not found');
  const values = sheet.getDataRange().getValues();
  const headers = values.length ? values[0].map(String) : [];
  const idx = headerIndex_(headers);
  const now = new Date();
  const rowMap = {};
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idx.match_id] || '') === matchId && Number(values[r][idx.hole]) === hole) {
      rowMap[String(values[r][idx.player_id] || '')] = r + 1;
    }
  }

  const appendRows = [];
  clean.forEach(x => {
    const row = [matchId, hole, x.playerId, x.score, x.up, submittedBy, now, now];
    const target = rowMap[x.playerId];
    if (target) sheet.getRange(target, 1, 1, row.length).setValues([row]);
    else appendRows.push(row);
  });
  if (appendRows.length) sheet.getRange(sheet.getLastRow()+1, 1, appendRows.length, appendRows[0].length).setValues(appendRows);

  return {success:true, message:'Scores saved', match_id:matchId, hole:hole, count:clean.length};
}

function findPlayerById_(matchId, playerId) {
  const players = getPlayers_(matchId);
  for (let i = 0; i < players.length; i++) {
    if (players[i].player_id === playerId) return players[i];
  }
  return null;
}

/* =====================================================
 * 10B. HANDICAPS
 * ===================================================== */

function saveHandicaps_(data) {
  const matchId = String(data.match_id || '').trim();
  const playerIds = Array.isArray(data.player_ids) ? data.player_ids : [];
  const handicaps = data.handicaps && typeof data.handicaps === 'object' ? data.handicaps : {};

  if (!matchId || playerIds.length < 2) {
    return {success:false, error:'match_id and player_ids are required'};
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HANDICAPS);
  if (!sheet) throw new Error('HANDICAPS sheet not found. Run setupDatabase() first.');

  const values = sheet.getDataRange().getValues();
  if (values.length >= 2) {
    const headers = values[0].map(String);
    const idx = headerIndex_(headers);
    for (let r = values.length - 1; r >= 1; r--) {
      if (String(values[r][idx.match_id] || '') === matchId) sheet.deleteRow(r + 1);
    }
  }

  const now = new Date();
  const rows = [];
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      let v = Number(handicaps[i + '-' + j] == null ? 0 : handicaps[i + '-' + j]);
      if (!Number.isInteger(v) || v < -14 || v > 14) throw new Error('Handicap must be -14 to +14');
      rows.push([matchId, playerIds[i], playerIds[j], v, now, now]);
      rows.push([matchId, playerIds[j], playerIds[i], -v, now, now]);
    }
  }
  if (rows.length) {
    sheet.getRange(sheet.getLastRow()+1,1,rows.length,6).setValues(rows);
  }
  SpreadsheetApp.flush();
  return {success:true, match_id:matchId, rows_written:rows.length};
}

function getHandicaps_(matchId) {
  matchId = String(matchId || '').trim();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.HANDICAPS);
  if (!sheet || sheet.getLastRow() < 2) return {success:true, handicaps:{}};
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idx = headerIndex_(headers);
  const players = getPlayers_(matchId);
  const order = {};
  players.forEach(function(p,i){ order[p.player_id] = i; });
  const out = {};
  for (let r=1;r<values.length;r++) {
    if (String(values[r][idx.match_id]||'') !== matchId) continue;
    const a=String(values[r][idx.row_player_id]||''), b=String(values[r][idx.col_player_id]||'');
    if (order[a] == null || order[b] == null) continue;
    const i=order[a], j=order[b];
    if (i<j) out[i+'-'+j]=Number(values[r][idx.strokes]||0);
  }
  return {success:true, handicaps:out};
}

function getScores_(matchId) {
  matchId = String(matchId || '').trim();

  if (!matchId) {
    return {
      success: false,
      error: 'match_id is required'
    };
  }

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEETS.SCORES);

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      success: true,
      scores: []
    };
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idx = headerIndex_(headers);

  const scores = [];

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idx.match_id] || '') === matchId) {
      scores.push({
        hole: Number(values[r][idx.hole]),
        player_id: String(values[r][idx.player_id] || ''),
        score: values[r][idx.score] === '' ? '' : Number(values[r][idx.score]),
        up: Boolean(values[r][idx.up])
      });
    }
  }

  return {
    success: true,
    scores: scores
  };
}

/* =====================================================
 * 11. MANUAL CLEANUP - MATCH DATA OLDER THAN 7 DAYS
 * Automatic cleanup is intentionally disabled. This action is only
 * called from the Admin P&L screen after a second confirmation.
 * COURSES is permanent and must never be modified here.
 * ===================================================== */
function deleteRecordsOlderThan7Days_(data) {
  const matchId = String(data.match_id || '').trim();
  const admin = String(data.admin || '').trim();
  if (!matchId || !admin) return {success:false,error:'match_id and admin are required'};

  // Verify that the caller is the creator/admin of the currently open game.
  const currentMatch = getMatchRaw_(matchId);
  if (!currentMatch) return {success:false,error:'Current game not found'};
  if (admin.toLowerCase() !== String(currentMatch.admin || '').trim().toLowerCase()) {
    return {success:false,error:'Only the game creator can delete old records'};
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const matchSheet = ss.getSheetByName(SHEETS.MATCHES);
  if (!matchSheet || matchSheet.getLastRow() < 2) {
    return {success:true,deleted_matches:0,deleted_players:0,deleted_scores:0,deleted_handicaps:0,deleted_join_entries:0,courses_preserved:true};
  }

  const values = matchSheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idx = headerIndex_(headers);
  if (idx.match_id == null || idx.date == null) return {success:false,error:'MATCHES must contain match_id and date columns'};

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oldIds = [];
  for (let r = values.length - 1; r >= 1; r--) {
    const rawDate = values[r][idx.date];
    const date = rawDate instanceof Date ? rawDate : (rawDate ? new Date(rawDate) : null);
    if (date && !isNaN(date.getTime()) && date < cutoff) {
      const oldId = String(values[r][idx.match_id] || '').trim();
      if (oldId) oldIds.push(oldId);
      matchSheet.deleteRow(r + 1);
    }
  }

  const counts = {
    deleted_matches: oldIds.length,
    deleted_players: countAndDeleteRowsByMatchId_(ss.getSheetByName(SHEETS.PLAYERS), oldIds),
    deleted_scores: countAndDeleteRowsByMatchId_(ss.getSheetByName(SHEETS.SCORES), oldIds),
    deleted_handicaps: countAndDeleteRowsByMatchId_(ss.getSheetByName(SHEETS.HANDICAPS), oldIds),
    deleted_join_entries: countAndDeleteRowsByMatchId_(ss.getSheetByName(SHEETS.JOIN_ENTRIES), oldIds)
  };

  // Deliberately do not access, clear, or delete the COURSES sheet.
  return {success:true, ...counts, cutoff:cutoff.toISOString(), courses_preserved:true};
}

function countAndDeleteRowsByMatchId_(sheet, matchIds) {
  if (!sheet || sheet.getLastRow() < 2 || !matchIds.length) return 0;
  const idSet = {};
  matchIds.forEach(function(id) { idSet[String(id)] = true; });
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idx = headerIndex_(headers);
  if (idx.match_id == null) return 0;
  let count = 0;
  for (let r = values.length - 1; r >= 1; r--) {
    if (idSet[String(values[r][idx.match_id] || '').trim()]) {
      sheet.deleteRow(r + 1);
      count++;
    }
  }
  return count;
}

function deleteRowsByMatchId_(sheet, matchIds) {
  if (!sheet || sheet.getLastRow() < 2) return;

  const idSet = {};
  matchIds.forEach(function(id) {
    idSet[id] = true;
  });

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idx = headerIndex_(headers);

  for (let r = values.length - 1; r >= 1; r--) {
    const id = String(values[r][idx.match_id] || '');

    if (idSet[id]) {
      sheet.deleteRow(r + 1);
    }
  }
}

/* =====================================================
 * 12. HEADER UTILITY
 * ===================================================== */

function headerIndex_(headers) {
  const map = {};

  headers.forEach(function(h, i) {
    map[String(h).trim()] = i;
  });

  return map;
}


/* =====================================================
 * JOIN GAME PUBLISHING - creator controlled, no expiry
 * ===================================================== */
function joinEntriesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.JOIN_ENTRIES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.JOIN_ENTRIES);
    sheet.getRange(1,1,1,5).setValues([['match_id','admin','status','published_at','updated_at']]);
    sheet.setFrozenRows(1);
  }
  ensureHeader_(sheet, 'match_id'); ensureHeader_(sheet, 'admin');
  ensureHeader_(sheet, 'status'); ensureHeader_(sheet, 'published_at'); ensureHeader_(sheet, 'updated_at');
  return sheet;
}
function publishJoinEntry_(data) {
  const matchId = String(data.match_id || '').trim();
  const admin = String(data.admin || '').trim();
  if (!matchId || !admin) return {success:false,error:'match_id and admin are required'};
  const match = getMatchRaw_(matchId);
  if (!match) return {success:false,error:'Game not found'};
  if (admin.toLowerCase() !== String(match.admin || '').trim().toLowerCase()) return {success:false,error:'Only the creator can publish this game'};
  const sheet = joinEntriesSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String), idx = headerIndex_(headers), now = new Date();
  for (let r=1;r<values.length;r++) {
    if (String(values[r][idx.match_id]||'').trim() === matchId) {
      sheet.getRange(r+1,idx.admin+1).setValue(match.admin);
      sheet.getRange(r+1,idx.status+1).setValue('ACTIVE');
      sheet.getRange(r+1,idx.published_at+1).setValue(now);
      sheet.getRange(r+1,idx.updated_at+1).setValue(now);
      return {success:true,status:'ACTIVE',match_id:matchId};
    }
  }
  sheet.appendRow([matchId,match.admin,'ACTIVE',now,now]);
  return {success:true,status:'ACTIVE',match_id:matchId};
}
function removeJoinEntry_(data) {
  const matchId = String(data.match_id || '').trim();
  const admin = String(data.admin || '').trim();
  if (!matchId || !admin) return {success:false,error:'match_id and admin are required'};
  const match = getMatchRaw_(matchId);
  if (!match) return {success:false,error:'Game not found'};
  if (admin.toLowerCase() !== String(match.admin || '').trim().toLowerCase()) return {success:false,error:'Only the creator can remove this entry'};
  const sheet = joinEntriesSheet_(), values = sheet.getDataRange().getValues();
  const headers = values[0].map(String), idx = headerIndex_(headers), now = new Date();
  for (let r=values.length-1;r>=1;r--) {
    if (String(values[r][idx.match_id]||'').trim() === matchId) {
      sheet.getRange(r+1,idx.status+1).setValue('REMOVED');
      sheet.getRange(r+1,idx.updated_at+1).setValue(now);
    }
  }
  return {success:true,status:'REMOVED',match_id:matchId};
}
function listPublishedGames_() {
  const sheet = joinEntriesSheet_(), values = sheet.getDataRange().getValues();
  if (values.length < 2) return {success:true,games:[]};
  const headers = values[0].map(String), idx = headerIndex_(headers), games=[];
  for (let r=1;r<values.length;r++) {
    const matchId=String(values[r][idx.match_id]||'').trim();
    if (!matchId || String(values[r][idx.status]||'').trim().toUpperCase() !== 'ACTIVE') continue;
    const match=getMatchRaw_(matchId);
    if (!match) continue;
    games.push({match_id:matchId,admin:match.admin,published_at:values[r][idx.published_at] instanceof Date ? values[r][idx.published_at].toISOString() : String(values[r][idx.published_at]||''),players:getPlayers_(matchId).map(p=>({player_id:p.player_id,name:p.name}))});
  }
  games.sort((a,b)=>String(a.published_at).localeCompare(String(b.published_at)));
  return {success:true,games:games};
}

/* =====================================================
 * 13. TEST FUNCTIONS
 * ===================================================== */

function testCreateCourse() {
  const result = createCourse_({
    course_name: 'TEST GOLF COURSE',
    holes: [
      {par:4, si:7},
      {par:5, si:3},
      {par:4, si:11},
      {par:4, si:1},
      {par:3, si:15},
      {par:5, si:5},
      {par:4, si:9},
      {par:3, si:17},
      {par:4, si:13},
      {par:4, si:8},
      {par:5, si:4},
      {par:4, si:12},
      {par:3, si:18},
      {par:4, si:6},
      {par:5, si:2},
      {par:4, si:10},
      {par:3, si:16},
      {par:4, si:14}
    ]
  });

  Logger.log(JSON.stringify(result, null, 2));
}

function testGetCourses() {
  Logger.log(JSON.stringify(getCourses_(), null, 2));
}

