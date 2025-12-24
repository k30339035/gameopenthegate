/**
 * Entity - Pure data container with unique ID
 * Part of ECS (Entity-Component-System) architecture
 */

let nextEntityId = 0;

export class Entity {
    constructor() {
        this.id = nextEntityId++;
        this.components = new Map(); // ComponentType -> Component instance
        this.active = true;
    }

    /**
     * Add a component to this entity
     * @param {Component} component
     */
    addComponent(component) {
        const type = component.constructor.name;
        this.components.set(type, component);
        return this;
    }

    /**
     * Get a component by type
     * @param {string} componentType
     */
    getComponent(componentType) {
        return this.components.get(componentType);
    }

    /**
     * Check if entity has a component
     * @param {string} componentType
     */
    hasComponent(componentType) {
        return this.components.has(componentType);
    }

    /**
     * Check if entity has all specified components
     * @param {string[]} componentTypes
     */
    hasComponents(componentTypes) {
        return componentTypes.every(type => this.components.has(type));
    }

    /**
     * Remove a component from this entity
     * @param {string} componentType
     */
    removeComponent(componentType) {
        this.components.delete(componentType);
        return this;
    }

    /**
     * Mark entity for removal
     */
    destroy() {
        this.active = false;
    }
}
