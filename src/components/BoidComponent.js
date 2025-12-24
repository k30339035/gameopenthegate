/**
 * BoidComponent - Swarm behavior parameters
 * Based on Craig Reynolds' Boids algorithm
 */

import { Component } from '../core/Component.js';

export class BoidComponent extends Component {
    constructor() {
        super();

        // Boid behavior weights
        this.separationWeight = 1.5;  // Avoid crowding neighbors
        this.alignmentWeight = 1.0;   // Steer towards average heading of neighbors
        this.cohesionWeight = 1.0;    // Steer towards average position of neighbors

        // Boid parameters
        this.neighborRadius = 2.0;    // How far to look for neighbors
        this.separationRadius = 1.0;  // Personal space radius

        // Cached neighbor data (updated by spatial hash)
        this.neighbors = [];          // Nearby entities
    }
}
