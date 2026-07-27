/**
 * MISI LOGIKA — WEBSITE 02 (MINI LEARNING BOOK)
 * Interaction Engine & Scene Navigator
 */

document.addEventListener('DOMContentLoaded', () => {
  

  // ==========================================
  // 0. CUSTOM TOAST NOTIFICATION (replaces alert)
  // ==========================================
  const toastContainer = document.getElementById('toast-container');

  function showToast(message, type = 'wrong') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-hide');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3200);
  }

  // ==========================================
  // 1. STATE & SCENE MANAGEMENT
  // ==========================================
  let currentScene = 1;
  let currentSubPane = '3a';
  const subPaneOrder = ['3a', '3b', '3c', '3d', '3e'];

  const scenes = {
    1: document.getElementById('scene-1'),
    2: document.getElementById('scene-2'),
    3: document.getElementById('scene-3'),
    4: document.getElementById('scene-4')
  };

  const currentSceneNum = document.getElementById('current-scene-num');
  const materiProgress = document.getElementById('materi-progress');

  function showScene(sceneNum) {
    currentScene = sceneNum;
    currentSceneNum.textContent = `0${sceneNum}`;
    materiProgress.style.width = `${sceneNum * 25}%`;

    Object.keys(scenes).forEach(key => {
      if (parseInt(key) === sceneNum) {
        scenes[key].classList.remove('hidden');
        scenes[key].classList.add('active');
      } else {
        scenes[key].classList.add('hidden');
        scenes[key].classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================
  // 2. SCENE NAVIGATION LISTENERS
  // ==========================================
  document.getElementById('btn-goto-s2').addEventListener('click', () => showScene(2));
  document.getElementById('btn-goto-s3').addEventListener('click', () => {
    showScene(3);
    showSubPane('3a');
  });

  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentScene > 1) showScene(currentScene - 1);
    });
  });

  // ==========================================
  // 3. SCENE 02 INTERACTION (BERPIKIR LOGIS)
  // ==========================================
  const logicOptions = document.querySelectorAll('#logic-options .choice-btn');
  const logicFeedback = document.getElementById('logic-feedback');

  logicOptions.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const choice = e.currentTarget.dataset.choice;
      if (choice === 'umbrella') {
        logicOptions.forEach(b => b.classList.remove('selected-correct'));
        e.currentTarget.classList.add('selected-correct');
        logicFeedback.classList.remove('hidden');
      } else {
        showToast('Coba pikirkan lagi: Kalau hujan deras di luar, kacamata hitam atau es krim tidak bisa melindungimu dari basah kuyup!');
      }
    });
  });

  // ==========================================
  // 4. SCENE 03 SUBPANES CONTROLLER
  // ==========================================
  const tabBtns = document.querySelectorAll('.subtabs-bar .tab-btn');
  const subPanes = {
    '3a': document.getElementById('sub-3a'),
    '3b': document.getElementById('sub-3b'),
    '3c': document.getElementById('sub-3c'),
    '3d': document.getElementById('sub-3d'),
    '3e': document.getElementById('sub-3e')
  };

  const btnPrevSub = document.getElementById('btn-prev-sub');
  const btnNextSub = document.getElementById('btn-next-sub');

  function showSubPane(paneId) {
    currentSubPane = paneId;
    
    // Update Tab Buttons
    tabBtns.forEach(btn => {
      if (btn.dataset.sub === paneId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Subpanes
    Object.keys(subPanes).forEach(key => {
      if (key === paneId) {
        subPanes[key].classList.remove('hidden');
        subPanes[key].classList.add('active');
      } else {
        subPanes[key].classList.add('hidden');
        subPanes[key].classList.remove('active');
      }
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      showSubPane(e.currentTarget.dataset.sub);
    });
  });

  btnPrevSub.addEventListener('click', () => {
    const idx = subPaneOrder.indexOf(currentSubPane);
    if (idx > 0) {
      showSubPane(subPaneOrder[idx - 1]);
    } else {
      showScene(2);
    }
  });

  btnNextSub.addEventListener('click', () => {
    const idx = subPaneOrder.indexOf(currentSubPane);
    if (idx < subPaneOrder.length - 1) {
      showSubPane(subPaneOrder[idx + 1]);
    } else {
      showScene(4);
    }
  });

  // ------------------------------------------
  // 3A. Decomposition Interactive Tree
  // ------------------------------------------
  const btnRevealTree = document.getElementById('btn-reveal-tree');
  const treeBranches = document.getElementById('tree-branches');
  
  btnRevealTree.addEventListener('click', () => {
    treeBranches.classList.toggle('hidden');
  });

  // ------------------------------------------
  // 3B. Pattern Recognition
  // ------------------------------------------
  const patternChoices = document.querySelectorAll('#pattern-choices .choice-btn');
  const patternFb = document.getElementById('pattern-fb');

  patternChoices.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = e.currentTarget.dataset.pattern;
      if (p === 'moon') {
        patternFb.classList.remove('hidden');
      } else {
        showToast('Coba lihat lagi polanya: ⭐ 🌙 ⭐ 🌙 ⭐ ... Setelah bintang, bentuk apa yang muncul?');
      }
    });
  });

  // ------------------------------------------
  // 3C. Abstraction Selection
  // ------------------------------------------
  const absBtns = document.querySelectorAll('.abs-btn');
  const absFb = document.getElementById('abs-fb');
  const selectedAbs = new Set();

  absBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (selectedAbs.has(id)) {
        selectedAbs.delete(id);
        e.currentTarget.classList.remove('selected');
      } else {
        selectedAbs.add(id);
        e.currentTarget.classList.add('selected');
      }

      // Check if user selected home, school, and road
      if (selectedAbs.has('home') && selectedAbs.has('school') && !selectedAbs.has('cat') && !selectedAbs.has('cloud')) {
        absFb.classList.remove('hidden');
      }
    });
  });

  // ------------------------------------------
  // 3D. Algorithm Step Ordering
  // ------------------------------------------
  const algoSteps = [
    'Ambil Gelas',
    'Masukkan Susu',
    'Tuang Air',
    'Aduk'
  ];
  let currentAlgoSteps = ['Aduk', 'Ambil Gelas', 'Masukkan Susu', 'Tuang Air'];

  const algoReorderList = document.getElementById('algo-reorder-list');
  const btnCheckAlgo = document.getElementById('btn-check-algo');
  const algoFb = document.getElementById('algo-fb');

  function renderAlgoReorder() {
    algoReorderList.innerHTML = '';
    currentAlgoSteps.forEach((text, idx) => {
      const card = document.createElement('div');
      card.className = 'step-card';
      card.innerHTML = `
        <div>
          <span class="step-num">${idx + 1}</span>
          <span>${text}</span>
        </div>
        <div class="reorder-controls">
          <button class="btn-sm-up" data-index="${idx}">⬆️</button>
          <button class="btn-sm-down" data-index="${idx}">⬇️</button>
        </div>
      `;
      algoReorderList.appendChild(card);
    });

    document.querySelectorAll('.btn-sm-up').forEach(b => {
      b.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.dataset.index);
        if (i > 0) {
          const temp = currentAlgoSteps[i];
          currentAlgoSteps[i] = currentAlgoSteps[i - 1];
          currentAlgoSteps[i - 1] = temp;
          renderAlgoReorder();
        }
      });
    });

    document.querySelectorAll('.btn-sm-down').forEach(b => {
      b.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.dataset.index);
        if (i < currentAlgoSteps.length - 1) {
          const temp = currentAlgoSteps[i];
          currentAlgoSteps[i] = currentAlgoSteps[i + 1];
          currentAlgoSteps[i + 1] = temp;
          renderAlgoReorder();
        }
      });
    });
  }

  renderAlgoReorder();

  btnCheckAlgo.addEventListener('click', () => {
    const isCorrect = currentAlgoSteps.every((val, idx) => val === algoSteps[idx]);
    if (isCorrect) {
      algoFb.classList.remove('hidden');
    } else {
      showToast('Urutan langkah membuat susu belum pas! Pikirkan: Ambil gelas dulu ➔ Masukkan susu ➔ Tuang air ➔ Aduk!');
    }
  });

  // ------------------------------------------
  // 3E. Debugging Option Click
  // ------------------------------------------
  const debugOpts = document.querySelectorAll('.debug-opt');
  const debugFb = document.getElementById('debug-fb');

  debugOpts.forEach(opt => {
    opt.addEventListener('click', (e) => {
      const isBug = e.currentTarget.dataset.bug === 'true';
      if (isBug) {
        debugFb.classList.remove('hidden');
      } else {
        showToast('Bukan langkah ini! Cari langkah mana yang mustahil dilakukan di awal.');
      }
    });
  });

});
