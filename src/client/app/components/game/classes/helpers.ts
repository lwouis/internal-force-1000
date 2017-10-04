import {BoxGeometry, Mesh, MeshBasicMaterial} from 'three';

export class Helpers {
  static boxMesh(color: number, scale: { x: number, y: number, z: number }, position: { x: number, y: number, z: number }): Mesh {
    let mesh = new Mesh(new BoxGeometry(scale.x, scale.y, scale.z), new MeshBasicMaterial({color: color}));
    mesh.position.set(position.x, position.y, position.z);
    return mesh;
  }
}
