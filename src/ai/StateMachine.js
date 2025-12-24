/**
 * StateMachine - Finite State Machine for agent states
 */

export class State {
    constructor(name) {
        this.name = name;
    }

    /**
     * Called when entering this state
     * @param {Entity} entity
     */
    onEnter(entity) {}

    /**
     * Called every frame while in this state
     * @param {Entity} entity
     * @param {number} deltaTime
     */
    onUpdate(entity, deltaTime) {}

    /**
     * Called when exiting this state
     * @param {Entity} entity
     */
    onExit(entity) {}
}

export class StateMachine {
    constructor() {
        this.states = new Map(); // stateName -> State
        this.currentState = null;
        this.transitions = new Map(); // currentState -> [{condition, targetState}]
    }

    /**
     * Add a state to the state machine
     * @param {State} state
     */
    addState(state) {
        this.states.set(state.name, state);
        return this;
    }

    /**
     * Add a transition between states
     * @param {string} fromState
     * @param {string} toState
     * @param {function} condition - Function that returns boolean
     */
    addTransition(fromState, toState, condition) {
        if (!this.transitions.has(fromState)) {
            this.transitions.set(fromState, []);
        }

        this.transitions.get(fromState).push({
            condition,
            targetState: toState
        });

        return this;
    }

    /**
     * Set the initial state
     * @param {string} stateName
     * @param {Entity} entity
     */
    setState(stateName, entity) {
        const newState = this.states.get(stateName);
        if (!newState) {
            console.warn(`State ${stateName} not found`);
            return;
        }

        if (this.currentState) {
            this.currentState.onExit(entity);
        }

        this.currentState = newState;
        this.currentState.onEnter(entity);
    }

    /**
     * Update state machine
     * @param {Entity} entity
     * @param {number} deltaTime
     */
    update(entity, deltaTime) {
        if (!this.currentState) return;

        // Update current state
        this.currentState.onUpdate(entity, deltaTime);

        // Check for transitions
        const transitions = this.transitions.get(this.currentState.name);
        if (transitions) {
            for (const transition of transitions) {
                if (transition.condition(entity)) {
                    this.setState(transition.targetState, entity);
                    break; // Only one transition per frame
                }
            }
        }
    }

    /**
     * Get current state name
     */
    getCurrentStateName() {
        return this.currentState ? this.currentState.name : null;
    }
}
