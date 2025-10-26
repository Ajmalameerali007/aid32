/** Aidlex Enhancer v2: centered chat, categories, no auto-close, selective tools, female-ish TTS **/
(function(){
  // -------- Safe container under hero --------
  const wrap = document.getElementById('alx-wrap') || (()=> {
    const w = document.createElement('section'); w.id='alx-wrap';
    // try to place below "Get Started" hero if present, else end of body
    const startBtn = findStartButton();
    if(startBtn && startBtn.parentElement) startBtn.parentElement.after(w); else document.body.appendChild(w);
    return w;
  })();

  const messages = document.getElementById('alx-messages') || (()=> {
    const m = document.createElement('div'); m.id='alx-messages'; wrap.appendChild(m); return m;
  })();

  const inputRow = document.getElementById('alx-inputRow') || (()=> {
    const r = document.createElement('div'); r.id='alx-inputRow';
    const ta = document.createElement('textarea'); ta.id='alx-input'; ta.rows=2; ta.placeholder='Type here…';
    const send = document.createElement('button'); send.id='alx-send'; send.className='alx-btn'; send.textContent='Send';
    r.append(ta, send); wrap.appendChild(r); return r;
  })();
  const input = document.getElementById('alx-input');
  const send  = document.getElementById('alx-send');

  // hide any stray old single-line inputs near hero
  hideLegacyInputs();

  // -------- Overlay shell (Exit + Categories Home) --------
  const shell = ensure('div','alx-shell'); document.body.appendChild(shell);
  const exit  = ensure('button','alx-exit'); exit.textContent='Exit → Home'; shell.appendChild(exit);
  const home  = ensure('div','alx-home'); shell.appendChild(home);

  const card  = el('div',{class:'alx-card'}); home.appendChild(card);
  card.appendChild(el('h3',{class:'alx-title',text:'Aidlex – Quick Start'}));
  card.appendChild(el('p',{class:'alx-sub',text:'Choose a category to begin a short interview. No session will auto-close.'}));

  const grid  = el('div',{class:'alx-grid'}); card.appendChild(grid);

  // Categories (concise)
  const CATS = [
    { h:'MOHRE (Labour)', s:['Salary delay','Absconding/Ban','Unpaid EOS','Complaint','Contract issues'] },
    { h:'Tenancy & Real Estate', s:['Eviction','Rent increase','Deposit','Maintenance','Ejari/Tawtheeq'] },
    { h:'Courts & Notary', s:['Notary attest','Payment order','Civil claim','Cheque','Execution'] },
    { h:'DED / Economic', s:['Trade licence','Name reservation','Fines/Appeals','Partner dispute','Consumer complaint'] },
    { h:'Municipality', s:['Fines/Appeals','Permits','Closure notice','Health violations','Inspection response'] },
    { h:'Traffic & Fines', s:['RTA/ITC fines','Black points','Accident','Salik/Darb','Objection/Appeal'] },
    { h:'ICP / Immigration', s:['Visa status','Overstay','Entry permit','Golden visa','Resident services'] },
    { h:'TAMM / Amer', s:['Family visa','Status change','Medical/ID','Cancellation','Travel permit'] },
    { h:'Letters & Translation', s:['Request letter','Complaint letter','Undertaking','Arabic ↔ English','Custom format'] }
  ];
  CATS.forEach(cat=>{
    const chip = el('div',{class:'alx-chip'});
    chip.appendChild(el('div',{text:cat.h,style:'font-weight:600'}));
    chip.appendChild(el('div',{class:'alx-sub',text:cat.s.join(' · ')}));
    chip.onclick = ()=>{ startIntake(cat.h); hideHome(); };
    grid.appendChild(chip);
  });

  // Hook “Get Started” button if present to open categories
  const startBtn = findStartButton();
  startBtn?.addEventListener('click', (e)=>{ e.preventDefault(); showHome(); });

  // Exit shows home (no auto-close ever)
  exit.onclick = showHome;

  // -------- Chat helpers --------
  function addMsg(text, role='assistant', opts={tools:false}) {
    const b = el('div',{class:`alx-msg ${role==='user'?'alx-user':''}`}); b.textContent = text;
    messages.appendChild(b);
    if (role==='assistant' && opts.tools) b.appendChild(toolbar(text));
    messages.scrollTop = messages.scrollHeight;
  }

  function toolbar(text){
    const tb = el('div',{class:'alx-toolbar'});
    tb.append(btn('Copy', ()=> navigator.clipboard.writeText(text)),
              btn('Read aloud', ()=> ttsSpeak(text)));
    return tb;
  }
  function btn(label,fn){ const b=el('button',{class:'alx-btn',text:label}); b.onclick=fn; return b; }

  // -------- Intake flow --------
  let active=false, idx=0, answers={};
  const Q = [
    {k:'issue_type',   t:(p)=>`Starting: ${p}. In one line, what is the specific issue?`},
    {k:'what_happened',t:'What happened? Please describe the situation in your own words.'},
    {k:'dates',        t:'When did it occur? Share key dates or notices.'},
    {k:'parties',      t:'Who is involved? (You, other party/company, authority)'},
    {k:'documents',    t:'Do you have documents (contracts/notices/emails)? List briefly.'},
    {k:'location',     t:'Which emirate/authority applies? (e.g., Abu Dhabi – ADJD/MOHRE; Dubai – Courts/MOHRE/DED)'},
    {k:'urgency',      t:'How urgent is this? (none / this week / today)'},
    {k:'outcome',      t:'What outcome do you want now? (draft letter / complaint / negotiation / appeal)'},
    {k:'deadline',     t:'Any fixed deadline/hearing date? If none, say "none".'},
    {k:'contact',      t:'If you want a callback, share email/phone (optional).'}
  ];

  function startIntake(picked){
    active=true; idx=0; answers={};
    addMsg("I'll ask a few quick questions to tailor the guidance.",'assistant', {tools:false});
    askNext(picked);
  }
  function askNext(picked){
    if(idx===0 && picked){ addMsg(fnText(Q[0].t,picked),'assistant',{tools:false}); return; }
    if(idx<Q.length){ addMsg(fnText(Q[idx].t,picked),'assistant',{tools:false}); }
    else{
      active=false;
      const summary = buildSummary(answers);
      addMsg('Thanks. Preparing your guidance…','assistant',{tools:false});
      callAgent(summary).then(reply=>{
        addMsg(reply || 'I returned a response.','assistant',{tools:true}); // tools only on agent output
        renderEndActions();
      }).catch(e=>{
        addMsg('Error: '+e,'assistant',{tools:false}); renderEndActions();
      });
    }
  }
  function onSend(){
    const t = input.value.trim(); if(!t) return; input.value=''; addMsg(t,'user',{tools:false});
    if(active){ answers[Q[idx].k]=t; idx++; askNext(); }
    else{ callAgent(t).then(r=> addMsg(r,'assistant',{tools:true})); }
  }
  send.addEventListener('click', onSend);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); onSend(); }});

  function buildSummary(a){
    return [
      'USER INTAKE SUMMARY',
      `Issue: ${a.issue_type||'-'}`,
      `What happened: ${a.what_happened||'-'}`,
      `Dates: ${a.dates||'-'}`,
      `Parties: ${a.parties||'-'}`,
      `Documents: ${a.documents||'-'}`,
      `Location/Authority: ${a.location||'-'}`,
      `Urgency: ${a.urgency||'-'}`,
      `Desired outcome: ${a.outcome||'-'}`,
      `Deadline: ${a.deadline||'-'}`,
      `Contact: ${a.contact||'-'}`
    ].join('\n');
  }

  function renderEndActions(){
    const w = el('div',{class:'alx-toolbar'});
    w.append(
      btn('Book appointment', ()=> addMsg('Please share a preferred time and your contact.','assistant',{tools:false})),
      btn('New case', ()=> { showHome(); startIntakePrompt(); }),
      btn('Exit → Home', ()=> showHome())
    );
    messages.appendChild(w); messages.scrollTop = messages.scrollHeight;
  }

  // -------- Home overlay --------
  function showHome(){ home.style.display='flex'; }
  function hideHome(){ home.style.display='none'; }
  function startIntakePrompt(){ hideHome(); startIntake('New case'); }
  // show categories only when user clicks "Get Started"
  // (no auto-open)

  // -------- TTS (female-ish) --------
  function ttsSpeak(text){
    try{
      const synth = window.speechSynthesis; if(!synth) return alert('Speech not supported.');
      const u = new SpeechSynthesisUtterance(text);
      const choose = (voices)=> voices.find(v=>/female/i.test(v.name))
        || voices.find(v=>/Google UK English Female|Samantha|Victoria|Joanna|Amy/i.test(v.name))
        || voices.find(v=>/^en[-_]/i.test(v.lang)) || voices[0];
      const apply = ()=>{ const v = choose(speechSynthesis.getVoices()); if(v) u.voice=v; synth.speak(u); };
      u.rate=0.96; u.pitch=1.1;
      if(speechSynthesis.getVoices().length){ apply(); } else { speechSynthesis.onvoiceschanged = apply; }
    }catch(e){ console.error(e); }
  }

  // -------- Backend call --------
  async function callAgent(message){
    const r = await fetch('/.netlify/functions/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
    const data = await r.json().catch(()=> ({}));
    return data?.output_text || data?.output?.[0]?.content?.[0]?.text || data?.response?.output_text || (typeof data==='string'?data:JSON.stringify(data));
  }

  // -------- Utils --------
  function ensure(tag,id){ const n=document.getElementById(id)||document.createElement(tag); n.id=id; return n; }
  function el(tag,opts={}){ const n=document.createElement(tag); if(opts.class) n.className=opts.class; if(opts.text) n.textContent=opts.text; if(opts.style) n.setAttribute('style',opts.style); return n; }
  function fnText(t,p){ return (typeof t==='function')? t(p): t; }

  function hideLegacyInputs(){
    // Hide obvious stray input near hero so we use our own
    const candidates = Array.from(document.querySelectorAll('input[type="text"], textarea')).filter(x=>!['alx-input'].includes(x.id));
    if(candidates.length===1){ candidates[0].style.display='none'; }
  }
  function findStartButton(){
    // Try common IDs or a button with text 'Get Started'
    return document.querySelector('#startChatBtn') ||
           Array.from(document.querySelectorAll('button,a')).find(b=>/get started/i.test(b.textContent||''));
  }
})();
