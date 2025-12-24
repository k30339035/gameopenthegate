/**
 * WeaponSystem - Handles player weapons and projectiles
 */

import { System } from '../core/System.js';
import { TransformComponent } from '../components/TransformComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { ColliderComponent, ColliderShape } from '../components/ColliderComponent.js';
import { ProjectileComponent, WeaponType } from '../components/WeaponComponent.js';
import { AgentState } from '../components/AgentComponent.js';
import * as THREE from 'three';

export class WeaponSystem extends System {
    constructor(entityManager, camera) {
        super();
        this.requiredComponents = ['ProjectileComponent', 'TransformComponent', 'VelocityComponent'];
        this.entityManager = entityManager;
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
    }

    update(entities, deltaTime) {
        // Update projectiles
        for (const entity of entities) {
            const projectile = entity.getComponent('ProjectileComponent');
            const transform = entity.getComponent('TransformComponent');

            // Age projectile
            projectile.age += deltaTime;

            // Destroy if lifetime exceeded
            if (projectile.age >= projectile.lifetime) {
                this.entityManager.destroyEntity(entity);
                continue;
            }

            // Check for hits
            this.checkProjectileHits(entity);
        }
    }

    /**
     * Fire a weapon
     * @param {THREE.Vector3} origin
     * @param {THREE.Vector3} direction
     * @param {WeaponComponent} weapon
     */
    fireWeapon(origin, direction, weapon) {
        const currentTime = performance.now() / 1000;

        // Check fire rate
        if (currentTime - weapon.lastFireTime < weapon.fireRate) {
            return null;
        }

        weapon.lastFireTime = currentTime;

        switch (weapon.type) {
            case WeaponType.GUN:
                return this.fireProjectile(origin, direction, weapon);

            case WeaponType.LASER:
                return this.fireLaser(origin, direction, weapon);

            case WeaponType.EXPLOSION:
                return this.fireExplosion(origin, weapon);

            default:
                return null;
        }
    }

    /**
     * Fire a projectile
     */
    fireProjectile(origin, direction, weapon) {
        const projectile = this.entityManager.createEntity();

        // Transform
        const transform = new TransformComponent(origin.x, origin.y, origin.z);
        transform.scale.setScalar(0.2);

        // Projectile component
        const projectileComp = new ProjectileComponent(weapon.damage, weapon.projectileSpeed);
        projectileComp.direction.copy(direction).normalize();

        // Velocity
        const velocity = new VelocityComponent();
        velocity.velocity.copy(projectileComp.direction).multiplyScalar(projectileComp.speed);

        // Collider (trigger only)
        const collider = new ColliderComponent(ColliderShape.SPHERE, 0.2);
        collider.isTrigger = true;

        projectile
            .addComponent(transform)
            .addComponent(projectileComp)
            .addComponent(velocity)
            .addComponent(collider);

        return projectile;
    }

    /**
     * Fire a laser (instant raycast)
     */
    fireLaser(origin, direction, weapon) {
        this.raycaster.set(origin, direction);

        // Get all entities with colliders
        const allEntities = this.entityManager.entities;
        const hits = [];

        for (const entity of allEntities) {
            const transform = entity.getComponent('TransformComponent');
            const collider = entity.getComponent('ColliderComponent');
            const agent = entity.getComponent('AgentComponent');

            if (!transform || !collider || !agent) continue;

            // Simple ray-sphere intersection
            const rayToSphere = new THREE.Vector3().subVectors(transform.position, origin);
            const projection = rayToSphere.dot(direction);

            if (projection < 0) continue; // Behind ray

            const closestPoint = origin.clone().addScaledVector(direction, projection);
            const distance = closestPoint.distanceTo(transform.position);

            if (distance <= collider.radius + weapon.laserWidth / 2) {
                hits.push({
                    entity,
                    distance: transform.position.distanceTo(origin)
                });
            }
        }

        // Sort by distance and apply damage
        hits.sort((a, b) => a.distance - b.distance);

        for (const hit of hits.slice(0, 5)) { // Max 5 hits
            const agent = hit.entity.getComponent('AgentComponent');
            if (agent) {
                agent.health -= weapon.damage;
                if (agent.health > 0) {
                    agent.state = AgentState.DEFENDING;
                }
            }
        }

        return hits;
    }

    /**
     * Fire an explosion (area of effect)
     */
    fireExplosion(origin, weapon) {
        const allEntities = this.entityManager.entities;
        const affected = [];

        for (const entity of allEntities) {
            const transform = entity.getComponent('TransformComponent');
            const agent = entity.getComponent('AgentComponent');

            if (!transform || !agent) continue;

            const distance = transform.position.distanceTo(origin);

            if (distance <= weapon.explosionRadius) {
                // Calculate damage falloff
                const falloff = 1.0 - (distance / weapon.explosionRadius);
                const damage = weapon.damage * (falloff * falloff); // Quadratic falloff

                agent.health -= damage;
                if (agent.health > 0) {
                    agent.state = AgentState.DEFENDING;
                }

                // Apply knockback
                const velocity = entity.getComponent('VelocityComponent');
                if (velocity) {
                    const knockback = new THREE.Vector3()
                        .subVectors(transform.position, origin)
                        .normalize()
                        .multiplyScalar(20 * falloff);

                    velocity.velocity.add(knockback);
                }

                affected.push(entity);
            }
        }

        return affected;
    }

    /**
     * Check if projectile hits anything
     */
    checkProjectileHits(projectile) {
        const transform = projectile.getComponent('TransformComponent');
        const projectileComp = projectile.getComponent('ProjectileComponent');
        const collider = projectile.getComponent('ColliderComponent');

        if (!transform || !projectileComp || !collider) return;

        // Check all entities
        const allEntities = this.entityManager.entities;

        for (const entity of allEntities) {
            if (entity === projectile) continue;

            const targetTransform = entity.getComponent('TransformComponent');
            const targetCollider = entity.getComponent('ColliderComponent');
            const agent = entity.getComponent('AgentComponent');

            if (!targetTransform || !targetCollider || !agent) continue;

            // Simple sphere collision
            const distance = transform.position.distanceTo(targetTransform.position);
            const radiusSum = collider.radius + targetCollider.radius;

            if (distance < radiusSum) {
                // Hit!
                agent.health -= projectileComp.damage;
                if (agent.health > 0) {
                    agent.state = AgentState.DEFENDING;
                }

                projectileComp.hitCount++;

                // Destroy projectile if penetration exceeded
                if (projectileComp.hitCount >= projectileComp.penetration) {
                    this.entityManager.destroyEntity(projectile);
                    return;
                }
            }
        }
    }
}
