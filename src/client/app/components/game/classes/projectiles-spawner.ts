import {Milliseconds, RepeatingTimer} from './repeating-timer';
import {Mesh, MeshBasicMaterial} from 'three';
import {Projectile} from './projectile';
import {Helpers} from './helpers';

export class ProjectilesSpawner {
  private timer: RepeatingTimer;

  constructor(interval: Milliseconds, public mesh: Mesh, speed: number, callback: (p: Projectile) => any) {
    this.timer = new RepeatingTimer(interval, () => {
      callback(new Projectile(Helpers.boxMesh((this.mesh.material as MeshBasicMaterial).color, {x: 0.5, y: 0.5, z: 0.5}, this.mesh.position), speed));
    });
  }

  start() {
    this.timer.start();
  }

  stop() {
    this.timer.stop();
  }
}
