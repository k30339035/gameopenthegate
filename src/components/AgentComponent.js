/**
 * AgentComponent - Core agent properties
 */

import { Component } from '../core/Component.js';
import * as THREE from 'three';

// Agent states
export const AgentState = {
    SPAWNING: 'spawning',
    FORMING: 'forming',
    FORMED: 'formed',
    ATTACKING: 'attacking',
    DEFENDING: 'defending',
    PANICKING: 'panicking',
    DYING: 'dying'
};

export class AgentComponent extends Component {
    constructor() {
        super();
        this.state = AgentState.SPAWNING;
        this.targetPosition = new THREE.Vector3();
        this.health = 100;
        this.maxHealth = 100;
        this.energy = 100;
        this.damage = 10;
        this.perception = 5.0; // How far the agent can "see"
        this.formationId = -1; // Which text formation this belongs to
    }
}
