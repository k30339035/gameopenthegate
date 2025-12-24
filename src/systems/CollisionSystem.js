/**
 * CollisionSystem - Detects and responds to collisions
 */

import { System } from '../core/System.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { AgentState } from '../components/AgentComponent.js';
import * as THREE from 'three';

export class CollisionSystem extends System {
    constructor(spatialHashSystem) {
        super();
        this.requiredComponents = ['TransformComponent', 'ColliderComponent'];
        this.spatialHashSystem = spatialHashSystem;
        this.collisions = []; // Store collisions for this frame
    }

    update(entities, deltaTime) {
        this.collisions.length = 0;

        const spatialHash = this.spatialHashSystem.getSpatialHash();

        // Broad phase + narrow phase collision detection
        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const collider = entity.getComponent('ColliderComponent');

            // Get nearby entities from spatial hash
            const nearby = spatialHash.getNearby(transform.position, collider.radius * 2);

            // Check collision with each nearby entity
            for (const other of nearby) {
                if (entity === other) continue;
                if (entity.id > other.id) continue; // Avoid duplicate checks

                const collision = CollisionDetector.checkCollision(entity, other);

                if (collision) {
                    this.collisions.push({
                        entityA: entity,
                        entityB: other,
                        ...collision
                    });

                    // Apply collision response
                    this.resolveCollision(entity, other, collision, deltaTime);
                }
            }
        }
    }

    /**
     * Resolve collision between two entities
     */
    resolveCollision(entityA, entityB, collision, deltaTime) {
        const colliderA = entityA.getComponent('ColliderComponent');
        const colliderB = entityB.getComponent('ColliderComponent');

        // If either is a trigger, don't apply physics response
        if (colliderA.isTrigger || colliderB.isTrigger) {
            this.handleTrigger(entityA, entityB, collision);
            return;
        }

        const transformA = entityA.getComponent('TransformComponent');
        const transformB = entityB.getComponent('TransformComponent');
        const velocityA = entityA.getComponent('VelocityComponent');
        const velocityB = entityB.getComponent('VelocityComponent');
        const rigidbodyA = entityA.getComponent('RigidbodyComponent');
        const rigidbodyB = entityB.getComponent('RigidbodyComponent');

        // Separate overlapping objects
        const separation = collision.normal.clone().multiplyScalar(collision.penetration / 2);

        if (rigidbodyA && !rigidbodyA.isKinematic) {
            transformA.position.add(separation);
        }
        if (rigidbodyB && !rigidbodyB.isKinematic) {
            transformB.position.sub(separation);
        }

        // Apply impulse (simplified elastic collision)
        if (velocityA && velocityB && rigidbodyA && rigidbodyB) {
            const relativeVelocity = new THREE.Vector3().subVectors(
                velocityA.velocity,
                velocityB.velocity
            );

            const velocityAlongNormal = relativeVelocity.dot(collision.normal);

            // Don't resolve if velocities are separating
            if (velocityAlongNormal > 0) return;

            // Calculate impulse
            const restitution = 0.5; // Bounciness
            const impulseScalar = -(1 + restitution) * velocityAlongNormal;
            const impulse = collision.normal.clone().multiplyScalar(impulseScalar);

            // Apply impulse
            if (!rigidbodyA.isKinematic) {
                velocityA.velocity.add(impulse.clone().multiplyScalar(1 / rigidbodyA.mass));
            }
            if (!rigidbodyB.isKinematic) {
                velocityB.velocity.sub(impulse.clone().multiplyScalar(1 / rigidbodyB.mass));
            }
        }

        // Damage handling
        this.handleCollisionDamage(entityA, entityB, collision);
    }

    /**
     * Handle trigger collisions (no physics response)
     */
    handleTrigger(entityA, entityB, collision) {
        // Implement trigger logic (e.g., pickup detection, zone entry)
        // For now, just log
        // console.log('Trigger collision detected');
    }

    /**
     * Handle damage from collisions
     */
    handleCollisionDamage(entityA, entityB, collision) {
        const agentA = entityA.getComponent('AgentComponent');
        const agentB = entityB.getComponent('AgentComponent');
        const velocityA = entityA.getComponent('VelocityComponent');
        const velocityB = entityB.getComponent('VelocityComponent');

        // Calculate impact force
        let impactForce = 0;
        if (velocityA && velocityB) {
            const relativeVelocity = new THREE.Vector3().subVectors(
                velocityA.velocity,
                velocityB.velocity
            );
            impactForce = relativeVelocity.length();
        }

        // Apply damage based on impact force
        const damageThreshold = 5.0; // Minimum velocity for damage
        if (impactForce > damageThreshold) {
            const damage = (impactForce - damageThreshold) * 2;

            if (agentA) {
                agentA.health -= damage;
                if (agentA.health > 0 && agentA.health < 50) {
                    agentA.state = AgentState.DEFENDING;
                }
            }

            if (agentB) {
                agentB.health -= damage;
                if (agentB.health > 0 && agentB.health < 50) {
                    agentB.state = AgentState.DEFENDING;
                }
            }
        }
    }

    /**
     * Get collisions from this frame (for visualization/debugging)
     */
    getCollisions() {
        return this.collisions;
    }
}
