const {JSDOM}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const root=__dirname+'/';
const source=fs.readFileSync(root+'app.js','utf8');
const tick=()=>new Promise(r=>setTimeout(r,0));
const runtimeErrors=[];
function setup(saved,broken=false){
  const d=new JSDOM(fs.readFileSync(root+'index.html','utf8'),{url:'https://example.github.io/logs/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=d.window;w.addEventListener('error',e=>runtimeErrors.push(e.error));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  if(saved)w.localStorage.setItem('logs-without-stress:v1',saved);
  if(broken)Object.defineProperty(w,'localStorage',{get(){throw new Error('denied');}});
  w.eval(fs.readFileSync(root+'engine.js','utf8'));w.eval(source);return w;
}
let w=setup();
const sel=s=>w.document.querySelector(s),click=s=>{assert.ok(sel(s),s);sel(s).click();};
const route=async hash=>{w.location.hash=hash;await tick();};
const saved=()=>JSON.parse(w.localStorage.getItem('logs-without-stress:v1'));
function answer(value){const s=saved().active,t=s.tasks[s.index];if(t.kind==='choice'){sel(`input[value="${t.options.indexOf(value)}"]`).checked=true;sel(`input[value="${t.options.indexOf(value)}"]`).dispatchEvent(new w.Event('input',{bubbles:true}));}else {sel('#answer').value=value;sel('#answer').dispatchEvent(new w.Event('input',{bubbles:true}));}}
function submit(){sel('form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
(async()=>{
  assert.equal(w.document.querySelectorAll('.topic').length,7);
  await route('practice/1/D01');
  submit();assert.ok(sel('#input-error').textContent.length>0);
  for(let i=0;i<3;i++)click('[data-action="hint"]');
  assert.equal(w.document.querySelectorAll('.hint-box li').length,3);assert.ok(sel('[data-action="hint"]').disabled);
  answer('999');submit();assert.ok(sel('.feedback.wrong'));assert.ok(sel('#answer').disabled);
  click('[data-action="next"]');
  answer(saved().active.tasks[1].answer);
  const checkpoint=w.localStorage.getItem('logs-without-stress:v1');
  w.close();w=setup(checkpoint);await route('practice/1/D01');assert.equal(sel('#answer').value,saved().active.tasks[1].answer);submit();
  for(let i=2;i<10;i++){click('[data-action="next"]');answer(saved().active.tasks[i].answer);submit();}
  click('[data-action="next"]');await tick();assert.ok(w.location.hash.startsWith('#result/'));assert.equal(sel('.result-score').textContent.trim(),'9 / 10');assert.equal(w.document.querySelectorAll('.review-card').length,10);
  click('[data-action="retry"]');await tick();assert.equal(saved().active.tasks.length,1);answer(saved().active.tasks[0].answer);submit();click('[data-action="next"]');await tick();assert.equal(sel('.result-score').textContent.trim(),'1 / 1');
  await route('exam/2/mixed');assert.equal(sel('[data-action="hint"]'),null);
  for(let i=0;i<10;i++){const s=saved().active;answer(i<8?s.tasks[i].answer:'999');submit();assert.equal(sel('.feedback'),null);}
  assert.equal(sel('[role="progressbar"]').getAttribute('aria-valuenow'),'100');
  click('[data-action="finish"]');assert.ok(sel('[data-action="confirm-finish"]'));click('[data-action="confirm-finish"]');await tick();assert.equal(sel('.result-score').textContent.trim(),'8 / 10');
  await route('definition');assert.ok(sel('main').textContent.includes('8/10'));
  await route('home');assert.ok(sel('main').textContent.includes('27%'));click('[data-route="base"]');assert.ok(sel('main').textContent.includes('0%'));
  click('[data-route="school"]');assert.ok(sel('main').textContent.includes('27%'));
  // More than 30 practice results must not erase the best exam score.
  let v=saved();const exam=v.records.find(r=>r.mode==='exam');v.records=Array.from({length:30},(_,i)=>({...exam,id:'practice'+i,mode:'practice'}));w.close();w=setup(JSON.stringify(v));assert.ok(sel('main').textContent.includes('27%'));
  await route('exam/3/mixed');click('[data-action="finish"]');click('[data-action="confirm-finish"]');await tick();assert.equal(sel('.result-score').textContent.trim(),'0 / 10');
  // Cover every family with real form events, including root answers and choices.
  for(const family of w.LogEngine.families){
    await route(`practice/${family.stage}/${family.id}`);
    answer(saved().active.tasks[0].answer);submit();assert.ok(sel('.feedback:not(.wrong)'));
  }
  // Explicit resume restores the saved route; a new route starts its own series.
  await route('home');click('[data-route="base"]');await route('practice/1/D01');assert.equal(saved().active.route,'base');
  await route('home');click('[data-route="school"]');await route('resume');assert.equal(saved().route,'base');assert.equal(saved().active.route,'base');
  await route('missing');assert.ok(sel('h1').textContent.includes('пока нет'));
  w.close();w=setup('{invalid');assert.ok(sel('.storage-warning'));await route('practice/1/D01');assert.ok(sel('form'));
  w.close();w=setup(null,true);assert.ok(sel('.storage-warning'));await route('practice/1/D01');assert.ok(sel('form'));
  w.close();assert.deepEqual(runtimeErrors,[]);console.log('PASS: full training, 3 hints, validation, reload restoration, 10-task result, retry, exam, skips, route isolation, retained best, unknown hash, corrupt/blocked storage; zero runtime errors.');
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});

