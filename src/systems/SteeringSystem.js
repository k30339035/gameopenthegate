/**
 * SteeringSystem - Integrates all steering forces and updates velocity
 * This runs AFTER all other force-calculating systems
 */

import { System } from '../core/System.js';
import { MathUtils } from '../utils/MathUtils.js';

export class SteeringSystem extends System {
    constructor() {
        super();
        this.requiredComponents = ['VelocityComponent'];
    }

    update(entities, deltaTime) {
        for (const entity of entities) {
            const velocity = entity.getComponent('VelocityComponent');

            // Limit acceleration to maxForce
            MathUtils.limitVector(velocity.acceleration, velocity.maxForce);

            // Integrate acceleration into velocity
            velocity.velocity.add(velocity.acceleration);

            // Limit velocity to maxSpeed
            MathUtils.limitVector(velocity.velocity, velocity.maxSpeed);

            // Reset acceleration for next frame
            velocity.acceleration.set(0, 0, 0);
        }
    }
}
