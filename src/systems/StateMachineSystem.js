/**
 * StateMachineSystem - Manages agent state transitions
 */

import { System } from '../core/System.js';
import { AgentState } from '../components/AgentComponent.js';

export class StateMachineSystem extends System {
    constructor() {
        super();
        this.requiredComponents = ['AgentComponent'];

        // State transition timers
        this.formationStableTimers = new Map(); // formationId -> timer
    }

    update(entities, deltaTime) {
        // Track formation stability for state transitions
        const formations = new Map(); // formationId -> { total, formed }

        for (const entity of entities) {
            const agent = entity.getComponent('AgentComponent');
            const formation = entity.getComponent('FormationComponent');

            const id = agent.formationId;
            if (!formations.has(id)) {
                formations.set(id, { total: 0, formed: 0 });
            }

            const stats = formations.get(id);
            stats.total++;
            if (formation && formation.formationReached) {
                stats.formed++;
            }
        }

        // Update stable timers
        for (const [formationId, stats] of formations.entries()) {
            const stability = stats.formed / stats.total;

            if (stability > 0.95) { // 95% formed
                if (!this.formationStableTimers.has(formationId)) {
                    this.formationStableTimers.set(formationId, 0);
                }

                this.formationStableTimers.set(
                    formationId,
                    this.formationStableTimers.get(formationId) + deltaTime
                );
            } else {
                this.formationStableTimers.set(formationId, 0);
            }
        }

        // Apply state transitions
        for (const entity of entities) {
            const agent = entity.getComponent('AgentComponent');
            const id = agent.formationId;
            const stableTime = this.formationStableTimers.get(id) || 0;

            // Transition FORMING -> FORMED after 2s of stability
            if (agent.state === AgentState.FORMING && stableTime > 2.0) {
                agent.state = AgentState.FORMED;
            }

            // Transition PANICKING -> DEFENDING if health recovers
            if (agent.state === AgentState.PANICKING && agent.health > 30) {
                agent.state = AgentState.DEFENDING;
            }

            // Transition DEFENDING -> FORMED after returning to formation
            if (agent.state === AgentState.DEFENDING && stableTime > 1.0) {
                const formation = entity.getComponent('FormationComponent');
                if (formation && formation.formationReached) {
                    agent.state = AgentState.FORMED;
                }
            }

            // Death check
            if (agent.health <= 0 && agent.state !== AgentState.DYING) {
                agent.state = AgentState.DYING;
            }
        }
    }

    cleanup() {
        this.formationStableTimers.clear();
    }
}
