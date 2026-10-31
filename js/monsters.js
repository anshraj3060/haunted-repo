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

  if (has("merge", "conflict")) {
    name = "Merge Conflict Demon";
    emoji = "👹";
  } else if (has("bug", "error", "crash", "null")) {
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
  }

  const commentsValue = Number(issue?.comments ?? 0);
  const comments = Number.isFinite(commentsValue) ? commentsValue : 0;
  const level3Match = has("security", "vulnerability", "merge conflict");
  const level2Match = has(
    "bug", "error", "crash", "null", "performance", "slow", "test", "feature", "enhancement"
  );
  const level1Match = has("docs", "readme", "typo", "good first issue", "help wanted");
  let level;

  // Match labels and keywords before using comment counts as a fallback.
  if (level3Match) {
    level = 3;
  } else if (level2Match) {
    level = 2;
  } else if (level1Match) {
    level = 1;
  } else if (comments >= 8) {
    level = 3;
  } else if (comments >= 3 && comments <= 7) {
    level = 2;
  } else {
    level = 1;
  }

  const issueTitle = title || "Untitled issue";
  const weakness = issueTitle.length > 42 ? `${issueTitle.slice(0, 41).trimEnd()}…` : issueTitle;
  const xp = level === 1 ? 50 : level === 2 ? 100 : 200;

  return { name, emoji, weakness, level, xp };
}
