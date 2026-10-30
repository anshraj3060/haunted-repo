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

document.addEventListener("DOMContentLoaded", () => {
  const repoForm = document.getElementById("repo-form");

  showScreen("home");

  repoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    showScreen("dungeon");
  });

  document.querySelectorAll("[data-screen-target]").forEach((button) => {
    button.addEventListener("click", () => {
      showScreen(button.dataset.screenTarget);
    });
  });
});
