const gameState = {
  xp: 0,
  defeated: [],
  hintsUsed: {},
};
let activeRepoKey = "";

function clearGameProgress() {
  gameState.xp = 0;
  gameState.defeated = [];
  gameState.hintsUsed = {};
}

function loadGameState(repoName) {
  const parts = String(repoName || "")
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .split(/[?#]/)[0]
    .split("/")
    .filter(Boolean);

  activeRepoKey = parts.length >= 2
    ? `${parts[0].toLowerCase()}/${parts[1].replace(/\.git$/i, "").toLowerCase()}`
    : "";
  clearGameProgress();

  if (!activeRepoKey) {
    return;
  }

  try {
    const saved = localStorage.getItem(`haunted-repo:${activeRepoKey}`);
    if (!saved) {
      return;
    }

    const parsed = JSON.parse(saved);
    if (Number.isFinite(parsed.xp) && parsed.xp >= 0) {
      gameState.xp = parsed.xp;
    }
    if (Array.isArray(parsed.defeated)) {
      gameState.defeated = [...new Set(parsed.defeated.map(String))];
    }
    if (parsed.hintsUsed && typeof parsed.hintsUsed === "object" && !Array.isArray(parsed.hintsUsed)) {
      gameState.hintsUsed = Object.fromEntries(
        Object.entries(parsed.hintsUsed).map(([id, level]) => [
          id,
          Math.min(3, Math.max(0, Math.floor(Number(level) || 0))),
        ])
      );
    }
  } catch {
    clearGameProgress();
  }
}

function saveGameState() {
  if (!activeRepoKey) {
    return;
  }

  try {
    localStorage.setItem(`haunted-repo:${activeRepoKey}`, JSON.stringify({
      xp: gameState.xp,
      defeated: gameState.defeated,
      hintsUsed: gameState.hintsUsed,
    }));
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

function resetGameState() {
  clearGameProgress();
  saveGameState();
}

const gameRanks = [
  { name: "Rookie Ghost", xp: 0 },
  { name: "Pumpkin Hunter", xp: 100 },
  { name: "Crypt Keeper", xp: 300 },
  { name: "Grim Reaper", xp: 600 },
];

function getIssueId(issue) {
  return String(issue.id ?? issue.url ?? issue.number ?? issue.title ?? "unknown-issue");
}

function getHintLevel(issue) {
  const hintsUsed = gameState.hintsUsed || {};
  const level = Number(hintsUsed[getIssueId(issue)]) || 0;
  return Math.min(3, Math.max(0, Math.floor(level)));
}

function recordHintUsed(issue, hintLevel) {
  const issueId = getIssueId(issue);
  const nextLevel = Math.min(3, Math.max(0, Math.floor(Number(hintLevel) || 0)));
  gameState.hintsUsed = gameState.hintsUsed || {};
  gameState.hintsUsed[issueId] = Math.max(getHintLevel(issue), nextLevel);
  saveGameState();
  return gameState.hintsUsed[issueId];
}

function getXpMultiplier(hintLevel) {
  if (hintLevel >= 3) {
    return 0.5;
  }

  return hintLevel === 2 ? 0.75 : 1;
}

function getXpReward(issue, monster) {
  return monster.xp * getXpMultiplier(getHintLevel(issue));
}

function defeatMonster(issue, monster) {
  const issueId = getIssueId(issue);

  if (gameState.defeated.includes(issueId)) {
    return false;
  }

  const earnedXp = getXpReward(issue, monster);
  gameState.defeated.push(issueId);
  gameState.xp += earnedXp;
  saveGameState();
  return earnedXp;
}

function countDefeatedInLevel(issues, level) {
  return issues.filter((issue) => {
    return issueToMonster(issue).level === level && gameState.defeated.includes(getIssueId(issue));
  }).length;
}

function isLevelUnlocked(level, issues) {
  if (level === 1) {
    return true;
  }

  const requiredLevel = level === 2 ? 1 : level === 3 ? 2 : null;
  if (requiredLevel === null) {
    return false;
  }

  const requiredIssues = issues.filter((issue) => issueToMonster(issue).level === requiredLevel);
  return requiredIssues.length === 0 || countDefeatedInLevel(issues, requiredLevel) >= 2;
}

function getRankStatus() {
  let rank = gameRanks[0];
  let nextRank = null;

  for (let index = 1; index < gameRanks.length; index += 1) {
    if (gameState.xp >= gameRanks[index].xp) {
      rank = gameRanks[index];
    } else {
      nextRank = gameRanks[index];
      break;
    }
  }

  if (!nextRank) {
    return { rank, nextRank: null, progress: 100, remaining: 0 };
  }

  const rankSpan = nextRank.xp - rank.xp;
  const earnedInRank = gameState.xp - rank.xp;

  return {
    rank,
    nextRank,
    progress: Math.floor((earnedInRank / rankSpan) * 100),
    remaining: nextRank.xp - gameState.xp,
  };
}
