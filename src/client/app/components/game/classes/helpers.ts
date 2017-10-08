import {BoxGeometry, Color, Mesh, MeshBasicMaterial, Vector3} from 'three';

type Scale = { x: number, y: number, z: number };

export class Helpers {
  static boxMeshWithPosition(color: Color, scale: Scale, position: Vector3): Mesh {
    const mesh = Helpers.boxMesh(color, scale);
    mesh.position.copy(position);
    return mesh;
  }

  static boxMesh(color: Color, scale: Scale): Mesh {
    return new Mesh(new BoxGeometry(scale.x, scale.y, scale.z), new MeshBasicMaterial({color: color}));
  }
}
