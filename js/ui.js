let activeFight = null;

const monsterQuotes = {
  "NullPointer Wraith": [
    "I haunt the place where your value should be.",
    "You cannot catch what was never there...",
  ],
  "Typo Bat": [
    "One tiny typo can darken the whole night.",
    "I hide between the letters you forgot to check.",
  ],
  "Tiny Pumpkin Imp": [
    "Trick or treat? Better read the issue first.",
    "I may be small, but my TODO list is endless.",
  ],
  "Feature Golem": [
    "My new powers are still under construction.",
    "Every request makes me grow stronger.",
  ],
  "Lag Zombie": [
    "Sloooowly, your response time will be mine.",
    "Wait... wait... I am almost there...",
  ],
  "Vampire Leak": [
    "I drink secrets one exposed token at a time.",
    "Your credentials look delicious tonight.",
  ],
  "Flaky Test Skeleton": [
    "I passed yesterday. Perhaps I will today.",
    "Run me again... if you dare.",
  ],
  "Merge Conflict Demon": [
    "Choose a side, then try to resolve me.",
    "Two branches enter. One truth leaves.",
  ],
  "Unknown Spirit": [
    "You should not have opened this issue...",
    "I have been waiting in the backlog for you.",
  ],
};

function shortIssueDescription(body) {
  const description = String(body || "").replace(/\s+/g, " ").trim();

  if (!description) {
    return "No description was left with this issue. The silence is unsettling.";
  }

  return description.length > 190 ? `${description.slice(0, 187).trimEnd()}…` : description;
}

function findIssueForCard(card) {
  if (!card) {
    return null;
  }

  const numberLabel = card.querySelector(".monster-issue-number");
  const match = numberLabel?.textContent.match(/#(\d+)/);
  const issues = typeof currentIssues === "undefined" ? [] : currentIssues;

  if (!match) {
    return null;
  }

  return issues.find((issue) => String(issue.number) === match[1]) || null;
}

function getMonsterLine(monster, hitCount = 0, defeated = false) {
  if (defeated) {
    return `${monster.name} has already been banished from this repository.`;
  }

  const lines = monsterQuotes[monster.name] || monsterQuotes["Unknown Spirit"];
  return lines[hitCount % lines.length];
}

function getIssueLabels(issue) {
  if (Array.isArray(issue.labels)) {
    return issue.labels.map((label) => String(label?.name || label || "").toLowerCase());
  }

  return issue.labels ? [String(issue.labels).toLowerCase()] : [];
}

function getFirstHint(issue) {
  const labels = getIssueLabels(issue);

  if (labels.some((label) => label.includes("bug"))) {
    return "Try to reproduce the problem first.";
  }
  if (labels.some((label) => /security|vulnerab/.test(label))) {
    return "Trace how sensitive data is handled and check the access rules.";
  }
  if (labels.some((label) => /performance|slow/.test(label))) {
    return "Measure the slow path before changing the code.";
  }
  if (labels.some((label) => /documentation|docs|readme|typo/.test(label))) {
    return "Find the related docs section and check what is out of date.";
  }
  if (labels.some((label) => /test|ci/.test(label))) {
    return "Run the related test first, then isolate the failing case.";
  }
  if (labels.some((label) => /feature|enhancement/.test(label))) {
    return "Look for the component that owns this feature before adding to it.";
  }

  return "Follow the issue label to the part of the codebase it describes.";
}

function getIssueKeywords(title) {
  const stopWords = new Set([
    "the", "and", "for", "with", "from", "when", "this", "that", "into",
    "some", "have", "has", "are", "was", "were", "how", "why", "what",
    "where", "issue", "bug", "fix", "please",
  ]);
  const words = String(title || "").toLowerCase().match(/[a-z0-9]+/g) || [];
  const keywords = [...new Set(words.filter((word) => word.length > 2 && !stopWords.has(word)))].slice(0, 4);

  return keywords.length ? keywords : [...new Set(words)].slice(0, 4);
}

function getCodeSearchUrl(issue, keywords) {
  if (!keywords.length) {
    return "";
  }

  try {
    const issueUrl = new URL(issue.url || issue.html_url);
    if (issueUrl.hostname !== "github.com") {
      return "";
    }

    const [owner, repo] = issueUrl.pathname.split("/").filter(Boolean);
    if (!owner || !repo) {
      return "";
    }

    return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/search?q=${encodeURIComponent(keywords.join(" "))}&type=code`;
  } catch {
    return "";
  }
}

function openFightScreen(issue) {
  if (!issue) {
    return;
  }

  const monster = issueToMonster(issue);
  const alreadyDefeated = gameState.defeated.includes(getIssueId(issue));
  const initialHintLevel = getHintLevel(issue);
  const maxHp = 100;
  const fightScreen = document.getElementById("fight-screen");
  let fightCard = fightScreen.querySelector(".fight-card, .placeholder-card");

  if (!fightCard) {
    fightCard = document.createElement("div");
    fightScreen.replaceChildren(fightCard);
  }

  fightCard.className = "fight-card";
  fightCard.replaceChildren();
  activeFight = {
    issue,
    monster,
    hp: alreadyDefeated ? 0 : maxHp,
    maxHp,
    hits: 0,
    hintLevel: initialHintLevel,
    defeated: alreadyDefeated,
  };

  const kicker = document.createElement("p");
  kicker.className = "fight-kicker";
  kicker.textContent = "STAGE 02 · MONSTER ENCOUNTER";

  const fightGrid = document.createElement("div");
  fightGrid.className = "fight-grid";

  const visual = document.createElement("div");
  visual.className = "fight-visual";
  visual.setAttribute("role", "img");
  visual.setAttribute("aria-label", monster.name);

  const monsterEmoji = document.createElement("span");
  monsterEmoji.className = `fight-monster-emoji${alreadyDefeated ? " is-banished" : ""}`;
  monsterEmoji.setAttribute("aria-hidden", "true");
  monsterEmoji.textContent = monster.emoji;
  visual.appendChild(monsterEmoji);

  const details = document.createElement("div");
  details.className = "fight-details";

  const name = document.createElement("h2");
  name.id = "fight-title";
  name.className = "fight-monster-name";
  name.textContent = monster.name;

  const level = document.createElement("span");
  level.className = "fight-level";
  level.textContent = `LEVEL ${monster.level}`;

  const issueTitle = document.createElement("h3");
  issueTitle.className = "fight-issue-title";
  issueTitle.textContent = issue.title || "Untitled issue";

  const description = document.createElement("p");
  description.className = "fight-description";
  description.textContent = shortIssueDescription(issue.body);

  const issueLink = document.createElement("a");
  issueLink.className = "fight-issue-link";
  issueLink.textContent = "View issue on GitHub ↗";
  issueLink.href = issue.url || issue.html_url || "#";
  issueLink.target = "_blank";
  issueLink.rel = "noopener noreferrer";
  issueLink.hidden = !issue.url && !issue.html_url;

  const hpPanel = document.createElement("div");
  hpPanel.className = "fight-hp-panel";

  const hpLabels = document.createElement("div");
  hpLabels.className = "fight-hp-labels";

  const hpLabel = document.createElement("span");
  hpLabel.textContent = "MONSTER HP";

  const hpValue = document.createElement("span");
  hpValue.className = "fight-hp-value";
  hpValue.textContent = `${activeFight.hp} / ${maxHp}`;

  const hpBar = document.createElement("progress");
  hpBar.className = "fight-hp-bar";
  hpBar.max = maxHp;
  hpBar.value = activeFight.hp;
  hpBar.setAttribute("aria-label", `${monster.name} health`);

  hpLabels.append(hpLabel, hpValue);
  hpPanel.append(hpLabels, hpBar);

  const xpReward = document.createElement("p");
  xpReward.className = "fight-xp-reward";

  function updateXpReward() {
    if (activeFight.defeated) {
      xpReward.textContent = "XP REWARD: CLAIMED";
      return;
    }

    const multiplier = Math.round(getXpMultiplier(getHintLevel(issue)) * 100);
    xpReward.textContent = `CURRENT XP REWARD: +${getXpReward(issue, monster)} XP · ${multiplier}%`;
  }

  updateXpReward();
  details.append(name, level, issueTitle, description, issueLink, hpPanel, xpReward);
  fightGrid.append(visual, details);

  const dialogue = document.createElement("div");
  dialogue.className = "monster-dialogue";
  dialogue.setAttribute("role", "status");
  dialogue.setAttribute("aria-live", "polite");

  const dialogueLabel = document.createElement("span");
  dialogueLabel.className = "dialogue-label";
  dialogueLabel.textContent = `${monster.name} says:`;

  const dialogueText = document.createElement("p");
  dialogueText.className = "dialogue-text";
  dialogueText.textContent = getMonsterLine(monster, 0, alreadyDefeated);
  dialogue.append(dialogueLabel, dialogueText);

  const hintSection = document.createElement("section");
  hintSection.className = "fight-hints";
  hintSection.setAttribute("aria-labelledby", "fight-hints-title");

  const hintHeading = document.createElement("h3");
  hintHeading.id = "fight-hints-title";
  hintHeading.className = "fight-hints-title";
  hintHeading.textContent = "NEED A CLUE?";

  const hintButtons = document.createElement("div");
  hintButtons.className = "fight-hint-buttons";

  const hintStatus = document.createElement("p");
  hintStatus.className = "fight-hint-status";

  const hintOutput = document.createElement("div");
  hintOutput.className = "fight-hint-output";
  hintOutput.setAttribute("role", "status");
  hintOutput.setAttribute("aria-live", "polite");

  function updateHintStatus(level) {
    hintStatus.textContent = level
      ? `Highest hint used: Hint ${level}`
      : "Highest hint used: none. Hints 2 and 3 reduce XP.";
  }

  function renderHint(level) {
    hintOutput.replaceChildren();
    const hintText = document.createElement("p");
    hintText.className = "fight-hint-text";

    if (level === 1) {
      hintText.textContent = getFirstHint(issue);
      hintOutput.appendChild(hintText);
      return;
    }

    if (level === 2) {
      const keywords = getIssueKeywords(issue.title);
      hintText.textContent = `Search these issue-title keywords in the repo: ${keywords.join(", ") || "issue"}.`;
      hintOutput.appendChild(hintText);

      const searchUrl = getCodeSearchUrl(issue, keywords.length ? keywords : ["issue"]);
      if (searchUrl) {
        const searchLink = document.createElement("a");
        searchLink.className = "fight-code-search-link";
        searchLink.href = searchUrl;
        searchLink.target = "_blank";
        searchLink.rel = "noopener noreferrer";
        searchLink.textContent = "Search GitHub code ↗";
        hintOutput.appendChild(searchLink);
      }
      return;
    }

    hintText.textContent = "AI patch coming soon";
    hintOutput.appendChild(hintText);
  }

  const hintChoices = [
    { level: 1, label: "Hint 1" },
    { level: 2, label: "Hint 2" },
    { level: 3, label: "Hint 3 (AI patch)" },
  ];

  hintChoices.forEach(({ level, label }) => {
    const hintButton = document.createElement("button");
    hintButton.className = "fight-hint-button";
    hintButton.type = "button";
    hintButton.textContent = label;
    hintButton.disabled = alreadyDefeated;
    hintButton.setAttribute("aria-pressed", String(level === initialHintLevel));
    hintButton.addEventListener("click", () => {
      const highestHint = recordHintUsed(issue, level);
      activeFight.hintLevel = highestHint;
      updateHintStatus(highestHint);
      updateXpReward();
      renderHint(level);
      hintChoices.forEach(({ level: choiceLevel }, index) => {
        hintButtons.children[index].setAttribute("aria-pressed", String(choiceLevel === level));
      });
    });
    hintButtons.appendChild(hintButton);
  });

  updateHintStatus(initialHintLevel);
  if (initialHintLevel) {
    renderHint(initialHintLevel);
  } else {
    hintOutput.textContent = "Choose a hint to reveal a clue.";
  }

  hintSection.append(hintHeading, hintButtons, hintStatus, hintOutput);

  const actions = document.createElement("div");
  actions.className = "fight-actions";

  const attackButton = document.createElement("button");
  attackButton.className = "primary-button fight-attack";
  attackButton.type = "button";
  attackButton.disabled = alreadyDefeated;
  attackButton.textContent = alreadyDefeated ? "ALREADY DEFEATED" : "HIT THE MONSTER";

  const backButton = document.createElement("button");
  backButton.className = "secondary-button fight-back";
  backButton.type = "button";
  backButton.textContent = "← Back to map";

  attackButton.addEventListener("click", () => {
    if (!activeFight || activeFight.defeated) {
      return;
    }

    activeFight.hp = Math.max(0, activeFight.hp - 34);
    activeFight.hits += 1;
    hpBar.value = activeFight.hp;
    hpValue.textContent = `${activeFight.hp} / ${maxHp}`;
    monsterEmoji.classList.remove("is-hit");
    void monsterEmoji.offsetWidth;
    monsterEmoji.classList.add("is-hit");

    if (activeFight.hp === 0) {
      activeFight.defeated = true;
      const earnedXp = defeatMonster(issue, monster);
      monsterEmoji.classList.add("is-banished");
      attackButton.disabled = true;
      attackButton.textContent = earnedXp ? "MONSTER DEFEATED" : "ALREADY DEFEATED";
      updateXpReward();
      hintButtons.querySelectorAll("button").forEach((button) => {
        button.disabled = true;
      });
      dialogueText.textContent = earnedXp
        ? `${monster.name} fades into the dark. You earned ${earnedXp} XP.`
        : `${monster.name} has already been banished from this repository.`;
    } else {
      dialogueText.textContent = getMonsterLine(monster, activeFight.hits);
    }
  });

  backButton.addEventListener("click", () => {
    const issues = typeof currentIssues === "undefined" ? [] : currentIssues;
    const copy = document.getElementById("dungeon-copy");
    const sections = document.getElementById("level-sections");

    if (copy && sections && typeof renderDungeonIssues === "function") {
      renderDungeonIssues(issues, copy, sections);
    }

    showScreen("dungeon");
  });

  actions.append(attackButton, backButton);
  fightCard.append(kicker, fightGrid, dialogue, hintSection, actions);
  showScreen("fight");
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".defeat-button")) {
    return;
  }

  const monsterCard = event.target.closest(".monster-card");

  if (monsterCard) {
    openFightScreen(findIssueForCard(monsterCard));
    return;
  }

  if (event.target.closest('[data-screen-target="fight"]')) {
    const firstAvailableCard = document.querySelector(
      ".level-section:not(.is-locked) .monster-card:not(.is-defeated)"
    ) || document.querySelector(".level-section:not(.is-locked) .monster-card");
    openFightScreen(findIssueForCard(firstAvailableCard));
  }
});
