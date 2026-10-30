const demoIssues = [
  {
    id: "demo-101",
    number: 101,
    url: "https://github.com/anshraj3060/haunted-demo/issues/1",
    title: "Dashboard crashes after a session expires during refresh",
    body: "If the access token expires while the dashboard is refreshing in the background, the page can go blank. Sign in, leave the dashboard open until the session expires, then wait for the next refresh. The app should return to sign-in and preserve a useful error message.",
    labels: ["bug", "needs-reproduction"],
    comments: 3,
  },
  {
    id: "demo-102",
    number: 102,
    url: "https://github.com/anshraj3060/haunted-demo/issues/2",
    title: "Quick-start guide still uses the old install command",
    body: "The setup guide tells new contributors to run the legacy install command. That command no longer installs the optional test tools, so the first test run fails. Please update the setup steps and mention the supported runtime version.",
    labels: ["docs", "good first issue"],
    comments: 1,
  },
  {
    id: "demo-103",
    number: 103,
    url: "https://github.com/anshraj3060/haunted-demo/issues/3",
    title: "Add a dark-mode preference for the repository view",
    body: "It would be useful to choose a light or dark theme in account preferences. The selected theme should be remembered between visits and applied to the repository list as well as the issue detail view.",
    labels: ["feature", "enhancement"],
    comments: 5,
  },
  {
    id: "demo-104",
    number: 104,
    url: "https://github.com/anshraj3060/haunted-demo/issues/4",
    title: "Webhook verification accepts a revoked signing secret",
    body: "After rotating the webhook secret, requests signed with the revoked value are still accepted for several minutes. Please check how the active secret is cached and make sure rejected requests do not trigger event handlers.",
    labels: ["security", "vulnerability"],
    comments: 9,
  },
  {
    id: "demo-105",
    number: 105,
    url: "https://github.com/anshraj3060/haunted-demo/issues/5",
    title: "Retry test flakes when CI workers are under load",
    body: "The retry test passes locally but occasionally times out on busy CI workers. It appears to rely on a fixed sleep before checking the final attempt. The test should wait for the observable condition instead of depending on timing.",
    labels: ["test", "ci"],
    comments: 7,
  },
  {
    id: "demo-106",
    number: 106,
    url: "https://github.com/anshraj3060/haunted-demo/issues/6",
    title: "Empty search results render a blank panel",
    body: "Searching for a term with no matches leaves an empty panel with no explanation. Show a friendly empty state and keep the search controls available so the user can try a different query.",
    labels: ["bug", "frontend"],
    comments: 2,
  },
  {
    id: "demo-107",
    number: 107,
    url: "https://github.com/anshraj3060/haunted-demo/issues/7",
    title: "Pagination examples omit the next-cursor field",
    body: "The API documentation shows how to request the first page but does not explain how to use the cursor returned in the response. Add an example that follows the cursor to the next page and describes the end-of-list case.",
    labels: ["docs", "documentation"],
    comments: 4,
  },
  {
    id: "demo-108",
    number: 108,
    url: "https://github.com/anshraj3060/haunted-demo/issues/8",
    title: "Add a bulk export for audit history",
    body: "Administrators need to export several months of audit history without opening each date range separately. Add a bulk export action that respects the current filters and reports when the export is ready.",
    labels: ["feature", "enhancement"],
    comments: 8,
  },
  {
    id: "demo-109",
    number: 109,
    url: "https://github.com/anshraj3060/haunted-demo/issues/9",
    title: "Reject archive entries that escape the upload directory",
    body: "A crafted archive can include parent-directory segments in an entry path. Validate every extracted path before writing files and reject the archive if an entry resolves outside the configured upload directory.",
    labels: ["security", "upload"],
    comments: 6,
  },
  {
    id: "demo-110",
    number: 110,
    url: "https://github.com/anshraj3060/haunted-demo/issues/10",
    title: "Cover empty repository names in the parser tests",
    body: "The repository parser should return a clear validation error for empty input, whitespace, and a trailing slash with no repository name. Add focused regression coverage for those cases.",
    labels: ["test", "good first issue"],
    comments: 0,
  },
  {
    id: "demo-111",
    number: 111,
    url: "https://github.com/anshraj3060/haunted-demo/issues/11",
    title: "Issue timeline slows down with large comment histories",
    body: "Repositories with long comment histories take several seconds to open the issue timeline. The delay grows with the number of comments. Please profile the rendering path and check whether repeated formatting work can be avoided.",
    labels: ["performance", "slow"],
    comments: 12,
  },
  {
    id: "demo-112",
    number: 112,
    url: "https://github.com/anshraj3060/haunted-demo/issues/12",
    title: "Keyboard users cannot focus issue cards",
    body: "The issue cards can only be opened with a pointer. Make them reachable and operable with the keyboard, and provide a visible focus style that matches the existing selection state.",
    labels: ["feature", "accessibility"],
    comments: 10,
  },
];

function startDemoMode() {
  if (typeof activeRequestId !== "undefined") {
    activeRequestId += 1;
  }

  const submitButton = document.querySelector('#repo-form button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = false;
  }

  currentIssues = demoIssues.map((issue) => ({
    ...issue,
    labels: [...issue.labels],
  }));

  loadGameState("demo/haunted-repo");
  const copy = document.getElementById("dungeon-copy");
  const sections = document.getElementById("level-sections");

  if (copy && sections && typeof renderDungeonIssues === "function" && typeof showScreen === "function") {
    renderDungeonIssues(currentIssues, copy, sections);
    showScreen("dungeon");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const demoButton = document.getElementById("demo-mode");
  demoButton?.addEventListener("click", startDemoMode);
});
