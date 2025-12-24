/**
 * BoidSystem - Implements Craig Reynolds' Boids algorithm
 * Computes separation, alignment, and cohesion forces
 */

import { System } from '../core/System.js';
import * as THREE from 'three';

export class BoidSystem extends System {
    constructor() {
        super();
        this.requiredComponents = ['TransformComponent', 'VelocityComponent', 'BoidComponent'];

        // Temporary vectors (reused to avoid allocations)
        this.tempVec = new THREE.Vector3();
        this.separationForce = new THREE.Vector3();
        this.alignmentForce = new THREE.Vector3();
        this.cohesionForce = new THREE.Vector3();
    }

    update(entities, deltaTime) {
        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const velocity = entity.getComponent('VelocityComponent');
            const boid = entity.getComponent('BoidComponent');

            if (boid.neighbors.length === 0) continue;

            // Calculate boid forces
            this.calculateSeparation(entity, transform, boid);
            this.calculateAlignment(entity, velocity, boid);
            this.calculateCohesion(entity, transform, boid);

            // Apply weighted forces to acceleration
            this.tempVec.set(0, 0, 0);
            this.tempVec.add(this.separationForce.multiplyScalar(boid.separationWeight));
            this.tempVec.add(this.alignmentForce.multiplyScalar(boid.alignmentWeight));
            this.tempVec.add(this.cohesionForce.multiplyScalar(boid.cohesionWeight));

            // Add to acceleration
            velocity.acceleration.add(this.tempVec);
        }
    }

    /**
     * Separation - Avoid crowding neighbors
     */
    calculateSeparation(entity, transform, boid) {
        this.separationForce.set(0, 0, 0);
        let count = 0;

        for (const neighbor of boid.neighbors) {
            const neighborTransform = neighbor.getComponent('TransformComponent');
            const distance = transform.position.distanceTo(neighborTransform.position);

            // Only separate if within separation radius
            if (distance < boid.separationRadius && distance > 0) {
                // Calculate repulsion force (inverse square law)
                this.tempVec.subVectors(transform.position, neighborTransform.position);
                this.tempVec.normalize();
                this.tempVec.divideScalar(distance); // Weight by distance (closer = stronger)

                this.separationForce.add(this.tempVec);
                count++;
            }
        }

        if (count > 0) {
            this.separationForce.divideScalar(count);
        }
    }

    /**
     * Alignment - Steer towards average heading of neighbors
     */
    calculateAlignment(entity, velocity, boid) {
        this.alignmentForce.set(0, 0, 0);
        let count = 0;

        for (const neighbor of boid.neighbors) {
            const neighborVelocity = neighbor.getComponent('VelocityComponent');
            if (neighborVelocity) {
                this.alignmentForce.add(neighborVelocity.velocity);
                count++;
            }
        }

        if (count > 0) {
            this.alignmentForce.divideScalar(count);
            this.alignmentForce.normalize();
            this.alignmentForce.multiplyScalar(velocity.maxSpeed);
            this.alignmentForce.sub(velocity.velocity); // Steering = desired - current
        }
    }

    /**
     * Cohesion - Steer towards average position of neighbors
     */
    calculateCohesion(entity, transform, boid) {
        this.cohesionForce.set(0, 0, 0);
        let count = 0;

        for (const neighbor of boid.neighbors) {
            const neighborTransform = neighbor.getComponent('TransformComponent');
            this.cohesionForce.add(neighborTransform.position);
            count++;
        }

        if (count > 0) {
            this.cohesionForce.divideScalar(count);
            this.cohesionForce.sub(transform.position); // Direction to center
            this.cohesionForce.normalize();
            this.cohesionForce.multiplyScalar(0.5); // Moderate force
        }
    }
}
