/**
 * FormationSystem - Maintains text shape using spring forces
 */

import { System } from '../core/System.js';
import { AgentState } from '../components/AgentComponent.js';
import * as THREE from 'three';

export class FormationSystem extends System {
    constructor() {
        super();
        this.requiredComponents = [
            'TransformComponent',
            'VelocityComponent',
            'FormationComponent',
            'AgentComponent'
        ];

        this.tempVec = new THREE.Vector3();
    }

    update(entities, deltaTime) {
        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const velocity = entity.getComponent('VelocityComponent');
            const formation = entity.getComponent('FormationComponent');
            const agent = entity.getComponent('AgentComponent');

            // Only apply formation force for certain states
            if (agent.state === AgentState.DYING || agent.state === AgentState.PANICKING) {
                continue;
            }

            // Calculate spring force towards formation point
            this.tempVec.subVectors(formation.formationPoint, transform.position);
            const distance = this.tempVec.length();

            // Check if reached formation
            if (distance < formation.arrivalThreshold) {
                formation.formationReached = true;

                // Apply damping when at formation to reduce oscillation
                velocity.velocity.multiplyScalar(0.95);
            } else {
                formation.formationReached = false;
            }

            // Apply spring force (Hooke's law: F = -kx)
            this.tempVec.normalize();
            this.tempVec.multiplyScalar(formation.formationWeight);

            // Add to acceleration
            velocity.acceleration.add(this.tempVec);

            // Update agent state based on formation status
            if (agent.state === AgentState.SPAWNING && formation.formationReached) {
                agent.state = AgentState.FORMING;
            }
        }

        // Check if entire formation is stable
        this.checkFormationStability(entities);
    }

    /**
     * Check if all drones in a formation have reached their positions
     */
    checkFormationStability(entities) {
        const formations = new Map(); // formationId -> { total, reached }

        for (const entity of entities) {
            const agent = entity.getComponent('AgentComponent');
            const formation = entity.getComponent('FormationComponent');

            const id = agent.formationId;
            if (!formations.has(id)) {
                formations.set(id, { total: 0, reached: 0 });
            }

            const stats = formations.get(id);
            stats.total++;
            if (formation.formationReached) {
                stats.reached++;
            }
        }

        // Update states if formation is stable
        for (const entity of entities) {
            const agent = entity.getComponent('AgentComponent');
            const id = agent.formationId;
            const stats = formations.get(id);

            if (stats && stats.reached / stats.total > 0.9) { // 90% reached
                if (agent.state === AgentState.FORMING) {
                    agent.state = AgentState.FORMED;
                }
            }
        }
    }
}
