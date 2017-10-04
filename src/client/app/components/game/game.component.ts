// libs
import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
// app
import {getNames, IAppState} from '../../modules/ngrx/index';
import * as Stats from 'stats.js/build/stats.min';
import {List} from 'immutable';
import {Frustum, Matrix4, PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import {Ship} from './classes/ship';
import {Controls, Key, KeyName} from './classes/controls';
import {Helpers} from './classes/helpers';
import {Projectile} from './classes/projectile';
import {RepeatingTimer} from './classes/repeating-timer';
import {Boss} from './classes/boss';

@Component({
  moduleId: module.id,
  selector: 'sd-game',
  templateUrl: 'game.component.html',
  styleUrls: ['game.component.css'],
})
export class GameComponent implements OnInit {
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

  @HostListener('window:resize')
  resize() {
    if (this.camera && this.renderer) {
      const width = this.element.nativeElement.offsetWidth;
      const height = this.element.nativeElement.offsetHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.frustum = new Frustum().setFromMatrix(new Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
    }
  }

  keyDown(event: KeyboardEvent) {
    if (event.key === Key.ArrowLeft || event.key === Key.ArrowRight) {
      if (event.key !== this.controls.keyboardInputs.last()) {
        this.controls.keyboardInputs = this.controls.keyboardInputs.push(event.key);
      }
    }
  }

  keyUp(event: KeyboardEvent) {
    if (event.key === Key.ArrowLeft || event.key === Key.ArrowRight) {
      this.controls.keyboardInputs = List<KeyName>(this.controls.keyboardInputs.filterNot(e => e === event.key));
    }
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
    this.boss = new Boss(Helpers.boxMesh(0xb22323, {x: 2, y: 2, z: 2}, {x: 0, y: 10, z: 0}));
    new RepeatingTimer(100, () => {
      let firedProjectile = this.boss.firedProjectile();
      this.scene.add(firedProjectile.mesh);
      this.projectiles = this.projectiles.push(firedProjectile);
    }).start();
  }

  private initShip() {
    this.ship = new Ship(Helpers.boxMesh(0x144091, {x: 1, y: 1, z: 1}, {x: 0, y: -10, z: 0}), 0.3);
    new RepeatingTimer(100, () => {
      let firedProjectile = this.ship.firedProjectile();
      this.scene.add(firedProjectile.mesh);
      this.projectiles = this.projectiles.push(firedProjectile);
    }).start();
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
      .filter(p => this.frustum.intersectsObject(p.mesh));
  }
}
