/* ===============================
   Action ↔ Couleur (canonique)
================================ */

const actionColors = {
  CALL_VS_OPEN: "#eeee22",
  LIMP_FOLD: "#eded00",
  OPEN_FOLD: "#3085d1",
  CALL_VS_OPEN_SHOVE: "#0086f4",
  OPEN_CALL_RAISE_CALL_ALLIN: "#dd0000",
  THREE_BET_SIZE_VALUE: "#b134e2",
  ISO_ONE_THIRD_STACK: "#8224e3",
  ISO_SIZE_VALUE_CALL_ALLIN: "#db23c8",
  THREE_BET_ONE_THIRD_STACK: "#e825b7",
  LIMP_SHOVE: "#848484",
  LIMP_CALL_VS_RAISE_ALLIN: "#38a4e2",
  ISO_SIZE_FOLD_VS_RAISE: "#ce842f",
  OPEN_CALL_RAISE_FOLD_ALLIN: "#ddad00",
  OPEN_SHOVE: "#3ec94a",
  THREE_BET_ALLIN: "#77d633",
  ISO_ALLIN: "#38d161",
  CHECK: "#eded00"
};

/* ===============================
   Libellés FR (légende)
================================ */
const actionLabelsFr = {
  CALL_VS_OPEN: "Call vs Open",
  LIMP_FOLD: "Limp/Fold",
  OPEN_FOLD: "Open/Fold",
  CALL_VS_OPEN_SHOVE: "Call vs Open Shove",
  OPEN_CALL_RAISE_CALL_ALLIN: "Open/Call un raise/Call Allin",
  THREE_BET_SIZE_VALUE: "3 Bet Size en Value",
  ISO_ONE_THIRD_STACK: "Iso 1/3 stack",
  ISO_SIZE_VALUE_CALL_ALLIN: "Iso Size Value/Call Allin",
  THREE_BET_ONE_THIRD_STACK: "3bet 1/3 stack",
  LIMP_SHOVE: "Limp-Shove",
  LIMP_CALL_VS_RAISE_ALLIN: "Limp Call vs Raise et Allin",
  ISO_SIZE_FOLD_VS_RAISE: "Iso Size/Fold vs Raise",
  OPEN_CALL_RAISE_FOLD_ALLIN: "Open /call vs Raise / Fold vs Allin",
  OPEN_SHOVE: "Open Shove",
  THREE_BET_ALLIN: "3 Bet Allin",
  ISO_ALLIN: "Iso Allin",
  CHECK: "Check"
};

/* ===============================
   Grille 13×13
================================ */

const ranks = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];

function buildCombos() {
  const combos = [];
  for (let i = 0; i < ranks.length; i++) {
    for (let j = 0; j < ranks.length; j++) {
      if (i === j) combos.push(ranks[i] + ranks[j]);
      else if (i < j) combos.push(ranks[i] + ranks[j] + "s");
      else combos.push(ranks[j] + ranks[i] + "o");
    }
  }
  return combos;
}

const allCombos = buildCombos();

/* ===============================
   Rendering
================================ */

function renderRange(pRange) {
  const grid = document.getElementById("grid");
  const legend = document.getElementById("legend");
  const context = document.getElementById("context");

  grid.innerHTML = "";
  legend.innerHTML = "";

  context.innerHTML = `
    <span>${pRange.actionGroup}</span>
    <span>${pRange.position}</span>
    <span>${pRange.stackBb} BB</span>
  `;

  // Couleur des étiquettes de contexte = couleur du groupe
  if (context) {
    context.style.setProperty(
      "--header-color",
      typeof getGroupColor === "function" ? getGroupColor(pRange.actionGroup) : "#f2f2f2"
    );
  }

  const comboToAction = {};

  Object.entries(pRange.actions).forEach(([pAction, pCombos]) => {
    pCombos.forEach(pCombo => {
      comboToAction[pCombo] = pAction;
    });
  });

  allCombos.forEach(pCombo => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = pCombo;

    const action = comboToAction[pCombo];
    if (action && actionColors[action]) {
      cell.style.background = actionColors[action];
    }

    grid.appendChild(cell);
  });

  Object.entries(pRange.actions).forEach(([pAction]) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.style.background = actionColors[pAction] || "#000";
    item.textContent = actionLabelsFr[pAction] || pAction.replaceAll("_", " ");
    legend.appendChild(item);
  });
}

/* ===============================
   Sélecteur (UI) : groupes / positions / stacks
================================ */

const groupColors = {
  "Range d'ouverture 3W": "#e45c12",
  "Range de défense 3W vs open": "#5bc926",
  "Range de défense 3W vs limp": "#17b6d7",
  "3W call open shove": "#0c63d2",
  "Head's Up": "#e70041",
  "Head's up": "#e70041" // alias pour compatibilité
};

function normalizeKey(pValue) {
  return String(pValue || "").trim().toLowerCase();
}

function getGroupColor(pActionGroup) {
  const key = normalizeKey(pActionGroup);
  const found = Object.entries(groupColors).find(([k]) => normalizeKey(k) === key);
  return (found && found[1]) || "#888";
}

// Couleur de ligne (override pour certains groupes/positions)
const rowColorOverrides = {
  "head's up": {
    "bouton (sb)": "#e45c12",
    "bb vs open": "#5bc926",
    "bb vs limp": "#17b6d7",
    "call open shove (cos)": "#0c63d2"
  }
};

function getRowColor(pActionGroup, pPosition) {
  const gKey = normalizeKey(pActionGroup);
  const pKey = normalizeKey(pPosition);
  const override = rowColorOverrides[gKey];
  if (override && override[pKey]) return override[pKey];
  return getGroupColor(pActionGroup);
}

function buildRangeIndex(pRanges) {
  const index = new Map();
  pRanges.forEach(r => {
    const key = `${r.actionGroup}|${r.position}|${r.stackBb}`;
    index.set(key, r);
  });
  return index;
}

function buildSelector(pRanges, pOnSelect, pGetActiveKey) {
  const selector = document.getElementById("selector");
  if (!selector) return;
  selector.innerHTML = "";

  // Group -> Position -> stacks
  const groups = new Map();
  pRanges.forEach(r => {
    if (!groups.has(r.actionGroup)) groups.set(r.actionGroup, new Map());
    const positions = groups.get(r.actionGroup);
    if (!positions.has(r.position)) positions.set(r.position, new Set());
    positions.get(r.position).add(Number(r.stackBb));
  });

  // Colonnes gauche / droite comme sur le mockup
  const leftGroups = [
    "Range d'ouverture 3W",
    "Range de défense 3W vs open",
    "Range de défense 3W vs limp"
  ];
  const rightGroups = [
    "3W call open shove",
    "Head's Up"
  ];

  // Fonction pour trouver le nom exact du groupe (insensible à la casse)
  const findExactGroupName = (searchName) => {
    const searchKey = normalizeKey(searchName);
    for (const [exactName] of groups) {
      if (normalizeKey(exactName) === searchKey) return exactName;
    }
    return null;
  };

  const leftCol = document.createElement("div");
  leftCol.className = "sidebar-col sidebar-col--left";
  const rightCol = document.createElement("div");
  rightCol.className = "sidebar-col sidebar-col--right";

  selector.appendChild(leftCol);
  selector.appendChild(rightCol);

  // Set pour éviter les doublons
  const addedGroups = new Set();

  const appendGroupCard = (actionGroup, targetCol) => {
    // Éviter les doublons
    if (addedGroups.has(actionGroup)) return;
    addedGroups.add(actionGroup);
    
    const positions = groups.get(actionGroup);
    if (!positions) return;

    const card = document.createElement("div");
    card.className = "selector-card";
    card.style.setProperty("--group-color", getGroupColor(actionGroup));

    const title = document.createElement("div");
    title.className = "selector-card__title";
    title.textContent = actionGroup;
    card.appendChild(title);

    const body = document.createElement("div");
    body.className = "selector-card__body";

    // keep insertion order for positions as well
    positions.forEach((stacksSet, position) => {
      const row = document.createElement("div");
      row.className = "selector-row";
      row.style.setProperty("--group-color", getRowColor(actionGroup, position));
      // Bouton (SB) en heads up : forcer une seule ligne de boutons
      if (normalizeKey(actionGroup) === "head's up" && normalizeKey(position) === "bouton (sb)") {
        row.classList.add("no-wrap");
      }

      const label = document.createElement("div");
      label.className = "selector-row__label";
      label.textContent = position;
      row.appendChild(label);

      const buttons = document.createElement("div");
      buttons.className = "selector-row__buttons";

      const stacks = Array.from(stacksSet).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
      stacks.forEach(stackBb => {
        const btn = document.createElement("button");
        btn.className = "selector-btn";
        btn.type = "button";
        btn.textContent = String(stackBb);
        btn.dataset.key = `${actionGroup}|${position}|${stackBb}`;

        btn.addEventListener("click", () => {
          pOnSelect(btn.dataset.key);
          // refresh active styles
          updateActiveButtons(selector, pGetActiveKey());
        });

        buttons.appendChild(btn);
      });

      row.appendChild(buttons);
      body.appendChild(row);
    });

    card.appendChild(body);
    targetCol.appendChild(card);
  };

  // Ordre strict : gauche puis droite
  leftGroups.forEach(name => {
    const exactName = findExactGroupName(name);
    if (exactName) appendGroupCard(exactName, leftCol);
  });
  rightGroups.forEach(name => {
    const exactName = findExactGroupName(name);
    if (exactName) appendGroupCard(exactName, rightCol);
  });

  // Groupes éventuels non prévus → les ajouter à la suite à gauche
  groups.forEach((_, name) => {
    if (!leftGroups.includes(name) && !rightGroups.includes(name)) {
      appendGroupCard(name, leftCol);
    }
  });

  updateActiveButtons(selector, pGetActiveKey());
}

function updateActiveButtons(pRoot, pActiveKey) {
  const all = pRoot.querySelectorAll(".selector-btn");
  all.forEach(btn => {
    const isActive = btn.dataset.key === pActiveKey;
    btn.classList.toggle("is-active", isActive);
  });
}

/* ===============================
   Système d'onglets
================================ */

function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      // Désactiver tous les onglets
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      // Activer l'onglet sélectionné
      btn.classList.add("active");
      document.getElementById(`tab-${targetTab}`).classList.add("active");
    });
  });
}

/* ===============================
   Quiz
================================ */

let quizState = {
  currentRange: null,
  selectedCombos: new Set(),
  score: 0,
  correct: 0,
  wrong: 0,
  checked: false
};

function initQuiz() {
  const quizGrid = document.getElementById("quiz-grid");
  const quizNext = document.getElementById("quiz-next");
  const quizCheck = document.getElementById("quiz-check");
  const quizReset = document.getElementById("quiz-reset");

  // Générer la grille pour le quiz
  quizGrid.innerHTML = "";
  allCombos.forEach(pCombo => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = pCombo;
    cell.dataset.combo = pCombo;
    cell.addEventListener("click", () => {
      if (quizState.checked) return;
      toggleComboSelection(pCombo, cell);
    });
    quizGrid.appendChild(cell);
  });

  quizNext.addEventListener("click", () => {
    nextQuestion();
  });

  quizCheck.addEventListener("click", () => {
    checkAnswer();
  });

  quizReset.addEventListener("click", () => {
    resetQuiz();
  });

  // Première question
  nextQuestion();
}

function toggleComboSelection(pCombo, pCell) {
  if (quizState.selectedCombos.has(pCombo)) {
    quizState.selectedCombos.delete(pCombo);
    pCell.classList.remove("selected");
  } else {
    quizState.selectedCombos.add(pCombo);
    pCell.classList.add("selected");
  }
}

function nextQuestion() {
  if (!window.allRanges || !window.allRanges.length) return;

  // Sélectionner une range aléatoire
  const randomIndex = Math.floor(Math.random() * window.allRanges.length);
  quizState.currentRange = window.allRanges[randomIndex];
  quizState.selectedCombos.clear();
  quizState.checked = false;

  // Afficher la question avec le nouveau format
  const actions = Object.keys(quizState.currentRange.actions);
  const mainAction = actions.length > 0 ? actions[0] : "N/A";
  const actionLabel = actionLabelsFr[mainAction] || mainAction.replaceAll("_", " ");
  
  document.getElementById("quiz-action").textContent = actionLabel;
  document.getElementById("quiz-context").textContent = quizState.currentRange.actionGroup;
  document.getElementById("quiz-position").textContent = quizState.currentRange.position;
  document.getElementById("quiz-stack").textContent = `${quizState.currentRange.stackBb} BB`;

  // Réinitialiser la grille - toutes les cases blanches au début
  const cells = document.querySelectorAll("#quiz-grid .cell");
  cells.forEach(cell => {
    cell.classList.remove("selected", "correct", "incorrect", "missing");
    cell.style.background = "#ffffff";
  });

  // Réinitialiser le feedback
  const feedback = document.getElementById("quiz-feedback");
  feedback.textContent = "";
  feedback.className = "quiz-feedback hidden";

  // Activer/désactiver les boutons
  document.getElementById("quiz-check").disabled = false;
  document.getElementById("quiz-next").disabled = true;
}

function getComboAction(pCombo, pRange) {
  for (const [action, combos] of Object.entries(pRange.actions)) {
    if (combos.includes(pCombo)) {
      return action;
    }
  }
  return null;
}

function checkAnswer() {
  if (quizState.checked || !quizState.currentRange) return;

  quizState.checked = true;

  // Récupérer toutes les combos de la range
  const correctCombos = new Set();
  Object.values(quizState.currentRange.actions).forEach(combos => {
    combos.forEach(combo => correctCombos.add(combo));
  });

  // Comparer les sélections
  const selected = quizState.selectedCombos;
  const correct = new Set([...selected].filter(c => correctCombos.has(c)));
  const incorrect = new Set([...selected].filter(c => !correctCombos.has(c)));
  const missing = new Set([...correctCombos].filter(c => !selected.has(c)));

  // Mettre à jour l'affichage
  const cells = document.querySelectorAll("#quiz-grid .cell");
  cells.forEach(cell => {
    const combo = cell.dataset.combo;
    cell.classList.remove("selected", "correct", "incorrect", "missing");

    if (correct.has(combo)) {
      cell.classList.add("correct");
    } else if (incorrect.has(combo)) {
      cell.classList.add("incorrect");
    } else if (missing.has(combo)) {
      cell.classList.add("missing");
    }
  });

  // Calculer le score
  const totalCorrect = correctCombos.size;
  const selectedCorrect = correct.size;
  const selectedWrong = incorrect.size;
  const missed = missing.size;

  const accuracy = totalCorrect > 0 ? (selectedCorrect / totalCorrect) * 100 : 0;
  const penalty = selectedWrong * 0.1; // Pénalité pour les fausses sélections
  const finalScore = Math.max(0, Math.round(accuracy - penalty * 100));

  // Mettre à jour les stats
  if (selectedWrong === 0 && missing.size === 0) {
    quizState.correct++;
    quizState.score += finalScore;
  } else {
    quizState.wrong++;
  }

  updateQuizStats();

  // Afficher le feedback
  const feedback = document.getElementById("quiz-feedback");
  feedback.className = `quiz-feedback ${selectedWrong === 0 && missing.size === 0 ? "success" : "error"}`;
  
  let feedbackText = "";
  if (selectedWrong === 0 && missing.size === 0) {
    feedbackText = "✅ Parfait ! Vous avez trouvé toutes les mains correctement.";
  } else {
    feedbackText = `📊 Résultat :\n`;
    feedbackText += `✓ Correctes : ${selectedCorrect}/${totalCorrect}\n`;
    if (selectedWrong > 0) {
      feedbackText += `✗ Fausses sélections : ${selectedWrong}\n`;
    }
    if (missing.size > 0) {
      feedbackText += `⚠ Manquantes : ${missing.size}\n`;
    }
    feedbackText += `\nScore : ${finalScore}%`;
  }
  feedback.textContent = feedbackText;

  // Activer/désactiver les boutons
  document.getElementById("quiz-check").disabled = true;
  document.getElementById("quiz-next").disabled = false;
}

function updateQuizStats() {
  document.getElementById("quiz-score").textContent = quizState.score;
  document.getElementById("quiz-correct").textContent = quizState.correct;
  document.getElementById("quiz-wrong").textContent = quizState.wrong;
}

function resetQuiz() {
  quizState.score = 0;
  quizState.correct = 0;
  quizState.wrong = 0;
  updateQuizStats();
  nextQuestion();
}

/* ===============================
   Boot (sans serveur)
================================ */

if (!window.allRanges || !window.allRanges.length) {
  console.error("Aucune range chargée");
} else {
  console.log("Ranges chargées :", window.allRanges);
  const index = buildRangeIndex(window.allRanges);
  let activeKey = `${window.allRanges[0].actionGroup}|${window.allRanges[0].position}|${window.allRanges[0].stackBb}`;

  const selectByKey = (pKey) => {
    const r = index.get(pKey);
    if (!r) return;
    activeKey = pKey;
    renderRange(r);
  };

  buildSelector(
    window.allRanges,
    selectByKey,
    () => activeKey
  );

  selectByKey(activeKey);
}

/* ===============================
   Quiz d'actions
================================ */

let quizActionsState = {
  currentRange: null,
  currentHand: null,
  correctAction: null,
  selectedAction: null,
  score: 0,
  correct: 0,
  wrong: 0,
  checked: false
};

function initQuizActions() {
  const quizNext = document.getElementById("quiz-actions-next");
  const quizReset = document.getElementById("quiz-actions-reset");

  quizNext.addEventListener("click", () => {
    nextQuestionActions();
  });

  quizReset.addEventListener("click", () => {
    resetQuizActions();
  });

  // Première question
  nextQuestionActions();
}

function nextQuestionActions() {
  if (!window.allRanges || !window.allRanges.length) return;

  // Sélectionner une range aléatoire qui a au moins une action avec des combos
  let validRanges = window.allRanges.filter(r => {
    const actions = Object.values(r.actions);
    return actions.some(combos => combos.length > 0);
  });

  if (validRanges.length === 0) return;

  const randomIndex = Math.floor(Math.random() * validRanges.length);
  quizActionsState.currentRange = validRanges[randomIndex];
  quizActionsState.checked = false;
  quizActionsState.selectedAction = null;

  // Sélectionner une main aléatoire dans cette range
  const allCombosInRange = [];
  Object.entries(quizActionsState.currentRange.actions).forEach(([action, combos]) => {
    combos.forEach(combo => {
      allCombosInRange.push({ combo, action });
    });
  });

  if (allCombosInRange.length === 0) {
    nextQuestionActions(); // Réessayer si pas de combos
    return;
  }

  const randomComboIndex = Math.floor(Math.random() * allCombosInRange.length);
  const selected = allCombosInRange[randomComboIndex];
  quizActionsState.currentHand = selected.combo;
  quizActionsState.correctAction = selected.action;

  // Afficher sur la table de poker
  displayPokerTable();

  // Générer les options d'actions (la bonne + 3 fausses)
  const allActions = Object.keys(actionLabelsFr);
  const wrongActions = allActions.filter(a => a !== quizActionsState.correctAction);
  
  // Mélanger et prendre 3 fausses actions
  const shuffled = wrongActions.sort(() => Math.random() - 0.5);
  const selectedWrongActions = shuffled.slice(0, Math.min(3, shuffled.length));
  
  // Créer la liste des options (bonne + fausses) et mélanger
  const options = [quizActionsState.correctAction, ...selectedWrongActions].sort(() => Math.random() - 0.5);

  // Afficher les options
  const optionsContainer = document.getElementById("quiz-actions-options");
  optionsContainer.innerHTML = "";
  options.forEach(action => {
    const option = document.createElement("button");
    option.className = "quiz-action-option";
    option.type = "button";
    option.textContent = actionLabelsFr[action] || action.replaceAll("_", " ");
    option.dataset.action = action;
    
    option.addEventListener("click", () => {
      if (quizActionsState.checked) return;
      selectActionOption(action, option);
    });
    
    optionsContainer.appendChild(option);
  });

  // Réinitialiser le feedback
  const feedback = document.getElementById("quiz-actions-feedback");
  feedback.textContent = "";
  feedback.className = "quiz-feedback hidden";
}

function selectActionOption(pAction, pElement) {
  if (quizActionsState.checked) return;

  // Désélectionner toutes les options
  document.querySelectorAll(".quiz-action-option").forEach(opt => {
    opt.classList.remove("selected");
  });

  // Sélectionner l'option cliquée
  quizActionsState.selectedAction = pAction;
  pElement.classList.add("selected");

  // Vérifier automatiquement après sélection
  setTimeout(() => {
    checkAnswerActions();
  }, 300);
}

function checkAnswerActions() {
  if (quizActionsState.checked || !quizActionsState.selectedAction) return;

  quizActionsState.checked = true;

  const isCorrect = quizActionsState.selectedAction === quizActionsState.correctAction;

  // Mettre à jour les stats
  if (isCorrect) {
    quizActionsState.correct++;
    quizActionsState.score += 10;
  } else {
    quizActionsState.wrong++;
  }

  updateQuizActionsStats();

  // Mettre à jour l'affichage des options
  document.querySelectorAll(".quiz-action-option").forEach(option => {
    option.disabled = true;
    const action = option.dataset.action;
    
    if (action === quizActionsState.correctAction) {
      option.classList.add("correct");
    } else if (action === quizActionsState.selectedAction && !isCorrect) {
      option.classList.add("incorrect");
    }
  });

  // Afficher le feedback
  const feedback = document.getElementById("quiz-actions-feedback");
  feedback.className = `quiz-feedback ${isCorrect ? "success" : "error"}`;
  
  if (isCorrect) {
    feedback.textContent = "✅ Correct ! Cette main correspond bien à l'action " + actionLabelsFr[quizActionsState.correctAction] + ".";
  } else {
    feedback.textContent = `❌ Faux. La bonne réponse était : ${actionLabelsFr[quizActionsState.correctAction]}.`;
  }
}

function updateQuizActionsStats() {
  document.getElementById("quiz-actions-score").textContent = quizActionsState.score;
  document.getElementById("quiz-actions-correct").textContent = quizActionsState.correct;
  document.getElementById("quiz-actions-wrong").textContent = quizActionsState.wrong;
}

function displayPokerTable() {
  const position = quizActionsState.currentRange.position;
  const stack = quizActionsState.currentRange.stackBb;
  const hand = quizActionsState.currentHand;
  const context = quizActionsState.currentRange.actionGroup;

  // Déterminer si c'est Head's up (2 joueurs) ou 3W (3 joueurs)
  const isHeadsUp = context.toLowerCase().includes("head") || context.toLowerCase().includes("head's");
  const numPlayers = isHeadsUp ? 2 : 3;

  // Réinitialiser tous les sièges
  document.querySelectorAll(".poker-seat").forEach(seat => {
    seat.classList.remove("active");
    seat.style.display = "none";
    seat.style.position = "absolute";
    const cardsEl = seat.querySelector(".seat-cards");
    if (cardsEl) cardsEl.innerHTML = "";
    const stackEl = seat.querySelector(".seat-stack");
    if (stackEl) stackEl.textContent = "";
    // Réinitialiser le label
    const labelEl = seat.querySelector(".seat-label");
    if (labelEl && seat.id === "seat-btn") {
      labelEl.textContent = "BTN";
    }
  });

  // Le joueur est toujours en BB (bas milieu)
  const playerSeat = document.getElementById("seat-bb");
  playerSeat.classList.add("active");
  playerSeat.style.display = "block";
  playerSeat.style.bottom = "20px";
  playerSeat.style.left = "50%";
  playerSeat.style.transform = "translateX(-50%)";

  // Afficher le stack du joueur
  const stackEl = playerSeat.querySelector(".seat-stack");
  stackEl.textContent = `${stack} BB`;

  // Afficher le contexte
  const contextEl = playerSeat.querySelector(".seat-context");
  if (contextEl) {
    contextEl.textContent = context;
  }

  // Afficher les cartes du joueur
  const cardsEl = playerSeat.querySelector(".seat-cards");
  cardsEl.innerHTML = "";
  
  // Parser la main (ex: "AA", "AKs", "AKo")
  const cards = parseHand(hand);
  cards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.className = "poker-card";
    
    // Couleur rouge pour cœur et carreau
    if (card.suit === "♥" || card.suit === "♦") {
      cardEl.classList.add("red");
    } else {
      cardEl.classList.add("black");
    }
    
    // Afficher le rang en haut et la couleur en bas
    const rankEl = document.createElement("div");
    rankEl.style.fontSize = "20px";
    rankEl.style.fontWeight = "900";
    rankEl.textContent = card.rank;
    cardEl.appendChild(rankEl);
    
    const suitEl = document.createElement("div");
    suitEl.style.fontSize = "24px";
    suitEl.textContent = card.suit;
    cardEl.appendChild(suitEl);
    
    cardsEl.appendChild(cardEl);
  });

  if (numPlayers === 3) {
    // 3 joueurs : BTN (haut), SB (bas gauche), BB (bas milieu - joueur)
    const btnSeat = document.getElementById("seat-btn");
    btnSeat.style.display = "block";
    btnSeat.style.top = "20px";
    btnSeat.style.left = "50%";
    btnSeat.style.transform = "translateX(-50%)";
    btnSeat.querySelector(".seat-label").textContent = "BTN";
    
    const sbSeat = document.getElementById("seat-sb");
    sbSeat.style.display = "block";
    sbSeat.style.bottom = "20px";
    sbSeat.style.left = "20px";
    sbSeat.style.transform = "none";
    
    // Stacks des autres joueurs
    const randomStack1 = Math.floor(Math.random() * 50) + 10;
    btnSeat.querySelector(".seat-stack").textContent = `${randomStack1} BB`;
    
    const randomStack2 = Math.floor(Math.random() * 50) + 10;
    sbSeat.querySelector(".seat-stack").textContent = `${randomStack2} BB`;
  } else {
    // 2 joueurs : BTN/SB (bas gauche), BB (bas milieu - joueur)
    const btnSeat = document.getElementById("seat-btn");
    btnSeat.style.display = "block";
    btnSeat.style.bottom = "20px";
    btnSeat.style.left = "20px";
    btnSeat.style.transform = "none";
    btnSeat.querySelector(".seat-label").textContent = "BTN(SB)";
    
    // Stack de l'autre joueur
    const randomStack = Math.floor(Math.random() * 50) + 10;
    btnSeat.querySelector(".seat-stack").textContent = `${randomStack} BB`;
    
    // Cacher SB
    document.getElementById("seat-sb").style.display = "none";
  }
}

function parseHand(pHand) {
  // Parser les mains de poker (ex: "AA", "AKs", "AKo", "A2s")
  const cards = [];
  
  if (pHand.length === 2) {
    // Paire (ex: "AA", "KK")
    const rank = pHand[0];
    cards.push({ rank: rank, suit: "♠" });
    cards.push({ rank: rank, suit: "♥" });
  } else if (pHand.length === 3) {
    // Main avec suit (ex: "AKs", "A2s", "AKo")
    const rank1 = pHand[0];
    const rank2 = pHand[1];
    const suitType = pHand[2]; // "s" pour suited, "o" pour offsuit
    
    if (suitType === "s") {
      // Suited - même couleur
      cards.push({ rank: rank1, suit: "♠" });
      cards.push({ rank: rank2, suit: "♠" });
    } else {
      // Offsuit - couleurs différentes
      cards.push({ rank: rank1, suit: "♠" });
      cards.push({ rank: rank2, suit: "♥" });
    }
  }
  
  return cards;
}

function resetQuizActions() {
  quizActionsState.score = 0;
  quizActionsState.correct = 0;
  quizActionsState.wrong = 0;
  updateQuizActionsStats();
  nextQuestionActions();
}

// Initialiser les onglets et les quiz
initTabs();
initQuiz();
initQuizActions();