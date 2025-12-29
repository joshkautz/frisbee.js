import * as THREE from "three";
import { Player } from "./Player";

const PLAYERS_PER_TEAM = 7;
const FIELD_WIDTH = 37;

export class Team {
  public players: Player[];
  public color: number;

  constructor(color: number) {
    this.color = color;
    this.players = [];
  }

  public createPlayers(startX: number): void {
    // Spread players evenly across the width of the field
    const spacing = FIELD_WIDTH / (PLAYERS_PER_TEAM + 1);

    for (let i = 0; i < PLAYERS_PER_TEAM; i++) {
      const z = -FIELD_WIDTH / 2 + spacing * (i + 1);
      const player = new Player(startX, z, this.color);
      this.players.push(player);
    }
  }

  public addToScene(scene: THREE.Scene): void {
    for (const player of this.players) {
      scene.add(player.mesh);
    }
  }

  public update(deltaTime: number): void {
    for (const player of this.players) {
      player.update(deltaTime);
    }
  }
}
