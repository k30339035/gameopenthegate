/**
 * SystemManager - Manages all systems and their execution order
 */

export class SystemManager {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.systems = []; // Systems in execution order
        this.systemMap = new Map(); // SystemName -> System instance
    }

    /**
     * Register a system
     * @param {System} system
     */
    registerSystem(system) {
        this.systems.push(system);
        this.systemMap.set(system.constructor.name, system);
        system.init();
        return this;
    }

    /**
     * Get a system by name
     * @param {string} systemName
     */
    getSystem(systemName) {
        return this.systemMap.get(systemName);
    }

    /**
     * Update all systems (call every frame)
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        for (const system of this.systems) {
            if (!system.enabled) continue;

            // Get entities that match this system's required components
            const entities = this.entityManager.getEntitiesWithComponents(
                system.requiredComponents
            );

            // Update system with matching entities
            system.update(entities, deltaTime);
        }

        // Cleanup destroyed entities at end of frame
        this.entityManager.cleanup();
    }

    /**
     * Remove a system
     * @param {string} systemName
     */
    removeSystem(systemName) {
        const system = this.systemMap.get(systemName);
        if (system) {
            system.cleanup();
            this.systems = this.systems.filter(s => s !== system);
            this.systemMap.delete(systemName);
        }
    }

    /**
     * Clear all systems
     */
    clear() {
        for (const system of this.systems) {
            system.cleanup();
        }
        this.systems.length = 0;
        this.systemMap.clear();
    }
}
