/**
 * CullingSystem - Frustum culling for performance
 */

import { System } from '../core/System.js';
import * as THREE from 'three';

export class CullingSystem extends System {
    constructor(camera) {
        super();
        this.requiredComponents = ['TransformComponent', 'InstancedMeshComponent'];
        this.camera = camera;
        this.frustum = new THREE.Frustum();
        this.projScreenMatrix = new THREE.Matrix4();
        this.sphere = new THREE.Sphere();
    }

    update(entities, deltaTime) {
        // Update frustum
        this.projScreenMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.projScreenMatrix);

        // Check each entity
        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const instancedMesh = entity.getComponent('InstancedMeshComponent');

            // Create bounding sphere for entity
            this.sphere.center.copy(transform.position);
            this.sphere.radius = transform.scale.x; // Assume uniform scale

            // Check if in frustum
            instancedMesh.visible = this.frustum.intersectsSphere(this.sphere);
        }
    }
}
