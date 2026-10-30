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

// Load js/github.js dynamically if not already included in index.html
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

// Add minimal styles for the loading spinner and Dungeon issue list
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
    .issue-list {
      width: 100%; max-height: 320px; margin: 0; padding: 12px 16px;
      overflow-y: auto; list-style: none; text-align: left;
      font-family: "VT323", monospace; font-size: 21px; line-height: 1.35; color: var(--paper);
    }
    .issue-list li { display: flex; gap: 10px; padding: 8px 6px; border-bottom: 1px solid rgba(255, 242, 215, 0.08); }
    .issue-list li:last-child { border-bottom: 0; }
    .issue-number { flex-shrink: 0; color: var(--yellow); }
    .dungeon-message { padding: 20px; font-family: "VT323", monospace; font-size: 22px; line-height: 1.4; }
    .dungeon-error { color: var(--pink); }
    .form-note-error { color: var(--pink); }
    @keyframes dungeon-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

// Render loading spinner inside the Dungeon map container
function renderDungeonLoading(copyEl, containerEl) {
  copyEl.textContent = "Scanning the crypt for open issues...";
  containerEl.innerHTML = `
    <div class="dungeon-loading" role="status" aria-live="polite">
      <div class="dungeon-spinner" aria-hidden="true"></div>
      <span>SUMMONING ISSUES...</span>
    </div>
  `;
}

// Render fetched issue titles or empty state on the Dungeon screen
function renderDungeonIssues(issues, copyEl, containerEl) {
  containerEl.innerHTML = "";

  if (issues.length === 0) {
    copyEl.textContent = "All quiet in this repository.";
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "dungeon-message";
    emptyMsg.textContent = "No open issues found — this repo is ghost-free! 🎃";
    containerEl.appendChild(emptyMsg);
    return;
  }

  copyEl.textContent = `${issues.length} open issue${issues.length === 1 ? "" : "s"} lurking in the dungeon:`;
  const list = document.createElement("ul");
  list.className = "issue-list";

  issues.forEach((issue) => {
    const item = document.createElement("li");

    const num = document.createElement("span");
    num.className = "issue-number";
    num.textContent = `#${issue.number}`;

    const title = document.createElement("span");
    title.textContent = issue.title;

    item.append(num, title);
    list.appendChild(item);
  });

  containerEl.appendChild(list);
}

// Render a friendly error message on the Dungeon screen
function renderDungeonError(message, copyEl, containerEl) {
  copyEl.textContent = "The dungeon gates stayed shut.";
  containerEl.innerHTML = "";

  const errEl = document.createElement("div");
  errEl.className = "dungeon-message dungeon-error";
  errEl.setAttribute("role", "alert");
  errEl.textContent = message;
  containerEl.appendChild(errEl);
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

  // Allow both full GitHub URLs and "owner/repo" shorthand in the input
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
