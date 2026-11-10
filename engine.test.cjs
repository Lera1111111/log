const assert=require('node:assert/strict');
const E=require('./engine.js');
const katex=require('./vendor/katex/katex.min.js');
let seed=913743;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
let checked=0;
for(const f of E.families){
  const variants=new Set();
  for(let i=0;i<1500;i++){
    const t=E.generate(f.id,random),a=E.parseNumber(t.meta.base),ans=E.parseNumber(t.answer);
    const arg=t.meta.arg;
    const radicand=arg.match(/\\sqrt(?:\[(\d+)\])?\{(?:(\d+)|\\frac\{1\}\{(\d+)\})\}/);
    const b=radicand?Math.pow(radicand[2]?Number(radicand[2]):1/Number(radicand[3]),1/Number(radicand[1]||2)):E.parseNumber(arg);
    assert.equal(t.stage,f.stage);assert.equal(t.hints.length,3);assert.ok(E.check(t,t.answer));
    variants.add(t.formula);
    // Independent numerical identities, rather than mirroring generator output.
    if(['D01','D02','D03','D04'].includes(f.id))near(Math.log(b)/Math.log(a),ans);
    if(f.id==='D05')near(a**t.meta.exponent,ans);
    if(f.id==='D06'){assert.ok(ans>0&&ans!==1);near(Math.log(b)/Math.log(ans),t.meta.exponent);}
    if(f.id==='D07')near(a**ans,b);
    if(f.id==='D08'){
      assert.equal(t.options.length,4);assert.equal(new Set(t.options).size,4);
      near(a**t.meta.exponent,b);
      // Distractors must be false, not alternative true equalities.
      assert.notEqual(a**(t.meta.exponent+1),b);
      assert.notEqual(a**b,t.meta.exponent);
      assert.notEqual(a**t.meta.exponent,a**(t.meta.exponent+1));
    }
    if(f.id==='D09')assert.equal(t.answer,a>0&&a!==1&&b>0?'Да':'Нет');
    if(f.id==='D10')near(ans,t.formula.startsWith('\\log')?Math.log(b)/Math.log(a):b);
    if(f.id!=='D09'){
      const p=t.meta.primitive,limit=p===2?10:4;
      assert.ok(Math.abs(Math.log(Math.abs(b))/Math.log(p))<=limit+1e-9);
      assert.ok(Math.abs(Math.log(a)/Math.log(p))<=limit+1e-9);
    }
    for(const formula of [t.formula,t.relation,...(t.id==='D09'?[]:t.options||[])])katex.renderToString(formula,{throwOnError:true,strict:'error'});
    checked++;
  }
  assert.ok(variants.size>=10,`${f.id}: not enough variety`);
}
for(const s of [1,2,3]){
  for(const family of ['mixed',...E.families.filter(f=>f.stage===s).map(f=>f.id)]){
    const tasks=E.batch(s,family,random);assert.equal(tasks.length,10);assert.ok(tasks.every(t=>t.stage===s));
  }
}
for(const [a,b] of [['0,5',.5],['−3',-3],[' 2 / 4 ',.5],['1/-2',-.5],['.25',.25],['1e3',null],['1/0',null],['Infinity',null],['2+2',null],['<script>',null],['',null]])assert.equal(E.parseNumber(a),b);
assert.ok(E.check({kind:'number',answer:'1/2'},'0,5'));
assert.ok(!E.check({kind:'number',answer:'1/1024'},'0'));
assert.throws(()=>E.batch(1,'D10'));
console.log(`PASS: ${checked} generated tasks; numerical identities, limits, unique choices, KaTeX, parser, all series.`);
