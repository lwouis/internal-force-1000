import {Mesh, Scene} from 'three';
import {ProjectilesSpawner} from './projectiles-spawner';

export class Ship {
  constructor(scene: Scene, public mesh: Mesh, private speed: number, public projectilesSpawner: ProjectilesSpawner) {
    mesh.name = 'ship';
    projectilesSpawner.mesh.name = 'projectilesSpawner';
    scene.add(mesh);
    mesh.add(projectilesSpawner.mesh);
  }

  move(direction: number): void {
    // TODO implement min and max position
    this.mesh.position.x += direction * this.speed;
  }
}
