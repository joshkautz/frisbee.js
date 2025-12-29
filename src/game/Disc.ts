import * as THREE from "three";

const DISC_RADIUS = 0.5;
const DISC_HEIGHT = 0.1;

export class Disc {
  public mesh: THREE.Mesh;
  public velocity: THREE.Vector3;
  public isFlying: boolean;

  constructor() {
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isFlying = false;

    // Create a flat cylinder to represent the disc
    const geometry = new THREE.CylinderGeometry(
      DISC_RADIUS,
      DISC_RADIUS,
      DISC_HEIGHT,
      32
    );
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, DISC_HEIGHT / 2 + 0.5, 0);
  }

  public update(deltaTime: number): void {
    if (this.isFlying) {
      // Apply velocity to position
      this.mesh.position.x += this.velocity.x * deltaTime;
      this.mesh.position.z += this.velocity.z * deltaTime;

      // Apply air resistance
      this.velocity.multiplyScalar(0.995);

      // Stop flying if velocity is very low
      if (this.velocity.length() < 0.1) {
        this.isFlying = false;
      }
    }
  }

  public setPosition(x: number, z: number): void {
    this.mesh.position.set(x, DISC_HEIGHT / 2 + 0.5, z);
  }

  public throw(direction: THREE.Vector3, power: number): void {
    this.velocity.copy(direction).normalize().multiplyScalar(power);
    this.isFlying = true;
  }
}
