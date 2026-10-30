let currentIssues = [];
let activeRequestId = 0;
let githubLoadPromise = null;

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

// Add styles for loading and error messages
function injectDungeonStyles() {
  if (document.getElementById("dungeon-dynamic-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "dungeon-dynamic-styles";
  style.textContent = `
    .dungeon-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 24px; }
    .dungeon-spinner {
      width: 36px; height: 36px; border-radius: 50%;
      border: 4px solid rgba(247, 185, 40, 0.22); border-top-color: var(--orange);
      animation: dungeon-spin 0.8s linear infinite;
    }
    .dungeon-message { padding: 20px; font-family: "VT323", monospace; font-size: 22px; line-height: 1.4; }
    .dungeon-error { color: var(--pink); }
    .form-note-error { color: var(--pink); }
    @keyframes dungeon-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

// Show the loading spinner in the Dungeon map
function renderDungeonLoading(copyEl, containerEl) {
  copyEl.textContent = "Scanning the crypt for open issues...";
  containerEl.className = "dungeon-results";
  containerEl.innerHTML = `
    <div class="dungeon-loading" role="status" aria-live="polite">
      <div class="dungeon-spinner" aria-hidden="true"></div>
      <span>SUMMONING ISSUES...</span>
    </div>
  `;
}

function createMonsterCard(issue) {
  const monster = issueToMonster(issue);
  const fullTitle = String(issue.title || "Untitled issue").trim().replace(/\s+/g, " ");
  const shortTitle = fullTitle.length > 64 ? `${fullTitle.slice(0, 61).trimEnd()}…` : fullTitle;
  const card = document.createElement("article");
  card.className = "monster-card";
  card.setAttribute("role", "listitem");

  const number = document.createElement("span");
  number.className = "monster-issue-number";
  number.textContent = `ISSUE #${issue.number ?? "?"}`;

  const emoji = document.createElement("div");
  emoji.className = "monster-emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = monster.emoji;

  const name = document.createElement("h3");
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

  meta.append(level, xp);
  card.append(number, emoji, name, title, weakness, meta);
  return card;
}

// Render issue monsters or an empty state on the Dungeon screen
function renderDungeonIssues(issues, copyEl, containerEl) {
  containerEl.className = "dungeon-results";
  containerEl.replaceChildren();

  if (issues.length === 0) {
    copyEl.textContent = "All quiet in this repository.";
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "dungeon-message";
    emptyMsg.textContent = "No open issues found — this repo is ghost-free! 🎃";
    containerEl.appendChild(emptyMsg);
    return;
  }

  copyEl.textContent = `${issues.length} open issue${issues.length === 1 ? "" : "s"} transformed into monsters:`;
  const grid = document.createElement("div");
  grid.className = "monster-grid";
  grid.setAttribute("role", "list");

  issues.forEach((issue) => {
    grid.appendChild(createMonsterCard(issue));
  });

  containerEl.appendChild(grid);
}

// Show a friendly error on the Dungeon screen
function renderDungeonError(message, copyEl, containerEl) {
  copyEl.textContent = "The dungeon gates stayed shut.";
  containerEl.className = "dungeon-results";
  containerEl.replaceChildren();

  const error = document.createElement("div");
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
  const dungeonScreen = document.getElementById("dungeon-screen");
  const dungeonCopy = dungeonScreen.querySelector(".placeholder-copy");
  const dungeonContainer = dungeonScreen.querySelector(".empty-state");

  injectDungeonStyles();
  ensureGithubLoaded().catch(() => {});

  // Accept full GitHub URLs and "owner/repo" shorthand
  repoForm.noValidate = true;
  repoInput.type = "text";
  repoInput.placeholder = "https://github.com/owner/repo or owner/repo";

  showScreen("home");

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
    renderDungeonLoading(dungeonCopy, dungeonContainer);

    try {
      await ensureGithubLoaded();
      const issues = await fetchIssues(repoValue);

      if (requestId !== activeRequestId) {
        return;
      }

      currentIssues = issues;
      renderDungeonIssues(issues, dungeonCopy, dungeonContainer);
    } catch (error) {
      if (requestId !== activeRequestId) {
        return;
      }

      currentIssues = [];
      const message = error.message || "Something went wrong while fetching issues.";
      renderDungeonError(message, dungeonCopy, dungeonContainer);
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
