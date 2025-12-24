/**
 * RigidbodyComponent - Physics properties
 */

import { Component } from '../core/Component.js';

export class RigidbodyComponent extends Component {
    constructor() {
        super();
        this.mass = 1.0;
        this.drag = 0.98; // Velocity multiplier per frame (0.98 = 2% drag)
        this.useGravity = false;
        this.isKinematic = false; // If true, not affected by forces
        this.sleeping = false; // Performance optimization
    }
}
