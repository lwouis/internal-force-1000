// libs
import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
// app
import {getNames, IAppState} from '../../modules/ngrx/index';
import * as Stats from 'stats.js/build/stats.min';
import {List} from 'immutable';
import {Color, Frustum, Matrix4, PerspectiveCamera, Scene, SceneUtils, WebGLRenderer} from 'three';
import {Ship} from './classes/ship';
import {Controls, Key, KeyName} from './classes/controls';
import {Helpers} from './classes/helpers';
import {Projectile} from './classes/projectile';
import {Boss} from './classes/boss';
import {ProjectilesSpawner} from './classes/projectiles-spawner';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {Scheduler} from 'rxjs/Rx';

@Component({
  moduleId: module.id,
  selector: 'sd-game',
  templateUrl: 'game.component.html',
  styleUrls: ['game.component.css'],
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') canvas: ElementRef;

  names$: Observable<any>;
  private renderer: WebGLRenderer;
  private stats: Stats;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private ship: Ship;
  private boss: Boss;
  private controls: Controls;
  private projectiles: List<Projectile>;
  private frustum: Frustum;
  private resize$: Subject;
  private keyup$: Observable;
  private keydown$: Observable;

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

  constructor(private store: Store<IAppState>, private element: ElementRef) {}

  ngOnInit() {
    this.names$ = this.store.let(getNames);
    this.init();
    this.drawLoop();
    this.resize();
  }

  ngAfterViewInit() {
    this.keyup$ = Observable.fromEvent(this.canvas.nativeElement, 'keyup');
    this.keyup$.subscribe((event: KeyboardEvent) => {
      if (event.key === Key.ArrowLeft || event.key === Key.ArrowRight) {
        this.controls.keyboardInputs = List<KeyName>(this.controls.keyboardInputs.filterNot(e => e === event.key));
      }
    });

    this.keydown$ = Observable.fromEvent(this.canvas.nativeElement, 'keydown');
    this.keydown$.subscribe((event: KeyboardEvent) => {
      if (event.key === Key.ArrowLeft || event.key === Key.ArrowRight) {
        if (event.key !== this.controls.keyboardInputs.last()) {
          this.controls.keyboardInputs = this.controls.keyboardInputs.push(event.key);
        }
      }
    });

    this.resize$ = new Subject();
    this.resize$.subscribe(() => {
      if (this.camera && this.renderer) {
        const width = this.element.nativeElement.offsetWidth;
        const height = this.element.nativeElement.offsetHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.frustum = new Frustum().setFromMatrix(new Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
      }
    });

    const increaseButton = document.querySelector('#increase');
    const increase = this.keyup$
      .map(() => state => state.update('count', count => count + 1));

    const decreaseButton = document.querySelector('#decrease');
    const decrease = Observable
      .fromEvent(decreaseButton, 'click')
      .map(() => state => state.update('count', count => count - 1));

    const inputElement = document.querySelector('#input');
    const input = Observable
      .fromEvent(inputElement, 'input')
      .map(event => state => state.set('count', event.target.value));

    const clock = Observable
      .interval(0, Scheduler.animationFrame)
      .scan(
        previous => {
          const time = performance.now();
          return previous.merge({
            time,
            delta: time - previous.get('time'),
          });
        },
        Immutable.fromJS({
          time: performance.now(),
          delta: 0,
        }),
      );

    const initialState = Immutable.fromJS({
      count: 0,
      inputValue: '',
    });

    const state = Observable
      .merge(increase, decrease, input)
      .scan((state, changeFn) => changeFn(state), initialState);

    const loop = clock.withLatestFrom(state, (clock, state) => ({clock, state}));

    loop.subscribe(({clock, state}) => {
      document.querySelector('#count').innerHTML = state.get('count');
      document.querySelector('#hello').innerHTML = `Hello ${state.get(
        'inputValue',
      )}`;
    });

    loop.sampleTime(250, Scheduler.animationFrame).subscribe(({clock}) => {
      document.querySelector('#clock').innerHTML = `${Math.round(
        clock.get('delta') * 1000,
      )}μs`;
    });
  }

  @HostListener('window:resize')
  resize() {
    this.resize$.next();
  }

  private init() {
    this.initStats();
    this.initRenderer();
    this.initControls();
    this.initScene();
    this.resize();
  }

  private initStats() {
    this.stats = new Stats();
    this.element.nativeElement.appendChild(this.stats.domElement);
    this.stats.domElement.style.cssText = this.stats.domElement.style.cssText.replace('top', 'bottom');
  }

  private initRenderer() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas.nativeElement,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.floor(window.devicePixelRatio));
    this.element.nativeElement.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new Scene();
    this.initCamera();
    this.initShip();
    this.initBoss();
    this.initProjectiles();
    this.scene.add(this.ship.mesh, this.boss.mesh);
  }

  private initCamera() {
    this.camera = new PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    this.camera.position.z = 20;
    this.camera.lookAt(this.scene.position);
  }

  private initBoss() {
    let position = {x: 0, y: 10, z: 0};
    this.boss = new Boss(
      Helpers.boxMesh(new Color(0xb22323), {x: 2, y: 2, z: 2}, position),
      0.3,
      new ProjectilesSpawner(
        100,
        Helpers.boxMesh(new Color(0xb22323), {x: 0.5, y: 0.5, z: 0.5}, position),
        0.5,
        p => {
          this.projectiles = this.projectiles.push(p);
          this.scene.add(p.mesh);
        },
      ));
    this.boss.projectilesSpawner.start();
  }

  private initShip() {
    let position = {x: 0, y: -10, z: 0};
    let projectilesSpawner = new ProjectilesSpawner(100, Helpers.boxMesh(new Color(0x144091), {x: 0.5, y: 0.5, z: 0.5}, position), 0.5, p => {
      this.projectiles = this.projectiles.push(p);
      this.scene.add(p.mesh);
    });
    console.log(this.scene);
    this.ship = new Ship(Helpers.boxMesh(new Color(0x144091), {x: 1, y: 1, z: 1}, position), 0.3, projectilesSpawner);
    this.ship.projectilesSpawner.start();
  }

  private initControls() {
    this.controls = new Controls(List());
  }

  private initProjectiles() {
    this.projectiles = List<Projectile>();
  }

  private drawLoop() {
    this.stats.update();
    this.updateShip();
    this.updateBoss();
    this.updateProjectiles();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.drawLoop());
  }

  private updateBoss() {
    this.boss.mesh.rotation.x += 0.01;
    this.boss.mesh.rotation.y += 0.01;
  }

  private updateShip() {
    if (!this.controls.keyboardInputs.isEmpty()) {
      this.ship.move(this.controls.currentDirection());
    }
  }

  private updateProjectiles() {
    this.projectiles = this.projectiles
      .map(p => {
        p.move();
        return p;
      })
      .filter(p => {
        let isInFrustrum = this.frustum.intersectsObject(p.mesh);
        if (!isInFrustrum) {
          this.scene.remove(p.mesh);
        }
        return isInFrustrum;
      });
  }
}
