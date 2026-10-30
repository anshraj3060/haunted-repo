// Extract owner and repo name from a GitHub URL or "owner/repo" string
function parseRepoUrl(repoUrl) {
  const input = String(repoUrl || "").trim();

  if (!input) {
    throw new Error('Please enter a GitHub repository like "owner/repo" or "https://github.com/owner/repo".');
  }

  let path = input;
  const isUrl = /^https?:\/\//i.test(input) || /^(www\.)?github\.com\//i.test(input);

  if (isUrl) {
    const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    let parsed;

    try {
      parsed = new URL(normalized);
    } catch {
      throw new Error('Invalid GitHub URL. Try "https://github.com/owner/repo" or "owner/repo".');
    }

    const host = parsed.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") {
      throw new Error('Please enter a github.com repository URL or "owner/repo".');
    }

    path = parsed.pathname;
  } else {
    path = input.split(/[?#]/)[0];
  }

  const parts = path.replace(/^\/+|\/+$/g, "").split("/");

  if (parts.length < 2 || (!isUrl && parts.length > 2)) {
    throw new Error('Could not read owner and repo. Use "https://github.com/owner/repo" or "owner/repo".');
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, "");
  const validName = /^[A-Za-z0-9._-]+$/;

  if (!owner || !repo || !validName.test(owner) || !validName.test(repo) || repo === "." || repo === "..") {
    throw new Error('Invalid repository name. Use "https://github.com/owner/repo" or "owner/repo".');
  }

  return { owner, repo };
}

// Fetch up to 50 open issues (excluding PRs) from the public GitHub REST API
async function fetchIssues(repoUrl) {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=50`;

  let response;
  try {
    response = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github+json" },
    });
  } catch {
    throw new Error("Network error: Could not reach GitHub. Please check your connection and try again.");
  }

  if (response.status === 404) {
    throw new Error(`Repository "${owner}/${repo}" was not found (404). Check the name or make sure it is public.`);
  }

  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub API rate limit exceeded (403). Please wait a few minutes and try again, or use demo mode.");
  }

  if (response.status === 410) {
    throw new Error(`Issues are disabled for "${owner}/${repo}".`);
  }

  if (!response.ok) {
    throw new Error(`GitHub returned an unexpected error (${response.status}). Please try again.`);
  }

  let items;
  try {
    items = await response.json();
  } catch {
    throw new Error("Could not read response from GitHub. Please try again.");
  }

  if (!Array.isArray(items)) {
    throw new Error("Unexpected data received from GitHub.");
  }

  // Filter out pull requests and map each issue to simple fields
  return items
    .filter((item) => !item.pull_request)
    .map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title || "",
      body: issue.body || "",
      labels: Array.isArray(issue.labels)
        ? issue.labels.map((label) => (typeof label === "string" ? label : label.name)).filter(Boolean)
        : [],
      comments: issue.comments ?? 0,
      url: issue.html_url || issue.url || "",
    }));
}

if (typeof window !== "undefined") {
  window.fetchIssues = fetchIssues;
}
