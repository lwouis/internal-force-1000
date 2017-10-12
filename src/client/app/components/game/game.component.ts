// libs
import {AfterViewInit, Component, ElementRef, HostListener} from '@angular/core';
import {Observable} from 'rxjs/Observable';
// app
import * as Stats from 'stats.js/build/stats.min';
import {List} from 'immutable';
import {AnimationMixer, Color, Frustum, Matrix4, Mesh, PerspectiveCamera, Scene, Vector3, WebGLRenderer, AmbientLight,} from 'three';
import {Ship} from './classes/ship';
import {Controls, Key, KeyName} from './classes/controls';
import {Helpers} from './classes/helpers';
import {Projectile} from './classes/projectile';
import {Boss} from './classes/boss';
import {ProjectilesSpawner} from './classes/projectiles-spawner';
import {Scheduler} from 'rxjs/Rx';
import {FrameContext} from './classes/frame-context';
import {GameState} from './classes/game-state';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

@Component({
  moduleId: module.id,
  selector: 'sd-game',
  templateUrl: 'game.component.html',
  styleUrls: ['game.component.css'],
})
export class GameComponent implements AfterViewInit {
  private projectiles: List<Projectile>;
  private resize$ = new BehaviorSubject(true);

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

  @HostListener('window:resize')
  resize() {
    this.resize$.next(true);
  }

  async ngAfterViewInit() {
    const initialState = await this.initialState();
    GameComponent.animationFrame$(this.controls$(), this.resize$)
      .scan((gameState, frameContext) => this.drawLoop(gameState, frameContext), initialState)
      .subscribe();
  }

  private controls$(): Observable<List<KeyName>> {
    // tabIndex = 0 makes the element keyboard focusable, so it generates keyboard events
    this.element.nativeElement.tabIndex = 0;
    const isRightOrLeft = (event: KeyboardEvent) => event.key === Key.ArrowLeft || event.key === Key.ArrowRight;
    const keydown$ = Observable.fromEvent<KeyboardEvent>(this.element.nativeElement, 'keydown')
      .filter(isRightOrLeft)
      .map((event: KeyboardEvent) => keysDown => event.key !== keysDown.last() ? keysDown.push(event.key) : keysDown);
    const keyup$ = Observable.fromEvent<KeyboardEvent>(this.element.nativeElement, 'keyup')
      .filter(isRightOrLeft)
      .map((event: KeyboardEvent) => keysDown => keysDown.filterNot(e => e === event.key));
    const initialState = List<KeyName>();
    return Observable.merge(keydown$, keyup$)
      .scan((state, reducer) => reducer(state), initialState)
      .startWith(initialState);
  }

  private static animationFrame$(controls$: Observable<List<KeyName>>, resize$: BehaviorSubject<boolean>): Observable<FrameContext> {
    // TODO 1/60 is a workaround as Scheduler.animationFrame seems to have a bug and hits 120hz on my 60hz monitor
    const clock$ = Observable.interval(1000 / 60, Scheduler.animationFrame)
      .map(() => state => {
        const time = performance.now();
        return Object.assign({}, state, {
          time: time,
          delta: (time - state.time) / 1000,
        });
      })
      .scan((state, reducer) => reducer(state), {time: performance.now(), delta: 0} as FrameContext);
    return clock$.withLatestFrom(controls$, resize$, (timeAndDelta, keysDown, needResize) =>
      Object.assign({}, timeAndDelta, {
        keysDown: keysDown,
        needResize: needResize,
      }) as FrameContext);
  }

  private async initialState(): Promise<GameState> {
    const renderer = this.initialRenderer();
    const stats = this.initialStats();
    const scene = new Scene();
    scene.add(new AmbientLight(0x404040));
    const camera = GameComponent.initialCamera(scene);
    const frustum = new Frustum();
    const [boss, mixer] = await GameComponent.initialBoss(scene, 'assets/blender/boss.json');
    const ship = await GameComponent.initialShip(scene, 'assets/blender/ship.json');
    this.projectiles = List<Projectile>();
    ship.projectilesSpawner.projectiles$.subscribe(projectile => {
      this.projectiles = this.projectiles.push(projectile);
      scene.add(projectile.mesh);
    });
    return new GameState(renderer, stats, scene, camera, frustum, ship, boss, mixer);
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
    camera.position.y = -20;
    camera.lookAt(scene.position);
    camera.updateMatrixWorld(false);
    camera.matrixAutoUpdate = false;
    return camera;
  }

  private static async initialBoss(scene: Scene, url: string): Promise<[Boss, AnimationMixer]> {
    const [bossMesh, bossAnimation] = await Helpers.sceneLoader(url);
    scene.add(bossMesh);
    const mixer = new AnimationMixer(bossMesh);
    mixer.clipAction(bossAnimation).play();
    const boss = new Boss(bossMesh, 0.3, new ProjectilesSpawner(
      100,
      Helpers.boxMeshWithPosition(new Color(0xb22323), {x: 0.5, y: 0.5, z: 0.5}, new Vector3(0, 10, 0)),
      0.5,
    ));
    return [boss, mixer];
  }

  private static async initialShip(scene: Scene, url: string): Promise<Ship> {
    const [shipMesh, _] = await Helpers.sceneLoader('assets/blender/ship.json');
    const projectileSpawnerMesh = Helpers.boxMesh(new Color(0xb22323), {x: 2, y: 2, z: 2});
    let projectilesSpawner = new ProjectilesSpawner(100, projectileSpawnerMesh, 0.5);
    return new Ship(scene, shipMesh, 0.3, projectilesSpawner);
  }

  private drawLoop(gameState: GameState, frameContext: FrameContext): GameState {
    this.resizeIfNeeded(gameState, frameContext);
    gameState.stats.update();
    gameState.mixer.update(frameContext.delta);
    GameComponent.updateShip(gameState.ship, frameContext.keysDown);
    this.projectiles = GameComponent.updateProjectiles(this.projectiles, gameState.scene, gameState.frustum);
    gameState.renderer.render(gameState.scene, gameState.camera);
    return gameState;
  }

  private resizeIfNeeded(gameState: GameState, frameContext: FrameContext) {
    if (frameContext.needResize) {
      const width = this.element.nativeElement.offsetWidth;
      const height = this.element.nativeElement.offsetHeight;
      gameState.renderer.setSize(width, height);
      gameState.camera.aspect = width / height;
      gameState.camera.updateProjectionMatrix();
      gameState.frustum = gameState.frustum.setFromMatrix(new Matrix4()
        .multiplyMatrices(gameState.camera.projectionMatrix, gameState.camera.matrixWorldInverse));
      this.resize$.next(false);
    }
  }

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
