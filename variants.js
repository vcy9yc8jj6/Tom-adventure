/* Finite positive integer domains; generated equations have unique solutions. */
(() => {
'use strict';
const families=['operators','patterns','weighing','pouring','pursuit'];
function generate(family,level=1,rng=Math.random){
const n=(a,b)=>a+Math.floor(rng()*(b-a+1));
level=Math.max(1,Math.min(3,level));
let question,answer,explain,formula,values,steps,params;
if(family==='operators'){
 const k=n(2,5),b=n(2,9),x=n(3,15),y=k*x-b;params={k,b,x};
 question=level===1?`规定 a ★ b = ${k}a − b。求 ${x} ★ ${b}。`:`规定 a ★ b = ${k}a − b。已知 x ★ ${b} = ${y}，求 x。`;
 answer=level===1?y:x;explain=`${k} × ${x} − ${b} = ${y}；反向检查 (${y} + ${b}) ÷ ${k} = ${x}。`;
 formula=['结果','系数 × 第一个数','− 第二个数'];values=[y,k*x,b];steps=['两个位置分别对应哪个数？','先代入，检查乘法与减法的顺序。','把结果代回原规则，两边是否相等？'];
}else if(family==='patterns'){
 const count=[3,5,7,9][n(0,3)],d=n(1,4),first=d*n(2,9),last=first+(count-1)*d,sum=count*(first+last)/2;params={count,d,first};
 question=level===1?`${count} 个连续的 ${d} 的倍数之和是 ${sum}。最大的数是多少？`:`${count} 个连续的 ${d} 的倍数中，最大是 ${last}。这 ${count} 个数的和是多少？`;
 answer=level===1?last:sum;explain=`中间数为 ${(first+last)/2}；和为 ${count} × ${(first+last)/2} = ${sum}；最大为 ${last}。`;
 formula=['总和','项数','× 中间数'];values=[sum,count,(first+last)/2];steps=['连续的倍数每次增加多少？','首尾配对后，平均数在哪里？','从中间走到最大需要几步？反向怎样求和？'];
}else if(family==='weighing'){
 const times=n(2,4),count=n(3**(times-1)+1,3**times);params={times,count};
 question=level===1?`${count} 枚金币恰有一枚较轻，其余一样重。无砝码天平至少称几次能保证找到？`:`恰有一枚假币且已知较轻，其余一样重。无砝码天平最多称 ${times} 次，最多能保证在多少枚金币中找出假币？`;
 answer=level===1?times:3**times;explain=`一次有三种结果。${times-1} 次最多区分 ${3**(times-1)} 枚，${times} 次最多 ${3**times} 枚；等量三分递归达到上限。`;
 formula=['最多候选数','3','^ 称重次数'];values=[3**times,3,times];steps=['天平会出现哪三种结果？','每次最多把候选分成几组？','少称一次够吗？能构造三分方案吗？'];
}else if(family==='pouring'){
 const cap=n(8,20),water=n(2,cap-1),source=n(cap-water,cap+5),moved=cap-water,left=source-moved;params={cap,water,source};
 question=level===1?`大桶容量 ${cap} 升，已有 ${water} 升水。小桶有 ${source} 升水，倒入大桶直到大桶满。小桶还剩几升？`:`大桶容量 ${cap} 升，小桶起初有 ${source} 升水。倒入大桶直到大桶满，小桶剩 ${left} 升。大桶起初有几升？`;
 answer=level===1?left:water;explain=`倒入 ${cap} − ${water} = ${moved} 升；小桶剩 ${source} − ${moved} = ${left} 升。`;
 formula=['倒入量','容量','− 原有水量'];values=[moved,cap,water];steps=['容量和原有水量有什么区别？','倒出的水与倒入的水是否一样多？','用水量守恒核对前后水量。'];
}else if(family==='pursuit'){
 const slow=n(3,8),diff=n(2,6),fast=slow+diff,time=n(12,50),opposite=level===3,relative=opposite?fast+slow:diff,length=relative*time;params={slow,fast,time,opposite};
 question=level===1?`${length} 米环形跑道，两人从同一点同时同向出发，速度 ${fast} 和 ${slow} 米/秒。第一次追上需几秒？`:`${length} 米环形跑道，两人从同一点同时${opposite?'反向':'同向'}出发，快者速度 ${fast} 米/秒。${time} 秒后第一次${opposite?'相遇（不算出发时）':'追上'}，慢者速度多少米/秒？`;
 answer=level===1?time:slow;explain=`相对速度 ${fast} ${opposite?'+':'−'} ${slow} = ${relative} 米/秒；${length} ÷ ${relative} = ${time} 秒。`;
 formula=['圈长','相对速度','× 时间'];values=[length,relative,time];steps=['同向还是反向？间距每秒怎样改变？','首次相遇时，两人合计或相差的路程是多少？','用圈长、相对速度和时间代回检查。'];
}else throw Error('Unknown family');
return {id:`v3-${family}-${level}-${Object.values(params).join('-')}`,family,level,topic:{operators:'外星运算',patterns:'数字暗号',weighing:'金币疑案',pouring:'水桶机关',pursuit:'环形追踪'}[family],title:level===1?'参数档案':'反向调查',question,answer,explain,formula,values,steps,params};
}
window.TOM_VARIANTS={generate,families};
})();
