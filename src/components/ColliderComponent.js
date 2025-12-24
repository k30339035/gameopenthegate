/**
 * ColliderComponent - Collision detection
 */

import { Component } from '../core/Component.js';

export const ColliderShape = {
    SPHERE: 'sphere',
    BOX: 'box'
};

export class ColliderComponent extends Component {
    constructor(shape = ColliderShape.SPHERE, size = 0.5) {
        super();
        this.shape = shape;
        this.radius = size; // For sphere
        this.size = { x: size, y: size, z: size }; // For box
        this.isTrigger = false; // If true, no physics response
        this.layer = 0; // Collision layer (for filtering)
    }
}
