import {Mesh} from 'three';
import {ProjectilesSpawner} from './projectiles-spawner';

export class Ship {
  constructor(public mesh: Mesh, private speed: number, public projectilesSpawner: ProjectilesSpawner) {
    this.mesh.name = 'ship';
    projectilesSpawner.mesh.name = 'projectilesSpawner';
    this.mesh.add(projectilesSpawner.mesh);
  }

  move(direction: number): void {
    // TODO implement min and max position
    this.mesh.position.x += direction * this.speed;
  }
}
