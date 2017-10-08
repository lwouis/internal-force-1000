import {Mesh} from 'three';
import {ProjectilesSpawner} from './projectiles-spawner';

export class Boss {
  constructor(public mesh: Mesh, private speed: number, public projectilesSpawner: ProjectilesSpawner) {
    this.mesh.name = 'boss';
  }
}
