/**
 * VelocityComponent - Velocity and acceleration
 */

import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class VelocityComponent extends Component {
    constructor() {
        super();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.maxSpeed = 10.0;
        this.maxForce = 0.5; // Maximum steering force
    }
}
