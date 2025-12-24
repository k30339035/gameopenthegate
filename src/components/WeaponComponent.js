/**
 * WeaponComponent - Player weapon data
 */

import { Component } from '../core/Component.js';
import * as THREE from 'three';

export const WeaponType = {
    GUN: 'gun',
    LASER: 'laser',
    EXPLOSION: 'explosion'
};

export class WeaponComponent extends Component {
    constructor(type = WeaponType.GUN) {
        super();
        this.type = type;
        this.damage = 20;
        this.fireRate = 0.1; // Seconds between shots
        this.lastFireTime = 0;
        this.range = 100;

        // Type-specific properties
        this.projectileSpeed = 50; // For GUN
        this.laserWidth = 0.5; // For LASER
        this.explosionRadius = 5; // For EXPLOSION
    }
}

export class ProjectileComponent extends Component {
    constructor(damage, speed, lifetime = 3.0) {
        super();
        this.damage = damage;
        this.speed = speed;
        this.lifetime = lifetime;
        this.age = 0;
        this.direction = new THREE.Vector3();
        this.penetration = 1; // How many targets it can hit
        this.hitCount = 0;
    }
}
