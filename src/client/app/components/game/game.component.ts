// libs
import {AfterViewInit, Component, ElementRef, HostListener} from '@angular/core';
import {Observable} from 'rxjs/Observable';
// app
import * as Stats from 'stats.js/build/stats.min';
import {List} from 'immutable';
import {Color, Frustum, Matrix4, PerspectiveCamera, Scene, Vector3, WebGLRenderer} from 'three';
import {Ship} from './classes/ship';
import {Controls, Key, KeyName} from './classes/controls';
import {Helpers} from './classes/helpers';
import {Projectile} from './classes/projectile';
import {Boss} from './classes/boss';
import {ProjectilesSpawner} from './classes/projectiles-spawner';
import {Scheduler} from 'rxjs/Rx';
import {FrameContext} from './classes/frame-context';

@Component({
  moduleId: module.id,
  selector: 'sd-game',
  templateUrl: 'game.component.html',
  styleUrls: ['game.component.css'],
})
export class GameComponent implements AfterViewInit {
  public renderer: WebGLRenderer;
  public scene: Scene;
  public camera: PerspectiveCamera;
  public stats: any;
  public ship: Ship;
  public boss: Boss;
  public projectiles: List<Projectile>;
  public frustum?: Frustum;

  // TODO remove unused Angular components
  // TODO introduce Level class to handle scene setup and tearDown
  // TODO introduce Boss class to handle attack patterns and HP thresholds (with timers?)
  // TODO introduce Projectile class to handle damage
  // TODO introduce HUD class to handle HP bars
  // TODO add Highscore view after game over
  // TODO add start menu with: Play, Highscore
  // TODO add music
  // TODO add FX
  // TODO add power-ups? (lasers upgrade, bomb to clear screen, invulnerability, etc)

  constructor(private element: ElementRef) {}

  ngAfterViewInit() {
    this.initialState();
    GameComponent.animationFrame$(this.controls$()).subscribe(state => this.drawLoop(state));
  }

  private controls$(): Observable<List<KeyName>> {
    // tabIndex = 0 makes the element keyboard focusable, so it generates keyboard events
    this.element.nativeElement.tabIndex = 0;
    const keydown$ = Observable.fromEvent<KeyboardEvent>(this.element.nativeElement, 'keydown')
      .filter(event => event.key === Key.ArrowLeft || event.key === Key.ArrowRight)
      .map((event: KeyboardEvent) => keysDown => event.key !== keysDown.last() ? keysDown.push(event.key) : keysDown);
    const keyup$ = Observable.fromEvent<KeyboardEvent>(this.element.nativeElement, 'keyup')
      .filter((event: KeyboardEvent) => event.key === Key.ArrowLeft || event.key === Key.ArrowRight)
      .map((event: KeyboardEvent) => keysDown => keysDown.filterNot(e => e === event.key));
    const initialState = List<KeyName>();
    return Observable.merge(keydown$, keyup$)
      .scan((state, reducer) => reducer(state), initialState)
      .startWith(initialState);
  }

  private static animationFrame$(controls$: Observable<List<KeyName>>): Observable<FrameContext> {
    const clock$ = Observable.interval(0, Scheduler.animationFrame)
      .map(() => state => {
        const time = performance.now();
        return Object.assign(state, {
          time: time,
          delta: time - state.time,
        });
      })
      .scan((state, reducer) => reducer(state), {time: performance.now(), delta: 0} as FrameContext);
    return clock$.withLatestFrom(controls$, (timeAndDelta, keysDown) =>
      Object.assign(timeAndDelta, {keysDown: keysDown}) as FrameContext);
  }

  @HostListener('window:resize')
  resize() {
    if (this.camera && this.renderer) {
      const width = this.element.nativeElement.offsetWidth;
      const height = this.element.nativeElement.offsetHeight;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.frustum = new Frustum().setFromMatrix(
        new Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
    }
  }

  private initialState() {
    this.renderer = this.initialRenderer();
    this.scene = new Scene();
    this.camera = GameComponent.initialCamera(this.scene);
    this.stats = this.initialStats();
    this.projectiles = List<Projectile>();
    this.ship = this.initialShip(this.scene);
    //this.boss = this.initialBoss(this.scene);
    this.resize();
  }

  private initialStats(): any {
    const stats = new Stats();
    this.element.nativeElement.appendChild(stats.domElement);
    stats.domElement.style.cssText = stats.domElement.style.cssText.replace('top', 'bottom');
    return stats;
  }

  private initialRenderer(): WebGLRenderer {
    const renderer = new WebGLRenderer({
      antialias: true,
    });
    renderer.setPixelRatio(Math.floor(window.devicePixelRatio));
    this.element.nativeElement.appendChild(renderer.domElement);
    return renderer;
  }

  private static initialCamera(scene: Scene): PerspectiveCamera {
    const camera = new PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    camera.position.z = 20;
    camera.lookAt(scene.position);
    camera.updateMatrixWorld(false);
    camera.matrixAutoUpdate = false;
    return camera;
  }

  // private initialBoss(scene: Scene): Boss {
  //   let position = {x: 0, y: 10, z: 0};
  //   const boss = new Boss(
  //     Helpers.boxMeshWithPosition(new Color(0xb22323), {x: 2, y: 2, z: 2}, position),
  //     0.3,
  //     new ProjectilesSpawner(
  //       100,
  //       Helpers.boxMeshWithPosition(new Color(0xb22323), {x: 0.5, y: 0.5, z: 0.5}, position),
  //       0.5,
  //       p => {
  //         this.projectiles = this.projectiles.push(p);
  //         scene.add(p.mesh);
  //       },
  //     ));
  //   scene.add(boss.mesh);
  //   boss.projectilesSpawner.start();
  //   return boss;
  // }

  private initialShip(scene: Scene): Ship {
    const projectileSpawnerMesh = Helpers.boxMesh(new Color(0xb22323), {x: 2, y: 2, z: 2});
    let projectilesSpawner = new ProjectilesSpawner(100, projectileSpawnerMesh, 0.5, projectile => {
      this.projectiles = this.projectiles.push(projectile);
      scene.add(projectile.mesh);
    });
    const shipMesh = Helpers.boxMeshWithPosition(new Color(0x144091), {x: 1, y: 1, z: 1}, new Vector3(0, -10, 0));
    const ship = new Ship(scene, shipMesh, 0.3, projectilesSpawner);
    ship.projectilesSpawner.start();
    return ship;
  }

  private drawLoop(frameContext: FrameContext) {
    this.stats.update();
    GameComponent.updateShip(this.ship, frameContext.keysDown);
    //GameComponent.updateBoss(this.boss);
    this.projectiles = GameComponent.updateProjectiles(this.projectiles, this.scene, this.frustum);
    this.renderer.render(this.scene, this.camera);
    // const shipp = this.scene.children[0];
    // const spawner = shipp.children[0];
    // console.log(shipp.position, shipp.getWorldPosition());
    // console.log(spawner.position, spawner.getWorldPosition());
  }

  // private static updateBoss(boss: Boss) {
  //   boss.mesh.rotation.x += 0.01;
  //   boss.mesh.rotation.y += 0.01;
  // }

  private static updateShip(ship: Ship, keysDown: List<KeyName>) {
    if (!keysDown.isEmpty()) {
      ship.move(Controls.currentDirection(keysDown));
    }
  }

  private static updateProjectiles(projectiles: List<Projectile>, scene: Scene, frustum: Frustum): List<Projectile> {
    return projectiles
      .map(p => {
        p.move();
        p.mesh.geometry.computeBoundingSphere();
        return p;
      })
      .filter(p => {
        let isInFrustum = frustum.intersectsObject(p.mesh);
        if (!isInFrustum) {
          scene.remove(p.mesh);
        }
        return isInFrustum;
      });
  }
}
