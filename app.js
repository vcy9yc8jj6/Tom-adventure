(() => {
'use strict';
const STORE = 'tom-secret-quests-v02';
const OLD = 'tom-adventure-v1';
const BUILTIN = Array.isArray(window.TOM_QUESTIONS) ? window.TOM_QUESTIONS : [];
const $ = id => document.getElementById(id);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const addDays = (day, n) => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fresh = () => ({version:2, theme:'potato', history:[], progress:{}, customBank:[], legacyHistory:[]});
const parse = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
function validateQuestion(q){return !!q && typeof q.id === 'string' && /^[a-zA-Z0-9_.-]{1,90}$/.test(q.id) && typeof q.family === 'string' && /^[a-zA-Z0-9_.-]{1,90}$/.test(q.family) && !['__proto__','prototype','constructor'].includes(q.family) && typeof q.question === 'string' && q.question.length >= 4 && q.question.length <= 2000 && (['number','string'].includes(typeof q.answer) || (Array.isArray(q.answer) && q.answer.length > 0 && q.answer.length <= 10 && q.answer.every(a=>['string','number'].includes(typeof a))));}
let state = parse(STORE);
if (!state || state.version !== 2 || !Array.isArray(state.history) || !Array.isArray(state.customBank) || !state.progress || typeof state.progress !== 'object') {
  state = fresh();
  const legacy = parse(OLD);
  if(legacy){
    const logs = Array.isArray(legacy.attempts) ? legacy.attempts : Array.isArray(legacy.history) ? legacy.history : [];
    state.legacyHistory = logs.slice(0,10000).map(x=>({...x, legacy:true}));
    if(Array.isArray(legacy.bank)) state.customBank = legacy.bank.filter(q=>validateQuestion({...q, family:q.family||q.topic||'legacy'} ) && !String(q.id).startsWith('demo-')).map(q=>({...q, family:/^[a-zA-Z0-9_.-]{1,90}$/.test(q.family||'')?q.family:'legacy'})).slice(0,200);
  }
}
state.customBank = state.customBank.filter(validateQuestion).slice(0,300);
const themes = {
 potato:{name:'土豆星事件簿',icon:'🪐',friend:'🐻',heading:'今天，宇宙又出事了……',description:'土豆星自信满满地打开了秘密档案，结果把密码弄乱了。你愿意来帮忙吗？'},
 stick:{name:'火柴人行动',icon:'🥷',friend:'🕵️',heading:'紧急！秘密任务已启动',description:'火柴人特工遇到了奇怪的机关。只要破解谜题，就能完成这次行动。'}
};
let active = [],position = 0,roundLog = [],current = null;
let tries = 0, hints = 0, wrong = [], firstAnswer = null, solved = false;
let openedAt = 0, visibleSince = null, activeMillis = 0;
const allQuestions = () => [...BUILTIN,...state.customBank];
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); return true; } catch { $('toolMessage').textContent='设备存储空间不足，请先导出备份。'; return false; } };
const screen = name => ['home','game','finish','parent'].forEach(x=>$(x).classList.toggle('hidden',x!==name));
const norm = val => String(val).trim().toLowerCase().replace(/\s+/g,'').replace(/[，。]/g,'');
const isCorrect = (q,v) => (Array.isArray(q.answer)?q.answer:[q.answer]).some(ans=>norm(ans)===norm(v));
const skill = fam => Object.hasOwn(state.progress,fam) && state.progress[fam] && typeof state.progress[fam] === 'object' ? state.progress[fam] : {reviewStage:0, cleanDates:[],cleanVariants:[], nextDue:'',mastered:false,lastQ:null};
function setTheme(id){state.theme = themes[id]?id:'potato'; const t=themes[state.theme];document.body.dataset.theme=state.theme;$('logo').textContent=t.icon;$('heroEmoji').textContent=t.icon;$('brandTitle').textContent=t.name;document.title=t.name+' · 秘密任务';$('heroHeading').textContent=t.heading;$('heroDescription').textContent=t.description;document.querySelectorAll('[data-skin]').forEach(b=>{b.classList.toggle('selected',b.dataset.skin===state.theme);b.setAttribute('aria-pressed',b.dataset.skin===state.theme?'true':'false')});save();}
function refresh(){ const solvedCount=state.history.filter(r=>r.status==='correct').length;const families=[...new Set(allQuestions().map(q=>q.family))];const mastered=families.filter(f=>skill(f).mastered).length;$('missionCount').textContent=solvedCount;$('masterCount').textContent=mastered;$('pendingCount').textContent=families.length-mastered;$('levelTag').textContent=solvedCount>=30?'✦ 资深探员':solvedCount>=10?'✦ 小小调查员':'✦ 新晋探员'; const short=state.history.slice(-10);$('startButton').textContent=candidates().length?'接受秘密任务 →':'自由探索 3 题 →';$('dailyNote').textContent=candidates().length?'每次只有几件小麻烦，解决了就收工。':'🎉 今天的任务已处理完，额外探索完全自愿。';$('parentStats').textContent=`V0.2 已完成：${solvedCount} 题；最近 ${short.length} 次尝试中，有 ${short.filter(r=>r.firstCorrect).length} 次未查看提示、首次独立答对。已掌握主题：${mastered}/${families.length}。旧版历史记录：${state.legacyHistory.length} 条（保留备份，不用于新版掌握判断）。`;}
function candidates(){ const groups=new Map();for(const q of allQuestions()){if(!groups.has(q.family))groups.set(q.family,[]);groups.get(q.family).push(q)} const now=today();const ranked=[];for(const [family,qs] of groups){const p=skill(family),seen=state.history.some(h=>h.family===family);const due=!seen || !p.nextDue || p.nextDue<=now;if(!due)continue;const priority=seen?(p.mastered?30:95):65; ranked.push({family,qs,priority:priority+(p.nextDue&&p.nextDue<now?12:0),seen});}ranked.sort((a,b)=>b.priority-a.priority||a.family.localeCompare(b.family));return ranked;}
function pickOne(qs,family){const used=state.history.filter(h=>h.family===family).map(h=>h.id);const counts=Object.fromEntries(qs.map(q=>[q.id,used.filter(id=>id===q.id).length]));const last=skill(family).lastQ;return [...qs].sort((a,b)=>(counts[a.id]-counts[b.id]) || ((a.id===last?1:0)-(b.id===last?1:0)) || ((a.level||1)-(b.level||1)) || a.id.localeCompare(b.id))[0];}
function buildRound(free=false){const due=candidates();const groups=new Map();if(free && !due.length){for(const q of allQuestions()){if(!groups.has(q.family))groups.set(q.family,[]);groups.get(q.family).push(q)}for(const [family,qs] of groups)due.push({family,qs,priority:0});}return due.slice(0,free?3:5).map(g=>pickOne(g.qs,g.family));}
function start(){ active=buildRound(false);if(!active.length)active=buildRound(true);startRound(); }
function startRound(){if(!active.length)return;position=0;roundLog=[];screen('game');render();}
function pauseClock(){if(visibleSince!==null){activeMillis+=Date.now()-visibleSince;visibleSince=null}}
function startClock(){openedAt=Date.now();activeMillis=0;visibleSince=document.visibilityState==='visible'?Date.now():null;}
function activeSeconds(){return Math.max(0,Math.round((activeMillis+(visibleSince===null?0:Date.now()-visibleSince))/1000));}
function words(s){return state.theme==='stick'?String(s).replaceAll('土豆星','火柴人'):String(s)}
function render(){current=active[position];tries=0;hints=0;wrong=[];firstAnswer=null;solved=false;startClock(); const t=themes[state.theme];$('missionLabel').textContent=current.topic||'秘密谜题';$('missionProgress').textContent=`任务 ${position+1} / ${active.length}`;$('trackFill').style.width=`${100*position/active.length}%`;$('characterA').textContent=t.icon;$('characterB').textContent=t.friend;$('lineA').textContent=words(current.a||'这次可是个大麻烦！');$('lineB').textContent=words(current.b||'先仔细看看线索。');$('questionTitle').textContent=words(current.title||'新的谜题');$('questionText').textContent=words(current.question);$('answerInput').value='';$('answerInput').disabled=false;['submitAnswer','askHint','skipQuestion'].forEach(id=>$(id).disabled=false);$('answerFeedback').className='feedback hidden';$('showSolution').classList.add('hidden');$('nextQuestion').classList.add('hidden');}
function feedback(txt,type){$('answerFeedback').textContent=txt;$('answerFeedback').className='feedback '+(type||'');}
function updateProgress(record){if(record.status==='paused')return;let p=skill(record.family);p.lastQ=record.id;p.lastAttemptDate=today();if(record.firstCorrect){ if(!p.cleanDates.includes(today()))p.cleanDates.push(today());if(!p.cleanVariants.includes(record.id))p.cleanVariants.push(record.id);p.cleanDates=p.cleanDates.slice(-12);p.cleanVariants=p.cleanVariants.slice(-20);p.reviewStage=Math.min(3,p.cleanDates.length);p.mastered=p.cleanDates.length>=3 && p.cleanVariants.length>=2;p.nextDue=addDays(today(),p.mastered?14:p.reviewStage===1?1:p.reviewStage===2?3:7);}else{p.cleanDates=[];p.cleanVariants=[];p.reviewStage=0;p.mastered=false;p.nextDue=addDays(today(),1);}state.progress[record.family]=p;}
function record(status){pauseClock();const e={version:2,id:current.id,family:current.family,topic:current.topic||'',status,firstAnswer,finalAnswer:$('answerInput').value.trim(),wrongAnswers:[...wrong],attempts:tries,hints,firstCorrect:status==='correct'&&tries===1&&hints===0,activeSeconds:activeSeconds(),timestamp:new Date().toISOString()};state.history.push(e);roundLog.push(e);updateProgress(e);save();return e;}
function lock(){solved=true;$('answerInput').disabled=true;['submitAnswer','askHint','skipQuestion'].forEach(id=>$(id).disabled=true);$('showSolution').classList.add('hidden');$('nextQuestion').classList.remove('hidden');}
function submit(){if(solved)return;const v=$('answerInput').value.trim();if(!v){feedback('先写下你想到的答案吧。');return;}tries++;if(tries===1)firstAnswer=v;if(isCorrect(current,v)){const independent=tries===1&&hints===0;record('correct');feedback(independent?'✨ 一次破解！土豆星目瞪口呆。\n'+current.explain:'✅ 这次算对了！找到了破解方法。\n'+current.explain, 'success');lock();}else{wrong.push(v);feedback(tries===1?'🤔 还差一点。看看条件，再试一次。':tries===2?'🧩 不急，换个办法试试。也可以看提示，或者看看解析。':'🧩 先看提示，再思考一次。', 'tryagain');if(tries>=2)$('showSolution').classList.remove('hidden');}}
function hint(){if(solved)return;hints++;feedback('💡 '+(current.hint||'把题目中的已知条件一步步写出来。'),'tryagain');if(hints>=2)$('showSolution').classList.remove('hidden');}
function explain(){if(solved)return;record('explained');feedback('📖 一起来看怎么解：\n'+(current.explain||'这道题需要进一步完善解析。')+'\n这题先记下来，以后再来试试。','success');lock();}
function skip(){if(solved)return;record('skipped');next();}
function next(){position++;if(position>=active.length){const finished=roundLog.filter(x=>x.status==='correct').length;const solo=roundLog.filter(x=>x.firstCorrect).length;$('finishText').textContent=`本轮处理了 ${roundLog.length} 件事，解决 ${finished} 件，其中 ${solo} 件是没有看提示、第一次就独立解决的。`;$('trackFill').style.width='100%';refresh();screen('finish');}else render();}
function leave(){if(current&&!solved)record('paused');refresh();screen('home');}
function download(data,filename){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
async function readFile(el){const file=el.files&&el.files[0];if(!file)throw Error('请先选择 JSON 文件。');if(file.size>2*1024*1024)throw Error('文件不能大于2MB。');return JSON.parse(await file.text());}
function toolMessage(s){$('toolMessage').textContent=s;}
$('startButton').onclick=start;$('submitAnswer').onclick=submit;$('askHint').onclick=hint;$('showSolution').onclick=explain;$('skipQuestion').onclick=skip;$('nextQuestion').onclick=next;$('exitGame').onclick=leave;$('finishHome').onclick=()=>{refresh();screen('home')};$('answerInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!solved)submit()});$('parentOpen').onclick=()=>{refresh();screen('parent')};$('parentClose').onclick=()=>{refresh();screen('home')};document.querySelectorAll('[data-skin]').forEach(b=>b.addEventListener('click',()=>{setTheme(b.dataset.skin);toolMessage('已更换任务世界，练习记录没有变化。')}));
$('exportAll').onclick=()=>download({...state,exportedAt:new Date().toISOString()},'tom-adventure-backup-v02.json');$('exportHistory').onclick=()=>download({version:2,history:state.history,legacyHistory:state.legacyHistory,exportedAt:new Date().toISOString()},'tom-adventure-history.json');
$('importQuestions').onclick=async()=>{try{const data=await readFile($('questionFile'));if(!Array.isArray(data)||data.length>200||!data.length||data.some(q=>!validateQuestion(q)))throw Error('需要1～200道题，每道具备 id、family、question、answer。');const known=new Set(allQuestions().map(x=>x.id));let n=0;for(const q of data)if(!known.has(q.id)){state.customBank.push(q);known.add(q.id);n++}save();refresh();toolMessage('新增 '+n+' 道题，重复 ID 已跳过。')}catch(e){toolMessage('导入失败：'+e.message)}};
$('restoreBackup').onclick=async()=>{try{const b=await readFile($('backupFile'));if(!b||b.version!==2||!Array.isArray(b.history)||!Array.isArray(b.customBank)||!b.progress||b.customBank.some(q=>!validateQuestion(q)))throw Error('不是有效的 V0.2 备份。');if(!confirm('恢复备份会替换本设备的现有记录。要继续吗？'))return;state={...fresh(),...b,version:2};state.customBank=state.customBank.slice(0,300);save();setTheme(state.theme);refresh();toolMessage('备份恢复完成。')}catch(e){toolMessage('恢复失败：'+e.message)}};
document.addEventListener('visibilitychange',()=>{if(!current||solved||$('game').classList.contains('hidden'))return;if(document.visibilityState==='hidden')pauseClock();else if(visibleSince===null)visibleSince=Date.now()});
setTheme(state.theme);refresh();screen('home');
})();
