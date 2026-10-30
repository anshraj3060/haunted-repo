const gameState = {
  xp: 0,
  defeated: [],
  hintsUsed: {},
};

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

  const previousLevel = level - 1;
  const previousIssues = issues.filter((issue) => issueToMonster(issue).level === previousLevel);
  return previousIssues.length === 0 || countDefeatedInLevel(issues, previousLevel) >= 2;
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
