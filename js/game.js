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

function defeatMonster(issue, monster) {
  const issueId = getIssueId(issue);

  if (gameState.defeated.includes(issueId)) {
    return false;
  }

  gameState.defeated.push(issueId);
  gameState.xp += monster.xp;
  return true;
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
