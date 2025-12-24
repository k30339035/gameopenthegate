/**
 * FormationComponent - Formation position for text shape
 */

import { Component } from '../core/Component.js';
import * as THREE from 'three';

export class FormationComponent extends Component {
    constructor() {
        super();
        this.formationPoint = new THREE.Vector3(); // Target position in formation
        this.letterIndex = 0;                      // Which letter this belongs to
        this.pointIndex = 0;                       // Which point within the letter
        this.formationWeight = 2.0;                // Spring force strength towards formation
        this.formationReached = false;             // Has reached formation position
        this.arrivalThreshold = 0.5;              // Distance to consider "arrived"
    }
}
