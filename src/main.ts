import { Game } from "./game/Game";

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("game-container");

  if (!container) {
    console.error("Game container not found!");
    return;
  }

  // Initialize the game
  new Game(container);
});
