/**
 * InstancedMeshComponent - For GPU instanced rendering
 * Multiple entities share ONE InstancedMesh for performance
 */

import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class InstancedMeshComponent extends Component {
    constructor(instanceId = 0, color = 0x00ff00) {
        super();
        this.instanceId = instanceId; // Index in the instanced mesh
        this.color = new THREE.Color(color);
        this.visible = true;
        this.opacity = 1.0;
        this.meshType = 'drone'; // Which instanced mesh this belongs to
    }
}
