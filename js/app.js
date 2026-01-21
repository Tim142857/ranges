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
  CALL_VS_OPEN: "Check",
  LIMP_FOLD: "Check",
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
