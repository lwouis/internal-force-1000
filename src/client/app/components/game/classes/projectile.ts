import {Mesh} from 'three';

export class Projectile {
  constructor(public mesh: Mesh, private speed: number) {}

  move(): void {
    this.mesh.translateZ(this.speed);
  }
}
