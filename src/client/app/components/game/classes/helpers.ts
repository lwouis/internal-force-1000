import {BoxGeometry, Color, Geometry, JSONLoader, Material, Mesh, MeshBasicMaterial, Object3D, ObjectLoader, Vector3} from 'three';

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

  static async sceneLoader(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      new ObjectLoader().load(url,
        (object3d) => resolve(object3d),
        event => {},
        (event: any) => {
          // typescript signatures are misleading as this is not a ErrorEvent
          event.target.status !== 200 ? reject(event.target.response) : reject(event);
        });
    });
  }
}
