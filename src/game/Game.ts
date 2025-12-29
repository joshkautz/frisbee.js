import * as THREE from "three";
import { Field } from "./Field";
import { Team } from "./Team";
import { Disc } from "./Disc";

const FIELD_LENGTH = 100;

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private field: Field;
  private homeTeam: Team;
  private awayTeam: Team;
  private disc: Disc;
  private clock: THREE.Clock;

  constructor(container: HTMLElement) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Set up orthographic camera for top-down view
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 60;
    this.camera = new THREE.OrthographicCamera(
      (-viewSize * aspect) / 2,
      (viewSize * aspect) / 2,
      viewSize / 2,
      -viewSize / 2,
      0.1,
      1000
    );
    this.camera.position.set(0, 100, 0);
    this.camera.lookAt(0, 0, 0);

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Create game objects
    this.field = new Field();
    this.scene.add(this.field.mesh);

    // Create teams (blue = home, red = away)
    this.homeTeam = new Team(0x3366cc);
    this.awayTeam = new Team(0xcc3333);

    // Position teams on opposite sides of the field
    this.homeTeam.createPlayers(-FIELD_LENGTH / 4);
    this.awayTeam.createPlayers(FIELD_LENGTH / 4);

    this.homeTeam.addToScene(this.scene);
    this.awayTeam.addToScene(this.scene);

    // Create the disc
    this.disc = new Disc();
    this.scene.add(this.disc.mesh);

    // Initialize clock for delta time
    this.clock = new THREE.Clock();

    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Start the game loop
    this.animate();
  }

  private onWindowResize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 60;

    this.camera.left = (-viewSize * aspect) / 2;
    this.camera.right = (viewSize * aspect) / 2;
    this.camera.top = viewSize / 2;
    this.camera.bottom = -viewSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private update(deltaTime: number): void {
    // Update teams
    this.homeTeam.update(deltaTime);
    this.awayTeam.update(deltaTime);

    // Update disc
    this.disc.update(deltaTime);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();
    this.update(deltaTime);

    this.renderer.render(this.scene, this.camera);
  }
}
