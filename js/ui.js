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

function isValidPullRequestLink(value) {
  return /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+\/pull\/[1-9]\d*\/?$/i.test(String(value || "").trim());
}

function formatXp(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

function playVictoryBurst(container) {
  const colors = ["#f7b928", "#ff7a1a", "#7cffb2", "#e87a77", "#8fb0e0"];
  const burst = document.createElement("div");
  burst.className = "victory-burst";
  burst.setAttribute("aria-hidden", "true");

  const ghost = document.createElement("span");
  ghost.className = "victory-ghost";
  ghost.textContent = "👻";
  burst.appendChild(ghost);

  for (let index = 0; index < 28; index += 1) {
    const piece = document.createElement("i");
    piece.className = "victory-confetti";
    piece.style.setProperty("--confetti-x", `${Math.round((Math.random() - 0.5) * 600)}px`);
    piece.style.setProperty("--confetti-y", `${Math.round((Math.random() - 0.5) * 360)}px`);
    piece.style.setProperty("--confetti-turn", `${Math.round(Math.random() * 720 - 360)}deg`);
    piece.style.setProperty("--confetti-delay", `${Math.round(Math.random() * 180)}ms`);
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    burst.appendChild(piece);
  }

  container.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1800);
}

function openFightScreen(issue) {
  if (!issue) {
    return;
  }

  const monster = issueToMonster(issue);
  if (!isLevelUnlocked(monster.level, currentIssues)) {
    return;
  }

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
  const issueUrl = issue.html_url || issue.url || "";
  issueLink.className = "fight-issue-link";
  issueLink.textContent = "View issue on GitHub ↗";
  issueLink.target = "_blank";
  issueLink.rel = "noopener noreferrer";
  issueLink.hidden = !issueUrl;
  if (issueUrl) {
    issueLink.href = issueUrl;
  } else {
    issueLink.style.display = "none";
  }

  const aiBadge = document.createElement("span");
  aiBadge.className = "ai-status-badge is-loading";
  aiBadge.textContent = "AI: waking up…";
  aiBadge.setAttribute("role", "status");
  aiBadge.setAttribute("aria-live", "polite");

  const aiWeakness = document.createElement("p");
  aiWeakness.className = "fight-weakness";
  aiWeakness.textContent = `Weakness: ${monster.weakness}`;

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
  details.append(name, level, issueTitle, description, issueLink, aiBadge, aiWeakness, hpPanel, xpReward);
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
  let aiMonsterResult = null;
  let hintRenderId = 0;
  let currentHintDisplayLevel = 0;

  function updateHintStatus(level) {
    hintStatus.textContent = level
      ? `Highest hint used: Hint ${level}`
      : "Highest hint used: none. Hints 2 and 3 reduce XP.";
  }

  function showPatchFallback(message) {
    hintOutput.replaceChildren();
    const fallback = document.createElement("p");
    fallback.className = "ai-patch-fallback";
    fallback.textContent = message || "Ollama isn't available right now. Start it locally and try Hint 3 again.";
    hintOutput.appendChild(fallback);
  }

  function renderPatchDraft(draft) {
    const result = document.createElement("div");
    result.className = "ai-patch-result";

    const bulletList = document.createElement("ul");
    bulletList.className = "ai-patch-bullets";
    draft.bullets.forEach((bullet) => {
      const item = document.createElement("li");
      item.textContent = bullet;
      bulletList.appendChild(item);
    });

    const codeBox = document.createElement("pre");
    codeBox.className = "ai-patch-code-box";
    const code = document.createElement("code");
    code.textContent = draft.snippet;
    codeBox.appendChild(code);

    const footer = document.createElement("div");
    footer.className = "ai-patch-footer";
    const warning = document.createElement("p");
    warning.className = "ai-patch-warning";
    warning.textContent = "AI draft. Read it, understand it, then write the fix yourself.";

    const copyButton = document.createElement("button");
    copyButton.className = "ai-patch-copy";
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", async () => {
      const copyText = `${draft.bullets.map((bullet) => `- ${bullet}`).join("\n")}\n\n${draft.snippet}`;

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(copyText);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = copyText;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          try {
            textarea.select();
            const copied = document.execCommand && document.execCommand("copy");
            if (!copied) {
              throw new Error("Copy failed.");
            }
          } finally {
            textarea.remove();
          }
        }

        copyButton.textContent = "Copied!";
      } catch {
        copyButton.textContent = "Copy unavailable";
      }

      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1600);
    });

    footer.append(warning, copyButton);
    result.append(bulletList, codeBox, footer);
    hintOutput.replaceChildren(result);
  }

  function renderHint(level) {
    const renderId = ++hintRenderId;
    currentHintDisplayLevel = level;
    hintOutput.replaceChildren();

    if (level === 3) {
      const loading = document.createElement("div");
      loading.className = "ai-patch-loading";
      loading.setAttribute("role", "status");
      loading.setAttribute("aria-live", "polite");

      const pumpkin = document.createElement("span");
      pumpkin.className = "ai-patch-pumpkin";
      pumpkin.textContent = "🎃";
      pumpkin.setAttribute("aria-hidden", "true");

      const loadingText = document.createElement("span");
      loadingText.textContent = "Dreaming up a draft fix...";
      loading.append(pumpkin, loadingText);
      hintOutput.appendChild(loading);

      const issueId = getIssueId(issue);
      if (typeof aiPatchHint !== "function") {
        showPatchFallback();
        return;
      }

      aiPatchHint(issue).then((draft) => {
        if (renderId !== hintRenderId || !activeFight || getIssueId(activeFight.issue) !== issueId) {
          return;
        }

        if (draft.source !== "ai" || !Array.isArray(draft.bullets) || !draft.snippet) {
          showPatchFallback(draft.message);
          return;
        }

        renderPatchDraft(draft);
      }).catch(() => {
        if (renderId === hintRenderId && activeFight && getIssueId(activeFight.issue) === issueId) {
          showPatchFallback();
        }
      });
      return;
    }

    const hintText = document.createElement("p");
    hintText.className = "fight-hint-text";

    if (level === 1) {
      hintText.textContent = aiMonsterResult?.hint1 || getFirstHint(issue);
      hintOutput.appendChild(hintText);
      return;
    }

    if (level === 2) {
      const keywords = getIssueKeywords(issue.title);
      hintText.textContent = aiMonsterResult?.hint2
        || `Search these issue-title keywords in the repo: ${keywords.join(", ") || "issue"}.`;
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

    hintText.textContent = "Choose a hint to reveal a clue.";
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
      fightCard.classList.remove("is-hint-shaking");
      void fightCard.offsetWidth;
      fightCard.classList.add("is-hint-shaking");
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

  const banishForm = document.createElement("form");
  banishForm.className = "banish-form";

  const prLabel = document.createElement("label");
  prLabel.htmlFor = "pr-link";
  prLabel.textContent = "Paste your Pull Request link";

  const banishRow = document.createElement("div");
  banishRow.className = "banish-form-row";

  const prInput = document.createElement("input");
  prInput.id = "pr-link";
  prInput.name = "pr-link";
  prInput.type = "text";
  prInput.inputMode = "url";
  prInput.autocomplete = "url";
  prInput.placeholder = "https://github.com/owner/repo/pull/123";
  prInput.setAttribute("aria-describedby", "banish-feedback");
  prInput.disabled = alreadyDefeated;

  const banishButton = document.createElement("button");
  banishButton.className = "primary-button banish-button";
  banishButton.type = "submit";
  banishButton.textContent = "Banish the monster";
  banishButton.disabled = alreadyDefeated;

  const banishFeedback = document.createElement("p");
  banishFeedback.className = "banish-feedback";
  banishFeedback.id = "banish-feedback";
  banishFeedback.setAttribute("role", "alert");
  banishFeedback.hidden = true;

  if (alreadyDefeated) {
    banishFeedback.textContent = "This monster has already been banished.";
    banishFeedback.hidden = false;
  }

  banishRow.append(prInput, banishButton);
  banishForm.append(prLabel, banishRow, banishFeedback);

  const actions = document.createElement("div");
  actions.className = "fight-actions";

  const backButton = document.createElement("button");
  backButton.className = "secondary-button fight-back";
  backButton.type = "button";
  backButton.textContent = "← Back to map";

  banishForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!activeFight || activeFight.defeated) {
      return;
    }

    if (!isValidPullRequestLink(prInput.value)) {
      banishFeedback.textContent = "That link doesn't look like a pull request. Try https://github.com/owner/repo/pull/123.";
      banishFeedback.hidden = false;
      prInput.setAttribute("aria-invalid", "true");
      return;
    }

    banishFeedback.hidden = true;
    prInput.removeAttribute("aria-invalid");
    const earnedXp = defeatMonster(issue, monster);

    if (!earnedXp) {
      banishFeedback.textContent = "This monster has already been banished.";
      banishFeedback.hidden = false;
      return;
    }

    activeFight.defeated = true;
    activeFight.hp = 0;
    hpBar.value = 0;
    hpValue.textContent = `0 / ${maxHp}`;
    monsterEmoji.classList.add("is-hit", "is-banished");
    banishButton.disabled = true;
    prInput.disabled = true;
    backButton.disabled = true;
    hintButtons.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
    });
    updateXpReward();
    dialogueText.textContent = `${name.textContent} fades into the dark. You earned ${formatXp(earnedXp)} XP.`;

    const victoryBanner = document.createElement("div");
    victoryBanner.className = "victory-banner";
    victoryBanner.setAttribute("role", "status");
    victoryBanner.textContent = `Monster defeated! +${formatXp(earnedXp)} XP`;
    fightCard.prepend(victoryBanner);
    playVictoryBurst(fightCard);

    window.setTimeout(() => {
      const issues = typeof currentIssues === "undefined" ? [] : currentIssues;
      const copy = document.getElementById("dungeon-copy");
      const sections = document.getElementById("level-sections");

      if (copy && sections && typeof renderDungeonIssues === "function") {
        renderDungeonIssues(issues, copy, sections);
      }

      showScreen("dungeon");
      if (sections) {
        sections.before(victoryBanner);
      }
      victoryBanner.classList.add("map-victory-banner");
      window.setTimeout(() => victoryBanner.remove(), 4500);
    }, 1500);
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

  actions.appendChild(backButton);
  fightCard.append(kicker, fightGrid, dialogue, hintSection, banishForm, actions);
  showScreen("fight");

  const aiIssueId = getIssueId(issue);
  if (typeof aiMonster === "function") {
    aiMonster(issue).then((result) => {
      if (!activeFight || getIssueId(activeFight.issue) !== aiIssueId) {
        return;
      }

      aiMonsterResult = result;
      const isOnline = result.source === "ai";
      aiBadge.textContent = isOnline ? "AI: Gemma (local)" : "AI: offline mode";
      aiBadge.classList.remove("is-loading");
      aiBadge.classList.toggle("is-online", isOnline);
      aiBadge.classList.toggle("is-offline", !isOnline);
      name.textContent = result.name || monster.name;
      aiWeakness.textContent = `Weakness: ${result.weakness || monster.weakness}`;
      visual.setAttribute("aria-label", name.textContent);
      hpBar.setAttribute("aria-label", `${name.textContent} health`);
      dialogueLabel.textContent = `${name.textContent} says:`;

      if (currentHintDisplayLevel === 1 || currentHintDisplayLevel === 2) {
        renderHint(currentHintDisplayLevel);
      }
    });
  } else {
    aiBadge.textContent = "AI: offline mode";
    aiBadge.classList.remove("is-loading");
    aiBadge.classList.add("is-offline");
  }
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".fight-issue-link")) {
    return;
  }

  const monsterCard = event.target.closest(".monster-card");

  if (monsterCard) {
    if (monsterCard.closest(".level-section.is-locked")) {
      return;
    }

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
