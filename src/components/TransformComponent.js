/**
 * TransformComponent - Position, rotation, and scale in 3D space
 */

import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class TransformComponent extends Component {
    constructor(x = 0, y = 0, z = 0) {
        super();
        this.position = new THREE.Vector3(x, y, z);
        this.rotation = new THREE.Euler(0, 0, 0);
        this.scale = new THREE.Vector3(1, 1, 1);
    }
}
