/**
 * MathUtils - Mathematical helper functions
 */

import * as THREE from 'three';

export class MathUtils {
    /**
     * Clamp a value between min and max
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Linear interpolation
     */
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Map value from one range to another
     */
    static map(value, inMin, inMax, outMin, outMax) {
        return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
    }

    /**
     * Random float between min and max
     */
    static randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    /**
     * Random integer between min and max (inclusive)
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Random point in a sphere
     */
    static randomInSphere(radius) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * radius;
        const sinPhi = Math.sin(phi);
        const x = r * sinPhi * Math.cos(theta);
        const y = r * sinPhi * Math.sin(theta);
        const z = r * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    /**
     * Random point on a sphere surface
     */
    static randomOnSphere(radius) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const sinPhi = Math.sin(phi);
        const x = radius * sinPhi * Math.cos(theta);
        const y = radius * sinPhi * Math.sin(theta);
        const z = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    /**
     * Distance squared between two points (faster than distance)
     */
    static distanceSquared(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dz = a.z - b.z;
        return dx * dx + dy * dy + dz * dz;
    }

    /**
     * Limit a vector's magnitude
     */
    static limitVector(vector, maxMagnitude) {
        const magSq = vector.lengthSq();
        if (magSq > maxMagnitude * maxMagnitude) {
            vector.normalize().multiplyScalar(maxMagnitude);
        }
        return vector;
    }
}
