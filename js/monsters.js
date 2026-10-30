function issueToMonster(issue) {
  const title = String(issue?.title ?? "").trim().replace(/\s+/g, " ");
  const labels = Array.isArray(issue?.labels)
    ? issue.labels.map((label) => (typeof label === "string" ? label : label?.name || ""))
    : [typeof issue?.labels === "string" ? issue.labels : ""];
  const searchText = `${title} ${labels.join(" ")}`
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const paddedText = ` ${searchText} `;
  const has = (...keywords) => keywords.some((keyword) => paddedText.includes(` ${keyword} `));

  let name = "Unknown Spirit";
  let emoji = "🕯️";

  if (has("bug", "error", "crash", "null")) {
    name = "NullPointer Wraith";
    emoji = "👻";
  } else if (has("docs", "readme", "typo")) {
    name = "Typo Bat";
    emoji = "🦇";
  } else if (has("good first issue", "help wanted")) {
    name = "Tiny Pumpkin Imp";
    emoji = "🎃";
  } else if (has("feature", "enhancement")) {
    name = "Feature Golem";
    emoji = "🗿";
  } else if (has("performance", "slow")) {
    name = "Lag Zombie";
    emoji = "🧟";
  } else if (has("security", "vulnerability")) {
    name = "Vampire Leak";
    emoji = "🧛";
  } else if (has("test")) {
    name = "Flaky Test Skeleton";
    emoji = "💀";
  } else if (has("merge", "conflict")) {
    name = "Merge Conflict Demon";
    emoji = "👹";
  }

  const commentsValue = Number(issue?.comments ?? 0);
  const comments = Number.isFinite(commentsValue) ? commentsValue : 0;
  const isEasy = has("docs", "readme", "typo", "good first issue", "help wanted");
  const isSecurity = has("security", "vulnerability");
  const level = isSecurity || comments >= 8 ? 3 : isEasy || comments <= 2 ? 1 : 2;
  const issueTitle = title || "Untitled issue";
  const weakness = issueTitle.length > 42 ? `${issueTitle.slice(0, 41).trimEnd()}…` : issueTitle;
  const xp = level === 1 ? 50 : level === 2 ? 100 : 200;

  return { name, emoji, weakness, level, xp };
}
