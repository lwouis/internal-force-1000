// libs
import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
// app
import {getNames, IAppState} from '../../modules/ngrx/index';
import * as THREE from 'three/build/three';
import * as Stats from 'stats.js/build/stats.min';
import {List} from 'immutable/dist/immutable';

@Component({
  moduleId: module.id,
  selector: 'sd-game',
  templateUrl: 'game.component.html',
  styleUrls: ['game.component.css'],
})
export class GameComponent implements OnInit {
  @ViewChild('canvas') canvas: ElementRef;

  names$: Observable<any>;
  private renderer: THREE.WebGLRenderer;
  private stats: Stats;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private ship: THREE.Mesh;
  private boss: THREE.Mesh;
  private shipSpeed: number;
  private shipMoveVector: List<number>;

  private static box(color: number, scale: [number, number, number], position: [number, number, number]) {
    let mesh = new THREE.Mesh(new THREE.BoxGeometry(...scale), new THREE.MeshBasicMaterial({color: color}));
    mesh.position.set(...position);
    return mesh;
  }

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
    }
  }

  keyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft' && this.shipMoveVector.last() !== -1) {
      this.shipMoveVector = this.shipMoveVector.push(-1);
    } else if (event.key === 'ArrowRight' && this.shipMoveVector.last() !== 1) {
      this.shipMoveVector = this.shipMoveVector.push(1);
    }
  }

  keyUp(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.shipMoveVector = this.shipMoveVector.filter(e => e !== -1);
    } else if (event.key === 'ArrowRight') {
      this.shipMoveVector = this.shipMoveVector.filter(e => e !== 1);
    }
  }

  private init() {
    this.initStats();
    this.initRenderer();
    this.initScene();
    this.resize();
  }

  private initStats() {
    this.stats = new Stats();
    this.element.nativeElement.appendChild(this.stats.domElement);
    this.stats.domElement.style.cssText = this.stats.domElement.style.cssText.replace('top', 'bottom');
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas.nativeElement,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.floor(window.devicePixelRatio));
    this.element.nativeElement.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.initCamera();
    this.initShip();
    this.initBoss();
    this.scene.add(this.ship, this.boss);
  }

  private initCamera() {
    this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    this.camera.position.z = 20;
    this.camera.lookAt(this.scene.position);
  }

  private initBoss() {
    this.boss = GameComponent.box(0xb22323, [2, 2, 2], [0, 10, 0]);
  }

  private initShip() {
    this.ship = GameComponent.box(0x144091, [1, 1, 1], [0, -10, 0]);
    this.shipSpeed = 0.1;
    this.shipMoveVector = List<number>();
  }

  private drawLoop() {
    this.stats.update();
    this.updateShip();
    this.updateBoss();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.drawLoop());
  }

  private updateBoss() {
    this.boss.rotation.x += 0.01;
    this.boss.rotation.y += 0.01;
  }

  private updateShip() {
    this.ship.rotation.x += 0.01;
    this.ship.rotation.y += 0.01;
    if (!this.shipMoveVector.isEmpty()) {
      this.ship.position.x += this.shipMoveVector.last() * this.shipSpeed;
    }
  }
}
