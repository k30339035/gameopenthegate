/**
 * System - Pure logic that operates on entities with specific components
 * Systems should contain NO data, only logic
 */

export class System {
    constructor() {
        this.requiredComponents = []; // Override in subclass
        this.enabled = true;
    }

    /**
     * Update system logic - called every frame
     * @param {Entity[]} entities - Entities that match requiredComponents
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(entities, deltaTime) {
        // Override in subclass
    }

    /**
     * Initialize system - called once when system is registered
     */
    init() {
        // Override in subclass if needed
    }

    /**
     * Cleanup system - called when system is removed
     */
    cleanup() {
        // Override in subclass if needed
    }
}
