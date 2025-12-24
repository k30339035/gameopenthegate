/**
 * LODComponent - Level of Detail
 */

import { Component } from '../core/Component.js';

export class LODComponent extends Component {
    constructor() {
        super();
        this.currentLevel = 0;
        this.distanceToCamera = 0;

        // LOD levels (distance thresholds)
        this.levels = [
            { distance: 0, detail: 'high' },    // 0-30 units
            { distance: 30, detail: 'medium' }, // 30-60 units
            { distance: 60, detail: 'low' },    // 60-100 units
            { distance: 100, detail: 'billboard' } // 100+ units
        ];
    }
}
