const API='https://script.google.com/macros/s/AKfycbyqhh0p4Cp1toE8iQAkMmlS6jGb-LCkfW4J2Pwe1gNQ7PYXXL7luQFxEGaB4ESGH9KN/exec';
const state={view:'home',courses:[],match:null,course:null,players:[],scores:[],handicaps:{},selectedPlayers:4,currentMode:'F9',gameMultiplier:10,baccaratMultiplier:5,currentHole:1,currentPlayer:null,isAdmin:false,adminName:'',editingScore:null,editingScores:null,editingHole:null,scoreMap:{},courseMap:{},qr:false,error:''};
const $=id=>document.getElementById(id); const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function post(data){return fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data),cache:'no-store'}).then(async r=>{if(!r.ok)throw new Error(`API request failed (${r.status})`);const out=await r.json();if(!out||typeof out!=='object')throw new Error('Invalid API response');return out})}
function get(action,params={}){const q=new URLSearchParams({action,...params,_ts:String(Date.now())});return fetch(API+'?'+q.toString(),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`API request failed (${r.status})`);return r.json()})}
function localName(gameId){return localStorage.getItem('golf-name-'+gameId)||''} function saveLocalName(gameId,name){localStorage.setItem('golf-name-'+gameId,name)} function saveLastJoin(gameId,name){localStorage.setItem('golf-last-game-id',String(gameId||'').trim());localStorage.setItem('golf-last-player-name',String(name||'').trim());saveLocalName(gameId,name)} function restoreLastJoin(){return {gameId:localStorage.getItem('golf-last-game-id')||'',name:localStorage.getItem('golf-last-player-name')||''}}
function render(){document.getElementById('app').innerHTML=state.view==='home'?homeView():state.view==='new'?newGameView():state.view==='join'?joinView():state.view==='courses'?coursesView():state.view==='courseEditor'?courseEditorView():scoreView();}
function shell(content,opts={}){return `<div class="app-shell"><header class="header"><div>${opts.back?`<button class="back" onclick="goHome()">‹ Home</button>`:`<div class="brand">Golf Game${state.match?` <small>${esc(state.match.match_id)}</small>`:''}</div>`}</div>${opts.qr?`<div class="header-actions"><button class="header-icon-btn refresh-btn" onclick="refreshMatch()" aria-label="Refresh scores" title="Refresh scores">↻</button></div>`:''}</header>${content}</div>`}
function homeView(){return shell(`<main class="container home home-v61"><section class="home-hero"><img src="./home-golf-hero.jpg" alt="Tom and Jerry enjoying a round of golf" fetchpriority="high"><div class="home-hero-shade"></div><div class="home-hero-caption"><span class="home-eyebrow"><span class="home-dot"></span> YOUR ROUND STARTS HERE</span><h1>Tom &amp; Jerry Group</h1><p>Play together. Track every hole.</p></div></section><section class="home-menu" aria-label="Main menu"><button class="home-menu-card join-card" onclick="show('join')"><span class="home-menu-icon">⛳</span><span class="home-menu-copy"><strong>Join Game</strong><small>Enter a game with your group</small></span><span class="arrow">›</span></button><button class="home-menu-card new-card" onclick="show('new')"><span class="home-menu-icon">🏆</span><span class="home-menu-copy"><strong>New Game</strong><small>Create a round · Admin</small></span><span class="arrow">›</span></button><button class="home-menu-card course-card" onclick="show('courses')"><span class="home-menu-icon">🚩</span><span class="home-menu-copy"><strong>Course Management</strong><small>View and manage course PAR / SI</small></span><span class="arrow">›</span></button></section><div class="home-mode-chips" aria-label="Available game modes"><span>Front 9</span><span>Back 9</span><span>Baccarat</span></div><p class="home-footnote">Scores sync with your game database.</p></main>`)}
function newGameView(){return shell(`<main class="container"><div class="card"><div class="section-head"><div class="section-title">New Game</div></div><div id="new-error"></div><div class="form-row"><div class="label">Game ID</div><input id="gameId" class="field" placeholder="Enter Game ID"></div><div class="form-row"><div class="label">Course</div><select id="courseId" class="field"><option value="">Select Course</option>${state.courses.map(c=>`<option value="${esc(c.course_id)}">${esc(c.course_name)}</option>`).join('')}</select></div><div class="form-row"><div class="label">Players</div><div class="num-row">${[2,3,4,5,6].map(n=>`<button class="num-btn ${state.selectedPlayers===n?'active':''}" onclick="selectPlayers(${n})">${n}</button>`).join('')}</div></div><div class="form-row"><div class="label">Player Names</div><div class="player-grid">${Array.from({length:state.selectedPlayers},(_,i)=>`<input class="field pname" data-i="${i}" placeholder="Player ${i+1}">`).join('')}</div></div><div class="card" style="margin:16px 0 0;padding:14px;background:#f5faf8;border-color:#d8ebe5"><div class="section-head"><div><div class="section-title" style="font-size:16px">Handicap</div><div style="font-size:12px;color:#667872">Set pair handicaps before Start.</div></div><button class="link-btn" onclick="openHandicap()">Edit ›</button></div></div><button class="start primary" onclick="startGame()">Start</button></div></main>`);loadCoursesIfNeeded()}
function joinView(){const last=restoreLastJoin();return shell(`<main class="container"><div class="card"><div class="section-title" style="margin-bottom:18px">Join Game</div><div id="join-error"></div><div class="form-row"><div class="label">Game ID</div><input id="joinGameId" class="field" placeholder="Enter Game ID" value="${esc(last.gameId)}" autocomplete="off"></div><div class="form-row"><div class="label">Your Name</div><input id="joinName" class="field" placeholder="Enter your name" value="${esc(last.name)}" autocomplete="name"></div><button class="start primary" onclick="joinGame()">Join</button><div style="margin-top:12px;color:#697972;font-size:12px">Last Game ID and player name are remembered on this device. You can change them anytime.</div></div></main>`)}
function coursesView(){return shell(`<main class="container"><div class="card"><div class="section-head"><div class="section-title">Course Management</div><button class="link-btn" onclick="newCoursePrompt()">＋ Add Course</button></div><div class="course-list">${state.courses.map(c=>`<button class="course-item" onclick="courseDetail('${esc(c.course_id)}')"><span><strong>${esc(c.course_name)}</strong><small>18 holes · Tap to view</small></span><span>›</span></button>`).join('')||'<div class="course-empty">No courses yet. Tap Add Course to create one.</div>'}</div></div></main>`)}
function courseDetail(id){const c=state.courses.find(x=>x.course_id===id);if(!c)return;document.getElementById('app').innerHTML=shell(`<main class="container"><div class="card course-detail"><div class="section-head"><div class="section-title">${esc(c.course_name)}</div><button class="link-btn" onclick="editCourse('${esc(c.course_id)}')">✎ Edit</button></div><table><thead><tr><th>Hole</th><th>PAR</th><th>Index</th></tr></thead><tbody>${c.holes.map(h=>`<tr><td>${h.hole}</td><td>${h.par}</td><td>${h.si}</td></tr>`).join('')}</tbody></table><button class="start secondary course-back" onclick="show('courses')">Back to Courses</button></div></main>`,{back:true})}
function courseEditorView(){const c=state.courseDraft;return shell(`<main class="container"><div class="card course-editor"><div class="section-head"><div class="section-title">${c.course_id?'Edit Course':'Add Course'}</div><button class="link-btn" onclick="show('courses')">Cancel</button></div><div id="course-error"></div><label class="label">Course Name</label><input id="courseName" class="field" maxlength="100" placeholder="Enter course name" value="${esc(c.course_name||'')}"><div class="course-hole-head"><span>Hole</span><span>PAR</span><span>SI</span></div><div class="course-hole-grid">${Array.from({length:18},(_,i)=>{const h=(c.holes||[]).find(x=>Number(x.hole)===i+1)||{par:4,si:i+1};return `<div class="course-hole-row"><b>${i+1}</b><select class="field course-par" aria-label="Hole ${i+1} PAR">${[3,4,5,6].map(n=>`<option value="${n}" ${Number(h.par)===n?'selected':''}>${n}</option>`).join('')}</select><select class="field course-si" aria-label="Hole ${i+1} SI">${Array.from({length:18},(_,n)=>n+1).map(n=>`<option value="${n}" ${Number(h.si)===n?'selected':''}>${n}</option>`).join('')}</select></div>`}).join('')}</div><button class="start primary" onclick="saveCourse()">Save Course</button></div></main>`,{back:true})}
function selectPlayers(n){state.selectedPlayers=n;render()}
async function loadCoursesIfNeeded(){if(state.courses.length)return;try{const r=await get('getCourses');if(r.success){state.courses=r.courses;updateCourseSelect()}}catch(e){console.warn('getCourses failed',e)}}
function updateCourseSelect(){const el=$('courseId');if(!el)return;const current=el.value;el.innerHTML='<option value="">Select Course</option>'+state.courses.map(c=>`<option value="${esc(c.course_id)}">${esc(c.course_name)}</option>`).join('');if(current)el.value=current}
async function show(v){state.view=v;state.error='';render();if(v==='new'||v==='courses'){await loadCoursesIfNeeded();if(v==='courses')render()}}
function goHome(){state.view='home';render()}
async function startGame(){const err=$('new-error');err.innerHTML='';const gameId=$('gameId').value.trim(),courseId=$('courseId').value, names=[...document.querySelectorAll('.pname')].map(x=>x.value.trim());if(!gameId||!courseId||names.some(n=>!n)||new Set(names.map(n=>n.toLowerCase())).size!==names.length){err.innerHTML='<div class="error">Enter Game ID, Course and unique player names.</div>';return}const r=await post({action:'createMatch',match_id:gameId,admin:names[0],course_id:courseId,players:names,handicaps:state.handicaps,baccarat_enabled:state.newBaccaratEnabled||names.map(()=>true)});if(!r.success){err.innerHTML=`<div class="error">${esc(r.error)}</div>`;return}if(Number(r.handicap_rows||0)!==names.length*(names.length-1)){err.innerHTML='<div class="error">Handicap was not saved. Please run setupDatabase() and redeploy the Apps Script.</div>';return}state.adminName=names[0];state.isAdmin=true;saveLastJoin(gameId,names[0]);await openMatch(gameId,names[0],true)}
async function joinGame(){
 const err=$('join-error'); if(!err)return; err.innerHTML='';
 const id=$('joinGameId')?.value.trim()||'',name=$('joinName')?.value.trim()||'';
 if(!id||!name){err.innerHTML='<div class="error">Enter Game ID and your name.</div>';return}
 const btn=document.querySelector('.join-submit')||document.querySelector('#join-error')?.parentElement?.querySelector('button.start');
 const original=btn?.textContent||'Join'; if(btn){btn.disabled=true;btn.textContent='Joining…';btn.setAttribute('aria-busy','true')}
 try{
   const r=await Promise.race([post({action:'joinMatch',match_id:id,name}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Request timed out. Check your internet connection and try again.')),15000))]);
   if(!r||!r.success)throw new Error(r?.error||'Could not join this game. Check the Game ID and player name.');
   saveLastJoin(id,name);state.adminName='';state.isAdmin=false;
   await openMatch(id,name,false);
 }catch(e){console.error('Join Game failed:',e);err.innerHTML=`<div class="error">${esc(e?.message||'Join failed. Please try again.')}</div>`}
 finally{if(btn){btn.disabled=false;btn.textContent=original;btn.removeAttribute('aria-busy')}}
}
function baccaratEnabledValue(v){return !(v===false||v===0||String(v).trim().toLowerCase()==='false'||String(v).trim()==='0'||String(v).trim().toLowerCase()==='no')}
async function openMatch(id,name,isAdmin){let r,s,lastError;for(let attempt=0;attempt<5;attempt++){try{[r,s]=await Promise.all([get('getMatch',{match_id:id}),get('getScores',{match_id:id})]);if(r&&r.success)break;lastError=r&&r.error||'Game not found';}catch(e){lastError=e.message||String(e)}if(attempt<4)await new Promise(resolve=>setTimeout(resolve,400*(attempt+1)));}if(!r||!r.success){alert(lastError||'Game not found');return}state.match=r.match;state.gameMultiplier=Number(r.match.pnl_settings?.game_multiplier??10);state.baccaratMultiplier=Number(r.match.pnl_settings?.baccarat_multiplier??5);state.players=(r.players||[]).map(p=>({...p,baccarat_enabled:baccaratEnabledValue(p.baccarat_enabled)}));state.course=r.course;state.courseMap={};(state.course.holes||[]).forEach(h=>state.courseMap[Number(h.hole)]=h);state.handicaps=r.handicaps||{};state.scores=s.success?s.scores:[];state.scoreMap={};state.scores.forEach(x=>state.scoreMap[`${x.player_id}|${Number(x.hole)}`]=x);state.currentPlayer=state.players.find(p=>p.name.toLowerCase()===name.toLowerCase())||state.players[0];state.isAdmin=isAdmin||name.toLowerCase()===String(state.match.admin||'').toLowerCase();state.view='score';render()}
async function refreshMatch(){if(!state.match||state.refreshing)return;state.refreshing=true;const btn=document.querySelector('.refresh-btn');if(btn){btn.disabled=true;btn.classList.add('spinning')}try{const id=state.match.match_id;const currentPlayerId=state.currentPlayer?.player_id;const [r,s]=await Promise.all([get('getMatch',{match_id:id}),get('getScores',{match_id:id})]);if(!r.success)throw new Error(r.error||'Refresh failed');state.match=r.match;state.gameMultiplier=Number(r.match.pnl_settings?.game_multiplier??state.gameMultiplier??10);state.baccaratMultiplier=Number(r.match.pnl_settings?.baccarat_multiplier??state.baccaratMultiplier??5);state.players=r.players||state.players;state.course=r.course||state.course;state.courseMap={};(state.course?.holes||[]).forEach(h=>state.courseMap[Number(h.hole)]=h);state.handicaps=r.handicaps||state.handicaps||{};state.scores=s.success?(s.scores||[]):[];state.scoreMap={};state.scores.forEach(x=>state.scoreMap[`${x.player_id}|${Number(x.hole)}`]=x);state.currentPlayer=state.players.find(p=>p.player_id===currentPlayerId)||state.currentPlayer||state.players[0];state.isAdmin=state.isAdmin||String(state.currentPlayer?.name||'').toLowerCase()===String(state.match.admin||'').toLowerCase();render();showToast('Updated')}catch(e){console.error(e);showToast(e.message||'Refresh failed')}finally{state.refreshing=false}}
function showToast(message){let t=document.getElementById('refresh-toast');if(!t){t=document.createElement('div');t.id='refresh-toast';t.className='toast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(window.__refreshToastTimer);window.__refreshToastTimer=setTimeout(()=>t.classList.remove('show'),1200)}
function openHandicap(){const names=[...document.querySelectorAll('.pname')].map(x=>x.value.trim());if(names.length<2||names.some(n=>!n)){alert('Enter all player names first.');return}state.handicapContext='new';state.handicapNames=names;state.handicapDraft={...state.handicaps};state.baccaratDraft={};names.forEach((n,i)=>{const saved=Array.isArray(state.newBaccaratEnabled)?state.newBaccaratEnabled[i]:undefined;state.baccaratDraft[String(i)]=saved===undefined?true:baccaratEnabledValue(saved)});const div=document.createElement('div');div.className='handicap-modal';div.id='handicapModal';div.innerHTML=handicapHTML(names);document.body.appendChild(div);bindHandicap()}
function openMatchHandicap(){if(!state.isAdmin){showToast('Only admin can change handicaps');return}state.handicapContext='match';state.handicapNames=state.players.map(p=>p.name);state.handicapDraft={...state.handicaps};state.baccaratDraft={};state.players.forEach(p=>state.baccaratDraft[p.player_id]=baccaratEnabledValue(p.baccarat_enabled));const div=document.createElement('div');div.className='handicap-modal';div.id='handicapModal';div.innerHTML=handicapHTML(state.handicapNames);document.body.appendChild(div);bindHandicap()} 
function handicapHTML(names){let h='<div class="handicap-panel"><div class="modal-top"><div class="section-title">Handicap Matrix</div><button class="close" onclick="closeHandicap()">×</button></div><div class="help">Select the handicap. <b>Negative = give strokes</b>, <b>0 = square</b>, <b>Positive = receive strokes</b>. The reverse side is automatic.</div>';
h+='<div class="section-title" style="font-size:14px;margin:12px 0 6px">Baccarat Players</div><div class="help">Tick players who participate in Baccarat. Unticked players are excluded from Baccarat points.</div><div class="baccarat-player-list">';
h+=names.map((n,i)=>{const p=state.handicapContext==='match'?state.players[i]:null;const key=p?p.player_id:String(i);const checked=state.baccaratDraft&&state.baccaratDraft[key]!==false;return `<label class="baccarat-player-option"><input type="checkbox" class="baccarat-participant" data-player-key="${key}" ${checked?'checked':''}><span>${esc(n)}</span></label>`}).join('');
h+='</div><div class="matrix-wrap"><table class="matrix"><thead><tr><th>GIVE</th>'+names.map(n=>`<th>${esc(n)}</th>`).join('')+'</tr></thead><tbody>';
names.forEach((row,i)=>{h+=`<tr><td>${esc(row)}</td>`;names.forEach((col,j)=>{if(i===j)h+='<td class="diag">—</td>';else if(j<i){const v=-(Number(state.handicapDraft[`${i}-${j}`]??0));h+=`<td class="auto-value ${v<0?'neg':v>0?'pos':'zero'}">${v>0?'+':''}${v}</td>`}else{const key=`${i}-${j}`,v=Number(state.handicapDraft[key]??0);h+=`<td><select class="handicap-select ${v<0?'neg':v>0?'pos':'zero'}" data-key="${key}">${Array.from({length:29},(_,k)=>k-14).map(n=>`<option value="${n}" ${n===v?'selected':''}>${n>0?'+':''}${n}</option>`).join('')}</select></td>`}});h+='</tr>'});
h+='</tbody></table></div><div class="legend"><span class="neg">● -14 to -1 Give</span><span class="zero">● 0 Square</span><span class="pos">● +1 to +14 Receive</span></div><div class="modal-actions"><button class="cancel" onclick="closeHandicap()">Cancel</button><button class="save" onclick="saveHandicap()">Save</button></div></div>';return h}
function bindHandicap(){document.querySelectorAll('.handicap-select').forEach(s=>s.addEventListener('change',()=>{const v=Number(s.value);state.handicapDraft[s.dataset.key]=v;s.className='handicap-select '+(v<0?'neg':v>0?'pos':'zero');document.getElementById('handicapModal').innerHTML=handicapHTML(state.handicapNames);bindHandicap()}));document.querySelectorAll('.baccarat-participant').forEach(c=>c.addEventListener('change',()=>{state.baccaratDraft[c.dataset.playerKey]=c.checked}))}
async function saveHandicap(){const draft={...state.handicapDraft};if(state.handicapContext==='match'){const btn=document.querySelector('#handicapModal .save');if(btn){btn.disabled=true;btn.textContent='Saving…'}const r=await post({action:'saveHandicaps',match_id:state.match.match_id,player_ids:state.players.map(p=>p.player_id),handicaps:draft});if(!r.success){alert(r.error||'Could not save handicaps');if(btn){btn.disabled=false;btn.textContent='Save'}return}let br;try{br=await post({action:'saveBaccaratPlayers',match_id:state.match.match_id,players:state.players.map(p=>({player_id:p.player_id,baccarat_enabled:baccaratEnabledValue(state.baccaratDraft[p.player_id])}))})}catch(e){br={success:false,error:e.message||String(e)}}if(!br.success||Number(br.updated)!==state.players.length){alert((br.error||('Baccarat participation saved for '+Number(br.updated||0)+' of '+state.players.length+' players. Update and redeploy the Apps Script, then save again.')));if(btn){btn.disabled=false;btn.textContent='Save'}return}state.handicaps=draft;state.players.forEach(p=>p.baccarat_enabled=baccaratEnabledValue(state.baccaratDraft[p.player_id]));closeHandicap();render();showToast('Handicaps saved');return}state.handicaps=draft;state.newBaccaratEnabled=state.handicapNames.map((n,i)=>state.baccaratDraft[String(i)]!==false);closeHandicap()}
function closeHandicap(){document.getElementById('handicapModal')?.remove()}
function displayPlayers(){if(!state.currentPlayer||!state.match)return state.players;const me=state.currentPlayer;const admin=state.players.find(p=>String(p.name).toLowerCase()===String(state.match.admin||'').toLowerCase());const ordered=[me];if(admin&&admin.player_id!==me.player_id)ordered.push(admin);state.players.forEach(p=>{if(!ordered.some(x=>x.player_id===p.player_id))ordered.push(p)});return ordered}
function scoreFor(pid,hole){return state.scoreMap[`${pid}|${Number(hole)}`]||{score:'',up:false}}
function courseHole(hole){return state.courseMap[Number(hole)]||null}
function getPairHandicap(a,b){const ia=state.players.findIndex(p=>p.player_id===a),ib=state.players.findIndex(p=>p.player_id===b);if(ia<0||ib<0)return 0;const key=ia<ib?`${ia}-${ib}`:`${ib}-${ia}`;const base=Number(state.handicaps[key]||0);return ia<ib?base:-base}
function segmentStrokeCount(total,mode){const n=Math.abs(Number(total)||0);if(mode==='F9'||mode==='B9')return n/2;return n}
function strokeValueForHole(a,b,hole){const hc=getPairHandicap(a,b);if(hc===0)return 0;const mode=hole<=9?'F9':'B9';const count=segmentStrokeCount(hc,mode);if(!count)return 0;const start=hole<=9?1:10;const end=hole<=9?9:18;const candidates=(state.course?.holes||[]).filter(x=>Number(x.hole)>=start&&Number(x.hole)<=end).sort((x,y)=>Number(x.si)-Number(y.si));const absCount=Math.abs(count);const full=Math.floor(absCount);const half=absCount-full;const idx=candidates.findIndex(x=>Number(x.hole)===Number(hole));if(idx<0||idx>=full+(half?1:0))return 0;const amount=idx<full?1:0.5;return hc<0?-amount:amount}
function strokesFor(a,b,hole){return strokeValueForHole(a,b,hole)}
function fmtStroke(n){if(!n)return '0';return `${n>0?'+':''}${Number.isInteger(n)?n:n.toFixed(1)}`}
function segmentHandicap(a,b,mode){const hc=getPairHandicap(a,b);const n=segmentStrokeCount(hc,mode);return hc<0?-n:n}
function relative(a,b,hole){const sa=Number(scoreFor(a,hole).score),sb=Number(scoreFor(b,hole).score);if(!sa||!sb)return 'S';const stroke=strokesFor(a,b,hole);const adjA=sa-stroke;return adjA<sb?'W':adjA>sb?'L':'S'}
function cellClass(viewer,pid,hole){/* Handicap borders describe the opponent's stroke advantage from the current viewer's perspective. Never paint the viewer's own score cells red/blue. */if(pid===viewer)return '';const st=strokesFor(viewer,pid,hole);if(st>0)return 'benefit';if(st<0)return 'disadvantage';return ''}
function isBirdie(score,par){return score&&score<=par-1}
function scoreMarkup(pid,hole){const s=scoreFor(pid,hole);if(s.score==='')return '<span style="color:#a1aaa6">–</span>';const par=Number(courseHole(hole)?.par||4);const score=Number(s.score);if(score<par)return `<span class="double-circle">${s.score}</span>`;if(score===par)return `<span class="circle">${s.score}</span>`;return `<span>${s.score}</span>`}
function pairOutcomes(viewer,opp,mode){const holes=mode==='F9'?Array.from({length:9},(_,i)=>i+1):Array.from({length:9},(_,i)=>i+10);let margin=0;let decisionAt=null;const rows=[];for(const h of holes){const a=Number(scoreFor(viewer,h).score),b=Number(scoreFor(opp,h).score);let r='S';if(a&&b){r=relative(viewer,opp,h);if(r==='W')margin++;else if(r==='L')margin--}const remainingAfter=holes[holes.length-1]-h;if(decisionAt===null&&a&&b&&Math.abs(margin)>remainingAfter)decisionAt=h;rows.push({h,r,margin,remainingAfter,decisionAt})}return {holes,rows,decisionAt,finalMargin:margin}}
function fmtState(n,wordUp='UP',wordDown='DW'){if(n>0)return `${n}${wordUp}`;if(n<0)return `${Math.abs(n)}${wordDown}`;return 'SQUARE'}
function matchStatus(viewer,opp,hole){
  const mode=state.currentMode==='B9'?'B9':'F9';
  const {holes,rows}=pairOutcomes(viewer,opp,mode);
  const idx=rows.findIndex(x=>x.h===hole); if(idx<0)return '–';
  const row=rows[idx], lastIdx=rows.length-1;
  const hasScores=i=>{const a=Number(scoreFor(viewer,rows[i].h).score),b=Number(scoreFor(opp,rows[i].h).score);return a>0&&b>0;};

  // Determine which scoring path starts first. Once Tommy/Buy starts, keep
  // that path for the rest of the segment; GG is only used if it occurs first.
  let triggerIdx=-1, ggIdx=-1;
  for(let i=0;i<lastIdx;i++){
    if(!hasScores(i)) continue;
    if(triggerIdx<0 && rows[i].margin!==0 && Math.abs(rows[i].margin)===rows[i].remainingAfter) triggerIdx=i;
    if(ggIdx<0 && Math.abs(rows[i].margin)>rows[i].remainingAfter) ggIdx=i;
  }
  const tommyBuyFirst=triggerIdx>=0 && (ggIdx<0 || triggerIdx<ggIdx);

  if(ggIdx>=0 && idx>=ggIdx && !tommyBuyFirst){
    if(idx===ggIdx)return `${Math.abs(row.margin)}${row.margin>0?'UP':'DW'}/GG`;
    let post=0;
    for(let i=ggIdx+1;i<=idx;i++){if(rows[i].r==='W')post++;else if(rows[i].r==='L')post--;}
    return fmtState(post,'UP','DW').replace('SQUARE','SQ');
  }

  if(triggerIdx>=0 && idx>=triggerIdx && tommyBuyFirst){
    const tr=rows[triggerIdx];
    if(idx<triggerIdx)return fmtState(row.margin).replace('SQUARE','SQ');
    if(idx===triggerIdx)return `${Math.abs(tr.margin)}${tr.margin>0?'UP':'DW'}/${Math.abs(tr.margin)}GO`;
    let decisionIdx=-1;
    for(let i=triggerIdx+1;i<=idx;i++){
      if(hasScores(i)&&Math.abs(rows[i].margin)>rows[i].remainingAfter){decisionIdx=i;break;}
    }
    const t=row.margin-tr.margin;
    // Established B9 lookup sequence, locked into Tommy/Buy after it starts.
    if(mode==='B9' && tr.h===15 && tr.margin===-3 && idx>triggerIdx &&
       rows.slice(triggerIdx+1,idx+1).every(x=>x.r==='S')){
      if(idx===triggerIdx+1)return 'T+1';
      if(idx===triggerIdx+2)return 'G/T+1';
      if(idx===triggerIdx+3)return 'T+1/B0';
    }
    if(decisionIdx>=0&&idx>=decisionIdx){
      if(idx===decisionIdx)return `G/T${t>0?'+':''}${t}`;
      const b=row.margin-rows[decisionIdx].margin;
      // Show both Tommy and Buy on the final hole after Game is decided.
      return `T${t>0?'+':''}${t}/B${b>0?'+':''}${b}`;
    }
    return `T${t>0?'+':''}${t}`;
  }

  if(idx===lastIdx&&idx>0&&rows[idx-1].margin===0&&row.margin!==0){
    return `G/1${row.margin>0?'UP':'DW'}`;
  }
  return fmtState(row.margin).replace('SQUARE','SQ');
}
function matchStatusMarkup(raw){
  const text=String(raw);
  const go=text.match(/^(\d+)(UP|DW)\/(\d+)GO$/);
  if(go)return `<span class="status-stack"><span>${go[1]}${go[2]}</span><span>${go[3]}GO</span></span>`;
  const gg=text.match(/^(\d+)(UP|DW)\/GG$/);
  if(gg)return `<span class="status-stack"><span>${gg[1]}${gg[2]}</span><span>Game Over</span></span>`;
  if(text==='G')return 'Game';
  const gamePair=text.match(/^G\/(.+)$/);
  if(gamePair)return `<span class="status-stack"><span>Game</span><span>${gamePair[1]}</span></span>`;
  const tommyBuy=text.match(/^(T[+-]?\d+)\/(B[+-]?\d+)$/);
  if(tommyBuy)return `<span class="status-stack"><span>${tommyBuy[1]}</span><span>${tommyBuy[2]}</span></span>`;
  return text==='SQUARE'?'SQ':text;
}
function matchStatusClass(text){if(text==='G'||text.startsWith('G/')||text.endsWith('/GG'))return 'status-game';if(/UP/.test(text)||/T\+|B\+/.test(text))return 'status-up';if(/DW/.test(text)||/T-|B-/.test(text))return 'status-down';return 'status-square'}
function matchHandicapLabel(viewer,opp){const mode=state.currentMode==='B9'?'B9':'F9';const n=segmentHandicap(viewer,opp,mode);if(n>0)return `<span class="hcp-receive">Receive ${fmtStroke(n)}</span>`;if(n<0)return `<span class="hcp-give">Give ${fmtStroke(n)}</span>`;return '<span class="hcp-zero">0 strokes</span>'}
function scoreView(){return shell(`<main class="score-page"><div class="mode-tabs">${['F9','B9','Baccarat','P&L'].map(m=>`<button class="mode-tab ${state.currentMode===m?'active':''}" onclick="setMode('${m}')">${m}</button>`).join('')}</div>${state.currentMode==='P&L'?pnlView():state.currentMode==='Baccarat'?baccaratTable():matchTable()}${state.editingScores?bulkScoreEditor():state.editingScore?scoreEditor():''}${state.qr?qrModal():''}</main>`,{qr:true})}
function holesForMode(){return state.currentMode==='F9'?Array.from({length:9},(_,i)=>i+1):state.currentMode==='B9'?Array.from({length:9},(_,i)=>i+10):Array.from({length:18},(_,i)=>i+1)}
function matchTable(){const holes=holesForMode();return `<div class="score-scroll"><table class="score-table match-score-table"><thead><tr><th>Holes</th>${holes.map(h=>`<th>${h}</th>`).join('')}</tr><tr><th>Index</th>${holes.map(h=>`<th>${courseHole(h)?.si||''}</th>`).join('')}</tr><tr><th>PAR</th>${holes.map(h=>`<th>${courseHole(h)?.par||''}</th>`).join('')}</tr></thead><tbody>${displayPlayers().map((p,pi)=>`<tr class="player-row ${pi%2?'alt':''}"><td class="player-name">${esc(p.name)}${p.player_id===state.currentPlayer.player_id?'<div class="you">YOU</div>':`<div class="match-hcp">${matchHandicapLabel(state.currentPlayer.player_id,p.player_id)}</div>`}</td>${holes.map(h=>`<td class="score-cell ${cellClass(state.currentPlayer.player_id,p.player_id,h)} ${((p.player_id===state.currentPlayer.player_id)||state.isAdmin)?'editable':''}" onclick="editScore('${p.player_id}',${h})">${scoreMarkup(p.player_id,h)}</td>`).join('')}</tr>${p.player_id!==state.currentPlayer.player_id?`<tr class="stroke-row ${pi%2?'alt':''}"><td class="match-status-label-cell"></td>${holes.map(h=>{const raw=matchStatus(state.currentPlayer.player_id,p.player_id,h);const ms=matchStatusMarkup(raw);return `<td class="match-status-cell ${matchStatusClass(raw)}">${ms}</td>`}).join('')}</tr>`:''}`).join('')}</tbody></table></div>${state.isAdmin?'<div class="below-handicap-tools"><button class="link-btn" onclick="openMatchHandicap()">⚖ Edit Handicap</button></div>':''}${resultPanel()}`}
const RESULT_TABLES={
  1:{'W':4,'S':3,'L':-1},
  2:{'WW':5,'WL':2,'WS':4,'LW':3,'LS':2,'LL':-1,'SW':5,'SS':3,'SL':1},
  3:{'WWW':5,'WWS':5,'WWL':4,'WLW':4,'WLL':1,'WLS':2,'WSW':5,'WSL':2,'WSS':4,'SWW':5,'SWL':3,'SWS':5,'SLW':3,'SLL':1,'SLS':1,'SSW':5,'SSL':1,'SSS':3,'LWW':5,'LWL':1,'LWS':3,'LLW':2,'LLL':-1,'LLS':2,'LSW':4,'LSL':1,'LSS':2},
  4:{
    'WWWW':5,'WWWL':5,'WWWS':5,'WWLW':5,'WWLL':2,'WWLS':4,'WWSW':5,'WWSL':4,'WWSS':5,
    'WLWW':5,'WLWL':2,'WLWS':4,'WLLW':2,'WLLL':1,'WLLS':1,'WLSW':4,'WLSL':1,'WLSS':2,
    'WSWW':5,'WSWL':4,'WSWS':5,'WSLW':4,'WSLL':1,'WSLS':2,'WSSW':5,'WSSL':2,'WSSS':4,
    'SWWW':5,'SWWL':5,'SWWS':5,'SWLW':5,'SWLL':1,'SWLS':3,'SWSW':5,'SWSL':3,'SWSS':5,
    'SLWW':5,'SLWL':1,'SLWS':3,'SLLW':1,'SLLL':1,'SLLS':1,'SLSW':3,'SLSL':1,'SLSS':1,
    'SSWW':5,'SSWL':1,'SSWS':3,'SSLW':1,'SSLL':1,'SSLS':1,'SSSW':3,'SSSL':1,'SSSS':3,
    'LWWW':5,'LWWL':3,'LWWS':5,'LWLW':3,'LWLL':1,'LWLS':1,'LWSW':5,'LWSL':1,'LWSS':3,
    'LSWW':5,'LSWL':2,'LSWS':4,'LSLW':2,'LSLL':1,'LSLS':1,'LSSW':4,'LSSL':1,'LSSS':2,
    'LLWW':4,'LLWL':1,'LLWS':2,'LLLW':2,'LLLL':-1,'LLLS':2,'LLSW':3,'LLSL':1,'LLSS':2
  }
};
function pairHoleResults(aid,bid,mode){
  const holes=mode==='F9'?Array.from({length:9},(_,i)=>i+1):Array.from({length:9},(_,i)=>i+10);
  let margin=0; const rows=[];
  for(const h of holes){
    const a=Number(scoreFor(aid,h).score), b=Number(scoreFor(bid,h).score); let r='S';
    if(a&&b) r=relative(aid,bid,h);
    if(r==='W') margin++; else if(r==='L') margin--;
    const remainingAfter=holes[holes.length-1]-h;
    rows.push({h,r,margin,remainingAfter});
  }
  return {holes,rows};
}
function resultForPair(aid,bid,mode){
  // Before play starts, an empty scorecard must show zero rather than the
  // all-square settlement value (-1). Keep the existing settlement once scores exist.
  const holes=mode==='F9'?Array.from({length:9},(_,i)=>i+1):Array.from({length:9},(_,i)=>i+10);
  const hasAnyPairScores=holes.some(h=>{
    const a=Number(scoreFor(aid,h).score), b=Number(scoreFor(bid,h).score);
    return a>0 && b>0;
  });
  if(!hasAnyPairScores) return {game:0,tommy:0,buy:0,bonus:0,satay:0,total:0};
  // Calculate each pair only from its own scores and directional handicap.
  const {holes:playedHoles,rows}=pairHoleResults(aid,bid,mode);
  const final=rows[rows.length-1];
  const beforeFinal=rows.length>1?rows[rows.length-2].margin:0;
  let decisionIndex=null;
  let startMargin=0;
  let normalDecisionIndex=-1;
  for(let i=1;i<rows.length;i++){
    if(Math.abs(rows[i-1].margin)>0 && Math.abs(rows[i-1].margin)===rows[i-1].remainingAfter){
      const prior=rows[i-1].margin, result=rows[i].r;
      const nextStillToGo=Math.abs(rows[i].margin)>0 && Math.abs(rows[i].margin)===rows[i].remainingAfter;
      const closes=(prior>0 && result!=='L') || (prior<0 && result==='W' && !nextStillToGo);
      if(closes){normalDecisionIndex=i;break;}
    }
  }
  let ggIndex=-1, tommyBuyIndex=-1;
  for(let i=0;i<rows.length-1;i++){
    if(ggIndex<0 && Math.abs(rows[i].margin)>rows[i].remainingAfter) ggIndex=i;
    if(tommyBuyIndex<0 && rows[i].margin!==0 && Math.abs(rows[i].margin)===rows[i].remainingAfter) tommyBuyIndex=i;
  }
  // The first scoring path to trigger owns the rest of the 9-hole segment.
  // A Tommy/Buy trigger blocks GG later; an earlier GG blocks Tommy/Buy.
  const tommyBuyFirst=tommyBuyIndex>=0 && (ggIndex<0 || tommyBuyIndex<ggIndex);
  if(tommyBuyFirst) startMargin=rows[tommyBuyIndex].margin;
  for(let i=0;i<rows.length;i++){
    if(Math.abs(rows[i].margin)>rows[i].remainingAfter && !tommyBuyFirst){decisionIndex=i;startMargin=i===0?0:rows[i-1].margin;break;}
  }
  let game=0,tommy=0,buy=0,satay=0;
  if(ggIndex>=0 && ggIndex<rows.length-1 && !tommyBuyFirst){
    decisionIndex=ggIndex;
    const ggMargin=rows[decisionIndex].margin;
    game=ggMargin>0?3:-3;
    tommy=0; buy=0;
    let postMargin=0;
    for(let i=decisionIndex+1;i<rows.length;i++){if(rows[i].r==='W')postMargin++;else if(rows[i].r==='L')postMargin--;}
    satay=postMargin>0?2:postMargin<0?-2:0;
  }else if(tommyBuyFirst || decisionIndex!==null){
    if(normalDecisionIndex>=0) decisionIndex=normalDecisionIndex;
    else if(tommyBuyFirst && decisionIndex===null){
      decisionIndex=rows.findIndex((row,i)=>i>tommyBuyIndex && Math.abs(row.margin)>row.remainingAfter);
      if(decisionIndex<0) decisionIndex=rows.length-1;
      // The Tommy/Buy path starts from the recorded TO-GO margin, not from
      // a tied-game baseline; keep the original lookup-table scoring active.
      startMargin=rows[tommyBuyIndex].margin;
    }
    const finalMargin=final.margin;
    if(startMargin===0){
      // A tied game decided on the final hole: winner gets Game +/-3 and Tommy +/-1.
      // If the final hole is square, the Game result is a tie (0), not -1.
      if(finalMargin!==0){game=finalMargin>0?3:finalMargin<0?-3:0;tommy=0;buy=0;}
      else {game=0;tommy=0;buy=0;}
    }else{
      // Look up the complete sequence from the initial X-UP / X-TO-GO state,
      // not merely the final holes after the game becomes mathematically decided.
      const lookupStartIndex=rows.findIndex((row,i)=>
        i>0 && Math.abs(rows[i-1].margin)===rows.length-i
      );
      const tableStartIndex=lookupStartIndex>=0 && lookupStartIndex<=decisionIndex
        ? lookupStartIndex : decisionIndex;
      const tableStartMargin=tableStartIndex>0?rows[tableStartIndex-1].margin:startMargin;
      const seq=rows.slice(tableStartIndex).map(x=>x.r).join('');
      const absStart=Math.min(4,Math.max(1,Math.abs(tableStartMargin)));
      const table=RESULT_TABLES[absStart];
      let total;
      if(tableStartMargin>0){
        total=table?.[seq];
      }else{
        const mirrored=seq.replace(/[WL]/g,c=>c==='W'?'L':c==='L'?'W':'S');
        const mirroredTotal=table?.[mirrored];
        total=mirroredTotal==null?undefined:-mirroredTotal;
      }
      if(total==null){
        // Fallback only for incomplete/unsupported sequences; preserve the pair's final state.
        total=finalMargin>0?4:finalMargin<0?-4:-1;
      }
      game=finalMargin>0?3:finalMargin<0?-3:0;
      let bmargin=0;
      // Buy begins on the hole AFTER the hole where Game is decided.
      for(let i=decisionIndex+1;i<rows.length;i++){
        if(rows[i].r==='W')bmargin++;else if(rows[i].r==='L')bmargin--;
      }
      buy=bmargin>0?1:bmargin<0?-1:0;
      tommy=total-game-buy;
    }
  }else if(Math.abs(beforeFinal)===1){
    // 1UP/1TOGO table; mirror it when this pair is one down before the final hole.
    const last=final.r;
    let total;
    if(beforeFinal>0) total=RESULT_TABLES[1][last];
    else {
      const mirrored=last==='W'?'L':last==='L'?'W':'S';
      total=-RESULT_TABLES[1][mirrored];
    }
    game=final.margin>0?3:final.margin<0?-3:0;
    tommy=total-game;
    buy=0;
  }else if(beforeFinal===0 && final.margin!==0){
    // The final hole alone decides a previously square match.
    game=final.margin>0?3:-3;
    tommy=0;
    buy=0;
  }else{
    // No decisive winner and the match finishes square: Game is tied (0).
    game=0;tommy=0;buy=0;
  }
  // Preserve the confirmed B9 fixed lookup case: 3DW/3GO at hole 15,
  // followed by square holes 16-18, remains on the Tommy/Buy path.
  if(mode==='B9' && tommyBuyFirst && rows[5]?.h===15 && rows[5].margin===-3 &&
     rows.slice(6).every(x=>x.r==='S')){
    game=-3; tommy=1; buy=0; satay=0;
  }
  const bonus=bonusBreakdown(aid,mode).bonus-bonusBreakdown(bid,mode).bonus;
  return {game,tommy,buy,bonus,satay,total:game+tommy+buy+bonus+satay};
}
function resultForOpponent(pid,mode){const me=state.currentPlayer.player_id;return resultForPair(me,pid,mode)}
function resultPairKey(mode,a,b){return `${mode}|${[String(a),String(b)].sort().join('|')}`}
async function toggleResultDouble(mode,a,b,checked){if(!state.isAdmin)return;const key=resultPairKey(mode,a,b);const next={...(state.match.result_doubles||{})};if(checked)next[key]=true;else delete next[key];state.match.result_doubles=next;render();try{const r=await post({action:'saveResultDouble',match_id:state.match.match_id,admin:state.currentPlayer.name,mode,p1:a,p2:b,checked});if(!r.success)throw new Error(r.error||'Save failed');showToast('Double saved')}catch(e){if(checked)delete next[key];else next[key]=true;state.match.result_doubles=next;render();alert('Could not save DB setting: '+(e.message||e));}}
function resultPanel(){
  const mode=state.currentMode==='B9'?'B9':'F9';
  const pairs=[];
  if(state.isAdmin){
    // Creator/admin can review every head-to-head result.
    for(let i=0;i<state.players.length;i++)for(let j=i+1;j<state.players.length;j++){
      const a=state.players[i],b=state.players[j];
      const r=resultForPair(a.player_id,b.player_id,mode);
      const f9=resultForPair(a.player_id,b.player_id,'F9').total;
      const b9=resultForPair(a.player_id,b.player_id,'B9').total;
      pairs.push({label:`${a.name} v ${b.name}`,r,f9,b9,a:a.player_id,b:b.player_id});
    }
  }else{
    // Non-admin players can only see their own matchups, calculated from their perspective.
    const me=state.currentPlayer;
    if(me)for(const opponent of state.players){
      if(opponent.player_id===me.player_id)continue;
      const r=resultForPair(me.player_id,opponent.player_id,mode);
      const f9=resultForPair(me.player_id,opponent.player_id,'F9').total;
      const b9=resultForPair(me.player_id,opponent.player_id,'B9').total;
      pairs.push({label:`${me.name} v ${opponent.name}`,r,f9,b9,a:me.player_id,b:opponent.player_id});
    }
  }
  return `<div class="result-card"><div class="result-title">${mode==='F9'?'Front 9 Result':'Back 9 Result'}</div><div class="result-scroll"><table class="result-table"><thead><tr><th>Opponent</th><th class="db-heading">DB</th><th>Game</th><th>Tommy</th><th>Buy</th><th>Fin</th><th>Satay</th><th>F9</th><th>B9</th><th class="grand-total-heading">Total</th></tr></thead><tbody>${pairs.map(x=>{const r=x.r;const key=resultPairKey(mode,x.a,x.b);const doubled=!!state.match.result_doubles?.[key];const segment=mode==='F9'?Number(x.f9):Number(x.b9);const adjusted=segment*(doubled?2:1);const otherMode=mode==='F9'?'B9':'F9';const otherKey=resultPairKey(otherMode,x.a,x.b);const otherDoubled=!!state.match.result_doubles?.[otherKey];const f9Doubled=mode==='F9'?doubled:otherDoubled;const b9Doubled=mode==='B9'?doubled:otherDoubled;const displayF9=Number(x.f9)*(f9Doubled?2:1);const displayB9=Number(x.b9)*(b9Doubled?2:1);const adjustedTotal=displayF9+displayB9;const mark=state.isAdmin?`<label class="db-check"><input type="checkbox" ${doubled?'checked':''} onchange="toggleResultDouble('${mode}','${x.a}','${x.b}',this.checked)"></label>`:(doubled?'<b class="db-mark">DB</b>':'<span class="db-empty">–</span>');return `<tr><td>${esc(x.label)}</td><td class="db-toggle-cell">${mark}</td><td>${fmtSigned(r.game)}</td><td>${fmtSigned(r.tommy)}</td><td>${fmtSigned(r.buy)}</td><td>${fmtSigned(r.bonus)}</td><td>${fmtSigned(r.satay||0)}</td><td class="segment-total ${resultTone(displayF9)}"><b>${fmtSigned(displayF9)}</b></td><td class="segment-total ${resultTone(displayB9)}"><b>${fmtSigned(displayB9)}</b></td><td class="grand-total-cell"><b class="grand-total ${resultTone(adjustedTotal)}">${fmtSigned(adjustedTotal)}</b></td></tr>`}).join('')}</tbody></table></div></div>`
}
function bonusBreakdown(pid,mode){const holes=mode==='F9'?Array.from({length:9},(_,i)=>i+1):Array.from({length:9},(_,i)=>i+10);const data={double3:0,double5:0,birdie:0,eagle:0,hio:0,bonus:0};const rows=holes.map(h=>{const score=Number(scoreFor(pid,h).score);const par=Number(courseHole(h)?.par||0);return {score,par}});const par3=rows.filter(x=>x.par===3);const par5=rows.filter(x=>x.par===5);if(par3.length===2&&par3.every(x=>x.score>0&&x.score<=x.par))data.double3=1;if(par5.length===2&&par5.every(x=>x.score>0&&x.score<=x.par))data.double5=1;rows.forEach(x=>{if(!x.score||!x.par)return;if(x.par===3&&x.score===1){data.hio+=12;return}if(x.score<=x.par-2){data.eagle+=6;return}if(x.score===x.par-1)data.birdie+=1});data.bonus=data.double3+data.double5+data.birdie+data.eagle+data.hio;return data}
function fmtSigned(n){return n>0?`+${n}`:String(n)}
function resultTone(n){return Number(n)>0?'result-win':Number(n)<0?'result-loss':'result-even'}
function pairBaccaratTotal(aid,bid){let total=0;for(let h=1;h<=18;h++){const pair=baccaratPairPoints(aid,bid,h);total+=pair.a;}return total}
function pairGameTotal(aid,bid){const f9=resultForPair(aid,bid,'F9').total;const b9=resultForPair(aid,bid,'B9').total;const fKey=resultPairKey('F9',aid,bid),bKey=resultPairKey('B9',aid,bid);return f9*(state.match.result_doubles?.[fKey]?2:1)+b9*(state.match.result_doubles?.[bKey]?2:1)}
function pnlView(){
 const gm=Number(state.gameMultiplier??10),bm=Number(state.baccaratMultiplier??5),me=state.currentPlayer;
 const money=n=>`${Number(n)>0?'+':''}${Number(n)}`;
 const playerRows=state.isAdmin?state.players:[me].filter(Boolean);
 const opponents=state.isAdmin?state.players:state.players.filter(p=>p.player_id!==me?.player_id);
 const gameAmount=(a,b)=>pairGameTotal(a.player_id,b.player_id)*gm;
 const baccaratAmount=(a,b)=>pairBaccaratTotal(a.player_id,b.player_id)*bm;
 const playerTotal=a=>opponents.filter(b=>b.player_id!==a.player_id).reduce((sum,b)=>sum+gameAmount(a,b),0)+opponents.filter(b=>b.player_id!==a.player_id).reduce((sum,b)=>sum+baccaratAmount(a,b),0);
 const settings=state.isAdmin?`<div class="pnl-settings"><strong>Multiplier Settings <small>(Creator only)</small></strong><div class="pnl-multipliers"><label>Game multiplier <input id="pnlGameMultiplier" type="number" min="0" step="1" value="${gm}"></label><label>Baccarat multiplier <input id="pnlBaccaratMultiplier" type="number" min="0" step="1" value="${bm}"></label><button class="primary pnl-save" onclick="savePnlSettings()">Save</button></div></div>`:`<div class="pnl-multipliers read-only"><label>Game multiplier <input type="number" value="${gm}" disabled></label><label>Baccarat multiplier <input type="number" value="${bm}" disabled></label></div>`;
 let body='';
 if(state.isAdmin){
  const head=`<tr><th>Player</th>${opponents.map(p=>`<th>vs ${esc(p.name)}</th>`).join('')}<th>Baccarat</th><th class="pnl-net-head">NET TOTAL</th></tr>`;
  let mobileBody='';
  body=state.players.map(a=>{
   let gameSum=0,bacSum=0;
   const cells=opponents.map(b=>{
    if(a.player_id===b.player_id)return '<td class="pnl-zero">—</td>';
    const v=gameAmount(a,b);gameSum+=v;
    return `<td class="${resultTone(v)}"><b>${money(v)}</b></td>`;
   }).join('');
   const pairRows=opponents.filter(b=>a.player_id!==b.player_id).map(b=>{
    const v=gameAmount(a,b);
    return `<div class="pnl-mobile-line"><span>vs ${esc(b.name)}</span><strong class="${resultTone(v)}">${money(v)}</strong></div>`;
   }).join('');
   for(const b of opponents)if(a.player_id!==b.player_id)bacSum+=baccaratAmount(a,b);
   const net=gameSum+bacSum;
   mobileBody+=`<article class="pnl-mobile-player"><h4>${esc(a.name)}</h4>${pairRows}<div class="pnl-mobile-line"><span>Baccarat</span><strong class="${resultTone(bacSum)}">${money(bacSum)}</strong></div><div class="pnl-mobile-line pnl-mobile-net"><span>NET TOTAL</span><strong class="${resultTone(net)}">${money(net)}</strong></div></article>`;
   return `<tr><th>${esc(a.name)}</th>${cells}<td class="${resultTone(bacSum)}"><b>${money(bacSum)}</b></td><td class="pnl-net ${resultTone(net)}"><b>${money(net)}</b></td></tr>`;
  }).join('');
  return `<section class="pnl-page"><div class="pnl-heading"><h2>P&amp;L <span>(Total Win / Loss)</span></h2></div>${settings}<div class="pnl-table-wrap"><h3>All Players' P&amp;L <small>(Creator view)</small></h3><div class="pnl-scroll pnl-desktop-only"><table class="pnl-table"><thead>${head}</thead><tbody>${body}</tbody></table></div><div class="pnl-mobile-list">${mobileBody}</div></div><div class="pnl-help"><h3>Calculation</h3><p>Game = (F9 Total + B9 Total after each DB multiplier) × Game multiplier.</p><p>Baccarat = sum of this player's pairwise Baccarat points × Baccarat multiplier.</p><p>NET TOTAL = Game amounts + Baccarat amount. Players can only view their own P&amp;L.</p></div></section>`;
 }
 const a=me; if(!a)return '<div class="notice">Player not found.</div>';
 let gameSum=0,bacSum=0;const rows=opponents.map(b=>{const g=gameAmount(a,b),bac=baccaratAmount(a,b);gameSum+=g;bacSum+=bac;return `<tr><td>vs ${esc(b.name)} (Game)</td><td class="${resultTone(g)}"><b>${money(g)}</b></td></tr>`}).join('');
 const net=gameSum+bacSum;
 return `<section class="pnl-page"><div class="pnl-heading"><h2>P&amp;L <span>(Total Win / Loss)</span></h2></div>${settings}<div class="pnl-table-wrap"><h3>Player: <strong>${esc(a.name)}</strong></h3><table class="pnl-table pnl-own"><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>${rows}<tr><td>Baccarat</td><td class="${resultTone(bacSum)}"><b>${money(bacSum)}</b></td></tr><tr class="pnl-net-row"><th>NET TOTAL</th><td class="pnl-net ${resultTone(net)}"><b>${money(net)}</b></td></tr></tbody></table></div><div class="pnl-help"><h3>Calculation</h3><p>Game = (F9 Total + B9 Total after each DB multiplier) × Game multiplier.</p><p>Baccarat = sum of this player's pairwise Baccarat points × Baccarat multiplier.</p><p>You can view only your own P&amp;L. Multipliers are controlled by the creator.</p></div></section>`;
}
async function savePnlSettings(){if(!state.isAdmin)return;const gm=Number(document.getElementById('pnlGameMultiplier')?.value),bm=Number(document.getElementById('pnlBaccaratMultiplier')?.value);if(!Number.isFinite(gm)||gm<0||!Number.isFinite(bm)||bm<0){alert('Multipliers must be zero or greater.');return}const btn=document.querySelector('.pnl-save');if(btn){btn.disabled=true;btn.textContent='Saving…'}try{const r=await post({action:'savePnlSettings',match_id:state.match.match_id,admin:state.currentPlayer.name,game_multiplier:gm,baccarat_multiplier:bm});if(!r.success)throw new Error(r.error||'Save failed');state.gameMultiplier=gm;state.baccaratMultiplier=bm;state.match.pnl_settings={game_multiplier:gm,baccarat_multiplier:bm};render();showToast('P&L multipliers saved')}catch(e){alert('Could not save P&L settings: '+(e.message||e));if(btn){btn.disabled=false;btn.textContent='Save'}}}
function baccaratTable(){
  const holes=Array.from({length:18},(_,i)=>i+1);
  const ordered=displayPlayers();
  const pointCell=(p,h)=>{
    const value=baccaratPoints(p.player_id,h);
    const up=!!scoreFor(p.player_id,h).up;
    const editable=state.isAdmin||p.player_id===state.currentPlayer.player_id;
    return `<td class="baccarat-point ${editable?'editable':''}" onclick="editScore('${p.player_id}',${h})"><span class="${value===0?'zero-point':value>0?'point-positive':'point-negative'} ${up?'baccarat-up-circle':''}">${value===0?'0':fmtSigned(value)}</span></td>`;
  };
  const rows=holes.map(h=>`<tr><th scope="row" class="baccarat-hole-label">${h}</th>${ordered.map(p=>pointCell(p,h)).join('')}</tr>`).join('');
  const totals=ordered.map(p=>`<td class="baccarat-total"><b>${fmtSigned(holes.reduce((sum,h)=>sum+baccaratPoints(p.player_id,h),0))}</b></td>`).join('');
  return `<div class="score-scroll baccarat-scroll baccarat-vertical-scroll"><table class="score-table baccarat-table baccarat-vertical-table"><thead><tr><th>Holes</th>${ordered.map(p=>`<th>${esc(p.name)}${p.player_id===state.currentPlayer.player_id?'<div class="you">YOU</div>':''}</th>`).join('')}</tr></thead><tbody>${rows}<tr class="baccarat-vertical-total"><th scope="row">Total</th>${totals}</tr></tbody></table></div><div class="baccarat-note">A red circle marks a player's UP call. Points are calculated pair-by-pair after handicap strokes.</div>`;
}
function baccaratStrokeValueForHole(a,b,hole){
  const hc=getPairHandicap(a,b);if(!hc)return 0;
  const candidates=(state.course?.holes||[]).slice().sort((x,y)=>Number(x.si)-Number(y.si));
  const abs=Math.abs(hc), full=Math.floor(abs), half=abs-full;
  const idx=candidates.findIndex(x=>Number(x.hole)===Number(hole));
  if(idx<0||idx>=full+(half?1:0))return 0;
  return (hc<0?-1:1)*(idx<full?1:0.5);
}
function baccaratPairPoints(a,b,hole){
  const recA=scoreFor(a,hole), recB=scoreFor(b,hole);
  const sa=Number(recA.score), sb=Number(recB.score);
  if(!sa||!sb)return {a:0,b:0,result:'S'};
  const par=Number(courseHole(hole)?.par||4);
  const adjA=sa-baccaratStrokeValueForHole(a,b,hole);
  const adjB=sb;
  if(adjA===adjB)return {a:0,b:0,result:'S'};
  const winner=adjA<adjB?a:b, loser=winner===a?b:a;
  const winRec=winner===a?recA:recB;
  const loseRec=loser===a?recA:recB;
  const winScore=Number(winRec.score);
  // Base multiplier follows the winner's gross score. HIO uses ×16 and still applies UP multipliers.
  let scoreMultiplier=1;
  if(par===3 && winScore===1) scoreMultiplier=16;
  else if(winScore<=par-3) scoreMultiplier=8;       // Albatross or better
  else if(winScore<=par-2) scoreMultiplier=4;       // Eagle
  else if(winScore===par-1) scoreMultiplier=2;      // Birdie
  const winnerUp=!!winRec.up;
  const loserUp=!!loseRec.up;
  const upMultiplier=winnerUp&&loserUp?4:(winnerUp||loserUp?2:1);
  const points=scoreMultiplier*upMultiplier;
  return winner===a?{a:points,b:-points,result:'W'}:{a:-points,b:points,result:'L'};
}
function baccaratPoints(pid,hole){
  // A player who opted out of Baccarat must not earn or lose Baccarat points.
  // Check both the row owner and each opponent, since the UI still lists all match players.
  const owner=state.players.find(p=>p.player_id===pid);
  const isEnabled=p=>!!p && baccaratEnabledValue(p.baccarat_enabled);
  if(!isEnabled(owner))return 0;
  let total=0;
  for(const p of state.players){
    if(p.player_id===pid||!isEnabled(p))continue;
    const pair=baccaratPairPoints(pid,p.player_id,hole);
    total+=pair.a;
  }
  return total;
}
function setMode(m){state.currentMode=m;if(m==='B9')state.currentHole=10;else if(m==='F9')state.currentHole=1;render()}function prevHole(){state.currentHole=Math.max(state.currentMode==='B9'?10:1,state.currentHole-1);render()}function nextHole(){const max=state.currentMode==='F9'?9:18;state.currentHole=Math.min(max,state.currentHole+1);render()}
function editScore(pid,hole){if(pid!==state.currentPlayer.player_id&&!state.isAdmin)return;if(state.isAdmin){state.editingHole=hole;state.editingScores=state.players.map(p=>({pid:p.player_id,name:p.name,...scoreFor(p.player_id,hole)}));state.editingScore=null;render()}else{state.editingScore={pid,hole,...scoreFor(pid,hole)};render()}}
function scoreEditor(){const e=state.editingScore;return `<div class="score-editor"><div class="editor-panel"><div class="editor-title">Edit Score</div><div class="editor-sub">${esc(state.players.find(p=>p.player_id===e.pid)?.name||'')} · Hole ${e.hole}</div><div class="score-picker">${Array.from({length:12},(_,i)=>i+1).map(n=>`<button class="score-option ${Number(e.score)===n?'active':''}" onclick="pickScore(${n})">${n}</button>`).join('')}</div><label class="up-row"><input id="editUp" type="checkbox" ${e.up?'checked':''}> UP</label><div class="editor-actions"><button class="cancel-score" onclick="cancelEdit()">Cancel</button><button class="save-score" onclick="saveEditedScore()">Save</button></div></div></div>`}
function bulkScoreEditor(){const hole=state.editingHole;const rows=state.editingScores||[];return `<div class="score-editor"><div class="editor-panel bulk-editor"><div class="editor-title">Admin · Hole ${hole}</div><div class="editor-sub">Enter all players' score and UP at once.</div><div class="bulk-list">${rows.map((r,i)=>`<div class="bulk-row"><div class="bulk-name">${esc(r.name)}</div><div class="bulk-score">${Array.from({length:12},(_,n)=>n+1).map(n=>`<button class="bulk-score-btn ${Number(r.score)===n?'active':''}" onclick="pickBulkScore(${i},${n})">${n}</button>`).join('')}</div><label class="bulk-up"><input type="checkbox" ${r.up?'checked':''} onchange="pickBulkUp(${i},this.checked)"> UP</label></div>`).join('')}</div><div class="editor-actions"><button class="cancel-score" onclick="cancelBulkEdit()">Cancel</button><button class="save-score" onclick="saveBulkScores()">Save All</button></div></div></div>`}
function pickScore(n){state.editingScore.score=n;render()}function cancelEdit(){state.editingScore=null;render()}
function pickBulkScore(i,n){state.editingScores[i].score=n;render()}function pickBulkUp(i,v){state.editingScores[i].up=v}
async function saveEditedScore(){if(state.savingScore)return;const e=state.editingScore;if(!e)return;const up=document.getElementById('editUp').checked;state.savingScore=true;const btn=document.querySelector('.save-score');if(btn){btn.disabled=true;btn.textContent='Saving…'}try{const r=await post({action:'saveScore',match_id:state.match.match_id,hole:e.hole,player_id:e.pid,score:e.score,up,submitted_by:state.currentPlayer.player_id});if(!r.success){alert(r.error||'Save failed. Please try again.');return}const old=state.scores.find(s=>s.player_id===e.pid&&Number(s.hole)===e.hole);if(old){old.score=e.score;old.up=up}else {const added={player_id:e.pid,hole:e.hole,score:e.score,up};state.scores.push(added)}state.scoreMap[`${e.pid}|${e.hole}`]=state.scores.find(x=>x.player_id===e.pid&&Number(x.hole)===Number(e.hole));state.editingScore=null;render()}catch(err){alert(err.message||'Network error. Your score was not confirmed saved.')}finally{state.savingScore=false}}
async function saveBulkScores(){const rows=state.editingScores||[];if(rows.some(r=>!r.score)){alert('Enter a score for every player.');return}const payload=rows.map(x=>({player_id:x.pid,score:Number(x.score),up:!!x.up}));let r=await post({action:'saveScoresBatch',match_id:state.match.match_id,hole:state.editingHole,scores:payload,submitted_by:state.currentPlayer.player_id});if(!r.success&&String(r.error||'').includes('Unknown action: saveScoresBatch')){const results=await Promise.all(payload.map(x=>post({action:'saveScore',match_id:state.match.match_id,hole:state.editingHole,player_id:x.player_id,score:x.score,up:x.up,submitted_by:state.currentPlayer.player_id})));const bad=results.find(x=>!x.success);if(bad)r=bad;else r={success:true}}if(!r.success){alert(r.error||'Save failed');return}rows.forEach(x=>{const old=state.scores.find(s=>s.player_id===x.pid&&Number(s.hole)===state.editingHole);if(old){old.score=Number(x.score);old.up=!!x.up}else {const added={player_id:x.pid,hole:state.editingHole,score:Number(x.score),up:!!x.up};state.scores.push(added)}state.scoreMap[`${x.pid}|${state.editingHole}`]=state.scores.find(s=>s.player_id===x.pid&&Number(s.hole)===Number(state.editingHole))});state.editingScores=null;state.editingHole=null;render()}
function cancelBulkEdit(){state.editingScores=null;state.editingHole=null;render()}
function qrModal(){return `<div class="handicap-modal" onclick="if(event.target===this)state.qr=false,render()"><div class="handicap-panel" style="text-align:center"><div class="modal-top"><div class="section-title">Join Game</div><button class="close" onclick="state.qr=false;render()">×</button></div><div style="width:220px;height:220px;margin:20px auto;background:repeating-linear-gradient(45deg,#111 0 4px,#fff 4px 8px);border:14px solid #fff;box-shadow:0 0 0 1px #ddd"></div><div style="font-size:24px;font-weight:900">${esc(state.match.match_id)}</div><div class="help">Scan this QR code to join the game</div><div class="notice">Players ${state.players.length} · Joined ${state.players.length} / ${state.match.player_count}</div></div></div>`}
function openQR(){state.qr=true;render()}
function newCoursePrompt(){state.courseDraft={course_id:'',course_name:'',holes:Array.from({length:18},(_,i)=>({hole:i+1,par:4,si:i+1}))};state.view='courseEditor';render()}
function editCourse(id){const c=state.courses.find(x=>x.course_id===id);if(!c)return;state.courseDraft={course_id:c.course_id,course_name:c.course_name,holes:c.holes.map(h=>({...h}))};state.view='courseEditor';render()}
async function saveCourse(){if(state.savingCourse)return;const name=$('courseName').value.trim(),err=$('course-error');err.innerHTML='';if(!name){err.innerHTML='<div class="error">Enter a course name.</div>';return}const pars=[...document.querySelectorAll('.course-par')].map(x=>Number(x.value));const sis=[...document.querySelectorAll('.course-si')].map(x=>Number(x.value));if(pars.length!==18||sis.length!==18||new Set(sis).size!==18){err.innerHTML='<div class="error">Please set a unique SI from 1 to 18 for all holes.</div>';return}const holes=pars.map((par,i)=>({hole:i+1,par,si:sis[i]}));const payload={action:state.courseDraft.course_id?'updateCourse':'createCourse',course_id:state.courseDraft.course_id,course_name:name,holes};const btn=document.querySelector('.course-editor .start');state.savingCourse=true;if(btn){btn.disabled=true;btn.textContent='Saving…'}try{const r=await post(payload);if(!r.success){err.innerHTML=`<div class="error">${esc(r.error||'Unable to save course.')}</div>`;return}const fresh=await get('getCourses');if(fresh.success)state.courses=fresh.courses||[];state.view='courses';render();showToast(state.courseDraft.course_id?'Course updated':'Course added')}catch(e){err.innerHTML=`<div class="error">${esc(e.message||'Network error. Please try again.')}</div>`}finally{state.savingCourse=false;const b=document.querySelector('.course-editor .start');if(b){b.disabled=false;b.textContent='Save Course'}}}
loadCoursesIfNeeded();render();