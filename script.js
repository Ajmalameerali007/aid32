const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const serviceGrid = $('#serviceGrid');
const habitList = $('#habitList');
const actionsSection = $('#actions');
const workflowTitle = $('#workflowTitle');
const workflowSummary = $('#workflowSummary');
const guardrailList = $('#guardrailList');
const chatMessages = $('#chatMessages');
const chatForm = $('#chatForm');
const chatInput = $('#chatInput');
const contextLabel = $('#contextLabel');
const thinkingBadge = $('#thinkingBadge');
const kbFilters = $('#kbFilters');
const kbList = $('#kbList');
const evidenceList = $('#evidenceList');
const launchMemoBtn = $('#launchMemo');
const launchTranslationBtn = $('#launchTranslation');
const memoModal = $('#memoModal');
const translationModal = $('#translationModal');
const apiModal = $('#apiModal');
const connectKeyBtn = $('#connectKey');
const closeMemo = $('#closeMemo');
const closeTranslation = $('#closeTranslation');
const closeApi = $('#closeApi');
const memoForm = $('#memoForm');
const memoEnglish = $('#memoEnglish');
const memoArabic = $('#memoArabic');
const translationForm = $('#translationForm');
const translationPreview = $('#translationPreview');
const apiForm = $('#apiForm');
const readAloudBtn = $('#readAloud');
const stopReadingBtn = $('#stopReading');
const startDictationBtn = $('#startDictation');
const dictationStatus = $('#dictationStatus');
const fileUploadInput = $('#fileUpload');
const fileList = $('#fileList');
const summarizeFilesBtn = $('#summarizeFiles');
const clearFilesBtn = $('#clearFiles');
const exportMemoPdfBtn = $('#exportMemoPdf');
const exportMemoWordBtn = $('#exportMemoWord');
const memoOutputSection = $('#memoOutput');

const state = {
  selectedService: null,
  activeFilter: 'all',
  messages: [],
  loading: false,
  sessionKey: loadCachedKey(),
  uploads: [],
  lastAssistantText: '',
  speech: {
    voicesReady: false,
    englishVoice: null,
    arabicVoice: null,
    reading: false,
    recognition: null,
    listening: false,
  },
};

const SERVICES = [
  {
    id: 'dubai-court-memo',
    clusterId: 'courtroom',
    title: 'Dubai Courts Memorandum',
    subtitle: 'Arabic pleading • Execution-ready templates',
    summary:
      'Generate bilingual memoranda that satisfy Dubai Courts formatting, salutations, spacing, and annexure protocols.',
    guardrails: [
      'Scope: Dubai Courts, RDC, and DIFC filings only (civil/commercial).',
      'Collect claimant/respondent names exactly as in Emirates ID or licence.',
      'Dates must be ISO (YYYY-MM-DD) and amounts in AED with Arabic digits for Arabic output.',
      'Annexures follow "Annex (١)" format; include certification notes (Notary, MOFAIC, sworn translation).',
      'Arabic text must align right with justified paragraphs and official salutations.',
    ],
    evidence: [
      'Ejari / Tawtheeq certificates, stamped contracts, or cheque copies with bank certification.',
      'Bank statements translated into Arabic by sworn translator (attach translator licence).',
      'SMS / Email notices with delivery proof; convert into Arabic summary.',
      'Power of attorney notarised (if legal representative).',
      'Court fee receipts or estimated costs from Dubai Courts portal.',
    ],
    tags: ['courts', 'dubai', 'memo', 'arabic'],
    memoEnabled: true,
    translationEnabled: true,
    systemPrompt:
      'You are Aidlex.AE – a fine-tuned UAE legal drafting copilot specialised in Dubai Courts Arabic pleadings. ' +
      'Maintain legal accuracy, cite Articles by number/year/title only, produce Arabic in Modern Standard Arabic with Emirati court tone. ' +
      'Return structured answers with headings, bilingual guidance, evidence reminders, and compliance warnings. ',
  },
  {
    id: 'mohre-wages',
    clusterId: 'employment',
    title: 'MOHRE Wage Claim',
    subtitle: 'Salary delays • End of service • Complaints',
    summary:
      'Guide employees through MOHRE wage recovery with checklists, timelines, and bilingual notices.',
    guardrails: [
      'Cover MOHRE (federal) scope for mainland employers only.',
      'Collect labour card, contract, and bank statements for the last 3 months.',
      'Clarify employment status (active, resigned, terminated) and last working day.',
      'Timeline references must mention Tasheel/Twafouq steps and 14-day mediation window.',
      'Arabic notices should cite MOHRE complaint number and wage protection status.',
    ],
    evidence: [
      'Employment contract (Arabic + English) as registered with MOHRE.',
      'WPS bank statements (3-6 months) translated to Arabic when submitting to court.',
      'Termination notices, email correspondence, and passport/visa copies.',
      'Any settlement offers or payment receipts (attach as annexes).',
    ],
    tags: ['employment', 'mohre', 'federal'],
    memoEnabled: false,
    translationEnabled: true,
    systemPrompt:
      'You are Aidlex.AE MOHRE labour specialist. Provide stepwise MOHRE/Tasheel workflows, bilingual notices, ' +
      'and evidence checklists. Reference only current MOHRE portals and timelines. ',
  },
  {
    id: 'tenancy-rdc',
    clusterId: 'courtroom',
    title: 'RDC Tenancy Disputes',
    subtitle: 'Rent disputes • Eviction • Maintenance',
    summary:
      'Deliver RDC-compliant procedures, portal steps, and bilingual templates for landlords and tenants.',
    guardrails: [
      'Scope limited to Dubai Rental Disputes Center (RDC).',
      'Collect Ejari, tenancy contract, and payment receipts before drafting.',
      'Mention RDC mediation vs. judgement pathways with respective fees.',
      'Arabic filings must use “إلى سعادة قاضي مركز فض المنازعات الإيجارية”.',
      'Highlight common pitfalls: incomplete annexures, missing attestation, wrong respondent details.',
    ],
    evidence: [
      'Signed tenancy contract and Ejari certificate.',
      'Payment receipts, bounced cheques, and correspondence.',
      'Notices served to tenant/landlord with proof of delivery.',
      'Photos/videos (timestamped) for maintenance disputes.',
    ],
    tags: ['tenancy', 'dubai', 'rdc'],
    memoEnabled: true,
    translationEnabled: true,
    systemPrompt:
      'You are Aidlex.AE RDC tenancy expert. Draft bilingual guidance, RDC case forms, and evidence checklists. ' +
      'All outputs must include timelines, portal button labels, and mention Article references succinctly. ',
  },
  {
    id: 'vat-reconsideration',
    clusterId: 'tax',
    title: 'VAT Reconsideration (FTA)',
    subtitle: 'Tax penalties • Clarifications • Refunds',
    summary:
      'Explain FTA reconsideration workflows, document packs, and bilingual cover letters.',
    guardrails: [
      'Applicable to UAE Federal Tax Authority (FTA) reconsideration or refund requests.',
      'Clarify taxable period, TRN, and penalty notice reference.',
      'Attach proof of payment, bank statements, and contracts supporting VAT position.',
      'Arabic cover letter must quote FTA reference number and attach notarised translations where required.',
      'Remind users about the 20 working-day deadline from penalty date.',
    ],
    evidence: [
      'FTA penalty notice or audit findings.',
      'Tax invoices, contracts, and bank statements supporting the claim.',
      'Proof of penalty payment or bank guarantee.',
      'Power of attorney for authorised tax agent.',
    ],
    tags: ['tax', 'vat', 'federal'],
    memoEnabled: false,
    translationEnabled: true,
    systemPrompt:
      'You are Aidlex.AE VAT reconsideration expert. Provide bilingual instructions, portal navigation, and ' +
      'evidence matrices tailored to UAE Federal Tax Authority standards. ',
  },
  {
    id: 'cybercrime-report',
    clusterId: 'digital',
    title: 'eCrime / Cybercrime Complaint',
    subtitle: 'Dubai Police • Abu Dhabi Police',
    summary:
      'Assist citizens with eCrime reports, evidence preservation, and bilingual affidavits.',
    guardrails: [
      'Support Dubai Police eCrime and Abu Dhabi Police Aman platforms only.',
      'Collect device, platform, and timeline information with screenshots.',
      'Advise on preservation of digital evidence (metadata, chat exports, bank confirmations).',
      'Arabic complaints must use respectful salutations and include offence references.',
      'Highlight emergency escalation (999/901) for immediate threats.',
    ],
    evidence: [
      'Screenshots of messages, emails, or fraudulent transactions.',
      'Bank confirmations, police reports, or previous complaints.',
      'Device logs or app chat exports saved in PDF.',
      'ID copies and contact information for victims.',
    ],
    tags: ['cybercrime', 'dubai', 'abudhabi'],
    memoEnabled: false,
    translationEnabled: true,
    systemPrompt:
      'You are Aidlex.AE cybercrime workflow guide. Provide bilingual complaint drafts, evidence preservation tips, ' +
      'and portal instructions for Dubai Police eCrime and Abu Dhabi Aman services. ',
  },
];

const SERVICE_CLUSTERS = [
  {
    id: 'courtroom',
    title: 'Court Advocacy Pod',
    subtitle: 'Dubai Courts • RDC • DIFC',
    description:
      'Consolidates bilingual pleadings, translation rituals, and evidence heatmaps so every filing feels concierge-crafted.',
    availability: 'Priority hearing support 07:30 – 20:00 GST',
    habits: [
      '06:45 mindful docket scan with hydration + three-deep breaths before calls.',
      '12:30 annexure verification sprint (translation + notarisation checks).',
      '17:00 wrap-up: bilingual Outlook summary + tomorrow’s evidence chase list.',
    ],
    services: ['dubai-court-memo', 'tenancy-rdc'],
  },
  {
    id: 'employment',
    title: 'Employment & MOHRE Care',
    subtitle: 'Wage claims • Settlements • Tasheel routing',
    description:
      'Empathetic scripts, mediation scheduling, and WPS evidence packaging for employees and HR guardians alike.',
    availability: 'Concierge hours 08:00 – 21:00 GST',
    habits: [
      'Start with tone check: gratitude note to claimant before evidence requests.',
      'Pulse MoHRE portal queue at 11:00 & 16:00 for status nudges.',
      'Evening closure: share bilingual reassurance template + next milestone.',
    ],
    services: ['mohre-wages'],
  },
  {
    id: 'tax',
    title: 'Finance & VAT Response Desk',
    subtitle: 'FTA penalties • Refunds • Clarifications',
    description:
      'Keeps compliance teams ahead with deadline reminders, bilingual cover letters, and checklists for certified ledgers.',
    availability: 'Office hours 09:00 – 19:00 GST',
    habits: [
      'Daily 09:15 ledger sanity review + highlight red-flag invoices.',
      'Midday 13:00 translator coordination call with shared glossary.',
      'Pre-close 18:15 decision log update + stakeholder voice memo recap.',
    ],
    services: ['vat-reconsideration'],
  },
  {
    id: 'digital',
    title: 'Digital Safety & Evidence Watch',
    subtitle: 'eCrime • Cybercrime • Online fraud',
    description:
      'Guides families and SMEs through calm evidence capture, portal reporting, and bilingual reassurance messaging.',
    availability: 'Always-on triage 24/7',
    habits: [
      'Immediate grounding script: verify safety, capture screenshots, hydrate.',
      'Hourly digital evidence sync with secure cloud vault.',
      'Nightly reflection: gratitude message to victim + next-day roadmap.',
    ],
    services: ['cybercrime-report'],
  },
];

const HABIT_TRACKS = [
  {
    title: 'Sunrise Clarity Loop',
    focus: 'Case intake & empathy',
    availability: '06:30 – 09:30 GST',
    energy: 'Calm • Observant • Grounded',
    steps: [
      '2-min breathing check while reviewing overnight portal alerts.',
      'Voice-to-text note three client wins, then convert to bilingual SMS.',
      'Send micro-agenda to teammates before 09:45 with wellness nudge.',
    ],
  },
  {
    title: 'Midday Evidence Sprint',
    focus: 'Attachments & certification',
    availability: '12:00 – 15:00 GST',
    energy: 'Focused • Collaborative',
    steps: [
      'Triage uploads with Document Lab and assign certification owners.',
      'Trigger translator + notary follow-ups using quick-action templates.',
      'Celebrate progress with 60-second gratitude voice note to client.',
    ],
  },
  {
    title: 'Dusk Reflection Ritual',
    focus: 'Follow-through & wellbeing',
    availability: '18:00 – 21:30 GST',
    energy: 'Warm • Reassuring',
    steps: [
      'Review AI transcript highlights and flag tomorrow’s risks.',
      'Export memos to PDF/Word, share with bilingual wrap-up email.',
      'Journal one human story that mattered today to keep empathy high.',
    ],
  },
];

const KB_ARTICLES = [
  {
    id: 'kb-rdc-nonpayment',
    title: 'RDC Non-Payment Eviction (Dubai)',
    summary: 'Procedure, fees, documents, and bilingual templates for RDC eviction due to rent non-payment.',
    path: 'kb/procedures/tenancy/dubai/tenancy__non-payment-eviction__dubai__v20250105.md',
    tags: ['tenancy', 'dubai', 'rdc', 'procedure'],
    jurisdiction: ['Dubai', 'RDC'],
  },
  {
    id: 'kb-mohre-wage',
    title: 'MOHRE Wage Claim (UAE Mainland)',
    summary: 'Steps for wage complaint filing, mediation timelines, docs checklist, and bilingual notices.',
    path: 'kb/procedures/employment/mohre/employment__wage-claim__uae__v20250105.md',
    tags: ['employment', 'mohre', 'procedure'],
    jurisdiction: ['UAE', 'MOHRE'],
  },
  {
    id: 'kb-dubai-memo-template',
    title: 'Dubai Courts Memorandum Template (EN/AR)',
    summary: 'Sample bilingual pleading structure with salutations, spacing, annexures, and signature blocks.',
    path: 'kb/templates/courts__dubai-memorandum__dubai__v20250105.md',
    tags: ['courts', 'dubai', 'memo', 'template'],
    jurisdiction: ['Dubai', 'Courts'],
  },
  {
    id: 'kb-vat-reconsideration',
    title: 'FTA VAT Reconsideration Pack (Federal)',
    summary: 'Checklist for VAT reconsideration, portal steps, fees, and bilingual cover letter guidance.',
    path: 'kb/procedures/tax/vat/tax__vat-reconsideration__uae__v20250105.md',
    tags: ['tax', 'vat', 'procedure'],
    jurisdiction: ['UAE', 'FTA'],
  },
  {
    id: 'kb-cybercrime',
    title: 'Cybercrime Complaint Workflow (Dubai/Abu Dhabi)',
    summary: 'Digital evidence checklist, eCrime portal steps, and bilingual complaint snippets.',
    path: 'kb/procedures/cybercrime/dubai/cybercrime__ecrime-complaint__dubai-abudhabi__v20250105.md',
    tags: ['cybercrime', 'dubai', 'abudhabi', 'procedure'],
    jurisdiction: ['Dubai', 'Abu Dhabi'],
  },
];

init();

function init() {
  renderServiceClusters();
  renderKbFilters();
  renderKbList();
  renderHabitBoard();
  connectParticles();
  setupVoiceControls();
  setupUploadCenter();
  setupExporters();
  chatForm.addEventListener('submit', onChatSubmit);
  chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onChatSubmit(event);
    }
  });
  launchMemoBtn.addEventListener('click', () => toggleModal(memoModal, true));
  closeMemo.addEventListener('click', () => toggleModal(memoModal, false));
  memoModal.addEventListener('click', (event) => {
    if (event.target === memoModal) toggleModal(memoModal, false);
  });
  launchTranslationBtn.addEventListener('click', () => toggleModal(translationModal, true));
  closeTranslation.addEventListener('click', () => toggleModal(translationModal, false));
  translationModal.addEventListener('click', (event) => {
    if (event.target === translationModal) toggleModal(translationModal, false);
  });
  connectKeyBtn.addEventListener('click', () => toggleModal(apiModal, true));
  closeApi.addEventListener('click', () => toggleModal(apiModal, false));
  apiModal.addEventListener('click', (event) => {
    if (event.target === apiModal) toggleModal(apiModal, false);
  });
  memoForm.addEventListener('submit', onMemoSubmit);
  translationForm.addEventListener('submit', onTranslationSubmit);
  apiForm.addEventListener('submit', onApiSubmit);
  if (state.sessionKey) {
    appendSystemToast('Session key loaded from cache.');
  }
}

function renderServiceClusters() {
  if (!serviceGrid) return;
  serviceGrid.innerHTML = '';
  SERVICE_CLUSTERS.forEach((cluster) => {
    const card = document.createElement('article');
    card.className = 'glass-panel bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 space-y-4';
    card.innerHTML = `
      <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p class="text-[11px] uppercase tracking-[0.35em] text-slate-400">${cluster.title}</p>
          <h3 class="text-lg font-semibold text-white mt-1">${cluster.subtitle}</h3>
          <p class="text-sm text-slate-300 mt-2 leading-relaxed">${cluster.description}</p>
          <p class="text-[11px] text-slate-500 uppercase tracking-[0.3em] mt-3">${cluster.availability}</p>
        </div>
        <button type="button" data-toggle-cluster="${cluster.id}" class="px-4 py-2 rounded-2xl border border-white/15 text-xs uppercase tracking-[0.3em] text-slate-200 hover:border-cyan-400/60 hover:text-white transition">Open pod</button>
      </header>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 hidden" data-cluster-services="${cluster.id}"></div>
      <div class="bg-black/30 border border-white/10 rounded-2xl p-4">
        <p class="text-[11px] uppercase tracking-[0.35em] text-slate-400">Focus Habits</p>
        <ul class="mt-3 space-y-2 text-xs text-slate-300"></ul>
      </div>
    `;
    const habitListContainer = card.querySelector('ul');
    cluster.habits.forEach((habit) => {
      const li = document.createElement('li');
      li.textContent = habit;
      habitListContainer.appendChild(li);
    });
    const serviceContainer = card.querySelector(`[data-cluster-services="${cluster.id}"]`);
    cluster.services.forEach((serviceId) => {
      const service = SERVICES.find((entry) => entry.id === serviceId);
      if (service) {
        serviceContainer.appendChild(buildServiceButton(service));
      }
    });
    const toggleBtn = card.querySelector(`[data-toggle-cluster="${cluster.id}"]`);
    toggleBtn.addEventListener('click', () => toggleClusterVisibility(cluster.id));
    serviceGrid.appendChild(card);
  });
  if (SERVICE_CLUSTERS.length) {
    openCluster(SERVICE_CLUSTERS[0].id);
  }
}

function buildServiceButton(service) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'service-btn';
  button.dataset.serviceId = service.id;
  button.innerHTML = `
    <div class="flex flex-col gap-1">
      <span class="text-xs uppercase tracking-[0.25em] text-slate-400">${service.title}</span>
      <span class="text-base text-white font-semibold">${service.subtitle}</span>
      <span class="text-xs text-slate-400 leading-relaxed">${service.summary}</span>
    </div>
  `;
  button.addEventListener('click', () => selectService(service));
  return button;
}

function toggleClusterVisibility(clusterId) {
  const container = document.querySelector(`[data-cluster-services="${clusterId}"]`);
  const toggleBtn = document.querySelector(`[data-toggle-cluster="${clusterId}"]`);
  if (!container || !toggleBtn) return;
  const isHidden = container.classList.contains('hidden');
  if (isHidden) {
    openCluster(clusterId);
  } else {
    container.classList.add('hidden');
    toggleBtn.textContent = 'Open pod';
    toggleBtn.classList.remove('bg-white/10');
  }
}

function openCluster(clusterId) {
  $$('[data-cluster-services]').forEach((container) => {
    const isTarget = container.dataset.clusterServices === clusterId;
    container.classList.toggle('hidden', !isTarget);
  });
  $$('[data-toggle-cluster]').forEach((btn) => {
    const isTarget = btn.dataset.toggleCluster === clusterId;
    btn.textContent = isTarget ? 'Hide workflows' : 'Open pod';
    btn.classList.toggle('bg-white/10', isTarget);
  });
}

function renderHabitBoard() {
  if (!habitList) return;
  habitList.innerHTML = '';
  HABIT_TRACKS.forEach((track) => {
    const card = document.createElement('article');
    card.className = 'glass-panel bg-black/40 border border-white/10 rounded-3xl p-5 space-y-3';
    card.innerHTML = `
      <div class="flex flex-col gap-1">
        <p class="text-xs uppercase tracking-[0.35em] text-sky-300">${track.title}</p>
        <h4 class="text-sm font-semibold text-white">${track.focus}</h4>
        <p class="text-[11px] text-slate-400 uppercase tracking-[0.3em]">${track.availability}</p>
        <p class="text-xs text-emerald-200">Energy: ${track.energy}</p>
      </div>
      <ol class="list-decimal list-inside text-xs text-slate-300 space-y-2"></ol>
    `;
    const stepsList = card.querySelector('ol');
    track.steps.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      stepsList.appendChild(li);
    });
    habitList.appendChild(card);
  });
}

function setupVoiceControls() {
  if (readAloudBtn) {
    readAloudBtn.addEventListener('click', () => {
      if (!state.lastAssistantText) {
        appendSystemToast('Ask the copilot first to enable read aloud.');
        return;
      }
      readLatestMessage();
    });
  }
  if (stopReadingBtn) {
    stopReadingBtn.addEventListener('click', stopReading);
  }
  if (startDictationBtn) {
    startDictationBtn.addEventListener('click', toggleDictation);
  }
  if (!('speechSynthesis' in window)) {
    if (readAloudBtn) readAloudBtn.disabled = true;
    appendSystemToast('Speech synthesis not supported in this browser.');
  } else {
    ensureVoicesLoaded();
    window.speechSynthesis.addEventListener('voiceschanged', ensureVoicesLoaded);
  }
  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    if (startDictationBtn) startDictationBtn.disabled = true;
    if (dictationStatus) dictationStatus.textContent = 'Dictation unavailable';
  }
}

function ensureVoicesLoaded() {
  if (!('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return false;
  state.speech.englishVoice = pickVoice(voices, 'en');
  state.speech.arabicVoice = pickVoice(voices, 'ar');
  state.speech.voicesReady = Boolean(state.speech.englishVoice || state.speech.arabicVoice);
  return state.speech.voicesReady;
}

function pickVoice(voices, languagePrefix) {
  if (!voices || !voices.length) return null;
  const femaleNames = ['female', 'zira', 'jenny', 'laila', 'salma', 'hana', 'zira', 'sofia'];
  const exact = voices.find(
    (voice) =>
      voice.lang.toLowerCase().startsWith(languagePrefix) &&
      femaleNames.some((needle) => voice.name.toLowerCase().includes(needle))
  );
  if (exact) return exact;
  const fallback = voices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix));
  return fallback || voices[0];
}

function readLatestMessage() {
  if (!state.lastAssistantText) {
    appendSystemToast('No assistant response available to read aloud yet.');
    return;
  }
  if (!ensureVoicesLoaded()) {
    appendSystemToast('Female voice not ready yet. Try again in a moment.');
    return;
  }
  const segments = splitBilingualSegments(state.lastAssistantText);
  speakSegments(segments);
}

function splitBilingualSegments(text) {
  const parts = text.split('— — —');
  if (parts.length === 1) {
    return [{ text: text.trim(), lang: 'en' }];
  }
  return parts.map((segment, index) => ({
    text: segment.trim(),
    lang: index === 0 ? 'en' : 'ar',
  }));
}

function speakSegments(segments) {
  if (!segments.length) return;
  stopReading();
  state.speech.reading = true;
  const queue = segments.slice();
  const playNext = () => {
    if (!queue.length) {
      state.speech.reading = false;
      return;
    }
    const segment = queue.shift();
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = segment.lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.pitch = 1;
    utterance.rate = 0.96;
    utterance.voice = segment.lang === 'ar' ? state.speech.arabicVoice : state.speech.englishVoice;
    utterance.onend = playNext;
    utterance.onerror = () => {
      appendSystemToast('Unable to finish read aloud.');
      state.speech.reading = false;
    };
    window.speechSynthesis.speak(utterance);
  };
  playNext();
}

function stopReading() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  state.speech.reading = false;
}

function toggleDictation() {
  if (state.speech.listening) {
    stopDictation();
  } else {
    startDictation();
  }
}

function startDictation() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    appendSystemToast('Dictation is not supported in this browser.');
    return;
  }
  if (state.speech.recognition) {
    state.speech.recognition.stop();
  }
  const recognition = new Recognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onstart = () => {
    state.speech.listening = true;
    setDictationStatus('Listening…');
  };
  recognition.onresult = handleDictationResult;
  recognition.onerror = (event) => {
    appendSystemToast(`Dictation error: ${event.error}`);
    stopDictation();
  };
  recognition.onend = () => {
    setDictationStatus('Dictation idle');
    state.speech.listening = false;
    state.speech.recognition = null;
  };
  state.speech.recognition = recognition;
  recognition.start();
}

function stopDictation() {
  if (state.speech.recognition) {
    state.speech.recognition.stop();
    state.speech.recognition = null;
  }
  state.speech.listening = false;
  setDictationStatus('Dictation idle');
}

function handleDictationResult(event) {
  if (!chatInput) return;
  const { resultIndex } = event;
  const result = event.results[resultIndex];
  if (!result || !result.isFinal) return;
  const transcript = result[0].transcript.trim();
  chatInput.value = `${chatInput.value} ${transcript}`.trim();
  setDictationStatus('Dictation captured');
}

function setDictationStatus(text) {
  if (dictationStatus) {
    dictationStatus.textContent = text;
  }
}

function setupUploadCenter() {
  if (fileUploadInput) {
    fileUploadInput.addEventListener('change', handleFileUpload);
  }
  if (summarizeFilesBtn) {
    summarizeFilesBtn.addEventListener('click', summarizeUploads);
  }
  if (clearFilesBtn) {
    clearFilesBtn.addEventListener('click', () => {
      state.uploads = [];
      renderUploads();
    });
  }
  if (fileList) {
    fileList.addEventListener('click', (event) => {
      const target = event.target;
      if (target.dataset && target.dataset.removeUpload) {
        const id = target.dataset.removeUpload;
        state.uploads = state.uploads.filter((item) => item.id !== id);
        renderUploads();
      }
    });
  }
  renderUploads();
}

function handleFileUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  files.forEach((file) => processFile(file));
  event.target.value = '';
}

function processFile(file) {
  const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const upload = {
    id,
    name: file.name,
    size: file.size,
    type: file.type || 'unknown',
    status: 'loading',
    text: '',
    language: '',
  };
  state.uploads.push(upload);
  renderUploads();

  const sizeLimit = 25 * 1024 * 1024;
  if (file.size > sizeLimit) {
    upload.status = 'too-large';
    renderUploads();
    return;
  }

  if (shouldReadAsText(file)) {
    const reader = new FileReader();
    reader.onload = () => {
      upload.text = reader.result;
      upload.language = detectLanguage(upload.text);
      upload.status = 'ready';
      renderUploads();
    };
    reader.onerror = () => {
      upload.status = 'error';
      renderUploads();
    };
    reader.readAsText(file);
  } else {
    upload.status = 'binary';
    renderUploads();
  }
}

function shouldReadAsText(file) {
  const textualTypes = ['text/', 'application/json', 'application/xml'];
  if (textualTypes.some((type) => file.type.startsWith(type))) return true;
  const textExtensions = ['.txt', '.md', '.csv', '.json', '.xml', '.html'];
  return textExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
}

function renderUploads() {
  if (!fileList) return;
  fileList.innerHTML = '';
  if (!state.uploads.length) {
    const empty = document.createElement('p');
    empty.className = 'text-slate-500';
    empty.textContent = 'No files yet. Upload to unlock evidence extraction and translation guidance.';
    fileList.appendChild(empty);
    return;
  }
  state.uploads.forEach((upload) => {
    const card = document.createElement('article');
    card.className = 'border border-white/10 bg-black/40 rounded-2xl p-3 space-y-2';
    const statusMap = {
      loading: 'Reading file…',
      ready: `Ready • ${upload.language || 'Language detection pending'}`,
      binary: 'Stored for AI processing (binary file).',
      'too-large': 'File exceeds 25 MB limit. Please split before sending.',
      error: 'Unable to read file. Please retry or upload alternative format.',
    };
    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-white">${upload.name}</p>
          <p class="text-xs text-slate-400">${formatFileSize(upload.size)} • ${upload.type}</p>
        </div>
        <button type="button" data-remove-upload="${upload.id}" class="text-[11px] uppercase tracking-[0.3em] text-rose-300 hover:text-rose-200">Remove</button>
      </div>
      <p class="text-xs text-slate-300">${statusMap[upload.status] || upload.status}</p>
    `;
    if (upload.text && upload.status === 'ready') {
      const preview = document.createElement('p');
      preview.className = 'text-xs text-slate-400 bg-white/5 border border-white/10 rounded-xl p-2';
      preview.textContent = `${upload.text.slice(0, 280)}${upload.text.length > 280 ? '…' : ''}`;
      card.appendChild(preview);
    }
    fileList.appendChild(card);
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
}

function detectLanguage(text) {
  if (!text) return '';
  const arabicChars = /[\u0600-\u06FF]/;
  return arabicChars.test(text) ? 'Arabic detected' : 'Likely English/Latin script';
}

function summarizeUploads() {
  if (!state.selectedService) {
    appendSystemToast('Select a workflow before sending uploads.');
    return;
  }
  if (!state.uploads.length) {
    appendSystemToast('Upload at least one file first.');
    return;
  }
  if (state.loading) {
    appendSystemToast('Copilot is still responding. Please wait before sending uploads.');
    return;
  }
  const summaries = state.uploads.map((upload, index) => {
    const snippet = upload.text ? `${upload.text.slice(0, 500)}${upload.text.length > 500 ? '…' : ''}` : '[Binary/Non-text document ready for AI extraction]';
    return `File ${index + 1}: ${upload.name} (${formatFileSize(upload.size)} | ${upload.type})\nStatus: ${upload.status}\nDetected: ${upload.language || 'N/A'}\nSnippet: ${snippet}`;
  });
  const payload = `Document lab summary:\n${summaries.join('\n\n')}\nPlease confirm evidentiary relevance, missing certifications, and bilingual translation steps.`;
  state.messages.push({ role: 'user', content: payload });
  appendMessage('user', payload);
  sendToCopilot();
}

function setupExporters() {
  if (exportMemoPdfBtn) {
    exportMemoPdfBtn.addEventListener('click', exportMemoAsPdf);
  }
  if (exportMemoWordBtn) {
    exportMemoWordBtn.addEventListener('click', exportMemoAsWord);
  }
}

function exportMemoAsPdf() {
  if (!memoOutputSection) return;
  if (!memoEnglish || !memoArabic) return;
  const english = memoEnglish.textContent.trim();
  const arabic = memoArabic.textContent.trim();
  if (!english && !arabic) {
    appendSystemToast('Generate the memorandum before exporting.');
    return;
  }
  if (!window.html2pdf) {
    appendSystemToast('PDF exporter not loaded yet.');
    return;
  }
  window.html2pdf()
    .set({
      filename: 'aidlex-memorandum.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
    })
    .from(memoOutputSection)
    .save();
  appendSystemToast('Exporting PDF…');
}

function exportMemoAsWord() {
  if (!memoEnglish || !memoArabic) return;
  const english = memoEnglish.textContent.trim();
  const arabic = memoArabic.textContent.trim();
  if (!english && !arabic) {
    appendSystemToast('Generate the memorandum before exporting.');
    return;
  }
  if (!window.docx) {
    appendSystemToast('Word exporter not available.');
    return;
  }
  const { Document, Packer, Paragraph, TextRun } = window.docx;
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Dubai Courts Memorandum', bold: true, size: 28 })],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [new TextRun({ text: english || 'English draft pending.', size: 22 })],
            spacing: { after: 240 },
          }),
          new Paragraph({
            bidirectional: true,
            children: [
              new TextRun({
                text: arabic || 'سيتم إنشاء المذكرة العربية بعد إدخال البيانات.',
                size: 22,
                rightToLeft: true,
              }),
            ],
          }),
        ],
      },
    ],
  });
  Packer.toBlob(doc).then((blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'aidlex-memorandum.docx';
    anchor.click();
    URL.revokeObjectURL(url);
    appendSystemToast('Word export ready.');
  });
}

function renderKbFilters() {
  const tags = new Set(['all']);
  KB_ARTICLES.forEach((article) => article.tags.forEach((tag) => tags.add(tag)));
  kbFilters.innerHTML = '';
  tags.forEach((tag) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tag.toUpperCase();
    btn.className = `px-3 py-1 rounded-full border border-white/15 text-xs tracking-[0.2em] ${
      state.activeFilter === tag ? 'bg-white/20 text-white' : 'text-slate-300'
    }`;
    btn.addEventListener('click', () => {
      state.activeFilter = tag;
      renderKbFilters();
      renderKbList();
    });
    kbFilters.appendChild(btn);
  });
}

function renderKbList() {
  kbList.innerHTML = '';
  const filtered = KB_ARTICLES.filter((article) =>
    state.activeFilter === 'all' ? true : article.tags.includes(state.activeFilter)
  );
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'text-slate-500 text-sm';
    empty.textContent = 'No knowledge-base entries found for this filter.';
    kbList.appendChild(empty);
    return;
  }
  filtered.forEach((article) => {
    const card = document.createElement('article');
    card.className = 'border border-white/10 bg-white/5 rounded-2xl p-4';
    card.innerHTML = `
      <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 uppercase tracking-[0.3em]">
        ${article.jurisdiction.map((j) => `<span class="px-2 py-0.5 border border-white/10 rounded-full">${j}</span>`).join('')}
      </div>
      <h5 class="mt-3 text-sm font-semibold text-white">${article.title}</h5>
      <p class="mt-2 text-xs text-slate-300 leading-relaxed">${article.summary}</p>
      <div class="mt-3 flex flex-wrap gap-2 text-[11px] text-sky-200 uppercase tracking-[0.25em]">${article.tags
        .map((tag) => `<span class="bg-sky-500/10 border border-sky-500/20 rounded-full px-2 py-0.5">${tag}</span>`)
        .join('')}</div>
      <a href="${article.path}" class="mt-3 inline-flex items-center gap-2 text-xs text-cyan-200 hover:text-white" target="_blank" rel="noopener">Open File →</a>
    `;
    kbList.appendChild(card);
  });
}

function selectService(service) {
  state.selectedService = service;
  state.messages = [];
  state.lastAssistantText = '';
  state.uploads = [];
  state.activeFilter = (service.tags && service.tags.length ? service.tags[0] : 'all');
  if (service.clusterId) {
    openCluster(service.clusterId);
  }
  renderKbFilters();
  $$('.service-btn').forEach((btn) => btn.classList.remove('active'));
  const activeButton = $(`.service-btn[data-service-id="${service.id}"]`);
  if (activeButton) activeButton.classList.add('active');
  actionsSection.classList.remove('hidden');
  workflowTitle.textContent = service.title;
  workflowSummary.textContent = service.summary;
  contextLabel.textContent = service.title;
  renderGuardrails(service.guardrails);
  renderEvidence(service.evidence);
  renderKbList();
  renderUploads();
  appendSystemToast(`${service.title} context loaded.`);
  chatMessages.innerHTML = '';
  appendMessage('assistant', `You are now in the ${service.title} workspace. Share your case details to begin.`);
  launchMemoBtn.disabled = !service.memoEnabled;
  launchTranslationBtn.disabled = !service.translationEnabled;
}

function renderGuardrails(items) {
  guardrailList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'flex gap-2 items-start';
    li.innerHTML = `<span class="mt-1 h-2 w-2 rounded-full bg-cyan-400"></span><span>${item}</span>`;
    guardrailList.appendChild(li);
  });
}

function renderEvidence(items) {
  evidenceList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('div');
    li.className = 'border border-white/10 bg-black/30 rounded-xl p-4';
    li.textContent = item;
    evidenceList.appendChild(li);
  });
}

function appendMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = `flex gap-3 ${role === 'assistant' ? 'items-start' : 'items-end justify-end'}`;
  const avatar = document.createElement('div');
  avatar.className = `h-10 w-10 rounded-2xl flex items-center justify-center text-sm font-semibold ${
    role === 'assistant' ? 'bg-gradient-to-br from-cyan-400 to-indigo-500 text-black' : 'bg-white/10 text-white'
  }`;
  avatar.textContent = role === 'assistant' ? 'AI' : 'You';
  const bubble = document.createElement('div');
  bubble.className = `max-w-full md:max-w-xl rounded-2xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
    role === 'assistant'
      ? 'bg-white/10 border-white/15 text-slate-100'
      : 'bg-cyan-500/10 border-cyan-400/40 text-cyan-100'
  }`;
  bubble.innerHTML = sanitize(content);
  wrapper.append(avatar, bubble);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
  if (role === 'assistant') {
    state.lastAssistantText = stripMarkup(content);
  }
}

function appendSystemToast(message) {
  const toast = document.createElement('div');
  toast.className = 'text-xs text-slate-400 italic';
  toast.textContent = message;
  chatMessages.appendChild(toast);
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

function onChatSubmit(event) {
  event.preventDefault();
  if (!state.selectedService) {
    appendSystemToast('Select a workflow first.');
    return;
  }
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  appendMessage('user', text);
  state.messages.push({ role: 'user', content: text });
  sendToCopilot();
}

async function sendToCopilot() {
  if (state.loading) return;
  state.loading = true;
  setThinking(true);
  try {
    const messages = buildMessages();
    const response = await callAidlex(messages);
    state.messages.push({ role: 'assistant', content: response });
    appendMessage('assistant', response);
  } catch (error) {
    appendMessage('assistant', `Error: ${error.message || error}`);
  } finally {
    setThinking(false);
    state.loading = false;
  }
}

function buildMessages(extra = null) {
  const service = state.selectedService || { systemPrompt: 'You are Aidlex.AE government services assistant. Provide bilingual outputs.', tags: [] };
  const system = {
    role: 'system',
    content: `${service.systemPrompt} Use knowledge base metadata when relevant: ${JSON.stringify(service.tags)}. Always deliver bilingual (English then Arabic separated by — — —) unless user says otherwise.`,
  };
  const history = state.messages.slice(-6); // keep recent context
  const messages = [system, ...history];
  if (extra) messages.push(extra);
  return messages;
}

async function callAidlex(messages) {
  const payload = { messages };
  const headers = { 'Content-Type': 'application/json' };

  if (state.sessionKey) {
    headers.Authorization = `Bearer ${state.sessionKey}`;
    const direct = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        prompt: { id: 'pmpt_68683b2a05b08194bb2989e8a23930a400dea87aa503adce' },
        messages,
      }),
    });
    if (!direct.ok) {
      throw new Error(`OpenAI error ${direct.status}`);
    }
    const data = await direct.json();
    return extractText(data);
  }

  const response = await fetch('/.netlify/functions/aidlex', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Aidlex endpoint error ${response.status}`);
  }
  const data = await response.json();
  return extractText(data);
}

function extractText(data) {
  if (!data) return 'No response received.';
  if (data.output_text) return data.output_text;
  if (Array.isArray(data.output)) {
    const chunk = data.output[0];
    if (chunk?.content?.[0]?.text) return chunk.content[0].text;
  }
  if (data.response?.output_text) return data.response.output_text;
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
}

function setThinking(active) {
  thinkingBadge.classList.toggle('hidden', !active);
}

function sanitize(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function stripMarkup(text) {
  if (!text) return '';
  const temp = document.createElement('div');
  temp.innerHTML = sanitize(text);
  return temp.textContent || temp.innerText || '';
}

function toggleModal(modal, open) {
  if (!modal) return;
  modal.classList.toggle('modal-hidden', !open);
}

async function onMemoSubmit(event) {
  event.preventDefault();
  const formData = new FormData(memoForm);
  const payload = Object.fromEntries(formData.entries());
  const summary = `Forum: ${payload.forum}\nCase Type: ${payload.caseType}\nParties: ${payload.parties}\nFacts: ${payload.facts}\nEvidence: ${payload.evidence}\nRelief: ${payload.relief}\nNotes: ${payload.notes}`;
  memoEnglish.textContent = 'Generating…';
  memoArabic.textContent = '... جارٍ إنشاء المذكرة باللغة العربية ...';
  try {
    const messages = buildMessages({
      role: 'user',
      content:
        'Generate a Dubai Courts memorandum. Provide output as JSON with keys english and arabic. ' +
        'Ensure Arabic is right-aligned, includes formal salutations, spacing, signature line, and annex list with Arabic numerals. ' +
        'English should mirror structure with headings: Cover Page, Facts, Legal Grounds, Relief, Annexures. Use data: ' +
        summary,
    });
    const response = await callAidlex(messages);
    const parsed = safeParseJSON(response);
    if (parsed?.english && parsed?.arabic) {
      memoEnglish.textContent = parsed.english;
      memoArabic.textContent = parsed.arabic;
    } else {
      memoEnglish.innerHTML = sanitize(response);
      memoArabic.innerHTML = sanitize(response);
    }
  } catch (error) {
    memoEnglish.textContent = `Error: ${error.message || error}`;
    memoArabic.textContent = `خطأ: ${error.message || error}`;
  }
}

async function onTranslationSubmit(event) {
  event.preventDefault();
  const formData = new FormData(translationForm);
  const payload = Object.fromEntries(formData.entries());
  translationPreview.textContent = 'Preparing translation brief…';
  try {
    const messages = buildMessages({
      role: 'user',
      content:
        'Create a bilingual translation brief (English then Arabic) with checklist, formatting requirements, and certification steps. ' +
        `Document Type: ${payload.docType}. Details: ${payload.details}. ` +
        'Ensure Arabic block uses Arabic numerals and right alignment instructions.',
    });
    const response = await callAidlex(messages);
    translationPreview.innerHTML = sanitize(response);
  } catch (error) {
    translationPreview.textContent = `Error: ${error.message || error}`;
  }
}

function onApiSubmit(event) {
  event.preventDefault();
  const formData = new FormData(apiForm);
  const key = formData.get('apiKey')?.trim();
  const remember = formData.get('remember');
  if (key) {
    state.sessionKey = key;
    if (remember) {
      localStorage.setItem('aidlexSessionKey', key);
    }
    appendSystemToast('Session key saved for this tab.');
  } else {
    state.sessionKey = null;
    localStorage.removeItem('aidlexSessionKey');
    appendSystemToast('Session key cleared. Using Netlify backend.');
  }
  toggleModal(apiModal, false);
}

function loadCachedKey() {
  try {
    return localStorage.getItem('aidlexSessionKey');
  } catch (error) {
    console.warn('localStorage unavailable', error);
    return null;
  }
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function connectParticles() {
  if (!window.tsParticles) return;
  window.tsParticles.load('tsparticles', {
    background: { color: '#050507' },
    particles: {
      number: { value: 60 },
      size: { value: 2 },
      color: { value: '#ffffff' },
      opacity: { value: 0.2 },
      move: { enable: true, speed: 0.6 },
      links: { enable: true, distance: 140, color: '#ffffff', opacity: 0.12 },
    },
    interactivity: {
      events: {
        onhover: { enable: true, mode: 'repulse' },
      },
    },
    fullScreen: { enable: false },
  });
}
