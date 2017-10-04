import {Mesh} from 'three';
import {Projectile} from './projectile';
import {Helpers} from './helpers';

export class Ship {
  constructor(public mesh: Mesh, private speed: number) {}

  move(direction: number): void {
    // TODO implement min and max position
    this.mesh.position.x += direction * this.speed;
  }

  firedProjectile(): Projectile {
    return new Projectile(Helpers.boxMesh(0x144091, {x: 0.5, y: 0.5, z: 0.5}, this.mesh.position), 0.5);
  }
}
