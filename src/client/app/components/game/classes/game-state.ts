import {AnimationClip, AnimationMixer, Frustum, Mesh, PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import {Ship} from './ship';
import {Boss} from './boss';

export class GameState {
  constructor(public renderer: WebGLRenderer,
    public stats: any,
    public scene: Scene,
    public camera: PerspectiveCamera,
    public frustum: Frustum,
    public ship: Ship,
    public bossesAssets: [Mesh, AnimationClip][],
    public boss: Boss,
    public mixer: AnimationMixer) {
  }
}
