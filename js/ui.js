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

function openFightScreen(issue) {
  if (!issue) {
    return;
  }

  const monster = issueToMonster(issue);
  const alreadyDefeated = gameState.defeated.includes(getIssueId(issue));
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
  details.append(name, level, issueTitle, description, issueLink, hpPanel);
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
      dialogueText.textContent = earnedXp
        ? `${monster.name} fades into the dark. You earned ${monster.xp} XP.`
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
  fightCard.append(kicker, fightGrid, dialogue, actions);
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
