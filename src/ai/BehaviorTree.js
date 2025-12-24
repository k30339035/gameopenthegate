/**
 * BehaviorTree - Behavior tree implementation for AI decision making
 */

// Node execution results
export const NodeStatus = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    RUNNING: 'running'
};

/**
 * Base node class
 */
export class BehaviorNode {
    constructor() {
        this.status = NodeStatus.FAILURE;
    }

    /**
     * Execute node logic
     * @param {Entity} entity
     * @param {number} deltaTime
     * @returns {string} - NodeStatus
     */
    execute(entity, deltaTime) {
        return NodeStatus.FAILURE;
    }

    reset() {
        this.status = NodeStatus.FAILURE;
    }
}

/**
 * Composite node - has children
 */
export class CompositeNode extends BehaviorNode {
    constructor() {
        super();
        this.children = [];
    }

    addChild(node) {
        this.children.push(node);
        return this;
    }
}

/**
 * Selector - Execute children until one succeeds (OR logic)
 */
export class Selector extends CompositeNode {
    execute(entity, deltaTime) {
        for (const child of this.children) {
            this.status = child.execute(entity, deltaTime);

            if (this.status === NodeStatus.SUCCESS || this.status === NodeStatus.RUNNING) {
                return this.status;
            }
        }

        return NodeStatus.FAILURE;
    }
}

/**
 * Sequence - Execute children until one fails (AND logic)
 */
export class Sequence extends CompositeNode {
    execute(entity, deltaTime) {
        for (const child of this.children) {
            this.status = child.execute(entity, deltaTime);

            if (this.status === NodeStatus.FAILURE || this.status === NodeStatus.RUNNING) {
                return this.status;
            }
        }

        return NodeStatus.SUCCESS;
    }
}

/**
 * Condition - Check a condition
 */
export class Condition extends BehaviorNode {
    constructor(predicate) {
        super();
        this.predicate = predicate; // Function that returns boolean
    }

    execute(entity, deltaTime) {
        this.status = this.predicate(entity) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
        return this.status;
    }
}

/**
 * Action - Perform an action
 */
export class Action extends BehaviorNode {
    constructor(action) {
        super();
        this.action = action; // Function that performs action and returns status
    }

    execute(entity, deltaTime) {
        this.status = this.action(entity, deltaTime);
        return this.status;
    }
}

/**
 * Decorator - Wraps a single child node
 */
export class Decorator extends BehaviorNode {
    constructor(child) {
        super();
        this.child = child;
    }
}

/**
 * Inverter - Inverts child's result
 */
export class Inverter extends Decorator {
    execute(entity, deltaTime) {
        this.status = this.child.execute(entity, deltaTime);

        if (this.status === NodeStatus.SUCCESS) {
            return NodeStatus.FAILURE;
        } else if (this.status === NodeStatus.FAILURE) {
            return NodeStatus.SUCCESS;
        }

        return this.status; // RUNNING stays RUNNING
    }
}

/**
 * Repeater - Repeats child N times or until failure
 */
export class Repeater extends Decorator {
    constructor(child, count = -1) {
        super(child);
        this.count = count; // -1 = infinite
        this.currentCount = 0;
    }

    execute(entity, deltaTime) {
        if (this.count > 0 && this.currentCount >= this.count) {
            this.currentCount = 0;
            return NodeStatus.SUCCESS;
        }

        this.status = this.child.execute(entity, deltaTime);

        if (this.status === NodeStatus.SUCCESS) {
            this.currentCount++;
        } else if (this.status === NodeStatus.FAILURE) {
            this.currentCount = 0;
            return NodeStatus.FAILURE;
        }

        return NodeStatus.RUNNING;
    }
}

/**
 * Complete behavior tree
 */
export class BehaviorTree {
    constructor(rootNode) {
        this.root = rootNode;
    }

    execute(entity, deltaTime) {
        return this.root.execute(entity, deltaTime);
    }

    reset() {
        this.root.reset();
    }
}
