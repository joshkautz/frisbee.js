import * as THREE from "three";

// Ultimate frisbee field dimensions (in meters)
// Standard field: 100m x 37m with 18m end zones
const FIELD_LENGTH = 100;
const FIELD_WIDTH = 37;
const END_ZONE_DEPTH = 18;

export class Field {
  public mesh: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();
    this.createField();
  }

  private createField(): void {
    // Main playing surface (green grass)
    const fieldGeometry = new THREE.PlaneGeometry(FIELD_LENGTH, FIELD_WIDTH);
    const fieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x2d5a27,
      side: THREE.DoubleSide,
    });
    const fieldMesh = new THREE.Mesh(fieldGeometry, fieldMaterial);
    fieldMesh.rotation.x = -Math.PI / 2;
    this.mesh.add(fieldMesh);

    // End zones (slightly different shade of green)
    const endZoneGeometry = new THREE.PlaneGeometry(END_ZONE_DEPTH, FIELD_WIDTH);
    const endZoneMaterial = new THREE.MeshBasicMaterial({
      color: 0x1e4d2b,
      side: THREE.DoubleSide,
    });

    // Left end zone
    const leftEndZone = new THREE.Mesh(endZoneGeometry, endZoneMaterial);
    leftEndZone.rotation.x = -Math.PI / 2;
    leftEndZone.position.set(
      -(FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2),
      0.01,
      0
    );
    this.mesh.add(leftEndZone);

    // Right end zone
    const rightEndZone = new THREE.Mesh(endZoneGeometry, endZoneMaterial);
    rightEndZone.rotation.x = -Math.PI / 2;
    rightEndZone.position.set(FIELD_LENGTH / 2 - END_ZONE_DEPTH / 2, 0.01, 0);
    this.mesh.add(rightEndZone);

    // Field lines
    this.createFieldLines();
  }

  private createFieldLines(): void {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    // Boundary lines
    const boundaryPoints = [
      new THREE.Vector3(-FIELD_LENGTH / 2, 0.02, -FIELD_WIDTH / 2),
      new THREE.Vector3(FIELD_LENGTH / 2, 0.02, -FIELD_WIDTH / 2),
      new THREE.Vector3(FIELD_LENGTH / 2, 0.02, FIELD_WIDTH / 2),
      new THREE.Vector3(-FIELD_LENGTH / 2, 0.02, FIELD_WIDTH / 2),
      new THREE.Vector3(-FIELD_LENGTH / 2, 0.02, -FIELD_WIDTH / 2),
    ];
    const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(
      boundaryPoints
    );
    const boundaryLine = new THREE.Line(boundaryGeometry, lineMaterial);
    this.mesh.add(boundaryLine);

    // End zone lines
    const playingFieldStart = -FIELD_LENGTH / 2 + END_ZONE_DEPTH;
    const playingFieldEnd = FIELD_LENGTH / 2 - END_ZONE_DEPTH;

    // Left goal line
    const leftGoalPoints = [
      new THREE.Vector3(playingFieldStart, 0.02, -FIELD_WIDTH / 2),
      new THREE.Vector3(playingFieldStart, 0.02, FIELD_WIDTH / 2),
    ];
    const leftGoalGeometry = new THREE.BufferGeometry().setFromPoints(
      leftGoalPoints
    );
    const leftGoalLine = new THREE.Line(leftGoalGeometry, lineMaterial);
    this.mesh.add(leftGoalLine);

    // Right goal line
    const rightGoalPoints = [
      new THREE.Vector3(playingFieldEnd, 0.02, -FIELD_WIDTH / 2),
      new THREE.Vector3(playingFieldEnd, 0.02, FIELD_WIDTH / 2),
    ];
    const rightGoalGeometry = new THREE.BufferGeometry().setFromPoints(
      rightGoalPoints
    );
    const rightGoalLine = new THREE.Line(rightGoalGeometry, lineMaterial);
    this.mesh.add(rightGoalLine);
  }
}
