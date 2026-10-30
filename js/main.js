let currentIssues = [];
let activeRequestId = 0;
let githubLoadPromise = null;

const levelSections = [
  { level: 1, title: "Level 1 - The Graveyard" },
  { level: 2, title: "Level 2 - The Haunted Library" },
  { level: 3, title: "Level 3 - The Boss Crypt" },
];

// Switch visible game screen by name
function showScreen(name) {
  const selectedScreen = document.getElementById(`${name}-screen`);

  if (!selectedScreen) {
    return;
  }

  document.querySelectorAll(".screen").forEach((screen) => {
    screen.hidden = true;
    screen.setAttribute("aria-hidden", "true");
  });

  selectedScreen.hidden = false;
  selectedScreen.setAttribute("aria-hidden", "false");
}

// Load js/github.js dynamically if it is not already available
function ensureGithubLoaded() {
  if (typeof fetchIssues === "function") {
    return Promise.resolve();
  }

  if (!githubLoadPromise) {
    githubLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "js/github.js";
      script.onload = () => resolve();
      script.onerror = () => {
        githubLoadPromise = null;
        reject(new Error("Could not load GitHub helper."));
      };
      document.head.appendChild(script);
    });
  }

  return githubLoadPromise;
}

function updateRankBar() {
  const rankName = document.getElementById("rank-name");
  const playerXp = document.getElementById("player-xp");
  const rankNext = document.getElementById("rank-next");
  const rankProgress = document.getElementById("rank-progress");
  const status = getRankStatus();

  rankName.textContent = status.rank.name;
  playerXp.textContent = `${gameState.xp} XP`;
  rankProgress.value = status.progress;
  rankProgress.setAttribute("aria-valuetext", `${status.progress}% progress`);
  rankNext.textContent = status.nextRank
    ? `${status.remaining} XP to ${status.nextRank.name}`
    : "MAX RANK REACHED";
}

function createMonsterCard(issue, monster, isUnlocked, onDefeat) {
  const fullTitle = String(issue.title || "Untitled issue").trim().replace(/\s+/g, " ");
  const shortTitle = fullTitle.length > 64 ? `${fullTitle.slice(0, 61).trimEnd()}…` : fullTitle;
  const issueId = getIssueId(issue);
  const isDefeated = gameState.defeated.includes(issueId);
  const card = document.createElement("article");
  card.className = `monster-card${isDefeated ? " is-defeated" : ""}`;
  card.setAttribute("role", "listitem");

  const number = document.createElement("span");
  number.className = "monster-issue-number";
  number.textContent = `ISSUE #${issue.number ?? "?"}`;

  const emoji = document.createElement("div");
  emoji.className = "monster-emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = monster.emoji;

  const name = document.createElement("h4");
  name.className = "monster-name";
  name.textContent = monster.name;

  const title = document.createElement("p");
  title.className = "monster-title";
  title.textContent = shortTitle;
  title.title = fullTitle;

  const weakness = document.createElement("p");
  weakness.className = "monster-weakness";
  weakness.textContent = `Weakness: ${monster.weakness}`;

  const meta = document.createElement("div");
  meta.className = "monster-meta";

  const level = document.createElement("span");
  level.className = "monster-level";
  level.textContent = `LEVEL ${monster.level}`;

  const xp = document.createElement("span");
  xp.className = "monster-xp";
  xp.textContent = `${monster.xp} XP`;

  const defeatButton = document.createElement("button");
  defeatButton.className = "defeat-button";
  defeatButton.type = "button";
  defeatButton.disabled = isDefeated || !isUnlocked;
  defeatButton.textContent = isDefeated
    ? "DEFEATED"
    : isUnlocked
      ? `DEFEAT · +${monster.xp} XP`
      : "LOCKED";
  defeatButton.addEventListener("click", onDefeat);

  meta.append(level, xp);
  card.append(number, emoji, name, title, weakness, meta, defeatButton);
  return card;
}

function createLevelSection(sectionInfo, groupedIssues, allIssues, copyEl, containerEl) {
  const { level, title } = sectionInfo;
  const unlocked = isLevelUnlocked(level, allIssues);
  const defeatedCount = countDefeatedInLevel(allIssues, level);
  const section = document.createElement("section");
  section.className = `level-section${unlocked ? "" : " is-locked"}`;
  section.dataset.level = level;

  const heading = document.createElement("header");
  heading.className = "level-section-heading";

  const name = document.createElement("h3");
  name.textContent = title;

  const status = document.createElement("span");
  status.className = "level-status";
  status.textContent = unlocked
    ? level < 3
      ? `${defeatedCount} / 2 DEFEATED`
      : `${defeatedCount} DEFEATED`
    : "🔒 LOCKED";
  heading.append(name, status);
  section.appendChild(heading);

  if (groupedIssues.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "section-empty";
    emptyMessage.textContent = "No monsters in this chamber.";
    section.appendChild(emptyMessage);
  } else {
    const grid = document.createElement("div");
    grid.className = "monster-grid";
    grid.setAttribute("role", "list");

    groupedIssues.forEach(({ issue, monster }) => {
      const onDefeat = () => {
        if (defeatMonster(issue, monster)) {
          renderDungeonIssues(currentIssues, copyEl, containerEl);
        }
      };
      grid.appendChild(createMonsterCard(issue, monster, unlocked, onDefeat));
    });

    section.appendChild(grid);
  }

  if (!unlocked) {
    const overlay = document.createElement("div");
    overlay.className = "locked-overlay";

    const lockContent = document.createElement("div");
    lockContent.className = "locked-content";

    const lockIcon = document.createElement("span");
    lockIcon.className = "lock-icon";
    lockIcon.setAttribute("aria-hidden", "true");
    lockIcon.textContent = "🔒";

    const lockMessage = document.createElement("p");
    lockMessage.className = "lock-message";
    lockMessage.textContent = `Defeat 2 Level ${level - 1} monsters to unlock.`;

    lockContent.append(lockIcon, lockMessage);
    overlay.appendChild(lockContent);
    section.appendChild(overlay);
  }

  return section;
}

// Render issues into their level chambers
function renderDungeonIssues(issues, copyEl, containerEl) {
  updateRankBar();
  containerEl.replaceChildren();

  copyEl.textContent = issues.length
    ? `${issues.length} open issue${issues.length === 1 ? "" : "s"} haunting this repository:`
    : "No open issues found. The dungeon is quiet.";

  const groupedIssues = { 1: [], 2: [], 3: [] };
  issues.forEach((issue) => {
    const monster = issueToMonster(issue);
    groupedIssues[monster.level].push({ issue, monster });
  });

  levelSections.forEach((sectionInfo) => {
    containerEl.appendChild(
      createLevelSection(sectionInfo, groupedIssues[sectionInfo.level], issues, copyEl, containerEl)
    );
  });
}

// Show the loading spinner in the Dungeon map
function renderDungeonLoading(copyEl, containerEl) {
  copyEl.textContent = "Scanning the crypt for open issues...";
  containerEl.innerHTML = `
    <div class="dungeon-loading" role="status" aria-live="polite">
      <div class="dungeon-spinner" aria-hidden="true"></div>
      <span>SUMMONING ISSUES...</span>
    </div>
  `;
}

// Show an error message in the Dungeon map
function renderDungeonError(message, copyEl, containerEl) {
  copyEl.textContent = "The dungeon gates stayed shut.";
  containerEl.replaceChildren();

  const error = document.createElement("p");
  error.className = "dungeon-message dungeon-error";
  error.setAttribute("role", "alert");
  error.textContent = message;
  containerEl.appendChild(error);
}

document.addEventListener("DOMContentLoaded", () => {
  const repoForm = document.getElementById("repo-form");
  const repoInput = document.getElementById("repo-url");
  const repoHelp = document.getElementById("repo-help");
  const submitBtn = repoForm.querySelector('button[type="submit"]');
  const dungeonCopy = document.getElementById("dungeon-copy");
  const levelSectionsEl = document.getElementById("level-sections");

  // Accept full GitHub URLs and owner/repo shorthand
  repoForm.noValidate = true;
  repoInput.type = "text";
  repoInput.placeholder = "https://github.com/owner/repo or owner/repo";
  updateRankBar();
  showScreen("home");
  ensureGithubLoaded().catch(() => {});

  repoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const repoValue = repoInput.value.trim();

    if (!repoValue) {
      repoHelp.textContent = 'Please enter a GitHub URL or "owner/repo" to begin.';
      repoHelp.classList.add("form-note-error");
      repoInput.focus();
      return;
    }

    const requestId = ++activeRequestId;
    repoHelp.textContent = "Paste a repository URL to begin.";
    repoHelp.classList.remove("form-note-error");
    submitBtn.disabled = true;

    showScreen("dungeon");
    renderDungeonLoading(dungeonCopy, levelSectionsEl);

    try {
      await ensureGithubLoaded();
      const issues = await fetchIssues(repoValue);

      if (requestId !== activeRequestId) {
        return;
      }

      currentIssues = issues;
      renderDungeonIssues(issues, dungeonCopy, levelSectionsEl);
    } catch (error) {
      if (requestId !== activeRequestId) {
        return;
      }

      currentIssues = [];
      const message = error.message || "Something went wrong while fetching issues.";
      renderDungeonError(message, dungeonCopy, levelSectionsEl);
      repoHelp.textContent = message;
      repoHelp.classList.add("form-note-error");
    } finally {
      if (requestId === activeRequestId) {
        submitBtn.disabled = false;
      }
    }
  });

  document.querySelectorAll("[data-screen-target]").forEach((button) => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.screenTarget);
    });
  });
});
