[README-4.md](https://github.com/user-attachments/files/34207882/README-4.md)
<div align="center">

```text
        .-""""""""-.
      .'  _      _  '.
     /   (o)    (o)   \
    |        ^         |
    |     .-___-.      |
     \    |||||||     /
      '.  '-'-'-'   .'
        '-.._____..-'

 _   _    _    _   _ _   _ _____ _____ ____
| | | |  / \  | | | | \ | |_   _| ____|  _ \
| |_| | / _ \ | | | |  \| | | | |  _| | | | |
|  _  |/ ___ \| |_| | |\  | | | | |___| |_| |
|_| |_/_/   \_\\___/|_| \_| |_| |_____|____/

 ____  _____ ____   ___
|  _ \| ____|  _ \ / _ \
| |_) |  _| | |_) | | | |
|  _ <| |___|  __/| |_| |
|_| \_\_____|_|    \___/

        Every bug is a ghost. Catch it.
```

**A Halloween game where every GitHub issue becomes a monster.**
Get hints from a local AI, fix real issues, open real pull requests, earn XP.

![License: MIT](https://img.shields.io/badge/license-MIT-orange)
![Built at](https://img.shields.io/badge/built%20at-DevForge%20x%20Hacktoberfest%202026-7cffb2)
![AI](https://img.shields.io/badge/AI-Gemma%20via%20Ollama-8fb0e0)
![Team](https://img.shields.io/badge/team-ByteForce-e63b2e)

</div>

---

## 👻 The problem

New contributors are scared of open source. A big repo looks like a dark, haunted forest. Nobody tells you which issue is easy, where to start, or how to open your first pull request. So most people never send a single PR.

## 🎃 Our idea

**Haunted Repo turns contributing into a game.**

Paste any public GitHub repo, and its open issues turn into monsters in a dungeon:

| Issue type | Monster |
|---|---|
| bug, error, crash | 👻 NullPointer Wraith |
| docs, typo, readme | 🦇 Typo Bat |
| good first issue | 🎃 Tiny Pumpkin Imp |
| feature, enhancement | 🗿 Feature Golem |
| performance | 🧟 Lag Zombie |
| security | 🧛 Vampire Leak |
| tests | 💀 Flaky Test Skeleton |
| merge conflicts | 👹 Merge Conflict Demon |
| anything else | 🕯️ Unknown Spirit |

Easy issues live in **Level 1 (The Graveyard)**, harder ones in **Level 2 (The Haunted Library)** and **Level 3 (The Boss Crypt)**.

## 🕹️ How the game works

1. **Enter the dungeon.** Paste a repo URL (like `owner/repo`) or use **Demo mode**.
2. **Pick a monster.** Each card shows the issue title, level and XP.
3. **Ask for hints.** A local AI gives you help without handing over the answer.
   - **Hint 1:** a gentle nudge. XP stays 100%.
   - **Hint 2:** which file or keyword to look at. XP drops to 75%.
   - **Hint 3:** an AI draft patch. XP drops to 50%.
4. **Fix it for real.** Click **View issue on GitHub**, make the change, and open a pull request.
5. **Banish the monster.** Paste your PR link. The game checks the link format, defeats the monster and gives you XP.
6. **Rank up:** 🪦 Rookie Ghost → 🎃 Pumpkin Hunter → 🗝️ Crypt Keeper → 💀 Grim Reaper.

Progress is saved in your browser.

## 🧠 How it works inside

```text
[ Repo URL ] -> [ GitHub public API ] -> [ Gemma (local) ] -> [ Game screen ]
   input          open issues             monster + hints      map, fight, XP
```

- **Data:** the public GitHub REST API (read-only, no API key).
- **AI:** Gemma through Ollama running on your own laptop. No cloud, no API keys.
- **Fallback:** if Ollama is off, the game uses rule-based monsters and hints, so it never breaks.
- **Demo mode:** built-in sample issues, so the game works even with no internet or when GitHub's rate limit is hit.
- **Frontend:** plain HTML, CSS and vanilla JavaScript. No frameworks, no backend.

## ✨ Features

- 🎮 Dungeon map with 3 levels and 9 monster types
- 🤖 Local AI monsters and hints (open-weight Gemma model)
- 💡 3-level hint system with an XP penalty
- 🏆 XP, ranks and a progress bar
- 🔗 Defeat flow using a real pull request link
- 💾 Saved progress (localStorage)
- 📴 Offline-friendly: AI fallback and Demo mode
- 🌙 Spooky pixel-art Halloween theme

## 🚀 Run it locally

```bash
# 1. Clone
git clone https://github.com/anshraj3060/haunted-repo.git
cd haunted-repo

# 2. (Optional, for AI hints) start Ollama and get the model
OLLAMA_ORIGINS="*" ollama serve
ollama pull gemma3:4b

# 3. Serve the game
python3 -m http.server 8000
```

Open **http://localhost:8000** in your browser.

- No Ollama? The game still works with rule-based hints.
- No internet or hit the GitHub rate limit? Click **Demo mode**.

## 🤖 AI tools used

We want to be open about this, as the rules ask.

| Tool | Used for |
|---|---|
| **Arena AI** | Helped us write the code, one small part at a time. We reviewed and explained every part. |
| **Gemma (via Ollama, local, open-weight)** | Powers the monster names and hints inside the game. |

All code in this repo was written during **DevForge x Hacktoberfest 2026, Bengaluru (30-31 Oct 2026)**. Our commit history shows it.

## 👥 Team ByteForce

**College:** Bosscoder School of Technology

| Member | Role | What they did |
|---|---|---|
| **Ansh Raj** (Team Lead) | Backend, AI, Demo and README | Idea and game design (monsters, levels, hint system, XP and ranks), architecture, Ollama and Gemma integration, running the Arena AI build sessions, demo and README |
| **Shriyam Gupta** | Frontend, AI and data | GitHub issue fetching and the Dungeon list, frontend polish, testing, sample data and demo preparation |

> Built by two first-year students, with a lot of coffee and one very haunted night.

## 🔭 What we would build next

We prefer to be honest about the limits:

- Today the game checks that the PR link **looks valid**. It does not judge whether the fix is correct. In real open source, the **repo maintainer** reviews and merges the PR.
- Next step: verify the PR through the GitHub API (does it exist, is it linked to the issue) and give **bonus XP when the PR is merged**.

## 📜 Licence

Released under the **MIT License**. See [LICENSE](LICENSE).

## 🙏 Credits

- [GitHub REST API](https://docs.github.com/rest) for issue data
- [Ollama](https://ollama.com) and Google's open **Gemma** model for local AI
- Google Fonts: *Press Start 2P* and *VT323*
- Built for **Hacktoberfest 2026**, hosted by **DevForge** (Newton School of Technology, Bengaluru) with **Major League Hacking**

<div align="center">

**$ git commit -m "let's go"** 🎃

</div>
