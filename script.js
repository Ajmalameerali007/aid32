/** Single flow: Landing → Profile → Services → Chat (intake + agent) **/

// ---------- Elements ----------
const $ = (s)=>document.querySelector(s);
const landing = $('#landing');
const profile = $('#profile');
const services = $('#services');
const chat = $('#chat');

const getStarted = $('#getStarted');
const exitHome = $('#exitHome');

const profileForm = $('#profileForm');
const nameEl = $('#name'), emailEl = $('#email'), phoneEl = $('#phone');

const serviceGrid = $('#serviceGrid');

const messagesEl = $('#messages');
const inputEl = $('#chatInput');
const sendBtn = $('#sendBtn');

// ---------- State ----------
let profileData = { name:'', email:'', phone:'' };
let selectedService = null;
let intakeActive = false;
let qIndex = 0;
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

// ---------- Navigation ----------
function show(section){
  [landing, profile, services, chat].forEach(s=> s.classList.add('hidden'));
  section.classList.remove('hidden');
}
exitHome.addEventListener('click', ()=>{ resetAll(); show(landing); });

getStarted.addEventListener('click', ()=> show(profile));

profileForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  profileData = { name: nameEl.value.trim(), email: emailEl.value.trim(), phone: phoneEl.value.trim() };
  if(!profileData.name || !profileData.email){
    alert('Please enter name and email');
    return;
  }
  buildServiceGrid();
  show(services);
});

// ---------- Services ----------
function buildServiceGrid(){
  serviceGrid.innerHTML = '';
  SERVICES.forEach(s=>{
    const card = document.createElement('div'); card.className='card';
    const h = document.createElement('h3'); h.textContent = s.title;
    const p = document.createElement('p'); p.textContent = s.subs;
    card.append(h,p);
    card.onclick = ()=> selectService(s);
    serviceGrid.appendChild(card);
  });
}

function selectService(svc){
  selectedService = svc;
  startIntake();
  show(chat);
}

// ---------- Chat helpers ----------
function addMessage(text, role='assistant', tools=false){
  const b = document.createElement('div');
  b.className = 'msg' + (role==='user'?' user':'');
  b.textContent = text;
  messagesEl.appendChild(b);
  if(role==='assistant' && tools){
    const tb = document.createElement('div'); tb.className='toolbar';
    const copy = toolBtn('Copy', ()=> navigator.clipboard.writeText(text));
    const speak= toolBtn('Read aloud', ()=> tts(text));
    tb.append(copy, speak);
    b.appendChild(tb);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}
function toolBtn(label, onClick){ const b=document.createElement('button'); b.className='btn'; b.textContent=label; b.onclick=onClick; return b; }

sendBtn.addEventListener('click', onSend);
inputEl.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onSend(); }});

function onSend(){
  const text = inputEl.value.trim(); if(!text) return; inputEl.value='';
  addMessage(text, 'user', false);
  if(intakeActive){
    const key = QUESTIONS[qIndex].key;
    answers[key] = text;
    qIndex++;
    askNext();
  }else{
    callAgent(text).then(r => addMessage(r || '', 'assistant', true))
                   .catch(err => addMessage('Error: '+err, 'assistant', false));
  }
}

// ---------- Intake logic ----------
function startIntake(){
  intakeActive = true; qIndex = 0;
  Object.keys(answers).forEach(k => delete answers[k]);
  addMessage("I'll ask a few quick questions to tailor the guidance.", 'assistant', false);
  askNext();
}

function askNext(){
  if(qIndex < QUESTIONS.length){
    const q = QUESTIONS[qIndex];
    const t = typeof q.text === 'function' ? q.text(selectedService.title) : q.text;
    addMessage(t, 'assistant', false);
  }else{
    intakeActive = false;
    const summary = buildSummary();
    addMessage('Thanks. Preparing your guidance…', 'assistant', false);
    callAgent(summary).then(r=>{
      addMessage(r || '', 'assistant', true);
      renderActions();
    }).catch(err=>{
      addMessage('Error: '+err, 'assistant', false);
      renderActions();
    });
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
  ].join('\n');
}

function renderActions(){
  const tb = document.createElement('div'); tb.className='toolbar';
  tb.append(
    toolBtn('Book appointment', ()=> addMessage('Please share a preferred time and your contact.', 'assistant', false)),
    toolBtn('New case', ()=> { show(services); resetChat(); }),
    toolBtn('Exit → Home', ()=> { resetAll(); show(landing); })
  );
  messagesEl.appendChild(tb);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ---------- Agent call (Netlify function) ----------
async function callAgent(userMessage){
  // We prepend the service prompt so the agent receives clear context
  const composed = [
    `SYSTEM CONTEXT: ${selectedService.prompt}`,
    '',
    userMessage
  ].join('\n');

  const r = await fetch('/.netlify/functions/agent', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ message: composed })
  });
  const data = await r.json().catch(()=> ({}));
  const reply = data?.output_text
            || data?.output?.[0]?.content?.[0]?.text
            || data?.response?.output_text
            || (typeof data==='string'?data:JSON.stringify(data));
  return reply;
}

// ---------- TTS (female-ish) ----------
function tts(text){
  try{
    const synth = window.speechSynthesis; if(!synth) return alert('Speech not supported.');
    const u = new SpeechSynthesisUtterance(text);
    const choose = (voices)=> voices.find(v=>/female/i.test(v.name))
      || voices.find(v=>/Google UK English Female|Samantha|Victoria|Joanna|Amy/i.test(v.name))
      || voices.find(v=>/^en[-_]/i.test(v.lang)) || voices[0];
    const apply = ()=>{ const v=choose(speechSynthesis.getVoices()); if(v) u.voice=v; synth.speak(u); };
    u.rate = 0.96; u.pitch = 1.1; // warmer tone
    if(speechSynthesis.getVoices().length){ apply(); } else { speechSynthesis.onvoiceschanged = apply; }
  }catch(e){ console.error(e); }
}

// ---------- Reset helpers ----------
function resetChat(){ messagesEl.innerHTML=''; inputEl.value=''; intakeActive=false; qIndex=0; Object.keys(answers).forEach(k=>delete answers[k]); }
function resetAll(){ resetChat(); selectedService=null; profileData={name:'',email:'',phone:''}; profileForm.reset(); }

// initial
show(landing);
