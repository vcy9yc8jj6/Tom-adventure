(() => {
'use strict';
const TEST = new URLSearchParams(location.search).get('test') === '1';
const STORE = TEST ? 'tom-secret-quests-v03-test' : 'tom-secret-quests-v02';
const SESSION = STORE + '-session-v03';
if(TEST){const banner=document.createElement('p');banner.textContent='测试模式：不会读写 Tom 的真实记录';banner.className='summary';document.body.prepend(banner);}
const OLD = TEST ? 'tom-adventure-v1-test' : 'tom-adventure-v1';
const BUILTIN = Array.isArray(window.TOM_QUESTIONS) ? window.TOM_QUESTIONS : [];
const $ = id => document.getElementById(id);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const addDays = (day, n) => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fresh = () => ({version:2, theme:'potato', history:[], progress:{}, customBank:[], legacyHistory:[]});
const parse = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
function validateQuestion(q){return !!q && typeof q.id === 'string' && /^[a-zA-Z0-9_.-]{1,90}$/.test(q.id) && typeof q.family === 'string' && /^[a-zA-Z0-9_.-]{1,90}$/.test(q.family) && !['__proto__','prototype','constructor'].includes(q.family) && typeof q.question === 'string' && q.question.length >= 4 && q.question.length <= 2000 && (['number','string'].includes(typeof q.answer) || (Array.isArray(q.answer) && q.answer.length > 0 && q.answer.length <= 10 && q.answer.every(a=>['string','number'].includes(typeof a))));}
let state = parse(STORE);
if(state && state.version===2 && !state.v03 && !TEST){try{if(!localStorage.getItem(STORE+'-pre-v03'))localStorage.setItem(STORE+'-pre-v03',JSON.stringify(state));}catch{}}
if (!state || state.version !== 2 || !Array.isArray(state.history) || !Array.isArray(state.customBank) || !state.progress || typeof state.progress !== 'object') {
  state = fresh();
  const legacy = parse(OLD);
  if(legacy){
    const logs = Array.isArray(legacy.attempts) ? legacy.attempts : Array.isArray(legacy.history) ? legacy.history : [];
    state.legacyHistory = logs.slice(0,10000).map(x=>({...x, legacy:true}));
    if(Array.isArray(legacy.bank)) state.customBank = legacy.bank.filter(q=>validateQuestion({...q, family:q.family||q.topic||'legacy'} ) && !String(q.id).startsWith('demo-')).map(q=>({...q, family:/^[a-zA-Z0-9_.-]{1,90}$/.test(q.family||'')?q.family:'legacy'})).slice(0,200);
  }
}
state.v03=true;state.legacyHistory=Array.isArray(state.legacyHistory)?state.legacyHistory:[];
state.customBank = state.customBank.filter(validateQuestion).slice(0,300);
const themes = {
 potato:{name:'土豆星事件簿',icon:'🪐',friend:'🐻',heading:'今天，宇宙又出事了……',description:'土豆星自信满满地打开了秘密档案，结果把密码弄乱了。你愿意来帮忙吗？'},
 stick:{name:'火柴人行动',icon:'🥷',friend:'🕵️',heading:'紧急！秘密任务已启动',description:'火柴人特工遇到了奇怪的机关。只要破解谜题，就能完成这次行动。'}
};
let active = [],position = 0,roundLog = [],current = null;
let tries = 0, hints = 0, wrong = [], firstAnswer = null, solved = false;
let mode='daily', verification=false, steps=[], blank=0;
let openedAt = 0, visibleSince = null, activeMillis = 0;
const allQuestions = () => [...BUILTIN,...state.customBank];
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); return true; } catch { $('toolMessage').textContent='设备存储空间不足，请先导出备份。'; return false; } };
let screenName='home';
const screen = name => {screenName=name; ['home','game','finish','parent'].forEach(x=>$(x).classList.toggle('hidden',x!==name));};
const norm = val => String(val).trim().toLowerCase().replace(/\s+/g,'').replace(/[，。]/g,'');
const isCorrect = (q,v) => (Array.isArray(q.answer)?q.answer:[q.answer]).some(ans=>typeof ans==='number' && /^[-+]?\d+(?:\.\d+)?$/.test(String(v).trim()) ? Number(v)===ans : norm(ans)===norm(v));
const skill = fam => Object.hasOwn(state.progress,fam) && state.progress[fam] && typeof state.progress[fam] === 'object' ? state.progress[fam] : {reviewStage:0, cleanDates:[],cleanVariants:[], nextDue:'',mastered:false,lastQ:null};
function setTheme(id){state.theme = themes[id]?id:'potato'; const t=themes[state.theme];document.body.dataset.theme=state.theme;$('logo').textContent=t.icon;$('heroEmoji').textContent=t.icon;$('brandTitle').textContent=t.name;document.title=t.name+' · 秘密任务';$('heroHeading').textContent=t.heading;$('heroDescription').textContent=t.description;document.querySelectorAll('[data-skin]').forEach(b=>{b.classList.toggle('selected',b.dataset.skin===state.theme);b.setAttribute('aria-pressed',b.dataset.skin===state.theme?'true':'false')});save();}
function refresh(){ const solvedCount=state.history.filter(r=>r.status==='correct').length;const families=[...new Set(allQuestions().map(q=>q.family))];const mastered=families.filter(f=>skill(f).mastered).length;$('missionCount').textContent=solvedCount;$('masterCount').textContent=mastered;$('pendingCount').textContent=families.length-mastered;$('levelTag').textContent=solvedCount>=30?'✦ 资深探员':solvedCount>=10?'✦ 小小调查员':'✦ 新晋探员'; const short=state.history.slice(-10);$('startButton').textContent=dailyDone().length<5?'接受秘密任务 →':'自由探索 3 题 →';$('dailyNote').textContent=dailyDone().length<5?`每日常规五题，今天已处理 ${Math.min(5,dailyDone().length)} 题。验证与专题加练自愿参加。`:'🎉 今天的任务已处理完，额外探索完全自愿。';$('parentStats').textContent=`V0.3 已完成：${solvedCount} 题；最近 ${short.length} 次尝试中，有 ${short.filter(r=>r.firstCorrect).length} 次未查看提示、首次独立答对。已掌握主题：${mastered}/${families.length}。旧版历史记录：${state.legacyHistory.length} 条（保留备份，不用于新版掌握判断）。`;}
function candidates(){ const groups=new Map();for(const q of allQuestions()){if(!groups.has(q.family))groups.set(q.family,[]);groups.get(q.family).push(q)} const now=today();const ranked=[];for(const [family,qs] of groups){const p=skill(family),seen=state.history.some(h=>h.family===family);const due=!seen || !p.nextDue || p.nextDue<=now;if(!due)continue;const priority=seen?(p.mastered?30:95):65; ranked.push({family,qs,priority:priority+(p.nextDue&&p.nextDue<now?12:0),seen});}ranked.sort((a,b)=>b.priority-a.priority||a.family.localeCompare(b.family));return ranked;}
function pickOne(qs,family){const used=state.history.filter(h=>h.family===family).map(h=>h.id);const counts=Object.fromEntries(qs.map(q=>[q.id,used.filter(id=>id===q.id).length]));const last=skill(family).lastQ;return [...qs].sort((a,b)=>(counts[a.id]-counts[b.id]) || ((a.id===last?1:0)-(b.id===last?1:0)) || ((a.level||1)-(b.level||1)) || a.id.localeCompare(b.id))[0];}
function dailyDone(){return state.history.filter(r=>r.mode!=='topic'&&r.mode!=='free'&&!r.verification&&r.status!=='paused'&&r.timestamp&&todayOf(r.timestamp)===today());}
function todayOf(timestamp){const d=new Date(timestamp);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function makeQuestion(g){return window.TOM_VARIANTS.families.includes(g.family)?window.TOM_VARIANTS.generate(g.family,Math.min(3,1+(skill(g.family).reviewStage||0))):pickOne(g.qs,g.family);}
function buildRound(free=false){const groups=new Map();for(const q of allQuestions()){if(!groups.has(q.family))groups.set(q.family,[]);groups.get(q.family).push(q);}
 const due=candidates(),seen=new Set(due.map(g=>g.family));for(const [family,qs] of groups)if(!seen.has(family))due.push({family,qs});
 if(free)return due.slice(0,3).map(makeQuestion);
 const done=dailyDone(),used=new Set(done.map(r=>r.family));return due.filter(g=>!used.has(g.family)).slice(0,Math.max(0,5-done.length)).map(makeQuestion);
}
function start(){mode=dailyDone().length>=5?'free':'daily';verification=false;active=buildRound(mode==='free');startRound();}
function startRound(){if(!active.length)return;position=0;roundLog=[];screen('game');render();}
function pauseClock(){if(visibleSince!==null){activeMillis+=Date.now()-visibleSince;visibleSince=null}}
function startClock(){openedAt=Date.now();activeMillis=0;visibleSince=document.visibilityState==='visible'?Date.now():null;}
function activeSeconds(){return Math.max(0,Math.round((activeMillis+(visibleSince===null?0:Date.now()-visibleSince))/1000));}
function words(s){return state.theme==='stick'?String(s).replaceAll('土豆星','火柴人'):String(s)}
function render(){current=active[position];steps=[];verification=!!current.verification;tries=0;hints=0;wrong=[];firstAnswer=null;solved=false;startClock(); const t=themes[state.theme];$('missionLabel').textContent=(verification?'无提示独立验证 · ':'')+(current.topic||'秘密谜题');$('missionProgress').textContent=`任务 ${position+1} / ${active.length}`;$('trackFill').style.width=`${100*position/active.length}%`;$('characterA').textContent=t.icon;$('characterB').textContent=t.friend;$('lineA').textContent=words(current.a||'这次可是个大麻烦！');$('lineB').textContent=words(current.b||'先仔细看看线索。');$('questionTitle').textContent=words(current.title||'新的谜题');$('questionText').textContent=words(current.question);$('answerInput').value='';$('handwork').value='';$('causeSelect').value='';$('verifyQuestion').classList.add('hidden');$('askHint').classList.toggle('hidden',verification);$('formulaPanel').classList.toggle('hidden',verification||!current.formula);$('formulaPanel').open=false;blank=Math.floor(Math.random()*3);drawFormula();$('answerInput').disabled=false;['submitAnswer','askHint','skipQuestion'].forEach(id=>$(id).disabled=false);$('answerFeedback').className='feedback hidden';$('showSolution').classList.add('hidden');$('nextQuestion').classList.add('hidden');checkpoint();}
function feedback(txt,type){$('answerFeedback').textContent=txt;$('answerFeedback').className='feedback '+(type||'');}
function updateProgress(record){if(record.status==='paused')return;let p=skill(record.family);p.lastQ=record.id;p.lastAttemptDate=today();if(record.firstCorrect && record.verification){ if(!p.cleanDates.includes(today()))p.cleanDates.push(today());if(!p.cleanVariants.includes(record.id))p.cleanVariants.push(record.id);p.cleanDates=p.cleanDates.slice(-12);p.cleanVariants=p.cleanVariants.slice(-20);p.reviewStage=Math.min(3,p.cleanDates.length);p.mastered=p.cleanDates.length>=3 && p.cleanVariants.length>=2;p.nextDue=addDays(today(),p.mastered?14:p.reviewStage===1?1:p.reviewStage===2?3:7);}else if(!record.firstCorrect){p.cleanDates=[];p.cleanVariants=[];p.reviewStage=0;p.mastered=false;p.nextDue=addDays(today(),1);}else{p.nextDue=addDays(today(),1);}state.progress[record.family]=p;}
function record(status){pauseClock();const e={version:3,mode,verification,question:current.question,parameters:current.params||null,steps:[...steps],handwork:$('handwork').value.trim(),id:current.id,family:current.family,topic:current.topic||'',status,firstAnswer,finalAnswer:$('answerInput').value.trim(),wrongAnswers:[...wrong],attempts:tries,hints,firstCorrect:status==='correct'&&tries===1&&hints===0,activeSeconds:activeSeconds(),timestamp:new Date().toISOString()};state.history.push(e);roundLog.push(e);updateProgress(e);save();checkpoint();return e;}
function lock(){solved=true;$('answerInput').disabled=true;['submitAnswer','askHint','skipQuestion'].forEach(id=>$(id).disabled=true);$('showSolution').classList.add('hidden');$('nextQuestion').classList.remove('hidden');$('verifyQuestion').classList.toggle('hidden',verification);checkpoint();}
function submit(){
 if(solved)return;const v=$('answerInput').value.trim();if(!v){feedback('先写下你想到的答案吧。');return;}
 if(verification&&!$('handwork').value.trim()){feedback('先在纸上独立手算，再写下关键等式。');return;}
 tries++;if(tries===1)firstAnswer=v;
 steps.push({kind:'answer',answer:v,cause:$('causeSelect').value,work:$('handwork').value,correct:isCorrect(current,v),timestamp:new Date().toISOString()});
 if(isCorrect(current,v)){const independent=tries===1&&hints===0;record('correct');feedback(verification?(independent?'✨ 无提示验证通过。手算过程已保存，家长可复核。':'✅ 已订正；这次不计为独立验证。'):(independent?'✨ 首次独立答对！可以换一道题独立验证。':'✅ 学会了这一题。提示后答对不计独立掌握，请换题验证。'),'success');lock();}
 else {wrong.push(v);if(verification){feedback('请独立检查纸上的过程，再提交。此次已不计首答独立成功。','tryagain');}
 else {hints++;feedback('🤔 '+prompts()[Math.min(tries-1,2)],'tryagain');if(tries>=3)$('showSolution').classList.remove('hidden');}checkpoint();}
}
function prompts(){return current.steps||['哪些条件是已知的，要求的是哪个量？','能写出这些量之间的等式吗？先检查单位与顺序。','把你的结果代回题目，所有条件都满足吗？'];}
function hint(){if(solved||verification)return;hints++;steps.push({kind:'hint',stage:Math.min(hints,3),timestamp:new Date().toISOString()});feedback('💡 '+prompts()[Math.min(hints-1,2)],'tryagain');if(hints>=3)$('showSolution').classList.remove('hidden');checkpoint();}
function explain(){if(solved||verification)return;record('explained');feedback('📖 一起来看怎么解：\n'+(current.explain||'这道题需要进一步完善解析。')+'\n这题先记下来，以后再来试试。','success');lock();}
function skip(){if(solved)return;record('skipped');next();}
function next(){verification=false;position++;if(position>=active.length){const finished=roundLog.filter(x=>x.status==='correct').length;const solo=roundLog.filter(x=>x.firstCorrect).length;$('finishText').textContent=`本轮处理了 ${roundLog.length} 件事，解决 ${finished} 件，其中 ${solo} 件是没有看提示、第一次就独立解决的。`;$('trackFill').style.width='100%';refresh();screen('finish');localStorage.removeItem(SESSION);}else render();}
function leave(){localStorage.removeItem(SESSION);if(current&&!solved)record('paused');current=null;refresh();screen('home');localStorage.removeItem(SESSION);}
function download(data,filename){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
async function readFile(el){const file=el.files&&el.files[0];if(!file)throw Error('请先选择 JSON 文件。');if(file.size>2*1024*1024)throw Error('文件不能大于2MB。');return JSON.parse(await file.text());}
function toolMessage(s){$('toolMessage').textContent=s;}
$('startButton').onclick=start;$('submitAnswer').onclick=submit;$('askHint').onclick=hint;$('showSolution').onclick=explain;$('skipQuestion').onclick=skip;$('nextQuestion').onclick=next;$('exitGame').onclick=leave;$('finishHome').onclick=()=>{refresh();screen('home')};$('answerInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!solved)submit()});$('parentOpen').onclick=()=>{refresh();screen('parent')};$('parentClose').onclick=()=>{refresh();screen('home')};document.querySelectorAll('[data-skin]').forEach(b=>b.addEventListener('click',()=>{setTheme(b.dataset.skin);toolMessage('已更换任务世界，练习记录没有变化。')}));
$('exportAll').onclick=()=>download({...state,exportedAt:new Date().toISOString()},'tom-adventure-backup-v02.json');$('exportHistory').onclick=()=>download({version:2,history:state.history,legacyHistory:state.legacyHistory,exportedAt:new Date().toISOString()},'tom-adventure-history.json');
$('importQuestions').onclick=async()=>{try{const data=await readFile($('questionFile'));if(!Array.isArray(data)||data.length>200||!data.length||data.some(q=>!validateQuestion(q)))throw Error('需要1～200道题，每道具备 id、family、question、answer。');const known=new Set(allQuestions().map(x=>x.id));let n=0;for(const q of data)if(!known.has(q.id)){state.customBank.push(q);known.add(q.id);n++}save();refresh();toolMessage('新增 '+n+' 道题，重复 ID 已跳过。')}catch(e){toolMessage('导入失败：'+e.message)}};
$('restoreBackup').onclick=async()=>{try{const b=await readFile($('backupFile'));if(!b||b.version!==2||!Array.isArray(b.history)||!Array.isArray(b.customBank)||!b.progress||b.customBank.some(q=>!validateQuestion(q)))throw Error('不是有效的 V0.2 备份。');if(!confirm('恢复备份会替换本设备的现有记录。要继续吗？'))return;localStorage.removeItem(SESSION);state={...fresh(),...b,version:2,v03:true};state.customBank=state.customBank.slice(0,300);save();setTheme(state.theme);refresh();toolMessage('备份恢复完成。')}catch(e){toolMessage('恢复失败：'+e.message)}};
document.addEventListener('visibilitychange',()=>{if(!current||solved||$('game').classList.contains('hidden'))return;if(document.visibilityState==='hidden')pauseClock();else if(visibleSince===null)visibleSince=Date.now()});

function checkpoint(){if(screenName!=='game'||!current)return;try{localStorage.setItem(SESSION,JSON.stringify({active,position,roundLog,mode,current,tries,hints,wrong,firstAnswer,solved,verification,steps,answer:$('answerInput').value,work:$('handwork').value,cause:$('causeSelect').value,seconds:activeSeconds()}));}catch{toolMessage('本轮进度保存失败，请导出记录备份。');}}
function drawFormula(){if(!current?.formula)return;$('formulaText').textContent=current.formula.join(' = ').replace(' = −',' −').replace(' = ×',' ×').replace(' = ^',' ^')+'；数值：'+current.values.map((v,i)=>i===blank?'□':v).join(' / ');$('formulaInput').value='';$('formulaFeedback').textContent='';}
$('formulaPanel').addEventListener('toggle',()=>{if($('formulaPanel').open&&!verification&&!solved){hints++;steps.push({kind:'formula-open'});checkpoint();}});
$('newBlank').onclick=()=>{if(verification||solved)return;blank=(blank+1+Math.floor(Math.random()*2))%3;drawFormula();};
$('checkFormula').onclick=()=>{if(verification||solved)return;hints++;const ok=String(current.values[blank])===$('formulaInput').value.trim();steps.push({kind:'formula',blank,answer:$('formulaInput').value,correct:ok});$('formulaFeedback').textContent=ok?'关系填对了，回到原题试试。':'先看空格代表哪个量，再用关系核对。';checkpoint();};
$('startTopic').onclick=()=>{mode='topic';verification=false;active=Array.from({length:3},()=>window.TOM_VARIANTS.generate($('topicSelect').value,Number($('stageSelect').value)));startRound();};
$('verifyQuestion').onclick=()=>{if(!solved||verification)return;const old=current;let q;for(let i=0;i<40;i++){q=window.TOM_VARIANTS.generate(window.TOM_VARIANTS.families.includes(old.family)?old.family:'operators',old.level||1);if(q.question!==old.question)break;}if(q.question===old.question){feedback('暂时没有新的验证题，请稍后再试。');return;}active.splice(position+1,0,{...q,verification:true});next();};
['answerInput','handwork','causeSelect'].forEach(id=>$(id).addEventListener('input',checkpoint));
window.addEventListener('pagehide',checkpoint);
setTheme(state.theme);refresh();screen('home');
const resumed=parse(SESSION);
if(resumed&&Array.isArray(resumed.active)&&resumed.active.length>0&&resumed.active.length<100&&resumed.active.every(validateQuestion)&&validateQuestion(resumed.current)&&Number.isInteger(resumed.position)&&resumed.position>=0&&resumed.position<resumed.active.length&&Array.isArray(resumed.roundLog)&&Array.isArray(resumed.steps)&&Array.isArray(resumed.wrong)&&Number.isFinite(resumed.tries)&&Number.isFinite(resumed.hints)){
 ({active,position,roundLog,mode}=resumed);screen('game');render();({current,tries,hints,wrong,firstAnswer,solved,verification,steps}=resumed);$('answerInput').value=resumed.answer||'';$('handwork').value=resumed.work||'';$('causeSelect').value=resumed.cause||'';activeMillis=(resumed.seconds||0)*1000;
 if(solved){lock();feedback('本题已记录，可以继续下一题。','success');}else if(!verification&&(tries>=3||hints>=3))$('showSolution').classList.remove('hidden');checkpoint();
}
})();
