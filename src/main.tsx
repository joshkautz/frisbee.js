import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Game } from "@/components";

const container = document.getElementById("game-container");
const loading = document.getElementById("loading");

if (!container) {
  throw new Error("Game container not found!");
}

if (loading) {
  loading.hidden = true;
}

createRoot(container).render(
  <StrictMode>
    <Game />
  </StrictMode>
);
