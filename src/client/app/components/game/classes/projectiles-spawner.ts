import {Milliseconds, RepeatingTimer} from './repeating-timer';
import {Mesh, MeshBasicMaterial} from 'three';
import {Projectile} from './projectile';
import {Helpers} from './helpers';
import {Observable} from 'rxjs/Observable';

export class ProjectilesSpawner {
  projectiles$: Observable<Projectile>;

  constructor(interval: Milliseconds, public mesh: Mesh, speed: number) {
    mesh.visible = false;
    this.projectiles$ = Observable.interval(interval)
      .map(() => new Projectile(Helpers.boxMeshWithPosition((this.mesh.material as MeshBasicMaterial).color, {
        x: 0.5,
        y: 0.5,
        z: 0.5,
      }, this.mesh.getWorldPosition()), speed));
  }
}
