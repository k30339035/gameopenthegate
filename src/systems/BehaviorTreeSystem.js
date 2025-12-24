/**
 * BehaviorTreeSystem - Executes behavior trees for AI agents
 */

import { System } from '../core/System.js';
import { BehaviorTree, Selector, Sequence, Condition, Action } from '../ai/BehaviorTree.js';
import { AgentState } from '../components/AgentComponent.js';
import { NodeStatus } from '../ai/BehaviorTree.js';
import * as THREE from 'three';
import { MathUtils } from '../utils/MathUtils.js';

export class BehaviorTreeSystem extends System {
    constructor() {
        super();
        this.requiredComponents = ['AgentComponent', 'TransformComponent', 'VelocityComponent'];

        // Create default behavior tree
        this.behaviorTree = this.createDefaultBehaviorTree();
    }

    createDefaultBehaviorTree() {
        // Root selector - tries behaviors in order until one succeeds
        const root = new Selector();

        // 1. Panic behavior (health < 20%)
        const panicSequence = new Sequence()
            .addChild(new Condition(entity => {
                const agent = entity.getComponent('AgentComponent');
                return agent.health < 20;
            }))
            .addChild(new Action((entity, deltaTime) => {
                const agent = entity.getComponent('AgentComponent');
                const velocity = entity.getComponent('VelocityComponent');

                if (agent.state !== AgentState.PANICKING) {
                    agent.state = AgentState.PANICKING;

                    // Add random escape velocity
                    const escape = MathUtils.randomOnSphere(velocity.maxSpeed);
                    velocity.velocity.add(escape);
                }

                return NodeStatus.SUCCESS;
            }));

        // 2. Attack behavior (state == ATTACKING)
        const attackSequence = new Sequence()
            .addChild(new Condition(entity => {
                const agent = entity.getComponent('AgentComponent');
                return agent.state === AgentState.ATTACKING;
            }))
            .addChild(new Action((entity, deltaTime) => {
                const transform = entity.getComponent('TransformComponent');
                const velocity = entity.getComponent('VelocityComponent');
                const agent = entity.getComponent('AgentComponent');

                // Move towards target (player or point)
                if (agent.targetPosition) {
                    const direction = new THREE.Vector3()
                        .subVectors(agent.targetPosition, transform.position)
                        .normalize()
                        .multiplyScalar(0.3);

                    velocity.acceleration.add(direction);
                }

                return NodeStatus.SUCCESS;
            }));

        // 3. Defend behavior (state == DEFENDING)
        const defendSequence = new Sequence()
            .addChild(new Condition(entity => {
                const agent = entity.getComponent('AgentComponent');
                return agent.state === AgentState.DEFENDING;
            }))
            .addChild(new Action((entity, deltaTime) => {
                const formation = entity.getComponent('FormationComponent');
                const velocity = entity.getComponent('VelocityComponent');

                // Return to formation with increased urgency
                const oldWeight = formation.formationWeight;
                formation.formationWeight = oldWeight * 1.5;

                // Restore after a delay
                setTimeout(() => {
                    formation.formationWeight = oldWeight;
                }, 2000);

                return NodeStatus.SUCCESS;
            }));

        // 4. Default: Maintain formation
        const maintainFormation = new Action((entity, deltaTime) => {
            // Formation system handles this
            return NodeStatus.SUCCESS;
        });

        root
            .addChild(panicSequence)
            .addChild(attackSequence)
            .addChild(defendSequence)
            .addChild(maintainFormation);

        return new BehaviorTree(root);
    }

    update(entities, deltaTime) {
        for (const entity of entities) {
            const agent = entity.getComponent('AgentComponent');

            // Skip dead agents
            if (agent.state === AgentState.DYING) continue;

            // Execute behavior tree
            this.behaviorTree.execute(entity, deltaTime);
        }
    }
}
