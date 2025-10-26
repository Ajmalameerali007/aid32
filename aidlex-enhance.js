/** Aidlex Enhancer: guided intake, categories, exit, copy, female-like TTS **/
(function(){
  // ---- DOM scaffolding (non-destructive overlay) ----
  const shell = el('div',{id:'alx-shell'}); document.body.appendChild(shell);
  const exit = el('button',{id:'alx-exit',text:'Exit → Home'}); shell.appendChild(exit);
  const home = el('div',{id:'alx-home'}); shell.appendChild(home);

  const card = el('div',{class:'alx-card'}); home.appendChild(card);
  card.appendChild(el('h3',{class:'alx-title',text:'Aidlex – Quick Start'}));
  card.appendChild(el('p',{class:'alx-sub',text:'Choose a category to begin a short interview. No session will auto-close.'}));

  const grid = el('div',{class:'alx-grid'}); card.appendChild(grid);

  // ---- Curated categories (short & clear) ----
  const CATS = [
    { h:'MOHRE (Labour)', s:['Salary delay','Absconding / Ban','Unpaid EOS','Labour complaint','Offer/Contract issues'] },
    { h:'Tenancy & Real Estate', s:['Eviction / Notice','Rent increase','Security deposit','Maintenance dispute','Ejari / Tawtheeq'] },
    { h:'Courts & Notary', s:['Notary attest','Payment order','Civil claim','Cheque case','Execution steps'] },
    { h:'DED / Economic', s:['Trade licence','Name reservation','Fines & appeals','Partner disputes','Consumer complaint'] },
    { h:'Municipality', s:['Fines & appeals','Shop permits','Closure notice','Health violations','Inspection response'] },
    { h:'Traffic & Fines', s:['RTA/ITC fines','Black points','Accident report','Salik/Darb','Objection/Appeal'] },
    { h:'ICP / Immigration', s:['Visa status','Overstay','Entry permit','Golden visa','Resident services'] },
    { h:'TAMM / Amer', s:['Family visa','Status change','Medical/ID','Cancellation','Travel permit'] },
    { h:'Letters & Translation', s:['Request letter','Complaint letter','Undertaking','Arabic ↔ English','Custom format'] }
  ];

  // build grid
  CATS.forEach(cat=>{
    const chip = el('div',{class:'alx-chip'});
    chip.appendChild(el('div',{text:cat.h,style:'font-weight:600'}));
    chip.appendChild(el('div',{class:'alx-sub',text:cat.s.join(' · ')}));
    chip.onclick = ()=>{ startIntake(cat.h); hideHome(); };
    grid.appendChild(chip);
  });

  // ---- Chat hooks (augment existing page) ----
  // Create message container if page doesn’t have one
  const host = document.querySelector('#messages') || document.body;
  function addMsg(text, role='assistant'){
    const m = el('div',{class:`alx-msg ${role==='user'?'alx-user':''}`}); 
    m.textContent = text; host.appendChild(m);
    if(role==='assistant'){ m.appendChild(toolbar(text)); }
    scrollToBottom();
  }
  function toolbar(text){
    const tb = el('div',{class:'alx-toolbar'});
    const copy = btn('Copy', ()=> navigator.clipboard.writeText(text));
    const speak = btn('Read aloud', ()=> ttsSpeak(text));
    tb.append(copy,speak); return tb;
  }
  function btn(label,fn){ const b=el('button',{class:'alx-btn',text:label}); b.onclick=fn; return b;}
  function scrollToBottom(){ host.scrollTop = host.scrollHeight; }

  // ---- Intake engine (guided interview) ----
  let answers={}, idx=0, active=false;
  const Q = [
    {k:'issue_type', t:(p)=>`Starting: ${p}. In one line, what is the specific issue?`},
    {k:'what_happened', t:'What happened? Please describe the situation in your own words.'},
    {k:'dates', t:'When did it occur? Share any key dates or notices.'},
    {k:'parties', t:'Who is involved? (You, other party/company, authority)'},
    {k:'documents', t:'Do you have any documents (contracts/notices/emails)? List briefly.'},
    {k:'location', t:'Which emirate/authority applies? (e.g., Abu Dhabi – ADJD/MOHRE; Dubai – Courts/MOHRE/DED)'},
    {k:'urgency', t:'How urgent is this? (none / this week / today)'},
    {k:'outcome', t:'What outcome do you want now? (draft letter / complaint / negotiation / appeal)'},
    {k:'deadline', t:'Any fixed deadline/hearing date? If none, say "none".'},
    {k:'contact', t:'If you want a callback, share email/phone (optional).'}
  ];

  // Attach to existing input if present; otherwise add minimal input
  let input = document.querySelector('#chatInput');
  let send  = document.querySelector('#sendBtn');
  if(!input){ input = el('textarea',{id:'chatInput',style:'width:100%;margin-top:8px',rows:2}); host.appendChild(input); }
  if(!send){  send  = el('button',{id:'sendBtn',class:'alx-btn',text:'Send'}); host.appendChild(send); }

  send.addEventListener('click', onSend);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); onSend(); }});

  function startIntake(picked){
    active=true; answers={}; idx=0;
    addMsg("I'll ask a few quick questions to tailor the guidance.",'assistant');
    askNext(picked);
  }
  function askNext(picked){
    if(idx===0 && picked){ addMsg(typeof Q[0].t==='function'?Q[0].t(picked):Q[0].t,'assistant'); return; }
    if(idx<Q.length){ addMsg(typeof Q[idx].t==='function'?Q[idx].t(picked):Q[idx].t,'assistant'); }
    else{
      active=false;
      const summary = buildSummary(answers);
      addMsg("Thanks. Preparing your guidance…",'assistant');
      callAgent(summary).then(r=>{
        addMsg(r || "Received.",'assistant');
        renderEndActions();
      }).catch(e=>{
        addMsg("Error: "+e,'assistant'); renderEndActions();
      });
    }
  }
  function onSend(){
    const t = input.value.trim(); if(!t) return; input.value='';
    addMsg(t,'user');
    if(active){
      const key = Q[idx].k; answers[key]=t; idx++; askNext();
    }else{
      // Chat continues with agent (no auto close)
      callAgent(t).then(r=> addMsg(r,'assistant'));
    }
  }
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
    const wrap = el('div',{class:'alx-toolbar'});
    wrap.append(
      btn('Book appointment', ()=> addMsg('Please share a preferred time and your contact.','assistant')),
      btn('New case', ()=> { showHome(); startIntakePrompt(); }),
      btn('Exit → Home', ()=> showHome())
    );
    host.appendChild(wrap); scrollToBottom();
  }

  // ---- Home show/hide + Exit ----
  function showHome(){ home.style.display='flex'; }
  function hideHome(){ home.style.display='none'; }
  exit.onclick = showHome; // never auto-close
  function startIntakePrompt(){ hideHome(); startIntake('New case'); }

  // open home at first render
  showHome();

  // ---- Copy + TTS (female-ish) ----
  function ttsSpeak(text){
    try{
      const synth = window.speechSynthesis; if(!synth) return alert('Speech not supported.');
      const utter = new SpeechSynthesisUtterance(text);
      // pick a female-sounding English voice if available
      const pick = (voices)=>{
        const pref = voices.find(v=>/female/i.test(v.name))
                  || voices.find(v=>/Google UK English Female|Samantha|Victoria|Joanna|Amy/i.test(v.name))
                  || voices.find(v=>/^en[-_]/i.test(v.lang))
                  || voices[0];
        return pref;
      };
      const apply = ()=>{ const v = pick(speechSynthesis.getVoices()); if(v) utter.voice=v; synth.speak(utter); };
      utter.rate = 0.96; utter.pitch = 1.1; // warmer female tone
      if(speechSynthesis.getVoices().length){ apply(); } else {
        speechSynthesis.onvoiceschanged = apply;
      }
    }catch(e){ console.error(e); }
  }

  // ---- Backend call (Netlify Function) ----
  async function callAgent(message){
    const r = await fetch('/.netlify/functions/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
    const data = await r.json().catch(()=> ({}));
    return data?.output_text || data?.output?.[0]?.content?.[0]?.text || data?.response?.output_text || (typeof data==='string'?data:JSON.stringify(data));
  }

  // util
  function el(tag,opts={}){
    const n=document.createElement(tag);
    if(opts.id) n.id=opts.id;
    if(opts.class) n.className=opts.class;
    if(opts.text) n.textContent=opts.text;
    if(opts.style) n.setAttribute('style',opts.style);
    return n;
  }
})();
