/**
 * DestructibleComponent - For destructible environment objects
 */

import { Component } from '../core/Component.js';

export class DestructibleComponent extends Component {
    constructor() {
        super();
        this.health = 100;
        this.maxHealth = 100;
        this.fractureThreshold = 50; // Health below which object fractures
        this.destroyed = false;
        this.debrisCount = 5; // Number of debris pieces when destroyed
    }
}
