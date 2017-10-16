import {Mesh, MeshBasicMaterial} from 'three';

export class Boss {
  private static MAX_HEALTH = 100;

  health: number;

  constructor(public id: number, public mesh: Mesh) {
    this.health = Boss.MAX_HEALTH;
    this.mesh.name = 'boss';
    this.mesh.geometry.computeBoundingBox();
  }

  damaged() {
    // TODO how to handle scene as immutable?
    this.health -= 1;
    const remainingHealth = (Boss.MAX_HEALTH - this.health) / Boss.MAX_HEALTH;
    (this.mesh.material as MeshBasicMaterial).color.setHSL(remainingHealth, remainingHealth, remainingHealth);
    return this;
  }
}
