/**
 * LODSystem - Level of Detail management
 */

import { System } from '../core/System.js';

export class LODSystem extends System {
    constructor(camera) {
        super();
        this.requiredComponents = ['TransformComponent', 'LODComponent'];
        this.camera = camera;
    }

    update(entities, deltaTime) {
        const cameraPos = this.camera.position;

        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const lod = entity.getComponent('LODComponent');

            // Calculate distance to camera
            lod.distanceToCamera = transform.position.distanceTo(cameraPos);

            // Determine LOD level
            let newLevel = 0;
            for (let i = lod.levels.length - 1; i >= 0; i--) {
                if (lod.distanceToCamera >= lod.levels[i].distance) {
                    newLevel = i;
                    break;
                }
            }

            // Update LOD if changed
            if (newLevel !== lod.currentLevel) {
                lod.currentLevel = newLevel;
                // In a full implementation, we'd swap geometries here
                // For now, just track the level
            }
        }
    }
}
