/**
 * PhysicsSystem - Integrates physics (velocity to position)
 */

import { System } from '../core/System.js';
import * as THREE from 'three';

export class PhysicsSystem extends System {
    constructor() {
        super();
        this.requiredComponents = ['TransformComponent', 'VelocityComponent', 'RigidbodyComponent'];
        this.gravity = new THREE.Vector3(0, -9.8, 0);
    }

    update(entities, deltaTime) {
        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const velocity = entity.getComponent('VelocityComponent');
            const rigidbody = entity.getComponent('RigidbodyComponent');

            // Skip kinematic objects (controlled by code, not physics)
            if (rigidbody.isKinematic) continue;

            // Skip sleeping objects (performance optimization)
            if (rigidbody.sleeping) {
                // Wake up if velocity is non-zero (external force applied)
                if (velocity.velocity.lengthSq() > 0.01) {
                    rigidbody.sleeping = false;
                } else {
                    continue;
                }
            }

            // Apply gravity
            if (rigidbody.useGravity) {
                velocity.velocity.addScaledVector(this.gravity, deltaTime);
            }

            // Apply drag
            velocity.velocity.multiplyScalar(rigidbody.drag);

            // Integrate velocity to position
            transform.position.addScaledVector(velocity.velocity, deltaTime);

            // Update rotation based on velocity (drones face movement direction)
            if (velocity.velocity.lengthSq() > 0.1) {
                const direction = velocity.velocity.clone().normalize();
                const angle = Math.atan2(direction.x, direction.z);
                transform.rotation.y = angle;
            }

            // Sleep check (performance optimization)
            if (velocity.velocity.lengthSq() < 0.01 && velocity.acceleration.lengthSq() < 0.01) {
                rigidbody.sleeping = true;
            }
        }
    }
}
