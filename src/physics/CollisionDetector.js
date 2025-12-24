/**
 * CollisionDetector - Collision detection utilities
 */

import * as THREE from 'three';
import { ColliderShape } from '../components/ColliderComponent.js';

export class CollisionDetector {
    /**
     * Check collision between two entities
     */
    static checkCollision(entityA, entityB) {
        const transformA = entityA.getComponent('TransformComponent');
        const colliderA = entityA.getComponent('ColliderComponent');
        const transformB = entityB.getComponent('TransformComponent');
        const colliderB = entityB.getComponent('ColliderComponent');

        if (!transformA || !colliderA || !transformB || !colliderB) {
            return null;
        }

        // Sphere-Sphere collision (most common for drones)
        if (colliderA.shape === ColliderShape.SPHERE && colliderB.shape === ColliderShape.SPHERE) {
            return this.sphereSphereCollision(
                transformA.position, colliderA.radius,
                transformB.position, colliderB.radius
            );
        }

        // Sphere-Box collision
        if (colliderA.shape === ColliderShape.SPHERE && colliderB.shape === ColliderShape.BOX) {
            return this.sphereBoxCollision(
                transformA.position, colliderA.radius,
                transformB.position, colliderB.size
            );
        }

        if (colliderA.shape === ColliderShape.BOX && colliderB.shape === ColliderShape.SPHERE) {
            const result = this.sphereBoxCollision(
                transformB.position, colliderB.radius,
                transformA.position, colliderA.size
            );
            if (result) {
                result.normal.negate(); // Flip normal
            }
            return result;
        }

        // Box-Box collision
        if (colliderA.shape === ColliderShape.BOX && colliderB.shape === ColliderShape.BOX) {
            return this.boxBoxCollision(
                transformA.position, colliderA.size,
                transformB.position, colliderB.size
            );
        }

        return null;
    }

    /**
     * Sphere-Sphere collision
     */
    static sphereSphereCollision(posA, radiusA, posB, radiusB) {
        const distance = posA.distanceTo(posB);
        const radiusSum = radiusA + radiusB;

        if (distance < radiusSum) {
            const normal = new THREE.Vector3().subVectors(posA, posB).normalize();
            const penetration = radiusSum - distance;

            return {
                collision: true,
                normal,
                penetration,
                point: new THREE.Vector3()
                    .addVectors(posA, posB)
                    .multiplyScalar(0.5)
            };
        }

        return null;
    }

    /**
     * Sphere-Box collision (AABB)
     */
    static sphereBoxCollision(spherePos, radius, boxPos, boxSize) {
        // Find closest point on box to sphere
        const closest = new THREE.Vector3(
            Math.max(boxPos.x - boxSize.x / 2, Math.min(spherePos.x, boxPos.x + boxSize.x / 2)),
            Math.max(boxPos.y - boxSize.y / 2, Math.min(spherePos.y, boxPos.y + boxSize.y / 2)),
            Math.max(boxPos.z - boxSize.z / 2, Math.min(spherePos.z, boxPos.z + boxSize.z / 2))
        );

        const distance = spherePos.distanceTo(closest);

        if (distance < radius) {
            const normal = new THREE.Vector3().subVectors(spherePos, closest).normalize();
            const penetration = radius - distance;

            return {
                collision: true,
                normal,
                penetration,
                point: closest
            };
        }

        return null;
    }

    /**
     * Box-Box collision (AABB)
     */
    static boxBoxCollision(posA, sizeA, posB, sizeB) {
        const minA = new THREE.Vector3(
            posA.x - sizeA.x / 2,
            posA.y - sizeA.y / 2,
            posA.z - sizeA.z / 2
        );
        const maxA = new THREE.Vector3(
            posA.x + sizeA.x / 2,
            posA.y + sizeA.y / 2,
            posA.z + sizeA.z / 2
        );

        const minB = new THREE.Vector3(
            posB.x - sizeB.x / 2,
            posB.y - sizeB.y / 2,
            posB.z - sizeB.z / 2
        );
        const maxB = new THREE.Vector3(
            posB.x + sizeB.x / 2,
            posB.y + sizeB.y / 2,
            posB.z + sizeB.z / 2
        );

        // AABB overlap test
        if (maxA.x < minB.x || minA.x > maxB.x) return null;
        if (maxA.y < minB.y || minA.y > maxB.y) return null;
        if (maxA.z < minB.z || minA.z > maxB.z) return null;

        // Calculate penetration (simplified)
        const overlapX = Math.min(maxA.x - minB.x, maxB.x - minA.x);
        const overlapY = Math.min(maxA.y - minB.y, maxB.y - minA.y);
        const overlapZ = Math.min(maxA.z - minB.z, maxB.z - minA.z);

        const minOverlap = Math.min(overlapX, overlapY, overlapZ);
        let normal = new THREE.Vector3();

        if (minOverlap === overlapX) {
            normal.x = posA.x < posB.x ? -1 : 1;
        } else if (minOverlap === overlapY) {
            normal.y = posA.y < posB.y ? -1 : 1;
        } else {
            normal.z = posA.z < posB.z ? -1 : 1;
        }

        return {
            collision: true,
            normal,
            penetration: minOverlap,
            point: new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5)
        };
    }
}
