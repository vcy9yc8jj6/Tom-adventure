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
 const ADVENTURES={
  operators:{icon:'⚡',name:'外星运算',title:'失控的外星密码机',subtitle:'符号被调包了！谁能还原指令？',bounty:'破译悬赏',intro:'奇怪的符号并不可怕。先找出符号左边、右边分别是谁，再想它要求先做什么。遇到括号，别忘了从里面调查起。',why:'外星符号不是普通乘号。每次看到它，都得把左右两个数放回规则规定的位置。',quiz:'碰到自定义运算符号，第一步最可靠的是？',choices:['先猜一个熟悉的答案','把两个数按位置代入规则','把符号当作乘号'],correct:1,reason:'对！规则是这道谜题的“说明书”。先找到位置，再依照规则算。',help:{'理解条件':['圈出符号两边的两个数。它们分别对应规则中的哪两个字母？','题目要求的是运算结果，还是一个未知数？先只标出这两部分。'],'建立关系':['试着把规则抄在草稿纸上，再把已知的数替换进去。','如果求未知数，可以先把运算后的结果写成一个等式。'],'运算顺序':['括号先算；没有括号时，按照题目规定的方向依次计算。','把每次运算当成一个完整的小任务，算完再接下一个。'],'公式理解':['想想为什么要“代入”：因为符号只是给一套新规则起了名字。','它的计算步骤完全由题目所给的定义决定，而不是符号的形状。'],'计算失误':['重新检查乘法和加减号，尤其注意有无负号。','把算出的数代回定义式，看两边是否相等。'],'单位或检查':['把你的结果放回原规则重新算一次。','遇到嵌套符号时，把每一步的中间结果都写出来核对。']},walk:['先读懂新符号的定义：同一个符号每次都按同一规则工作。','逐次找出左右两个输入，把对应的数放到正确位置；如果求未知数，把结果写成等式。']},
  patterns:{icon:'🚂',name:'数字暗号',title:'神秘列车的密码',subtitle:'车厢里藏着会移动的数字。',bounty:'列车夺宝',intro:'先观察相邻数字是怎么变化的。再问自己：题目要找的是某一项、总和，还是每次增加多少？别急着套公式。',why:'排得整齐的数列，每两个相邻数可能保持同样的间隔。这个间隔能把所有数串起来。',quiz:'看到有规律的数字列车，先检查哪件事？',choices:['每次增加（或减少）多少','数字是不是都很大','最后一项一定是偶数'],correct:0,reason:'正是间隔！先找规律，才知道该怎样往前或往后推。',help:{'理解条件':['把“有几个数”“总和”“每次相差多少”分别圈出来。','题目究竟要最大的、最小的、总和，还是公差？'],'建立关系':['在纸上画出几个格子，用箭头标相邻数之间的变化。','如果个数对称，可以试着比较首尾两项和中间附近的数。'],'运算顺序':['先找出相邻数的差，再决定从哪一项开始推。','总和与单个数别混淆，逐步算后回到题目。'],'公式理解':['为什么可以首尾配对？想想第一项加最后一项、第二项加倒数第二项。','每一对的和相同，才有“项数 × 平均数”的关系。'],'计算失误':['每移动一个位置，究竟应该加几？数一数一共移动了几次。','把所有项列出来相加，看能否回到题目给的总和。'],'单位或检查':['把得到的每一项逐个检查是否满足间隔。','再算总和，检查有没有漏项或多项。']},walk:['把相邻两项比较，先确定间隔是否固定。','把数列排成一行，选择适合它的办法：逐项推、对称配对或利用平均数。']},
  weighing:{icon:'🪙',name:'金币疑案',title:'消失的轻金币',subtitle:'金币里混进了神秘冒牌货。',bounty:'金币悬赏',intro:'这一案的关键不是猜哪枚金币最轻，而是想一想：天平每称一次，会告诉你哪几种可能的结果？',why:'无砝码天平一次称重只有三种结果：左边轻、右边轻、两边一样重。巧妙分组才能利用这些信息。',quiz:'一次称重最多有几种不同结果？',choices:['2 种','3 种','每枚金币一种'],correct:1,reason:'没错！左轻、右轻、平衡，是三条可能的线索。',help:{'理解条件':['确认题目是否已经告诉你：那枚假币一定更轻。','它问的是“至少几次保证找到”，还是“最多能区分多少枚”？'],'建立关系':['想象第一次把可疑金币分成三组，每一种称重结果排除一部分可能。','找出每次最多能把剩余可疑金币分成几种情况，再思考重复几次。'],'运算顺序':['先算较少次数能辨别多少种，再尝试多一次。','不要只找到“有可能成功”的方案，要考虑最坏情况。'],'公式理解':['每次称重可以产生三条分支，连续称两次能组成怎样的分支树？','每增加一次称重，最多能够继续把已有分支各分成三条。'],'计算失误':['把每一级能区分的候选数慢慢乘三，别跳步。','同时检查少一次称重是否真的不够。'],'单位或检查':['“最多能区分多少枚”和“至少称几次”不是同一个问题。','最后想一想能否通过尽量平均的分组实现这次称重次数。']},walk:['先想清楚每次称重可能出现的三种结果。','把候选金币尽可能均匀地分到三个分支，逐层追踪，直到每个分支只剩一种可能。']},
  pouring:{icon:'🪣',name:'水桶机关',title:'水门守卫的挑战',subtitle:'水不会凭空多出来，机关却会！',bounty:'水门夺宝',intro:'先搞清楚每个桶“最多装多少”和“现在装多少”。倒水时，流出和流入的是同一份水。',why:'水桶有“容量”和“已有的水量”两个不同数字。倒水前后，水量要守恒。',quiz:'大桶还可以装多少水，应该先看什么？',choices:['容量减去已有水量','两个桶容量相加','把已有水量乘二'],correct:0,reason:'对！空着的部分，才是还能倒进去的水。',help:{'理解条件':['分别写出每只桶的容量和眼下装的水量。','检查题目问的是倒进去多少，还是剩下多少。'],'建立关系':['在纸上画两个桶，把水量的变化用箭头表示。','先找到大桶还空多少，再看小桶倒出多少。'],'运算顺序':['先处理“还能装多少”，再处理“倒完剩多少”。','如果是操作题，每次记住两个桶各有多少。'],'公式理解':['倒出的小桶水量，就是大桶增加的水量。','总水量不会在倒水过程中自己增加或减少。'],'计算失误':['小桶的剩余水量不能是负数，回头看看减数有没有写错。','用“倒前总量=倒后总量”核对。'],'单位或检查':['所有数字都应该用相同单位（升）来比较。','再检查有没有超过桶的容量。']},walk:['把两个桶的“容量”和“当前水量”分开记。','按每次倒水的限制更新水量，检查是否保持总量不变。']},
  pursuit:{icon:'🏃',name:'环形追踪',title:'绕星球的追捕令',subtitle:'速度不同的探员在环道里追逐。',bounty:'追踪委托',intro:'先判断是朝同一个方向跑，还是迎面相向跑。两人的距离变化，决定该用速度差还是速度和。',why:'追及与相遇的关键是两个人之间的距离怎样改变，而不是单独看某人的路程。',quiz:'两个人同向跑，快的人追上慢的人，关键看哪种速度？',choices:['两人的速度差','两人的速度和','快者的速度平方'],correct:0,reason:'对！同向追赶时，每秒拉近多少，取决于速度差。',help:{'理解条件':['圈出“同向”还是“反向”四个字。','题目问的是时间、速度还是跑道长度？'],'建立关系':['画一个圈，标出两个人运动的方向。','第一次追上或相遇时，两人的相对路程是多少？'],'运算顺序':['先确定相对速度，再决定用距离除以速度还是反过来。','如果要求未知速度，先把相对速度的关系写清楚。'],'公式理解':['同向时快者每秒多跑多少？反向时两人每秒合起来接近多少？','首次追上或相遇不计出发时，相对路程一般是整整一圈。'],'计算失误':['速度单位和时间单位要搭配，米/秒乘秒得到米。','把你的速度和时间乘起来，看看是否能得到相对路程。'],'单位或检查':['时间不能为负，速度差也不能是零。','把得出的结果放回题目中的跑道长度检查。']},walk:['先画图，判断两人在同向追赶，还是反向相遇。','求出距离每秒变化多少，再用这个变化量连接跑道长度与时间。']}
 };
 const basicHelp={ '理解条件':['先用自己的话说说题目告诉了什么、问了什么。'], '建立关系':['把已知的两个量写在纸上，想一想它们怎样联系。'], '运算顺序':['一步一步做，不必一次算完。'], '公式理解':['先问清楚这个关系为什么成立，再动笔套用。'], '计算失误':['核对每一个中间结果。'], '单位或检查':['把答案代回题目看看是否符合条件。'] };
 const BOUNTIES=['天降神秘悬赏','侦探密令已解锁','宝箱正在等待破译'];
let active = [],position = 0,roundLog = [],current = null;
let tries = 0, hints = 0, wrong = [], firstAnswer = null, solved = false;
let mode='daily', verification=false, steps=[], blank=0;
 let briefingDismissed=false, walkthroughLevel=0, conceptUsed=false;
let openedAt = 0, visibleSince = null, activeMillis = 0;
const allQuestions = () => [...BUILTIN,...state.customBank];
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); return true; } catch { $('toolMessage').textContent='设备存储空间不足，请先导出备份。'; return false; } };
let screenName='home';
const screen = name => {screenName=name; ['home','game','finish','parent'].forEach(x=>$(x).classList.toggle('hidden',x!==name));};
const norm = val => String(val).trim().toLowerCase().replace(/\s+/g,'').replace(/[，。]/g,'');
const isCorrect = (q,v) => (Array.isArray(q.answer)?q.answer:[q.answer]).some(ans=>typeof ans==='number' && /^[-+]?\d+(?:\.\d+)?$/.test(String(v).trim()) ? Number(v)===ans : norm(ans)===norm(v));
const skill = fam => Object.hasOwn(state.progress,fam) && state.progress[fam] && typeof state.progress[fam] === 'object' ? state.progress[fam] : {reviewStage:0, cleanDates:[],cleanVariants:[], nextDue:'',mastered:false,lastQ:null};
function setTheme(id){state.theme = themes[id]?id:'potato'; const t=themes[state.theme];document.body.dataset.theme=state.theme;$('logo').textContent=t.icon;$('heroEmoji').textContent=t.icon;$('brandTitle').textContent=t.name;document.title=t.name+' · 秘密任务';$('heroHeading').textContent=t.heading;$('heroDescription').textContent=t.description;document.querySelectorAll('[data-skin]').forEach(b=>{b.classList.toggle('selected',b.dataset.skin===state.theme);b.setAttribute('aria-pressed',b.dataset.skin===state.theme?'true':'false')});save();}
 function unresolvedFamilies(){
  const unresolved=new Set();
  for(const r of state.history){
    if(!r||!r.family||r.status==='paused')continue;
    if(r.verification&&r.firstCorrect&&r.status==='correct')unresolved.delete(r.family);
    else if(r.status!=='correct'||r.hints>0||(Array.isArray(r.wrongAnswers)&&r.wrongAnswers.length))unresolved.add(r.family);
  }
  return [...unresolved].filter(f=>ADVENTURES[f]||allQuestions().some(q=>q.family===f));
 }
 function refreshAdventures(){
  const list=unresolvedFamilies(), grid=$('questGrid');grid.replaceChildren();
  window.TOM_VARIANTS.families.forEach((family,i)=>{
    const a=ADVENTURES[family],card=document.createElement('button');card.type='button';card.className='quest-entry quest-'+family;
    card.innerHTML=`<span class="quest-icon" aria-hidden="true">${a.icon}</span><span class="quest-content"><span class="quest-kicker">第 ${i+1} 号悬赏 · ${a.bounty}</span><strong>${a.title}</strong><small>${a.subtitle}</small><span class="quest-cta">${list.includes(family)?'遗留线索 · 重新调查':'领取悬赏 · 三关夺宝'} <span aria-hidden="true">↗</span></span></span>`;
    card.addEventListener('click',()=>startAdventure(family));grid.append(card);
  });
  $('unsolvedCount').textContent=String(list.length);const box=$('unsolvedList');box.replaceChildren();
  if(!list.length){const e=document.createElement('p');e.className='empty-cases';e.textContent='🎉 暂时没有遗留的线索！想挑战的话，悬赏榜里还有五张委托。';box.append(e);return;}
  list.forEach(family=>{const a=ADVENTURES[family];const b=document.createElement('button');b.type='button';b.className='unsolved-item';b.textContent=`${a?.icon||'🔎'} ${a?.name||family} · 再查一条线索 →`;b.onclick=()=>startAdventure(family);box.append(b);});
 }
 function refresh(){
  const solvedCount=state.history.filter(r=>r.status==='correct').length;
  const families=[...new Set(allQuestions().map(q=>q.family))];const mastered=families.filter(f=>skill(f).mastered).length;
  $('missionCount').textContent=state.history.filter(r=>r.status!=='paused').length;
  $('masterCount').textContent=mastered;$('pendingCount').textContent=families.length-mastered;
  $('levelTag').textContent=solvedCount>=30?'✦ 星系侦探':solvedCount>=10?'✦ 寻宝探员':'✦ 新晋探员';
  const short=state.history.slice(-10);$('startButton').textContent=dailyDone().length<5?'开启今日秘密事件 →':'再拆三件神秘事件 →';
  $('dailyNote').textContent=dailyDone().length<5?`今天还有 ${Math.max(0,5-dailyDone().length)} 件主线秘密事件。完成后就能休息啦。`:'🎉 今日主线已经通关！想继续，可以挑一份悬赏。';
  $('parentStats').textContent=`V0.3.2 已完成：${solvedCount} 题；最近 ${short.length} 次尝试中，有 ${short.filter(r=>r.firstCorrect).length} 次未查看提示、首次独立答对。已掌握主题：${mastered}/${families.length}。旧版历史记录：${state.legacyHistory.length} 条（保留备份，不用于新版掌握判断）。`;
  refreshAdventures();
 }
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
 function startAdventure(family){
  if(!window.TOM_VARIANTS.families.includes(family))return;
  mode='topic';verification=false;
  active=[1,2,3].map(level=>window.TOM_VARIANTS.generate(family,level));
  startRound();
 }
 function startRound(){if(!active.length)return;position=0;roundLog=[];screen('game');render();}
function pauseClock(){if(visibleSince!==null){activeMillis+=Date.now()-visibleSince;visibleSince=null}}
function startClock(){openedAt=Date.now();activeMillis=0;visibleSince=document.visibilityState==='visible'?Date.now():null;}
function activeSeconds(){return Math.max(0,Math.round((activeMillis+(visibleSince===null?0:Date.now()-visibleSince))/1000));}
function words(s){return state.theme==='stick'?String(s).replaceAll('土豆星','火柴人'):String(s)}
 function sceneFor(q){return ADVENTURES[q.family]||null;}
 function introFor(q){return sceneFor(q)?.intro||'这次先看清楚已知条件和要找的秘密。可以先在脑子里画一张简单的线索图，确定第一步，再开始计算。';}
 function openBriefing(){
   if(verification||briefingDismissed)return;
   $('briefingText').textContent=introFor(current);
   $('briefingOverlay').classList.remove('hidden');
   $('briefingClose').focus({preventScroll:true});
 }
 function dismissBriefing(){
   if(briefingDismissed)return;
   briefingDismissed=true;$('briefingOverlay').classList.add('hidden');
   if(!verification){hints++;steps.push({kind:'intro-guidance',family:current.family,timestamp:new Date().toISOString()});}
   $('readQuestionBar').classList.add('hidden');$('answerZone').classList.remove('hidden');$('supportActions').classList.remove('hidden');
   checkpoint();
  // Bring the answer area into view after the child closes the story clue (especially iPad landscape).
  requestAnimationFrame(()=>$('answerZone').scrollIntoView({behavior:'smooth',block:'start'}));
 }
 function render(){
  current=active[position];steps=[];verification=!!current.verification;tries=0;hints=0;wrong=[];firstAnswer=null;solved=false;
  briefingDismissed=false;walkthroughLevel=0;conceptUsed=false;startClock();
  const t=themes[state.theme],adventure=sceneFor(current),storyStage=mode==='topic'?position+1:0;
  $('missionLabel').textContent=verification?'独立挑战 · 新谜题':(current.topic||'秘密谜题');
  const normalStages=mode==='topic'?active.filter(q=>!q.verification).length:active.length;
  const normalStageNumber=mode==='topic'?active.slice(0,position+1).filter(q=>!q.verification).length:position+1;
  $('missionProgress').textContent=verification?`⚔️ 奖励关 · 独立验证`:(mode==='topic'?`宝藏调查 · 第 ${normalStageNumber} / ${normalStages} 关`:`任务 ${position+1} / ${active.length}`);
  $('stageBadge').textContent=verification?'独立通关':mode==='topic'?['先找到线索','反向追查','最后的宝箱'][Math.min(normalStageNumber-1,2)]:'今日秘密事件';
  $('stageReward').classList.add('hidden');
  $('trackFill').style.width=`${100*position/active.length}%`;
  $('characterA').textContent=t.icon;$('characterB').textContent=t.friend;
  $('lineA').textContent=words(current.a||(mode==='topic'?'宝藏就藏在下一道机关后面！':'这次可是个大麻烦！'));
  $('lineB').textContent=words(current.b||'先仔细看看线索，别急着猜答案。');
  $('questionTitle').textContent=words(verification?'奖励关 · 再破解一个新密码':mode==='topic'?['第一关 · 追踪线索','第二关 · 线索反转','第三关 · 宝箱密码'][Math.min(normalStageNumber-1,2)]:(current.title||'新的谜题'));
  $('questionText').textContent=words(current.question);
  $('answerInput').value='';$('handwork').value='';$('causeSelect').value='';
  $('verifyQuestion').classList.add('hidden');$('askHint').classList.toggle('hidden',verification);
  $('openWorkshop').classList.toggle('hidden',verification||!adventure);
  $('ideaWorkshop').classList.add('hidden');$('stuckPanel').classList.add('hidden');$('clueCard').classList.add('hidden');
  $('walkthroughPanel').classList.add('hidden');$('answerInput').disabled=false;
  ['submitAnswer','askHint','skipQuestion'].forEach(id=>$(id).disabled=false);
  $('answerFeedback').className='feedback hidden';$('showSolution').classList.add('hidden');$('nextQuestion').classList.add('hidden');
  $('nextQuestion').textContent=mode==='topic'?(position===active.length-1?'🎁 打开神秘宝箱':'🏃 再闯一关 →'):'下一件事件 →';
  $('briefingOverlay').classList.add('hidden');$('briefingText').textContent=introFor(current);
  $('readQuestionBar').classList.toggle('hidden',verification);
  // The answer/action areas must never both disappear: the briefing is a guide, not a page lock.
  $('answerZone').classList.remove('hidden');
  $('supportActions').classList.remove('hidden');
  fillWorkshop();checkpoint();
  // Offer an automatic opening clue, with a visible, clearly-labeled continue button.
  // If the modal is unsupported, the full answer UI below stays reachable.
  if(!verification)openBriefing();
 }
 function feedback(txt,type=''){let box=$('answerFeedback');box.textContent=txt;box.className='feedback '+type;box.setAttribute('data-feedback',type);}
 function revealFeedback(txt,type){
  feedback(txt,type);
  $('answerFeedback').scrollIntoView({behavior:'smooth',block:'center'});
  $('answerFeedback').focus({preventScroll:true});
 }
function updateProgress(record){if(record.status==='paused')return;let p=skill(record.family);p.lastQ=record.id;p.lastAttemptDate=today();if(record.firstCorrect && record.verification){ if(!p.cleanDates.includes(today()))p.cleanDates.push(today());if(!p.cleanVariants.includes(record.id))p.cleanVariants.push(record.id);p.cleanDates=p.cleanDates.slice(-12);p.cleanVariants=p.cleanVariants.slice(-20);p.reviewStage=Math.min(3,p.cleanDates.length);p.mastered=p.cleanDates.length>=3 && p.cleanVariants.length>=2;p.nextDue=addDays(today(),p.mastered?14:p.reviewStage===1?1:p.reviewStage===2?3:7);}else if(!record.firstCorrect){if(record.status==='correct'&&!(record.wrongAnswers||[]).length){/* Guided success is not new mastery evidence, but also does not erase previously proven mastery. */p.nextDue=addDays(today(),p.mastered?14:1);}else{p.cleanDates=[];p.cleanVariants=[];p.reviewStage=0;p.mastered=false;p.nextDue=addDays(today(),1);}}else{p.nextDue=addDays(today(),1);}state.progress[record.family]=p;}
function record(status){pauseClock();const e={version:3,mode,verification,question:current.question,parameters:current.params||null,steps:[...steps],handwork:$('handwork').value.trim(),id:current.id,family:current.family,topic:current.topic||'',status,firstAnswer,finalAnswer:$('answerInput').value.trim(),wrongAnswers:[...wrong],attempts:tries,hints,firstCorrect:status==='correct'&&tries===1&&hints===0,activeSeconds:activeSeconds(),timestamp:new Date().toISOString()};state.history.push(e);roundLog.push(e);updateProgress(e);save();checkpoint();return e;}
 function lock(){
  solved=true;$('answerInput').disabled=true;
  ['submitAnswer','askHint','skipQuestion'].forEach(id=>$(id).disabled=true);
  $('showSolution').classList.add('hidden');$('walkthroughPanel').classList.add('hidden');$('stuckPanel').classList.add('hidden');
  $('nextQuestion').classList.remove('hidden');$('verifyQuestion').classList.toggle('hidden',verification);
  if(mode==='topic'&&state.history.at(-1)?.status==='correct')$('stageReward').classList.remove('hidden');checkpoint();
 }
 function submit(){
  if(solved)return;
  // Never reject a submission merely because the briefing state is stale.
  const v=$('answerInput').value.trim();
  if(!v){revealFeedback('✏️ 还没有收到你的破解答案。先写一个数字试试，或者求一条线索。','tryagain');return;}
  if(verification&&!$('handwork').value.trim()){
   revealFeedback('📝 最后一关要靠自己啦！先在纸上算，再写下关键的一步。','tryagain');return;
  }
  tries++;if(tries===1)firstAnswer=v;
  steps.push({kind:'answer',answer:v,cause:$('causeSelect').value,work:$('handwork').value,correct:isCorrect(current,v),timestamp:new Date().toISOString()});
  if(isCorrect(current,v)){
   const independent=tries===1&&hints===0;
   record('correct');
   const winNote=mode==='topic'&&!verification?'\n'+(['🎁 第一块藏宝图到手！土豆星开始紧张了……','🗝️ 第二道机关也开了！最后的宝箱在呼唤你！','🏆 三道机关已经全部走过！看看谁才是真正的探险家。'][Math.min(position,2)]):'';
   revealFeedback((verification?(independent?'🎉 破解成功！这道新题没有提示也做对了。':'✅ 订正成功！这一轮有过错误，暂时不算独立掌握。'):(independent?'🎉 破案成功！没有借助线索也找到了答案。':'🎉 找到密码了！这次有线索帮助，想证明本领可以再挑战一次。'))+winNote,'success');
   lock();
  }else{
   wrong.push(v);
   const response=verification?'🔎 机关还没打开！检查纸上的步骤，试着自己找出是哪一步出了偏差。':
      tries===1?'🔒 密码没有打开！没关系，再核对题目条件。你可以修改答案，或者告诉小熊卡在哪里。':
      '🔎 还是没有破解成功。换一种检查方法吧，小熊准备了不同方向的线索。';
   revealFeedback(response,'tryagain');
   if(!verification){$('stuckPanel').classList.remove('hidden');if(tries>=2)$('showSolution').classList.remove('hidden');}
   checkpoint();
  }
 }
 function askForClue(){
  if(solved||verification)return;
  $('stuckPanel').classList.remove('hidden');
  $('stuckPanel').scrollIntoView({behavior:'smooth',block:'center'});
  $('causeSelect').focus({preventScroll:true});
  checkpoint();
 }
 function hint(){
  if(solved||verification)return;
  const cause=$('causeSelect').value||'理解条件',setting=sceneFor(current),category=setting?.help?.[cause]||basicHelp[cause]||basicHelp['理解条件'];
  const earlier=steps.filter(x=>x.kind==='hint'&&x.cause===cause).length;
  let txt=category[Math.min(earlier,category.length-1)];
  if(earlier>=2){txt+='\n💡 再想想：你现在写出的式子，每个数都能在题目中找到对应的意思吗？';}
  hints++;steps.push({kind:'hint',cause,level:earlier+1,timestamp:new Date().toISOString()});
  const c=$('clueCard');c.textContent='🐻 小熊给你的线索：\n'+txt;c.classList.remove('hidden');
  c.scrollIntoView({behavior:'smooth',block:'center'});
  if(hints>=3||tries>=2)$('showSolution').classList.remove('hidden');checkpoint();
 }
 function showWalkthrough(){
  if(solved||verification)return;
  walkthroughLevel=Math.max(1,walkthroughLevel);$('walkthroughPanel').classList.remove('hidden');renderWalkthrough();
  $('walkthroughPanel').scrollIntoView({behavior:'smooth',block:'center'});checkpoint();
 }
 function renderWalkthrough(){
  const setting=sceneFor(current),levels=[
   {title:'第 1 条 · 先决定从哪里想',text:setting?.walk?.[0]||'读完题，先辨认已知量与所求量，然后想想它们之间有什么联系。'},
   {title:'第 2 条 · 这条关系为什么成立',text:setting?.walk?.[1]||'把变化画成图或列成式子，验证每一步符合题意。'},
   {title:'第 3 条 · 尝试自己接上最后一步',text:'先暂时别看结果。照刚才的想法在纸上完成这题，然后返回输入答案。还想看完整过程，才打开最后一张底牌。'}
  ];
  const idx=Math.min(2,walkthroughLevel-1);
  $('walkthroughTitle').textContent=levels[idx].title;$('walkthroughText').textContent=levels[idx].text;
  $('walkthroughDots').textContent=['● ○ ○','● ● ○','● ● ●'][idx];
  $('walkthroughNext').textContent=walkthroughLevel<3?'下一条线索 →':'真的需要看完整过程';
 }
 function advanceWalkthrough(){
  if(solved||verification)return;
  hints++;steps.push({kind:'walkthrough-step',level:walkthroughLevel,timestamp:new Date().toISOString()});
  if(walkthroughLevel<3){walkthroughLevel++;renderWalkthrough();checkpoint();return;}
  record('explained');
  revealFeedback('📖 最后一张底牌（可以对照纸上的过程）：\n'+(current.explain||'把已知条件连接成算式，再逐步核对。')+'\n\n这道题还不算独立破解。想试试真正的本领，就点击「再挑战一次」。','success');
  lock();$('verifyQuestion').classList.remove('hidden');$('verifyQuestion').textContent='⚔️ 再挑战一次';
 }
 function fillWorkshop(){
  const setting=sceneFor(current);if(!setting)return;
  $('conceptWhy').textContent=setting.why;$('conceptQuestion').textContent=setting.quiz;
  const c=$('conceptChoices');c.replaceChildren();$('conceptFeedback').textContent='';
  setting.choices.forEach((value,i)=>{const b=document.createElement('button');b.type='button';b.className='concept-choice';b.textContent=value;
   b.addEventListener('click',()=>{
     if(solved)return;
     const ok=i===setting.correct;
     if(ok){b.classList.add('correct');$('conceptFeedback').textContent='✅ '+setting.reason;}
     else {b.classList.add('incorrect');$('conceptFeedback').textContent='🧐 这个方向还不对。先找出题目中的关键关系，再选一次。';}
     steps.push({kind:'concept-choice',family:current.family,choice:i,correct:ok});checkpoint();
   });c.append(b);});
 }
 function openWorkshop(){
  if(solved||verification)return;
  $('ideaWorkshop').classList.remove('hidden');
  if(!conceptUsed){hints++;steps.push({kind:'workshop-open',family:current.family});conceptUsed=true;}
  $('ideaWorkshop').scrollIntoView({behavior:'smooth',block:'center'});checkpoint();
 }
function skip(){if(solved)return;record('skipped');next();}
 function next(){
  verification=false;position++;
  if(position>=active.length){
   const main=roundLog.filter(x=>!x.verification);
   const verified=roundLog.filter(x=>x.verification && x.status==='correct').length;
   const finished=roundLog.filter(x=>x.status==='correct').length;
   const mainFinished=main.filter(x=>x.status==='correct').length;
   const solo=roundLog.filter(x=>x.firstCorrect).length;
   $('finishText').textContent=mode==='topic'?`🎁 这份悬赏的 ${main.length} 道机关都调查过啦！其中 ${mainFinished} 道成功破译。${verified?`另外，你还完成了 ${verified} 道无提示奖励验证！`:''}没解开的谜题会进“未解决事件”，以后还能回来挑战。`:
    `本轮调查了 ${roundLog.length} 件事，破解 ${finished} 件，其中 ${solo} 件是不借助提示、一次独立答对的。`;
   $('trackFill').style.width='100%';refresh();screen('finish');localStorage.removeItem(SESSION);
  }else render();
 }
 function leave(){localStorage.removeItem(SESSION);if(current&&!solved)record('paused');current=null;refresh();screen('home');localStorage.removeItem(SESSION);}
function download(data,filename){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
async function readFile(el){const file=el.files&&el.files[0];if(!file)throw Error('请先选择 JSON 文件。');if(file.size>2*1024*1024)throw Error('文件不能大于2MB。');return JSON.parse(await file.text());}
function toolMessage(s){$('toolMessage').textContent=s;}
 $('startButton').onclick=start;$('submitAnswer').onclick=submit;
 $('askHint').onclick=askForClue;$('getClue').onclick=hint;
 $('showSolution').onclick=showWalkthrough;$('walkthroughNext').onclick=advanceWalkthrough;
 $('closeWalkthrough').onclick=()=>{$('walkthroughPanel').classList.add('hidden');checkpoint();};
 $('openWorkshop').onclick=openWorkshop;
 $('closeWorkshop').onclick=()=>{$('ideaWorkshop').classList.add('hidden');checkpoint();};
 $('briefingClose').onclick=dismissBriefing;$('readQuestionButton').onclick=openBriefing;
 $('skipQuestion').onclick=skip;$('nextQuestion').onclick=next;
 $('exitGame').onclick=leave;$('finishHome').onclick=()=>{refresh();screen('home')};
 $('answerInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!solved){e.preventDefault();submit();}});
 $('parentOpen').onclick=()=>{refresh();screen('parent')};$('parentClose').onclick=()=>{refresh();screen('home')};
 document.querySelectorAll('[data-skin]').forEach(b=>b.addEventListener('click',()=>{setTheme(b.dataset.skin);toolMessage('已更换任务世界，练习记录没有变化。')}));

$('exportAll').onclick=()=>download({...state,exportedAt:new Date().toISOString()},'tom-adventure-backup-v02.json');$('exportHistory').onclick=()=>download({version:2,history:state.history,legacyHistory:state.legacyHistory,exportedAt:new Date().toISOString()},'tom-adventure-history.json');
$('importQuestions').onclick=async()=>{try{const data=await readFile($('questionFile'));if(!Array.isArray(data)||data.length>200||!data.length||data.some(q=>!validateQuestion(q)))throw Error('需要1～200道题，每道具备 id、family、question、answer。');const known=new Set(allQuestions().map(x=>x.id));let n=0;for(const q of data)if(!known.has(q.id)){state.customBank.push(q);known.add(q.id);n++}save();refresh();toolMessage('新增 '+n+' 道题，重复 ID 已跳过。')}catch(e){toolMessage('导入失败：'+e.message)}};
$('restoreBackup').onclick=async()=>{try{const b=await readFile($('backupFile'));if(!b||b.version!==2||!Array.isArray(b.history)||!Array.isArray(b.customBank)||!b.progress||b.customBank.some(q=>!validateQuestion(q)))throw Error('不是有效的 V0.2 备份。');if(!confirm('恢复备份会替换本设备的现有记录。要继续吗？'))return;localStorage.removeItem(SESSION);state={...fresh(),...b,version:2,v03:true};state.customBank=state.customBank.slice(0,300);save();setTheme(state.theme);refresh();toolMessage('备份恢复完成。')}catch(e){toolMessage('恢复失败：'+e.message)}};
document.addEventListener('visibilitychange',()=>{if(!current||solved||$('game').classList.contains('hidden'))return;if(document.visibilityState==='hidden')pauseClock();else if(visibleSince===null)visibleSince=Date.now()});

 function checkpoint(){
  if(screenName!=='game'||!current)return;
  try{localStorage.setItem(SESSION,JSON.stringify({active,position,roundLog,mode,current,tries,hints,wrong,firstAnswer,solved,verification,steps,answer:$('answerInput').value,work:$('handwork').value,cause:$('causeSelect').value,seconds:activeSeconds(),briefingDismissed,walkthroughLevel,conceptUsed,stuckOpen:!$('stuckPanel').classList.contains('hidden'),workshopOpen:!$('ideaWorkshop').classList.contains('hidden')}));}
  catch{toolMessage('本轮进度保存失败，请导出记录备份。');}
 }
 $('verifyQuestion').onclick=()=>{
  if(!solved||verification)return;
  const old=current;let q;
  for(let i=0;i<40;i++){
   q=window.TOM_VARIANTS.generate(window.TOM_VARIANTS.families.includes(old.family)?old.family:'operators',old.level||1);
   if(q.question!==old.question)break;
  }
  if(q.question===old.question){feedback('暂时没有新的验证题，请稍后再试。');return;}
  active.splice(position+1,0,{...q,verification:true});next();
 };
 ['answerInput','handwork','causeSelect'].forEach(id=>$(id).addEventListener('input',checkpoint));

window.addEventListener('pagehide',checkpoint);
setTheme(state.theme);refresh();screen('home');
 const resumed=parse(SESSION);
 if(resumed&&Array.isArray(resumed.active)&&resumed.active.length>0&&resumed.active.length<100&&resumed.active.every(validateQuestion)&&validateQuestion(resumed.current)&&Number.isInteger(resumed.position)&&resumed.position>=0&&resumed.position<resumed.active.length&&Array.isArray(resumed.roundLog)&&Array.isArray(resumed.steps)&&Array.isArray(resumed.wrong)&&Number.isFinite(resumed.tries)&&Number.isFinite(resumed.hints)){
  ({active,position,roundLog,mode}=resumed);screen('game');render();
  ({current,tries,hints,wrong,firstAnswer,solved,verification,steps}=resumed);
  briefingDismissed=!!resumed.briefingDismissed;walkthroughLevel=Math.max(0,Math.min(3,resumed.walkthroughLevel||0));conceptUsed=!!resumed.conceptUsed;
  $('answerInput').value=resumed.answer||'';$('handwork').value=resumed.work||'';$('causeSelect').value=resumed.cause||'';
  activeMillis=(resumed.seconds||0)*1000;
  $('briefingOverlay').classList.add('hidden');
  $('readQuestionBar').classList.toggle('hidden',briefingDismissed||verification);
  // Old saved sessions may contain an incomplete briefing state. Never restore a blank screen.
  $('answerZone').classList.remove('hidden');
  $('supportActions').classList.remove('hidden');
  if(!briefingDismissed&&!verification&&!solved)openBriefing();
  if(resumed.stuckOpen&&!verification)$('stuckPanel').classList.remove('hidden');
  if(resumed.workshopOpen&&!verification)$('ideaWorkshop').classList.remove('hidden');
  if(solved){lock();feedback('本题已经记录好了，可以继续下一件事件。','success');}
  else if(!verification&&(tries>=2||hints>=3))$('showSolution').classList.remove('hidden');
  checkpoint();
 }

})();
