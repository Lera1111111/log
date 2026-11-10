/* Pure math engine. Also available in Node for independent verification. */
(function (root) {
  'use strict';
  const families = [
    ['D01',1,'Вычисление логарифма','Найти показатель степени'],
    ['D02',1,'Ноль и отрицательные показатели','Единица и обратные степени'],
    ['D03',2,'Дробное основание','Основание меньше единицы'],
    ['D04',2,'Дробный ответ','Корень в аргументе'],
    ['D05',2,'Найди аргумент','Переход к показательной записи'],
    ['D06',2,'Найди основание','Положительное основание, отличное от 1'],
    ['D07',1,'Найди показатель','Связь степени и логарифма'],
    ['D08',3,'Две записи одного равенства','Перевод в показательную форму'],
    ['D09',3,'Существует ли логарифм?','Основание и аргумент'],
    ['D10',3,'Определение в действии','Обратные операции']
  ].map(([id,stage,title,description])=>({id,stage,title,description}));
  const pick=(xs,r)=>xs[Math.floor(r()*xs.length)];
  const int=(lo,hi,r)=>lo+Math.floor(r()*(hi-lo+1));
  function gcd(a,b){return b?gcd(b,a%b):a;}
  function rat(n,d=1){const g=gcd(Math.abs(n),d);return d/g===1?String(n/g):`${n/g}/${d/g}`;}
  function tex(v){const s=String(v);if(s.includes('/')){const [n,d]=s.split('/');return `${n.startsWith('-')?'-':''}\\frac{${n.replace('-','')}}{${d}}`;}return s;}
  function power(b,n){return n<0?`1/${b**(-n)}`:String(b**n);}
  function generate(id,r=Math.random){
    const b=pick([2,10],r),max=b===2?10:4;
    let n=int(1,max,r),a=String(b),arg=power(b,n),answer=String(n),title='Вычисли логарифм',formula='',relation='',kind='number',options,rootDegree;
    const log=(x,y)=>`\\log_{${tex(x)}} ${tex(y)}`;
    if(id==='D02'){n=pick([0,...Array.from({length:max},(_,i)=>-i-1)],r);arg=power(b,n);answer=String(n);}
    if(id==='D03'){a=`1/${b}`;n=int(-max,max,r);arg=power(b,-n);answer=String(n);}
    if(id==='D04'){const q=pick([2,3],r);rootDegree=q;n=pick(Array.from({length:2*max+1},(_,i)=>i-max).filter(k=>k%q!==0),r);arg=`\\sqrt${q===2?'':`[${q}]`}{${tex(power(b,n))}}`;answer=rat(n,q);}
    if(id==='D05'){n=int(-max,max,r);answer=power(b,n);title='Найди аргумент x';formula=`${log(a,'x')}=${n}`;relation=`x=${b}^{${n}}=${tex(answer)}`;}
    if(id==='D06'){const inv=pick([false,true],r);a=inv?`1/${b}`:String(b);n=pick([-2,-1,1,2],r);arg=power(b,inv?-n:n);answer=a;title='Найди основание x';formula=`${log('x',arg)}=${n}`;relation=`x^{${n}}=${tex(arg)},\\quad x=${tex(a)} \\;(x>0,\\;x\\ne1)`;}
    if(id==='D07'){n=int(-max,max,r);arg=power(b,n);answer=String(n);title='Найди показатель x';formula=`${b}^{x}=${tex(arg)}`;relation=`x=${log(a,arg)}=${n}`;}
    if(id==='D08'){
      n=int(-max,max,r);arg=power(b,n);title='Выбери равносильную запись';formula=`${log(a,arg)}=${n}`;kind='choice';answer=`${b}^{${n}}=${tex(arg)}`;
      options=[answer,`${b}^{${n+1}}=${tex(arg)}`,`${b}^{${tex(arg)}}=${n}`,`${b}^{${n}}=${tex(power(b,n+1))}`];relation=answer;
    }
    if(id==='D09'){
      a=pick(['2','10','1/2','1/10','1','0','-2'],r);arg=pick(['1','2','10','1/2','0','-1','-10'],r);title='Существует ли логарифм в действительных числах?';kind='choice';options=['Да','Нет'];
      const av=parseNumber(a),bv=parseNumber(arg);answer=av>0&&av!==1&&bv>0?'Да':'Нет';formula=log(a,arg);
      relation=`a=${tex(a)},\\quad b=${tex(arg)}`;
    }
    if(id==='D10'){title='Вычисли выражение';n=int(-max,max,r);arg=power(b,n);const variant=pick([true,false],r);answer=variant?arg:String(n);formula=variant?`${b}^{${log(a,arg)}}`:`${log(a,`${b}^{${n}}`)}`;relation=variant?`${b}^{${log(a,arg)}}=${tex(arg)}`:`${b}^{${n}}=${tex(arg)},\\quad ${log(a,arg)}=${n}`;}
    if(!formula)formula=log(a,arg);
    if(!relation)relation=`\\left(${tex(a)}\\right)^{${tex(answer)}}=${tex(arg)}`;
    const hints=id==='D09'?[
      'Для существования логарифма проверь три условия.',
      'Основание должно быть положительным и не равным 1. Аргумент должен быть положительным.',
      `Подставь основание ${a} и аргумент ${arg} в эти условия. Нарушения хотя бы одного достаточно для ответа «Нет».`
    ]:[
      'Логарифм — показатель степени: в какую степень нужно возвести основание, чтобы получить аргумент?',
      id==='D10'?'Возведение в степень и логарифмирование с одним основанием — обратные операции.':id==='D07'?'Перепиши степень через логарифм.':`Перейди к записи aᶜ = b. Основание здесь ${id==='D06'?'x':a}; аргумент ${id==='D05'?'x':arg}.`,
      `Используй опорное равенство: ${b}^${n} = ${power(b,n)}. ${id==='D03'?'При замене основания на обратное знак показателя меняется.':id==='D04'?`Извлечение корня степени ${rootDegree} делит показатель на ${rootDegree}.`:'Сопоставь его с условием.'}`
    ];
    const explanation=id==='D09'?(answer==='Да'?'Все три условия выполнены: a > 0, a ≠ 1, b > 0.':'Логарифм не существует: '+(parseNumber(a)<=0?'основание не положительно.':parseNumber(a)===1?'основание равно 1.':'аргумент не положителен.')):'По определению логарифма получаем равенство ниже. Оно позволяет проверить ответ подстановкой.';
    if(options)options=shuffle(options,r);
    return {id,stage:families.find(f=>f.id===id).stage,title,formula,answer,kind,options,hints,relation,explanation,meta:{base:a,arg,exponent:n,primitive:b,max,rootDegree}};
  }
  function shuffle(xs,r=Math.random){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function batch(stage,id='mixed',r=Math.random){
    const ids=families.filter(f=>f.stage===stage).map(f=>f.id);
    if(id!=='mixed'&&!ids.includes(id))throw new Error('Семейство не входит в ступень');
    const order=shuffle(Array.from({length:10},(_,i)=>id==='mixed'?ids[i%ids.length]:id),r);
    return order.map(x=>generate(x,r));
  }
  function parseNumber(raw){
    const s=String(raw).trim().replaceAll('−','-').replaceAll(',','.').replace(/\s/g,'');
    if(s.length>80||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[-+]?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(s))return null;
    const parts=s.split('/').map(Number);if(parts[1]===0)return null;const n=parts.length===2?parts[0]/parts[1]:parts[0];return Number.isFinite(n)?n:null;
  }
  function check(task,raw){if(task.kind==='choice')return raw===task.answer;const n=parseNumber(raw),a=parseNumber(task.answer);return n!==null&&Math.abs(n-a)<=1e-10*Math.max(1,Math.abs(a));}
  const api={families,generate,batch,parseNumber,check,tex,shuffle};
  root.LogEngine=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
