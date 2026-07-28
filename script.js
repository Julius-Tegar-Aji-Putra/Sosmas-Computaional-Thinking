/* ==========================================================================
   PROGRAMMER CILIK ADVENTURE — script.js
   State Machine + Game Logic
   ========================================================================== */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. APP STATE
   ───────────────────────────────────────────────────────────── */
const state = {
  currentScreen: 'welcome',   // welcome | materi | missions | finale
  currentScene:  1,           // 1–4 (materi scenes)
  currentSub:    '3a',        // 3a–3d (scene 3 sub-tabs)
  currentMission: 1,          // 1–3

  // Interaction unlock flags
  logicAnswered:   false,

  // Pattern quiz (scene 3b)
  patternQ1Done: false,
  patternQ2Done: false,

  // Algorithm (scene 3d)
  algoItems: [],

  // Abstraction
  absSelected: [],

  // Mission 1 — Detektif Pola
  m1Level:     1,
  m1MaxLevel:  1,
  m1Score:     0,
  m1Answered:  false,

  // Mission 2 — Susun Langkah
  m2Level:  1,
  m2MaxLevel: 1,
  m2Score:  0,
  m2Items:  [],

  // Mission 3 — Labirin Robot
  m3Level:  1,
  m3MaxLevel: 1,
  m3Score:  0,
  m3Grid:   [],
  m3Cols:   4,
  m3Rows:   4,
  m3LoPos:  { r: 0, c: 0 },
  m3Goal:   { r: 0, c: 0 },
  m3Cmds:   [],
  m3Running: false,

  // Total
  totalScore: 0,

  // Mission completion
  m1Done: false,
  m2Done: false,
  m3Done: false,
};

/* ─────────────────────────────────────────────────────────────
   2. SCREEN / SCENE NAVIGATION
   ───────────────────────────────────────────────────────────── */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + name);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  state.currentScreen = name;
  updateTopBar();
}

function gotoScene(n) {
  // Guard: scene 2 requires logic answered
  if (n === 3 && !state.logicAnswered) {
    showToast('Pilih jawaban dulu ya! 🧠', 'wrong');
    return;
  }

  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('scene-' + n);
  if (el) el.classList.add('active');
  state.currentScene = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateProgressSteps('materi');

  // Update materi progress bar
  const pct = (n / 4) * 100;
  const bar = document.getElementById('materi-progress-bar');
  if (bar) bar.style.width = pct + '%';
}

function switchTab(tabId) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Show subpane
  document.querySelectorAll('.subpane').forEach(p => p.classList.remove('active'));
  const pane = document.getElementById('sub-' + tabId);
  if (pane) pane.classList.add('active');

  state.currentSub = tabId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function gotoMissions() {
  showScreen('missions');
  updateMissionTabs();
  initMission1();
}

function gotoMission(n) {
  document.querySelectorAll('.mission-pane').forEach(p => p.classList.remove('active'));
  const pane = document.getElementById('mission-' + n);
  if (pane) pane.classList.add('active');
  state.currentMission = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateMissionTabs();
  updateTopBar();
}

// Shortcut dari top bar: langsung ke misi tanpa lock
function goToMissionShortcut(n) {
  // Simpan posisi terakhir di materi agar bisa kembali
  showScreen('missions');
  // Inisialisasi misi jika belum pernah diinisialisasi
  if (n === 1 && !state.m1Answered && state.m1Level === 1) initMission1();
  if (n === 2 && state.m2Level === 1 && state.m2Items.length === 0) initMission2();
  if (n === 3 && state.m3Level === 1 && state.m3Grid.length === 0) initMission3();
  gotoMission(n);
}

// Kembali ke materi di slide terakhir
function backToMateri() {
  showScreen('materi');
  // Tampilkan scene terakhir yang aktif
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('scene-' + state.currentScene);
  if (el) el.classList.add('active');
}

function updateTopBar() {
  const s = state;
  const psMateri = document.getElementById('ps-materi');
  const psM1 = document.getElementById('ps-m1');
  const psM2 = document.getElementById('ps-m2');
  const psM3 = document.getElementById('ps-m3');

  [psMateri, psM1, psM2, psM3].forEach(el => {
    if (el) el.classList.remove('active', 'done', 'locked');
  });

  if (s.currentScreen === 'welcome' || s.currentScreen === 'materi') {
    if (psMateri) psMateri.classList.add('active');
    // Misi tetap bisa diklik (tidak locked) — hanya tandai done jika sudah selesai
    if (psM1 && s.m1Done) psM1.classList.add('done');
    if (psM2 && s.m2Done) psM2.classList.add('done');
    if (psM3 && s.m3Done) psM3.classList.add('done');
  } else if (s.currentScreen === 'missions' || s.currentScreen === 'finale') {
    if (psMateri) psMateri.classList.add('done');
    if (s.m1Done) { if (psM1) psM1.classList.add('done'); }
    else if (psM1 && s.currentMission === 1) psM1.classList.add('active');
    if (s.m2Done) { if (psM2) psM2.classList.add('done'); }
    else if (psM2 && s.currentMission === 2) psM2.classList.add('active');
    if (s.m3Done) { if (psM3) psM3.classList.add('done'); }
    else if (psM3 && s.currentMission === 3) psM3.classList.add('active');
  }

  // Score
  const scoreEl = document.getElementById('score-display');
  if (scoreEl) scoreEl.textContent = s.totalScore;
}

function updateMissionTabs() {
  const t1 = document.getElementById('mtab-1');
  const t2 = document.getElementById('mtab-2');
  const t3 = document.getElementById('mtab-3');
  [t1, t2, t3].forEach(t => { if(t) t.classList.remove('active','done','locked'); });
  if (state.m1Done) { t1 && t1.classList.add('done'); }
  else { t1 && t1.classList.add(state.currentMission === 1 ? 'active' : 'locked'); }
  if (state.m2Done) { t2 && t2.classList.add('done'); }
  else { t2 && t2.classList.add(!state.m1Done ? 'locked' : state.currentMission === 2 ? 'active' : 'locked'); }
  if (state.m3Done) { t3 && t3.classList.add('done'); }
  else { t3 && t3.classList.add(!state.m2Done ? 'locked' : state.currentMission === 3 ? 'active' : 'locked'); }
}

function updateProgressSteps(screen) {
  updateTopBar();
}

/* ─────────────────────────────────────────────────────────────
   3. WELCOME SCREEN
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Start button
  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      showScreen('materi');
      initScene2();
      initAlgorithmReorder();
    });
  }

  // Problem cards (scene 1) — reveal on click
  document.querySelectorAll('.problem-card').forEach(card => {
    card.addEventListener('click', function() {
      const sol = this.dataset.solution;
      const solEl = this.querySelector('.problem-solution');
      if (solEl) {
        solEl.classList.toggle('hidden');
        solEl.textContent = sol;
        this.classList.toggle('revealed');
      }
    });
  });

  // Logic choice buttons (scene 2)
  document.querySelectorAll('#logic-choices .choice-card').forEach(btn => {
    btn.addEventListener('click', function() {
      handleLogicChoice(this);
    });
  });

  // Pattern quiz (scene 3b)
  document.querySelectorAll('#pt-choices-1 .choice-card').forEach(btn => {
    btn.addEventListener('click', function() {
      handlePatternAnswer(this, 1);
    });
  });
  document.querySelectorAll('#pt-choices-2 .choice-card').forEach(btn => {
    btn.addEventListener('click', function() {
      handlePatternAnswer(this, 2);
    });
  });

  // Abstraction items (scene 3c)
  document.querySelectorAll('#abs-items .abs-item').forEach(btn => {
    btn.addEventListener('click', function() {
      toggleAbsItem(this);
    });
  });

  // Sub-tab buttons (scene 3)
  document.querySelectorAll('#concept-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      switchTab(this.dataset.tab);
    });
  });

  // Tree branches expand (sub-level)
  ['tb1','tb2','tb3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        const sub = document.getElementById(id + '-sub');
        if (sub) sub.classList.toggle('hidden');
      });
      el.style.cursor = 'pointer';
    }
  });

  // Init
  updateTopBar();
});

/* ─────────────────────────────────────────────────────────────
   4. SCENE 2 — LOGIC
   ───────────────────────────────────────────────────────────── */
function initScene2() {
  state.logicAnswered = false;
  const nextBtn = document.getElementById('btn-scene2-next');
  if (nextBtn) nextBtn.disabled = true;
  // Reset choices
  document.querySelectorAll('#logic-choices .choice-card').forEach(b => {
    b.classList.remove('selected-correct','selected-wrong','disabled');
  });
  const fb = document.getElementById('logic-feedback');
  if (fb) fb.classList.add('hidden');
}

function handleLogicChoice(btn) {
  if (state.logicAnswered) return;

  const isCorrect = btn.dataset.answer === 'correct';
  state.logicAnswered = isCorrect;

  const iconEl = document.getElementById('logic-fb-icon');
  const titleEl = document.getElementById('logic-fb-title');
  const descEl  = document.getElementById('logic-fb-desc');
  const fbEl    = document.getElementById('logic-feedback');
  const nextBtn = document.getElementById('btn-scene2-next');

  document.querySelectorAll('#logic-choices .choice-card').forEach(b => b.classList.add('disabled'));

  if (isCorrect) {
    btn.classList.add('selected-correct');
    fbEl.classList.remove('hidden','wrong');
    fbEl.classList.add('correct');
    if (iconEl) iconEl.innerHTML = '<span class="fb-icon-correct"></span>';
    if (titleEl) titleEl.textContent = 'BENAR BANGET! ✓';
    if (descEl)  descEl.textContent = 'Payung adalah pilihan yang paling masuk akal saat hujan. Kamu menggunakan informasi untuk berpikir logis!';
    fbEl.classList.remove('hidden');
    if (nextBtn) nextBtn.disabled = false;
    showToast('Hebat! Kamu berpikir logis! 🧠', 'correct');
    addScore(5);
  } else {
    btn.classList.add('selected-wrong');
    fbEl.classList.remove('hidden','correct');
    fbEl.classList.add('wrong');
    if (iconEl) iconEl.innerHTML = '<span class="fb-icon-wrong"></span>';
    if (titleEl) titleEl.textContent = 'Hmm… Coba pikir lagi! ✗';
    if (descEl)  descEl.textContent = 'Kacamata hitam dan es krim tidak membantu saat hujan. Coba klik Payung! ☂️';
    fbEl.classList.remove('hidden');
    // Re-enable after hint
    setTimeout(() => {
      document.querySelectorAll('#logic-choices .choice-card').forEach(b => b.classList.remove('disabled','selected-wrong'));
    }, 1200);
  }
}

/* ─────────────────────────────────────────────────────────────
   5. SCENE 3A — DECOMPOSITION TREE
   ───────────────────────────────────────────────────────────── */
function revealTree() {
  const btn = document.getElementById('btn-tree-reveal');
  const connector = document.getElementById('tree-connector-1');
  const branches  = document.getElementById('tree-level-1');
  const hint = document.getElementById('tree-expand-hint');

  if (btn) btn.style.background = 'var(--accent-green)';
  if (connector) connector.classList.remove('hidden');
  if (branches) branches.classList.remove('hidden');
  if (hint) hint.classList.remove('hidden');

  addScore(3);
  showToast('Decomposition! Satu masalah jadi 3 bagian! 🧩', 'correct');
}

/* ─────────────────────────────────────────────────────────────
   6. SCENE 3B — PATTERN RECOGNITION
   ───────────────────────────────────────────────────────────── */
function handlePatternAnswer(btn, qId) {
  const isCorrect = btn.dataset.correct === 'true';
  const choices = document.querySelectorAll(`#pt-choices-${qId} .choice-card`);
  const fbEl    = document.getElementById(`pt-fb-${qId}`);
  const ansEl   = document.getElementById(`pt-ans-${qId}`);

  // Already answered?
  if (qId === 1 && state.patternQ1Done) return;
  if (qId === 2 && state.patternQ2Done) return;

  choices.forEach(b => b.classList.add('disabled'));

  if (isCorrect) {
    btn.classList.add('selected-correct');
    if (ansEl) {
      const emoji = btn.querySelector('.choice-emoji');
      ansEl.textContent = emoji ? emoji.textContent : '✓';
      ansEl.style.background = 'var(--accent-green)';
      ansEl.style.color = '#fff';
    }
    setFeedback(fbEl, true, 'TEPAT BANGET! ✓',
      qId === 1 ? 'Polanya selang-seling: Kucing → Anjing → Kucing → Anjing!'
               : 'Polanya bertambah 2 setiap langkah: 2, 4, 6, 8, 10!');
    addScore(5);
    showToast('Kamu menemukan polanya! 🔍', 'correct');

    if (qId === 1) {
      state.patternQ1Done = true;
      setTimeout(() => {
        const q2 = document.getElementById('pattern-q2');
        if (q2) q2.classList.remove('hidden');
      }, 800);
    } else {
      state.patternQ2Done = true;
    }
  } else {
    btn.classList.add('selected-wrong');
    setFeedback(fbEl, false, 'Belum tepat ✗', 'Perhatikan lagi pola berulangnya dari kiri ke kanan!');
    showToast('Coba perhatikan lagi polanya… 🔍', 'wrong');
    setTimeout(() => {
      choices.forEach(b => b.classList.remove('disabled','selected-wrong'));
      if (fbEl) fbEl.classList.add('hidden');
    }, 1200);
  }
}

/* ─────────────────────────────────────────────────────────────
   7. SCENE 3C — ABSTRACTION
   ───────────────────────────────────────────────────────────── */
function toggleAbsItem(btn) {
  const id = btn.dataset.id;
  const idx = state.absSelected.indexOf(id);
  if (idx > -1) {
    state.absSelected.splice(idx, 1);
    btn.classList.remove('selected');
  } else {
    if (state.absSelected.length < 3) {
      state.absSelected.push(id);
      btn.classList.add('selected');
    } else {
      showToast('Pilih maksimal 3 hal ya!', 'wrong');
    }
  }
}

function checkAbstraction() {
  const important = ['home','school','road'];
  const selected  = state.absSelected;

  if (selected.length < 2) {
    showToast('Pilih setidaknya 2 hal penting dulu!', 'wrong');
    return;
  }

  const correctCount = selected.filter(id => important.includes(id)).length;
  const wrongCount   = selected.filter(id => !important.includes(id)).length;
  const fbEl = document.getElementById('abs-feedback');

  if (wrongCount === 0 && correctCount >= 2) {
    // All selected are correct
    document.querySelectorAll('#abs-items .abs-item').forEach(b => {
      if (important.includes(b.dataset.id)) {
        b.classList.add('correct');
      } else {
        b.classList.add('dimmed');
      }
    });
    setFeedback(fbEl, true, 'HEBAT! Kamu memilih yang penting! 🎯',
      'Rumah, Sekolah, dan Jalan Utama adalah informasi yang relevan. Kucing, Awan, dan Burung bisa diabaikan!');
    addScore(5);
    showToast('Abstraction! Fokus pada yang penting! 🎯', 'correct');
  } else {
    setFeedback(fbEl, false, 'Hmm, ada yang tidak perlu ✗',
      'Fokus pada: Titik awal (Rumah), Tujuan (Sekolah), dan jalur/jalan. Kucing, awan, dan burung tidak membantu mencari jalan!');
    showToast('Coba lagi — pilih yang benar-benar penting! 🎯', 'wrong');
    // Reset
    setTimeout(() => {
      state.absSelected = [];
      document.querySelectorAll('#abs-items .abs-item').forEach(b => b.classList.remove('selected','dimmed','correct'));
      if (fbEl) fbEl.classList.add('hidden');
    }, 1500);
  }
}

/* ─────────────────────────────────────────────────────────────
   8. SCENE 3D — ALGORITHM (Reorder)
   ───────────────────────────────────────────────────────────── */
const algoData = [
  { text: 'Siapkan gelas bersih', emoji: '🫙', order: 1 },
  { text: 'Masukkan bubuk cokelat', emoji: '🍫', order: 2 },
  { text: 'Tuang susu ke gelas', emoji: '🥛', order: 3 },
  { text: 'Aduk hingga merata', emoji: '🥄', order: 4 },
  { text: 'Siap diminum! 😋', emoji: '☕', order: 5 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initAlgorithmReorder() {
  state.algoItems = shuffle(algoData);
  renderReorderList('algo-reorder', state.algoItems, 'algo');
  const fb = document.getElementById('algo-feedback');
  if (fb) fb.classList.add('hidden');
}

function resetAlgorithm() {
  state.algoItems = shuffle(algoData);
  renderReorderList('algo-reorder', state.algoItems, 'algo');
  const fb = document.getElementById('algo-feedback');
  if (fb) { fb.classList.add('hidden'); fb.classList.remove('correct','wrong'); }
}

function renderReorderList(containerId, items, prefix) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  items.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'reorder-item';
    div.innerHTML = `
      <div class="arrow-btns">
        <button class="arrow-btn" onclick="moveItem('${prefix}',${idx},-1)" ${idx===0?'disabled':''}
          aria-label="Naik">⬆</button>
        <button class="arrow-btn" onclick="moveItem('${prefix}',${idx},1)" ${idx===items.length-1?'disabled':''}
          aria-label="Turun">⬇</button>
      </div>
      <div class="reorder-num">${idx+1}</div>
      <div class="reorder-emoji">${item.emoji}</div>
      <div class="reorder-text">${item.text}</div>
    `;
    container.appendChild(div);
  });
}

function moveItem(prefix, idx, dir) {
  let items, containerId;
  if (prefix === 'algo') {
    items = state.algoItems;
    containerId = 'algo-reorder';
  } else if (prefix === 'm2') {
    items = state.m2Items;
    containerId = 'm2-reorder';
  } else {
    return;
  }

  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= items.length) return;
  [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
  renderReorderList(containerId, items, prefix);

  // Clear feedback on move
  const fbMap = { algo: 'algo-feedback', m2: 'm2-feedback' };
  const fb = document.getElementById(fbMap[prefix]);
  if (fb) { fb.classList.add('hidden'); fb.classList.remove('correct','wrong'); }
}

function checkAlgorithm() {
  const correct = state.algoItems.every((item, idx) => item.order === idx + 1);
  const fbEl = document.getElementById('algo-feedback');
  const nextBtn = document.getElementById('btn-goto-scene4');

  if (correct) {
    // Highlight all green
    document.querySelectorAll('#algo-reorder .reorder-item').forEach(el => {
      el.classList.add('is-right');
    });
    setFeedback(fbEl, true, 'SEMPURNA! Algoritmamu benar! 🎉',
      'Urutan langkah yang kamu buat tadi disebut ALGORITMA — langkah-langkah untuk menyelesaikan masalah!');
    addScore(5);
    showToast('Algoritma berhasil! 🪜', 'correct');
  } else {
    // Highlight wrong positions
    document.querySelectorAll('#algo-reorder .reorder-item').forEach((el, idx) => {
      el.classList.remove('is-right','is-wrong');
      el.classList.add(state.algoItems[idx].order === idx + 1 ? 'is-right' : 'is-wrong');
    });
    setFeedback(fbEl, false, 'Belum urut! ✗',
      'Perhatikan langkah merah — posisinya belum tepat. Gunakan ⬆ ⬇ untuk mengatur ulang!');
    showToast('Urutan belum benar, coba lagi! 🪜', 'wrong');
  }
}


/* ─────────────────────────────────────────────────────────────
   10. MISSION 1 — DETEKTIF POLA
   ───────────────────────────────────────────────────────────── */
const m1Levels = [
  {
    sequence: ['🐱','🐶','🐱','🐶','🐱'],
    question: '?',
    choices: [
      { text:'🐶 Anjing', correct: true },
      { text:'🐱 Kucing', correct: false },
      { text:'🐸 Katak',  correct: false },
      { text:'🦊 Rubah',  correct: false },
    ],
    hint: 'Perhatikan pola selang-seling!',
    type: 'emoji',
    explanation: 'Polanya: Kucing → Anjing → Kucing → Anjing → Kucing → Anjing! Selang-seling!'
  },
  {
    sequence: ['🔵','🟢','🟡','🔵','🟢'],
    question: '?',
    choices: [
      { text:'🟡 Kuning', correct: true },
      { text:'🔵 Biru',   correct: false },
      { text:'🟢 Hijau',  correct: false },
      { text:'🔴 Merah',  correct: false },
    ],
    hint: 'Pola 3 warna berulang!',
    type: 'emoji',
    explanation: 'Pola 3 warna: Biru → Hijau → Kuning → ulang! Jadi berikutnya: Kuning!'
  },
  {
    sequence: ['3','6','9','12','15'],
    question: '?',
    choices: [
      { text:'16', correct: false },
      { text:'17', correct: false },
      { text:'18', correct: true  },
      { text:'19', correct: false },
    ],
    hint: 'Pola bertambah berapa setiap langkah?',
    type: 'number',
    explanation: 'Polanya bertambah 3 setiap langkah: 3, 6, 9, 12, 15, 18!'
  },
];

function initMission1() {
  state.m1Level = 1;
  state.m1Score = 0;
  state.m1Answered = false;
  renderM1Level();
}

function jumpM1Level(n) {
  if (n <= state.m1MaxLevel && n !== state.m1Level) {
    state.m1Level = n;
    renderM1Level();
  }
}

function renderM1Level() {
  const lvl = m1Levels[state.m1Level - 1];
  state.m1Answered = false;

  // Update level label & dots
  const lbl = document.getElementById('m1-level-label');
  if (lbl) lbl.textContent = `Level ${state.m1Level} dari 3`;
  const hint = document.getElementById('m1-hint');
  if (hint) hint.textContent = lvl.hint;

  // Level dots
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`m1-dot-${i}`);
    if (!dot) continue;
    
    // Can only click if it's unlocked (<= m1MaxLevel)
    if (i <= state.m1MaxLevel) {
      dot.style.cursor = 'pointer';
      dot.onclick = () => jumpM1Level(i);
    } else {
      dot.style.cursor = 'not-allowed';
      dot.onclick = null;
    }

    dot.classList.remove('active','done');
    if (i === state.m1Level) dot.classList.add('active');
    else if (i <= state.m1MaxLevel) dot.classList.add('done');
  }

  // Track
  const track = document.getElementById('m1-track');
  if (track) {
    track.innerHTML = '';
    lvl.sequence.forEach(s => {
      const el = document.createElement('div');
      el.className = 'pattern-item' + (lvl.type === 'number' ? ' is-number' : '');
      el.textContent = s;
      track.appendChild(el);
    });
    const qEl = document.createElement('div');
    qEl.className = 'pattern-question';
    qEl.id = 'm1-answer-slot';
    qEl.textContent = '?';
    track.appendChild(qEl);
  }

  // Choices
  const choicesEl = document.getElementById('m1-choices');
  if (choicesEl) {
    choicesEl.innerHTML = '';
    lvl.choices.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'choice-card';
      const parts = c.text.split(' ');
      if (parts.length > 1) {
        btn.innerHTML = `<span class="choice-emoji">${parts[0]}</span> <span>${parts.slice(1).join(' ')}</span>`;
      } else {
        btn.innerHTML = `<span class="choice-emoji">${c.text}</span>`;
      }
      btn.dataset.correct = c.correct;
      btn.addEventListener('click', () => handleM1Choice(btn, c.correct, lvl));
      choicesEl.appendChild(btn);
    });
  }

  // Clear feedback
  const fb = document.getElementById('m1-feedback');
  if (fb) { fb.classList.add('hidden'); fb.classList.remove('correct','wrong'); }
}

function handleM1Choice(btn, correct, lvl) {
  if (state.m1Answered) return;
  state.m1Answered = true;

  document.querySelectorAll('#m1-choices .choice-card').forEach(b => b.classList.add('disabled'));
  const slot = document.getElementById('m1-answer-slot');
  const fbEl = document.getElementById('m1-feedback');

  if (correct) {
    btn.classList.add('selected-correct');
    if (slot) {
      slot.textContent = btn.querySelector('.choice-emoji').textContent;
      slot.style.background = 'var(--accent-green)';
      slot.style.color = '#fff';
    }
    setFeedback(fbEl, true, 'BENAR! Kamu detektif pola yang hebat! ✓', lvl.explanation);

    const pts = 10;
    state.m1Score += pts;
    addScore(pts);
    showToast(`+${pts} poin! Pola ditemukan! 🔍`, 'correct');

    setTimeout(() => {
      if (state.m1Level < 3) {
        state.m1Level++;
        if (state.m1Level > state.m1MaxLevel) state.m1MaxLevel = state.m1Level;
        renderM1Level();
      } else {
        // Mission 1 complete
        completeMission1();
      }
    }, 1800);
  } else {
    btn.classList.add('selected-wrong');
    setFeedback(fbEl, false, 'Belum tepat ✗', 'Perhatikan lagi pola berulangnya! ' + lvl.hint);
    showToast('Coba perhatikan lagi polanya!', 'wrong');
    setTimeout(() => {
      document.querySelectorAll('#m1-choices .choice-card').forEach(b => b.classList.remove('disabled','selected-wrong'));
      if (fbEl) fbEl.classList.add('hidden');
      state.m1Answered = false;
    }, 1200);
  }
}

function completeMission1() {
  state.m1Done = true;
  updateTopBar();

  // Update M1 dot 3
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`m1-dot-${i}`);
    if (dot) { dot.classList.remove('active'); dot.classList.add('done'); }
  }

  const fbEl = document.getElementById('m1-feedback');
  fbEl.classList.remove('hidden','wrong');
  fbEl.classList.add('correct');
  fbEl.innerHTML = `
    <div class="fb-icon" style="font-size:2.5rem;">🎉</div>
    <div class="fb-body">
      <h4>MISI 1 SELESAI! ✓</h4>
      <p>Kamu berhasil menemukan pola di semua level! Skor M1: ${state.m1Score}/30</p>
      <button class="btn btn-yellow" style="margin-top:12px;" onclick="unlockAndGoM2()">LANJUT MISI 2 →</button>
    </div>
  `;

  updateMissionTabs();
  showToast('MISI 1 SELESAI! 🏆', 'correct');
}

function unlockAndGoM2() {
  initMission2();
  gotoMission(2);
}

/* ─────────────────────────────────────────────────────────────
   11. MISSION 2 — SUSUN LANGKAH
   ───────────────────────────────────────────────────────────── */
const m2Levels = [
  {
    name: 'Membuat Teh ☕',
    steps: [
      { text: 'Siapkan cangkir bersih',   emoji: '🫙', order: 1 },
      { text: 'Didihkan air panas',        emoji: '🔥', order: 2 },
      { text: 'Masukkan kantong teh',      emoji: '🍵', order: 3 },
      { text: 'Tuang air panas',           emoji: '💧', order: 4 },
      { text: 'Tambah gula secukupnya',    emoji: '🍬', order: 5 },
      { text: 'Aduk dan siap diminum!',    emoji: '🥄', order: 6 },
    ]
  },
  {
    name: 'Mencuci Tangan 🙌',
    steps: [
      { text: 'Basahi tangan dengan air', emoji: '💧', order: 1 },
      { text: 'Tuang sabun cuci tangan',  emoji: '🧴', order: 2 },
      { text: 'Gosok seluruh tangan',     emoji: '🤲', order: 3 },
      { text: 'Bilas dengan air mengalir',emoji: '🚿', order: 4 },
      { text: 'Keringkan dengan handuk',  emoji: '🏳️', order: 5 },
    ]
  },
  {
    name: 'Menanam Bunga 🌸',
    steps: [
      { text: 'Siapkan pot dan tanah',      emoji: '🪴', order: 1 },
      { text: 'Isi pot dengan tanah',       emoji: '🌱', order: 2 },
      { text: 'Buat lubang di tengah',      emoji: '🕳️', order: 3 },
      { text: 'Tanam benih/bibit bunga',   emoji: '🌸', order: 4 },
      { text: 'Tutup dengan tanah',         emoji: '🏔️', order: 5 },
      { text: 'Siram secukupnya',           emoji: '🚿', order: 6 },
    ]
  },
];

function initMission2() {
  state.m2Level = 1;
  state.m2Score = 0;
  renderM2Level();
}

function jumpM2Level(n) {
  if (n <= state.m2MaxLevel && n !== state.m2Level) {
    state.m2Level = n;
    renderM2Level();
  }
}

function renderM2Level() {
  const lvl = m2Levels[state.m2Level - 1];
  state.m2Items = shuffle(lvl.steps);

  const lbl = document.getElementById('m2-level-label');
  if (lbl) lbl.textContent = `Level ${state.m2Level} dari 3`;

  const nameEl = document.getElementById('m2-task-name');
  if (nameEl) nameEl.textContent = lvl.name;

  // Dots
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`m2-dot-${i}`);
    if (!dot) continue;
    
    if (i <= state.m2MaxLevel) {
      dot.style.cursor = 'pointer';
      dot.onclick = () => jumpM2Level(i);
    } else {
      dot.style.cursor = 'not-allowed';
      dot.onclick = null;
    }

    dot.classList.remove('active','done');
    if (i === state.m2Level) dot.classList.add('active');
    else if (i <= state.m2MaxLevel) dot.classList.add('done');
  }

  renderReorderList('m2-reorder', state.m2Items, 'm2');

  const fb = document.getElementById('m2-feedback');
  if (fb) { fb.classList.add('hidden'); fb.classList.remove('correct','wrong'); }
}

function checkM2() {
  const lvl = m2Levels[state.m2Level - 1];
  const correct = state.m2Items.every((item, idx) => item.order === idx + 1);
  const fbEl = document.getElementById('m2-feedback');

  if (correct) {
    document.querySelectorAll('#m2-reorder .reorder-item').forEach(el => el.classList.add('is-right'));
    setFeedback(fbEl, true, 'SEMPURNA! Urutanmu benar! 🎉',
      `Algoritma "${lvl.name}" berhasil! Langkah yang terurut dengan benar = cara kerja programmer!`);
    const pts = 10;
    state.m2Score += pts;
    addScore(pts);
    showToast(`+${pts} poin! Langkah tersusun! 🪜`, 'correct');

    setTimeout(() => {
      if (state.m2Level < 3) {
        state.m2Level++;
        if (state.m2Level > state.m2MaxLevel) state.m2MaxLevel = state.m2Level;
        renderM2Level();
      } else {
        completeMission2();
      }
    }, 1800);
  } else {
    document.querySelectorAll('#m2-reorder .reorder-item').forEach((el, idx) => {
      el.classList.remove('is-right','is-wrong');
      el.classList.add(state.m2Items[idx].order === idx+1 ? 'is-right' : 'is-wrong');
    });
    setFeedback(fbEl, false, 'Belum urut! ✗',
      'Perhatikan langkah merah — urutannya belum tepat. Gunakan ⬆ ⬇!');
    showToast('Urutan belum benar, coba lagi! 🪜', 'wrong');
  }
}

function completeMission2() {
  state.m2Done = true;
  updateTopBar();

  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`m2-dot-${i}`);
    if (dot) { dot.classList.remove('active'); dot.classList.add('done'); }
  }

  const fbEl = document.getElementById('m2-feedback');
  fbEl.classList.remove('hidden','wrong');
  fbEl.classList.add('correct');
  fbEl.innerHTML = `
    <div class="fb-icon" style="font-size:2.5rem;">🎉</div>
    <div class="fb-body">
      <h4>MISI 2 SELESAI! ✓</h4>
      <p>Kamu menguasai Algorithmic Thinking! Skor M2: ${state.m2Score}/30</p>
      <button class="btn btn-blue" style="margin-top:12px;" onclick="unlockAndGoM3()">LANJUT MISI 3 →</button>
    </div>
  `;

  updateMissionTabs();
  showToast('MISI 2 SELESAI! 🏆', 'correct');
}

function unlockAndGoM3() {
  initMission3();
  gotoMission(3);
}

/* ─────────────────────────────────────────────────────────────
   12. MISSION 3 — LABIRIN ROBOT
   ───────────────────────────────────────────────────────────── */
// Grid encoding: 0=empty, 1=wall, L=Logi start, G=Goal
const m3Levels = [
  {
    cols: 4, rows: 4,
    grid: [
      [0, 0, 0, 0],
      [0, 1, 0, 0],
      ['L',0, 0,'G'],
      [0, 0, 0, 0],
    ],
    solution: ['R','R','R'],
    maxCmds: 8,
  },
  {
    cols: 4, rows: 4,
    grid: [
      [0, 1, 0, 0],
      ['L',0, 1, 0],
      [0, 0, 0, 0],
      [0, 1, 0,'G'],
    ],
    solution: ['D','R','R','D','R','D'],
    maxCmds: 10,
  },
  {
    cols: 5, rows: 5,
    grid: [
      ['L',0, 1, 0, 0],
      [0, 0, 1, 0, 1],
      [0, 1, 0, 0, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0,'G'],
    ],
    solution: ['D','D','D','D','R','R','U','R','R','D','D'],
    maxCmds: 14,
  },
];

function initMission3() {
  state.m3Level = 1;
  state.m3Score = 0;
  renderM3Level();
}

function jumpM3Level(n) {
  if (n <= state.m3MaxLevel && n !== state.m3Level) {
    state.m3Level = n;
    renderM3Level();
  }
}

function renderM3Level() {
  const lvl = m3Levels[state.m3Level - 1];
  state.m3Grid  = lvl.grid.map(row => [...row]);
  state.m3Cols  = lvl.cols;
  state.m3Rows  = lvl.rows;
  state.m3Cmds  = [];
  state.m3Running = false;

  // Find Logi start & goal
  for (let r = 0; r < lvl.rows; r++) {
    for (let c = 0; c < lvl.cols; c++) {
      if (lvl.grid[r][c] === 'L') state.m3LoPos = { r, c };
      if (lvl.grid[r][c] === 'G') state.m3Goal  = { r, c };
    }
  }

  // Update label & dots
  const lbl = document.getElementById('m3-level-label');
  if (lbl) lbl.textContent = `Level ${state.m3Level} dari 3`;

  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`m3-dot-${i}`);
    if (!dot) continue;
    
    if (i <= state.m3MaxLevel) {
      dot.style.cursor = 'pointer';
      dot.onclick = () => jumpM3Level(i);
    } else {
      dot.style.cursor = 'not-allowed';
      dot.onclick = null;
    }

    dot.classList.remove('active','done');
    if (i === state.m3Level) dot.classList.add('active');
    else if (i <= state.m3MaxLevel) dot.classList.add('done');
  }

  // Render board
  const board = document.getElementById('maze-board');
  if (board) {
    board.style.gridTemplateColumns = `repeat(${lvl.cols}, 1fr)`;
    board.innerHTML = '';
    for (let r = 0; r < lvl.rows; r++) {
      for (let c = 0; c < lvl.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'maze-cell';
        cell.id = `cell-${r}-${c}`;
        const val = lvl.grid[r][c];
        if (val === 1) { cell.classList.add('wall'); cell.textContent = '🧱'; }
        else if (val === 'L') { cell.classList.add('logi-here'); cell.textContent = '🤖'; }
        else if (val === 'G') { cell.classList.add('goal'); cell.textContent = '🏠'; }
        board.appendChild(cell);
      }
    }
  }

  // Cleared cmd queue

  const fb = document.getElementById('m3-maze-fb');
  if (fb) { fb.classList.add('hidden'); fb.classList.remove('correct','wrong'); }

  // Re-enable dpad
  setDpadEnabled(true);
}

function addCmd(dir) {
  if (state.m3Running) return;

  const lvlDef = m3Levels[state.m3Level - 1];
  const dirDelta = { U:[-1,0], D:[1,0], L:[0,-1], R:[0,1] };
  const [dr, dc] = dirDelta[dir];
  const nr = state.m3LoPos.r + dr;
  const nc = state.m3LoPos.c + dc;

  document.querySelectorAll('.maze-cell').forEach(c => c.classList.remove('explosion'));

  if (nr < 0 || nr >= state.m3Rows || nc < 0 || nc >= state.m3Cols || lvlDef.grid[nr][nc] === 1) {
    const curCell = document.getElementById(`cell-${state.m3LoPos.r}-${state.m3LoPos.c}`);
    if (curCell) { curCell.classList.add('explosion'); curCell.textContent = '💥'; }
    const fbEl = document.getElementById('m3-maze-fb');
    setFeedback(fbEl, false, 'Ouch! Logi menabrak! 💥', 'Logi menabrak dinding! Klik RESET POSISI untuk coba lagi.');
    fbEl.classList.remove('hidden');
    showToast('Logi nabrak! Reset ya! 💥', 'wrong');
    state.m3Running = true; 
    setDpadEnabled(false);
    return;
  }

  const oldCell = document.getElementById(`cell-${state.m3LoPos.r}-${state.m3LoPos.c}`);
  if (oldCell) {
    oldCell.classList.remove('logi-here','explosion');
    oldCell.textContent = '';
    if (state.m3LoPos.r === state.m3Goal.r && state.m3LoPos.c === state.m3Goal.c) {
      oldCell.classList.add('goal');
      oldCell.textContent = '🏠';
    }
  }

  state.m3LoPos = { r: nr, c: nc };

  const newCell = document.getElementById(`cell-${state.m3LoPos.r}-${state.m3LoPos.c}`);
  if (newCell) {
    newCell.classList.remove('goal');
    newCell.classList.add('logi-here');
    newCell.textContent = '🤖';
  }

  if (state.m3LoPos.r === state.m3Goal.r && state.m3LoPos.c === state.m3Goal.c) {
    state.m3Running = true;
    setDpadEnabled(false);
    
    setTimeout(() => {
      const fbEl = document.getElementById('m3-maze-fb');
      const pts = 14;
      state.m3Score += pts;
      addScore(pts);

      setFeedback(fbEl, true, 'BERHASIL! Logi sampai ke rumah! 🏠🎉', `Skor +${pts}! Hebat!`);
      fbEl.classList.remove('hidden');
      showToast('Logi sampai! Hebat sekali! 🏠', 'correct');

      const dot = document.getElementById(`m3-dot-${state.m3Level}`);
      if (dot) { dot.classList.remove('active'); dot.classList.add('done'); }

      setTimeout(() => {
        if (state.m3Level < 3) {
          state.m3Level++;
          if (state.m3Level > state.m3MaxLevel) state.m3MaxLevel = state.m3Level;
          renderM3Level();
        } else {
          completeMission3();
        }
      }, 2000);
    }, 300);
  }
}

function resetMaze() {
  renderM3Level();
}

function setDpadEnabled(enabled) {
  ['dpad-up','dpad-down','dpad-left','dpad-right'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = !enabled;
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function completeMission3() {
  state.m3Done = true;
  updateTopBar();

  const fbEl = document.getElementById('m3-maze-fb');
  fbEl.classList.remove('hidden','wrong');
  fbEl.classList.add('correct');
  fbEl.innerHTML = `
    <div class="fb-icon" style="font-size:2.5rem;">🏆</div>
    <div class="fb-body">
      <h4>MISI 3 SELESAI! ✓</h4>
      <p>Kamu berhasil menyelesaikan semua misi! Skor M3: ${state.m3Score}/42</p>
      <button class="btn btn-yellow" style="margin-top:12px;" onclick="gotoFinale()">LIHAT HASIL AKHIR 🏆</button>
    </div>
  `;

  updateMissionTabs();
  showToast('SEMUA MISI SELESAI! 🏆🎉', 'correct');
}

function gotoFinale() {
  showScreen('finale');
  renderFinale();
  spawnConfetti();
}

/* ─────────────────────────────────────────────────────────────
   13. FINALE
   ───────────────────────────────────────────────────────────── */
function renderFinale() {
  const finaleScore = document.getElementById('finale-score');
  if (finaleScore) finaleScore.textContent = state.totalScore;

  // Score bars
  const m1max = 30, m2max = 30, m3max = 42;
  updateBar('bar-m1', 'lbl-m1', state.m1Score, m1max);
  updateBar('bar-m2', 'lbl-m2', state.m2Score, m2max);
  updateBar('bar-m3', 'lbl-m3', state.m3Score, m3max);


  setTimeout(() => {
    updateBar('bar-m1', 'lbl-m1', state.m1Score, m1max, true);
    updateBar('bar-m2', 'lbl-m2', state.m2Score, m2max, true);
    updateBar('bar-m3', 'lbl-m3', state.m3Score, m3max, true);
  }, 300);
}

function updateBar(barId, lblId, score, max, animate) {
  const bar = document.getElementById(barId);
  const lbl = document.getElementById(lblId);
  if (bar) bar.style.width = (score / max * 100) + '%';
  if (lbl) lbl.textContent = `${score}/${max}`;
}


function restartAll() {
  // Reset state
  Object.assign(state, {
    currentScreen: 'welcome', currentScene: 1, currentSub: '3a', currentMission: 1,
    logicAnswered: false,
    patternQ1Done: false, patternQ2Done: false,
    algoItems: [], absSelected: [],
    m1Level:1, m1MaxLevel:1, m1Score:0, m1Answered:false,
    m2Level:1, m2MaxLevel:1, m2Score:0, m2Items:[],
    m3Level:1, m3MaxLevel:1, m3Score:0, m3Grid:[], m3Cmds:[], m3Running:false,
    totalScore:0,
    m1Done:false, m2Done:false, m3Done:false,
  });
  showScreen('welcome');
  // Re-init scenes
  initScene2();
  initAlgorithmReorder();
  // Reset pattern quiz
  const q2 = document.getElementById('pattern-q2');
  if (q2) q2.classList.add('hidden');
  document.querySelectorAll('#pt-choices-1 .choice-card, #pt-choices-2 .choice-card').forEach(b => {
    b.classList.remove('selected-correct','selected-wrong','disabled');
  });
  // Reset tree
  const branches = document.getElementById('tree-level-1');
  if (branches) branches.classList.add('hidden');
  const connector = document.getElementById('tree-connector-1');
  if (connector) connector.classList.add('hidden');
  const hint = document.getElementById('tree-expand-hint');
  if (hint) hint.classList.add('hidden');
  const treeBtn = document.getElementById('btn-tree-reveal');
  if (treeBtn) treeBtn.style.background = '';
  // Reset abstraction
  document.querySelectorAll('#abs-items .abs-item').forEach(b => b.classList.remove('selected','correct','dimmed'));
  const absFb = document.getElementById('abs-feedback');
  if (absFb) absFb.classList.add('hidden');
  // Reset progress
  updateTopBar();
}

/* ─────────────────────────────────────────────────────────────
   14. HELPERS
   ───────────────────────────────────────────────────────────── */
function setFeedback(el, correct, title, desc) {
  if (!el) return;
  el.className = 'feedback-box' + (correct ? ' correct' : ' wrong');
  el.innerHTML = `
    <div class="fb-icon">
      <span class="${correct ? 'fb-icon-correct' : 'fb-icon-wrong'}"></span>
    </div>
    <div class="fb-body">
      <h4>${title}</h4>
      <p>${desc}</p>
    </div>
  `;
  el.classList.remove('hidden');
}

function addScore(pts) {
  state.totalScore += pts;
  const el = document.getElementById('score-display');
  if (el) {
    el.textContent = state.totalScore;
    el.style.transform = 'scale(1.3)';
    el.style.color = 'var(--accent-yellow)';
    setTimeout(() => {
      el.style.transform = '';
      el.style.color = '';
    }, 400);
  }
}

/* ─────────────────────────────────────────────────────────────
   15. TOAST NOTIFICATION
   ───────────────────────────────────────────────────────────── */
function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'correct' ? ' toast-correct' : type === 'wrong' ? ' toast-wrong' : '');
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

/* ─────────────────────────────────────────────────────────────
   16. CONFETTI
   ───────────────────────────────────────────────────────────── */
function spawnConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#FFC83D','#3A7BD5','#F28C38','#4FAE68','#F15A4A','#FFF9EA'];
  const shapes = ['square','circle'];

  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size  = Math.random() * 10 + 6;
    const left  = Math.random() * 100;
    const duration = Math.random() * 2 + 2;
    const delay_ms = Math.random() * 1.5;
    const isCircle = Math.random() > 0.5;

    piece.style.cssText = `
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${isCircle ? '50%' : '2px'};
      animation: confettiFall ${duration}s ${delay_ms}s linear forwards;
    `;
    container.appendChild(piece);
  }

  // Clean up after 5 seconds
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}
