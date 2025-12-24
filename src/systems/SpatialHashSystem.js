/**
 * SpatialHashSystem - Updates spatial hash grid for efficient neighbor queries
 */

import { System } from '../core/System.js';
import { SpatialHash } from '../utils/SpatialHash.js';

export class SpatialHashSystem extends System {
    constructor() {
        super();
        this.requiredComponents = ['TransformComponent', 'BoidComponent'];
        this.spatialHash = new SpatialHash(3.0); // 3-unit cells
    }

    update(entities, deltaTime) {
        // Clear previous frame's grid
        this.spatialHash.clear();

        // Insert all entities into grid
        for (const entity of entities) {
            this.spatialHash.insert(entity);
        }

        // Update neighbor lists for each entity
        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const boid = entity.getComponent('BoidComponent');

            // Get nearby entities
            const nearby = this.spatialHash.getNearby(
                transform.position,
                boid.neighborRadius
            );

            // Filter to actual neighbors (within radius)
            boid.neighbors = nearby.filter(other => {
                if (other === entity) return false;

                const otherTransform = other.getComponent('TransformComponent');
                if (!otherTransform) return false;

                const distSq = transform.position.distanceToSquared(otherTransform.position);
                return distSq < boid.neighborRadius * boid.neighborRadius;
            });
        }
    }

    /**
     * Get spatial hash for external use (collision detection, etc.)
     */
    getSpatialHash() {
        return this.spatialHash;
    }
}
