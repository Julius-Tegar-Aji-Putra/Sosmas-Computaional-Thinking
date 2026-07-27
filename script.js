/**
 * MISI LOGIKA — Game Engine & Interaction Controller
 * Designed for ~30 Minute KKN Computational Thinking Workshop for SD Students
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const state = {
    score: 0,
    currentMission: 1,
    
    // Mission 01 State
    m1: {
      qIndex: 0,
      questions: [
        {
          items: ['▲', '●', '▲', '●', '▲'],
          options: ['▲', '●', '■'],
          correct: 1, // '●'
          hint: 'Bentuk berulang secara selang-seling (segitiga, lingkaran...)'
        },
        {
          items: ['⭐', '⭐', '🌙', '⭐', '⭐'],
          options: ['⭐', '🌙', '☀️'],
          correct: 1, // '🌙'
          hint: 'Dua bintang diikuti satu bulan...'
        },
        {
          items: ['🟥', '🟦', '🟩', '🟥', '🟦'],
          options: ['🟥', '🟦', '🟩'],
          correct: 2, // '🟩'
          hint: 'Pola warna 3 urutan: Merah, Biru, ...'
        }
      ]
    },

    // Mission 02 State (Robot Programmer Grid 4x4)
    m2: {
      gridSize: 4,
      start: { r: 0, c: 0 },
      goal: { r: 3, c: 2 },
      obstacles: [
        { r: 1, c: 1 },
        { r: 1, c: 2 }
      ],
      robotPos: { r: 0, c: 0 },
      commands: [],
      maxCmds: 8,
      isRunning: false,
      completed: false
    },

    // Mission 03 State (Debugging)
    m3: {
      phase: 1, // 1: find bug, 2: reorder
      scrambledSteps: [
        { id: 1, text: 'Makan roti', isBug: true },
        { id: 2, text: 'Ambil roti', isBug: false },
        { id: 3, text: 'Oleskan selai', isBug: false },
        { id: 4, text: 'Ambil piring', isBug: false }
      ],
      reorderSteps: [
        'Makan roti',
        'Ambil roti',
        'Oleskan selai',
        'Ambil piring'
      ],
      correctOrder: [
        'Ambil piring',
        'Ambil roti',
        'Oleskan selai',
        'Makan roti'
      ],
      completed: false
    }
  };

  // ==========================================
  // 2. DOM ELEMENTS SELECTION
  // ==========================================
  const screens = {
    start: document.getElementById('start-screen'),
    mission: document.getElementById('mission-screen'),
    result: document.getElementById('result-screen')
  };

  const missions = {
    1: document.getElementById('mission-1'),
    2: document.getElementById('mission-2'),
    3: document.getElementById('mission-3')
  };

  const scoreDisplay = document.getElementById('score-val');
  const btnStart = document.getElementById('btn-start');
  const btnRestart = document.getElementById('btn-restart');

  // ==========================================
  // 3. SCREEN & MISSION SWITCHING HELPERS
  // ==========================================
  function showScreen(screenId) {
    Object.keys(screens).forEach(key => {
      if (key === screenId) {
        screens[key].classList.remove('hidden');
        screens[key].classList.add('active');
      } else {
        screens[key].classList.add('hidden');
        screens[key].classList.remove('active');
      }
    });
  }

  function setMission(mIndex) {
    state.currentMission = mIndex;
    Object.keys(missions).forEach(key => {
      if (parseInt(key) === mIndex) {
        missions[key].classList.remove('hidden');
        missions[key].classList.add('active');
      } else {
        missions[key].classList.add('hidden');
        missions[key].classList.remove('active');
      }
    });

    // Update Progress Indicator Header
    for (let i = 1; i <= 3; i++) {
      const progEl = document.getElementById(`prog-${i}`);
      if (i < mIndex) {
        progEl.className = 'progress-step completed';
      } else if (i === mIndex) {
        progEl.className = 'progress-step active';
      } else {
        progEl.className = 'progress-step';
      }
    }
  }

  function addScore(points) {
    state.score += points;
    scoreDisplay.textContent = state.score;
  }

  // ==========================================
  // 4. MISSION 01 ENGINE: DETEKTIF POLA
  // ==========================================
  const m1QNum = document.getElementById('m1-q-num');
  const m1Hint = document.getElementById('m1-hint');
  const patternItems = document.getElementById('pattern-items');
  const m1Options = document.getElementById('m1-options');
  const m1Feedback = document.getElementById('m1-feedback');
  const m1FbIcon = document.getElementById('m1-fb-icon');
  const m1FbTitle = document.getElementById('m1-fb-title');
  const m1FbDesc = document.getElementById('m1-fb-desc');
  const m1BtnNext = document.getElementById('m1-btn-next');

  function renderMission1() {
    const qData = state.m1.questions[state.m1.qIndex];
    m1QNum.textContent = state.m1.qIndex + 1;
    m1Hint.textContent = qData.hint;
    m1Feedback.classList.add('hidden');

    // Clear and build sequence items
    patternItems.innerHTML = '';
    qData.items.forEach(symbol => {
      const tile = document.createElement('div');
      tile.className = 'p-tile';
      tile.textContent = symbol;
      patternItems.appendChild(tile);
    });

    // Append Target '?' Box
    const targetTile = document.createElement('div');
    targetTile.className = 'p-tile target';
    targetTile.textContent = '?';
    patternItems.appendChild(targetTile);

    // Build Options
    m1Options.innerHTML = '';
    qData.options.forEach((optSymbol, index) => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = optSymbol;
      btn.addEventListener('click', () => handleM1Answer(index));
      m1Options.appendChild(btn);
    });
  }

  function handleM1Answer(selectedIndex) {
    const qData = state.m1.questions[state.m1.qIndex];
    m1Feedback.classList.remove('hidden');

    if (selectedIndex === qData.correct) {
      addScore(10);
      m1FbIcon.textContent = '✓';
      m1FbTitle.textContent = 'BENAR!';
      m1FbTitle.style.color = 'var(--accent-green)';
      m1FbDesc.textContent = 'Kamu berhasil menemukan polanya! (+10 Poin)';

      // Disable options
      document.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);

      if (state.m1.qIndex < state.m1.questions.length - 1) {
        m1BtnNext.textContent = 'SOAL BERIKUTNYA →';
      } else {
        m1BtnNext.textContent = 'LANJUT MISI 2 →';
      }
    } else {
      m1FbIcon.textContent = '❌';
      m1FbTitle.textContent = 'BELUM TEPAT!';
      m1FbTitle.style.color = 'var(--accent-red)';
      m1FbDesc.textContent = 'Coba perhatikan urutan simbol yang berulang.';
      m1BtnNext.textContent = 'COBA LAGI';
    }
  }

  m1BtnNext.addEventListener('click', () => {
    if (m1FbTitle.textContent === 'BELUM TEPAT!') {
      m1Feedback.classList.add('hidden');
      return;
    }

    if (state.m1.qIndex < state.m1.questions.length - 1) {
      state.m1.qIndex++;
      renderMission1();
    } else {
      setMission(2);
      renderMission2();
    }
  });

  // ==========================================
  // 5. MISSION 02 ENGINE: JADI PROGRAMMER (GRID 4x4)
  // ==========================================
  const robotGrid = document.getElementById('robot-grid');
  const cmdCount = document.getElementById('cmd-count');
  const cmdQueue = document.getElementById('cmd-queue');
  const btnRunRobot = document.getElementById('btn-run-robot');
  const btnResetRobot = document.getElementById('btn-reset-robot');
  const btnPopCmd = document.getElementById('btn-pop-cmd');
  const m2Feedback = document.getElementById('m2-feedback');
  const m2BtnNext = document.getElementById('m2-btn-next');

  function renderMission2() {
    state.m2.robotPos = { ...state.m2.start };
    state.m2.commands = [];
    state.m2.isRunning = false;
    updateCmdQueueDisplay();
    renderGrid();
    m2Feedback.classList.add('hidden');
  }

  function renderGrid() {
    robotGrid.innerHTML = '';
    for (let r = 0; r < state.m2.gridSize; r++) {
      for (let c = 0; c < state.m2.gridSize; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';

        // Check if Goal
        if (r === state.m2.goal.r && c === state.m2.goal.c) {
          cell.classList.add('goal');
          cell.textContent = '⭐';
        }

        // Check if Obstacle
        const isObs = state.m2.obstacles.some(o => o.r === r && o.c === c);
        if (isObs) {
          cell.classList.add('obstacle');
          cell.textContent = '🧱';
        }

        // Check if Robot Logi
        if (r === state.m2.robotPos.r && c === state.m2.robotPos.c) {
          const logiEl = document.createElement('div');
          logiEl.className = 'cell-logi';
          logiEl.textContent = '🤖';
          cell.appendChild(logiEl);
        }

        robotGrid.appendChild(cell);
      }
    }
  }

  // Handle D-Pad Input
  document.querySelectorAll('.btn-cmd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (state.m2.isRunning || state.m2.completed) return;
      const dir = e.currentTarget.dataset.dir;
      if (state.m2.commands.length < state.m2.maxCmds) {
        state.m2.commands.push(dir);
        updateCmdQueueDisplay();
      }
    });
  });

  function updateCmdQueueDisplay() {
    cmdCount.textContent = state.m2.commands.length;
    cmdQueue.innerHTML = '';
    if (state.m2.commands.length === 0) {
      cmdQueue.innerHTML = '<span class="placeholder-text">Belum ada perintah...</span>';
      return;
    }

    const dirSymbols = { UP: '⬆️ ATAS', DOWN: '⬇️ BAWAH', LEFT: '⬅️ KIRI', RIGHT: '➡️ KANAN' };
    state.m2.commands.forEach((cmd) => {
      const chip = document.createElement('span');
      chip.className = 'cmd-chip';
      chip.textContent = dirSymbols[cmd];
      cmdQueue.appendChild(chip);
    });
  }

  btnPopCmd.addEventListener('click', () => {
    if (state.m2.isRunning || state.m2.completed) return;
    state.m2.commands.pop();
    updateCmdQueueDisplay();
  });

  btnResetRobot.addEventListener('click', () => {
    if (state.m2.isRunning) return;
    state.m2.commands = [];
    state.m2.robotPos = { ...state.m2.start };
    updateCmdQueueDisplay();
    renderGrid();
    m2Feedback.classList.add('hidden');
  });

  // Run Robot Movement Execution Engine
  btnRunRobot.addEventListener('click', () => {
    if (state.m2.isRunning || state.m2.commands.length === 0) return;
    state.m2.isRunning = true;
    state.m2.robotPos = { ...state.m2.start };
    renderGrid();

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex >= state.m2.commands.length) {
        clearInterval(interval);
        state.m2.isRunning = false;
        checkRobotArrival();
        return;
      }

      const dir = state.m2.commands[stepIndex];
      let newR = state.m2.robotPos.r;
      let newC = state.m2.robotPos.c;

      if (dir === 'UP') newR--;
      if (dir === 'DOWN') newR++;
      if (dir === 'LEFT') newC--;
      if (dir === 'RIGHT') newC++;

      // Boundary check & Obstacle collision check
      const hitWall = newR < 0 || newR >= 4 || newC < 0 || newC >= 4;
      const hitObstacle = state.m2.obstacles.some(o => o.r === newR && o.c === newC);

      if (hitWall || hitObstacle) {
        clearInterval(interval);
        state.m2.isRunning = false;
        showM2Fail(hitWall ? 'Oops! Logi keluar dari papan grid.' : 'Oops! Logi menabrak rintangan 🧱!');
        return;
      }

      // Move Logi
      state.m2.robotPos = { r: newR, c: newC };
      renderGrid();
      stepIndex++;
    }, 450);
  });

  function checkRobotArrival() {
    if (state.m2.robotPos.r === state.m2.goal.r && state.m2.robotPos.c === state.m2.goal.c) {
      if (!state.m2.completed) {
        addScore(40);
        state.m2.completed = true;
      }
      document.getElementById('m2-fb-icon').textContent = '🎉';
      document.getElementById('m2-fb-title').textContent = 'MISSION COMPLETE!';
      document.getElementById('m2-fb-title').style.color = 'var(--accent-green)';
      document.getElementById('m2-fb-desc').textContent = 'Logi berhasil sampai ke Bintang ⭐! (+40 Poin)';
      m2BtnNext.textContent = 'LANJUT MISI 3 →';
      m2Feedback.classList.remove('hidden');
    } else {
      showM2Fail('Logi belum sampai ke Bintang ⭐. Coba tambah atau perbaiki langkahmu!');
    }
  }

  function showM2Fail(msg) {
    document.getElementById('m2-fb-icon').textContent = '🤖';
    document.getElementById('m2-fb-title').textContent = 'LOGI TERSESTAT!';
    document.getElementById('m2-fb-title').style.color = 'var(--accent-red)';
    document.getElementById('m2-fb-desc').textContent = msg;
    m2BtnNext.textContent = 'COBA LAGI';
    m2Feedback.classList.remove('hidden');
  }

  m2BtnNext.addEventListener('click', () => {
    if (document.getElementById('m2-fb-title').textContent.includes('TERSESTAT')) {
      m2Feedback.classList.add('hidden');
      return;
    }
    setMission(3);
    renderMission3();
  });

  // ==========================================
  // 6. MISSION 03 ENGINE: TANGKAP BUG!
  // ==========================================
  const m3P1 = document.getElementById('m3-phase-1');
  const m3P2 = document.getElementById('m3-phase-2');
  const m3ScrambledList = document.getElementById('m3-scrambled-list');
  const m3P1Feedback = document.getElementById('m3-p1-feedback');
  const btnGotoP2 = document.getElementById('btn-goto-p2');
  
  const m3ReorderList = document.getElementById('m3-reorder-list');
  const btnCheckDebug = document.getElementById('btn-check-debug');
  const m3P2Feedback = document.getElementById('m3-p2-feedback');
  const btnShowResult = document.getElementById('btn-show-result');

  function renderMission3() {
    m3P1.classList.remove('hidden');
    m3P2.classList.add('hidden');
    m3P1Feedback.classList.add('hidden');
    m3P2Feedback.classList.add('hidden');

    // Phase 1 render
    m3ScrambledList.innerHTML = '';
    state.m3.scrambledSteps.forEach((step, idx) => {
      const card = document.createElement('div');
      card.className = 'step-card';
      card.innerHTML = `<span class="step-num">0${idx+1}</span> <span>${step.text}</span>`;
      card.addEventListener('click', () => handleP1BugClick(step));
      m3ScrambledList.appendChild(card);
    });
  }

  function handleP1BugClick(step) {
    if (step.isBug) {
      m3P1Feedback.classList.remove('hidden');
    } else {
      alert('Bukan langkah itu! Cari langkah mana yang paling tidak masuk akal dilakukan di awal.');
    }
  }

  btnGotoP2.addEventListener('click', () => {
    m3P1.classList.add('hidden');
    m3P2.classList.remove('hidden');
    renderP2Reorder();
  });

  function renderP2Reorder() {
    m3ReorderList.innerHTML = '';
    state.m3.reorderSteps.forEach((text, idx) => {
      const item = document.createElement('div');
      item.className = 'step-card';
      item.innerHTML = `
        <div>
          <span class="step-num">${idx + 1}</span>
          <span>${text}</span>
        </div>
        <div class="reorder-controls">
          <button class="btn-sm-up" data-index="${idx}">⬆️</button>
          <button class="btn-sm-down" data-index="${idx}">⬇️</button>
        </div>
      `;
      m3ReorderList.appendChild(item);
    });

    // Add reorder button handlers
    document.querySelectorAll('.btn-sm-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.dataset.index);
        if (i > 0) {
          const temp = state.m3.reorderSteps[i];
          state.m3.reorderSteps[i] = state.m3.reorderSteps[i - 1];
          state.m3.reorderSteps[i - 1] = temp;
          renderP2Reorder();
        }
      });
    });

    document.querySelectorAll('.btn-sm-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.dataset.index);
        if (i < state.m3.reorderSteps.length - 1) {
          const temp = state.m3.reorderSteps[i];
          state.m3.reorderSteps[i] = state.m3.reorderSteps[i + 1];
          state.m3.reorderSteps[i + 1] = temp;
          renderP2Reorder();
        }
      });
    });
  }

  btnCheckDebug.addEventListener('click', () => {
    const isCorrect = state.m3.reorderSteps.every((val, index) => val === state.m3.correctOrder[index]);
    if (isCorrect) {
      if (!state.m3.completed) {
        addScore(30);
        state.m3.completed = true;
      }
      m3P2Feedback.classList.remove('hidden');
    } else {
      alert('Urutan langkah masih belum tepat! Pikirkan: Piring dulu, lalu Roti, Oles Selai, baru Dimakan!');
    }
  });

  btnShowResult.addEventListener('click', () => {
    showScreen('result');
    document.getElementById('final-score-val').textContent = state.score;
  });

  // ==========================================
  // 7. MAIN NAVIGATION EVENT LISTENERS
  // ==========================================
  btnStart.addEventListener('click', () => {
    showScreen('mission');
    setMission(1);
    renderMission1();
  });

  btnRestart.addEventListener('click', () => {
    // Reset All State
    state.score = 0;
    state.currentMission = 1;
    state.m1.qIndex = 0;
    state.m2.completed = false;
    state.m3.completed = false;
    state.m3.reorderSteps = ['Makan roti', 'Ambil roti', 'Oleskan selai', 'Ambil piring'];

    scoreDisplay.textContent = '0';
    showScreen('start');
  });

});
