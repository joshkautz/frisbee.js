import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Game } from "./game/Game";

const container = document.getElementById("game-container");

if (!container) {
  throw new Error("Game container not found!");
}

createRoot(container).render(
  <StrictMode>
    <Game />
  </StrictMode>
);
