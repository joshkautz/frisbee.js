import * as THREE from "three";

const PLAYER_RADIUS = 0.8;
const PLAYER_HEIGHT = 0.5;

export class Player {
  public mesh: THREE.Mesh;
  public velocity: THREE.Vector3;
  public teamColor: number;

  constructor(x: number, z: number, teamColor: number) {
    this.teamColor = teamColor;
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Create a simple cylinder to represent the player (top-down view)
    const geometry = new THREE.CylinderGeometry(
      PLAYER_RADIUS,
      PLAYER_RADIUS,
      PLAYER_HEIGHT,
      16
    );
    const material = new THREE.MeshBasicMaterial({ color: teamColor });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, PLAYER_HEIGHT / 2, z);
  }

  public update(deltaTime: number): void {
    // Apply velocity to position
    this.mesh.position.x += this.velocity.x * deltaTime;
    this.mesh.position.z += this.velocity.z * deltaTime;

    // Apply friction to slow down
    this.velocity.multiplyScalar(0.98);
  }

  public setPosition(x: number, z: number): void {
    this.mesh.position.set(x, PLAYER_HEIGHT / 2, z);
  }
}
