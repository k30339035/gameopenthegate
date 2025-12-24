/**
 * DestructionSystem - Handles destruction of environment objects
 */

import { System } from '../core/System.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { RigidbodyComponent } from '../components/RigidbodyComponent.js';
import { ColliderComponent, ColliderShape } from '../components/ColliderComponent.js';
import { MathUtils } from '../utils/MathUtils.js';

export class DestructionSystem extends System {
    constructor(entityManager, scene) {
        super();
        this.requiredComponents = ['DestructibleComponent'];
        this.entityManager = entityManager;
        this.scene = scene;
    }

    update(entities, deltaTime) {
        for (const entity of entities) {
            const destructible = entity.getComponent('DestructibleComponent');

            // Check if should be destroyed
            if (destructible.health <= 0 && !destructible.destroyed) {
                destructible.destroyed = true;
                this.destroyObject(entity);
            }
        }
    }

    /**
     * Destroy an object and spawn debris
     */
    destroyObject(entity) {
        const transform = entity.getComponent('TransformComponent');
        const destructible = entity.getComponent('DestructibleComponent');

        if (!transform) return;

        // Spawn debris
        for (let i = 0; i < destructible.debrisCount; i++) {
            this.spawnDebris(transform.position, transform.scale);
        }

        // Remove original entity
        this.entityManager.destroyEntity(entity);
    }

    /**
     * Spawn a debris piece
     */
    spawnDebris(position, scale) {
        const debris = this.entityManager.createEntity();

        // Random offset from original position
        const offset = MathUtils.randomInSphere(scale.x);
        const debrisPos = position.clone().add(offset);

        // Transform
        const transform = new TransformComponent(debrisPos.x, debrisPos.y, debrisPos.z);
        transform.scale.setScalar(scale.x * MathUtils.randomRange(0.2, 0.5));
        transform.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );

        // Velocity (explode outward)
        const velocity = new VelocityComponent();
        velocity.velocity.copy(offset.normalize()).multiplyScalar(MathUtils.randomRange(5, 15));
        velocity.velocity.y += 5; // Upward bias

        // Rigidbody
        const rigidbody = new RigidbodyComponent();
        rigidbody.useGravity = true;
        rigidbody.mass = 0.5;

        // Collider
        const collider = new ColliderComponent(ColliderShape.BOX, transform.scale.x);

        debris
            .addComponent(transform)
            .addComponent(velocity)
            .addComponent(rigidbody)
            .addComponent(collider);

        // Auto-cleanup after 10 seconds
        setTimeout(() => {
            if (debris.active) {
                this.entityManager.destroyEntity(debris);
            }
        }, 10000);

        return debris;
    }
}
