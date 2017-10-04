import {Mesh} from 'three';
import {Projectile} from './projectile';
import {Helpers} from './helpers';

export class Boss {
  constructor(public mesh: Mesh) {}

  firedProjectile(): Projectile {
    return new Projectile(Helpers.boxMesh(0xb22323, {x: 0.5, y: 0.5, z: 0.5}, this.mesh.position), 0.5);
  }
}
