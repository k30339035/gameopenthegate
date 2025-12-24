/**
 * RenderSystem - Manages rendering and updates instanced meshes
 */

import { System } from '../core/System.js';
import { InstancedDroneRenderer } from '../rendering/InstancedDroneRenderer.js';

export class RenderSystem extends System {
    constructor(scene, camera) {
        super();
        this.requiredComponents = ['TransformComponent', 'InstancedMeshComponent'];
        this.scene = scene;
        this.camera = camera;

        // Create instanced renderer for drones
        this.droneRenderer = new InstancedDroneRenderer(scene, 10000);
    }

    update(entities, deltaTime) {
        // Update all drone instances
        this.droneRenderer.updateInstances(entities);
    }

    /**
     * Get renderer for external access
     */
    getDroneRenderer() {
        return this.droneRenderer;
    }

    cleanup() {
        this.droneRenderer.dispose();
    }
}
