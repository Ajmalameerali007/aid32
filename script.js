const $ = (s)=>document.querySelector(s);

// Sections
const landing = $('#landing'), profile = $('#profile'), services = $('#services'), chat = $('#chat');
// Controls
const getStarted = $('#getStarted'), exitHome = $('#exitHome');
const profileForm = $('#profileForm'), nameEl = $('#name'), emailEl = $('#email'), phoneEl = $('#phone');
const serviceGrid = $('#serviceGrid');
const messagesEl = $('#messages'), inputEl = $('#chatInput'), sendBtn = $('#sendBtn');

// State
let profileData = { name:'', email:'', phone:'' };
let selectedService = null;
let intakeActive = false, qIndex = 0;
const answers = {};

const SERVICES = [
  { key:'mohre', title:'MOHRE (Labour)', subs:'Salary delay · Unpaid EOS · Complaint · Contract', prompt:'You are a UAE MOHRE assistant. Give clear, step-by-step, plain-language guidance for labour matters.' },
  { key:'tenancy', title:'Tenancy & Real Estate', subs:'Eviction · Rent increase · Deposit · Maintenance · Ejari/Tawtheeq', prompt:'You are a UAE tenancy assistant (ADJD/Dubai Courts). Provide precise steps and required documents.' },
  { key:'courts', title:'Courts & Notary', subs:'Notary attest · Payment order · Civil claim · Cheque · Execution', prompt:'You are a UAE courts/notary guide. Provide forms, fees, and filing steps.' },
  { key:'ded', title:'DED / Economic', subs:'Trade licence · Fines/appeals · Partners · Consumer complaint', prompt:'You are a UAE DED/economic assistant. Explain procedures and links succinctly.' },
  { key:'municipality', title:'Municipality', subs:'Fines/appeals · Permits · Closure notice · Health violations', prompt:'You assist with municipality issues. Provide steps and documents needed.' },
  { key:'traffic', title:'Traffic & Fines', subs:'RTA/ITC fines · Black points · Accident · Salik/Darb · Objection', prompt:'You are a UAE traffic assistant (RTA/ITC). Explain objections, fines, and procedures.' },
  { key:'icp', title:'ICP / Immigration', subs:'Visa status · Overstay · Entry permit · Golden visa', prompt:'You are a UAE ICP/immigration assistant. Provide exact steps and documents.' },
  { key:'tamm', title:'TAMM / Amer', subs:'Family visa · Status change · Medical/ID · Cancellation', prompt:'You are a TAMM/Amer process assistant. Give clear checklists and timelines.' },
  { key:'letters', title:'Letters & Translation', subs:'Request/Complaint letters · Undertaking · Arabic ↔ English', prompt:'You draft bilingual formal letters in UAE format. Ask for details and produce a clean template.' },
];

const QUESTIONS = [
  { key:'issue_type',   text:(s)=>`Starting: ${s}. In one line, what is the specific issue?` },
  { key:'what_happened',text:'What happened? Please describe the situation.' },
  { key:'dates',        text:'When did it occur? Share key dates or notices.' },
  { key:'parties',      text:'Who is involved? (you, other party/company, authority)' },
  { key:'documents',    text:'Do you have documents (contracts, notices, emails)? List briefly.' },
  { key:'location',     text:'Which emirate/authority applies? (e.g., Abu Dhabi – ADJD/MOHRE; Dubai – Courts/MOHRE/DED)' },
  { key:'urgency',      text:'How urgent is this? (none / this week / today)' },
  { key:'outcome',      text:'What outcome do you want right now? (draft letter / complaint / negotiation / appeal)' },
  { key:'deadline',     text:'Any fixed deadline or hearing date? If none, say "none".' },
];

// Navigation
function show(sec){ [landing,profile,services,chat].forEach(s=>s.classList.add('hidden')); sec.classList.remove('hidden'); }
exitHome.addEventListener('click', ()=>{ resetAll(); show(landing); });
getStarted.addEventListener('click', ()=> show(profile));
profileForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  profileData = { name: nameEl.value.trim(), email: emailEl.value.trim(), phone: phoneEl.value.trim() };
  if(!profileData.name || !profileData.email){ alert('Please enter name and email'); return; }
  buildServiceGrid(); show(services);
});

// Services
function buildServiceGrid(){
  serviceGrid.innerHTML=''; 
  SERVICES.forEach(s=>{
    const card = document.createElement('button');
    card.className = 'w-full text-left px-4 py-4 rounded-2xl border border-border bg-card/80 hover:bg-card hover:border-white/40 transition focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-bg';
    card.innerHTML = `
      <h3 class="font-semibold text-base">${s.title}</h3>
      <p class="text-muted text-sm leading-relaxed">${s.subs}</p>
    `;
    card.onclick = ()=> selectService(s);
    serviceGrid.appendChild(card);
  });
}
function selectService(svc){ selectedService = svc; startIntake(); show(chat); }

// Chat
function addMessage(text, role='assistant', tools=false){
  const div = document.createElement('div');
  const base = 'border border-border rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap backdrop-blur';
  const assistant = 'bg-card/90 text-text';
  const user = 'bg-[#0f1216] text-white border-white/20';
  div.className = `${base} ${role==='user'?user:assistant}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  if (role==='assistant' && tools){
    const bar = document.createElement('div'); bar.className='flex flex-wrap gap-2 mt-3';
    const copy = toolBtn('Copy', ()=> navigator.clipboard.writeText(text));
    const speak= toolBtn('Read aloud', ()=> tts(text));
    bar.append(copy, speak); div.appendChild(bar);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function toolBtn(label, fn){
  const b=document.createElement('button');
  b.className='px-3 py-2 rounded-xl border border-border bg-card/80 hover:bg-card hover:border-white/40 transition text-sm';
  b.textContent=label; b.onclick=fn; return b;
}
sendBtn.addEventListener('click', onSend);
inputEl.addEventListener('keydown', e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); onSend(); }});
function onSend(){
  const text = inputEl.value.trim(); if(!text) return; inputEl.value='';
  addMessage(text,'user',false);
  if(intakeActive){
    answers[QUESTIONS[qIndex].key]=text; qIndex++; askNext();
  }else{
    callAgent(text).then(r=> addMessage(r||'', 'assistant', true))
                   .catch(err=> addMessage(formatError(err), 'assistant', false));
  }
}

// Intake
function startIntake(){ intakeActive=true; qIndex=0; Object.keys(answers).forEach(k=>delete answers[k]); addMessage("I'll ask a few quick questions to tailor the guidance.",'assistant',false); askNext(); }
function askNext(){
  if(qIndex < QUESTIONS.length){
    const q = QUESTIONS[qIndex];
    addMessage(typeof q.text==='function'? q.text(selectedService.title): q.text,'assistant',false);
  }else{
    intakeActive=false;
    const summary = buildSummary();
    addMessage('Thanks. Preparing your guidance…','assistant',false);
    callAgent(summary).then(r=>{ addMessage(r||'','assistant',true); renderActions(); })
                      .catch(e=>{ addMessage(formatError(e),'assistant',false); renderActions(); });
  }
}
function buildSummary(){
  return [
    'USER PROFILE',
    `Name: ${profileData.name}`,
    `Email: ${profileData.email}`,
    `Phone: ${profileData.phone || '—'}`,
    '',
    'SERVICE SELECTED',
    `${selectedService.title}`,
    '',
    'INTAKE ANSWERS',
    ...QUESTIONS.map(q => `${q.key}: ${answers[q.key]||'—'}`)
  ].join('\\n');
}
function renderActions(){
  const bar = document.createElement('div');
  bar.className='flex flex-wrap gap-2 justify-start';
  bar.append(
    toolBtn('Book appointment', ()=> addMessage('Please share a preferred time and your contact.','assistant',false)),
    toolBtn('New case', ()=> { show(services); resetChat(); }),
    toolBtn('Exit → Home', ()=> { resetAll(); show(landing); })
  );
  const wrapper = document.createElement('div');
  wrapper.className='border border-border rounded-2xl px-4 py-3 bg-card/70 backdrop-blur flex flex-wrap gap-2';
  wrapper.appendChild(bar);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Agent call
async function callAgent(userMessage){
  const context = selectedService
    ? `${selectedService.prompt} Focus on ${selectedService.title} services.`
    : 'You are a UAE government services assistant. Give clear, step-by-step guidance.';
  const payload = {
    messages: [
      { role: 'system', content: [{ type: 'text', text: context }] },
      { role: 'user', content: [{ type: 'text', text: userMessage }] }
    ]
  };
  const r = await fetch('/.netlify/functions/aidlex',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  const raw = await r.text();
  let data;
  try{ data = raw ? JSON.parse(raw) : {}; }catch(_){ throw new Error(`Invalid response (${r.status})`); }
  if(!r.ok){
    const msg = data?.error?.message || data?.message || `Request failed (${r.status})`;
    throw new Error(msg);
  }
  return data?.output_text || data?.output?.[0]?.content?.[0]?.text || data?.response?.output_text || (typeof data==='string'?data:JSON.stringify(data));
}

function formatError(err){
  if(!err) return 'An unknown error occurred.';
  if(err instanceof Error) return `Error: ${err.message}`;
  if(typeof err === 'string') return `Error: ${err}`;
  return 'Error: Unable to complete the request.';
}

// TTS (female-ish)
function tts(text){
  try{
    const s = window.speechSynthesis; if(!s) return alert('Speech not supported.');
    const u = new SpeechSynthesisUtterance(text);
    u.rate=0.96; u.pitch=1.1;
    const choose=(v)=> v.find(x=>/female/i.test(x.name))||v.find(x=>/Google UK English Female|Samantha|Victoria|Joanna|Amy/i.test(x.name))||v.find(x=>/^en[-_]/i.test(x.lang))||v[0];
    const go=()=>{ const v=choose(s.getVoices()); if(v) u.voice=v; s.speak(u); };
    if(s.getVoices().length){ go(); } else { s.onvoiceschanged = go; }
  }catch(e){ console.error(e); }
}

// Resets
function resetChat(){ messagesEl.innerHTML=''; inputEl.value=''; intakeActive=false; qIndex=0; Object.keys(answers).forEach(k=>delete answers[k]); }
function resetAll(){ resetChat(); selectedService=null; profileData={name:'',email:'',phone:''}; profileForm.reset(); }
show(landing);
