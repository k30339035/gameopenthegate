/**
 * EntityManager - Manages all entities in the game
 * Handles creation, destruction, and querying of entities
 */

import { Entity } from './Entity.js';

export class EntityManager {
    constructor() {
        this.entities = []; // All active entities
        this.entitiesToDestroy = []; // Entities marked for destruction
        this.entityPool = []; // Pooled entities for reuse
    }

    /**
     * Create a new entity
     * @returns {Entity}
     */
    createEntity() {
        let entity;

        // Reuse pooled entity if available
        if (this.entityPool.length > 0) {
            entity = this.entityPool.pop();
            entity.active = true;
            entity.components.clear();
        } else {
            entity = new Entity();
        }

        this.entities.push(entity);
        return entity;
    }

    /**
     * Destroy an entity (marks for removal, actual destruction happens in cleanup)
     * @param {Entity} entity
     */
    destroyEntity(entity) {
        entity.destroy();
        this.entitiesToDestroy.push(entity);
    }

    /**
     * Get all entities that have specific components
     * @param {string[]} componentTypes
     * @returns {Entity[]}
     */
    getEntitiesWithComponents(componentTypes) {
        return this.entities.filter(entity =>
            entity.active && entity.hasComponents(componentTypes)
        );
    }

    /**
     * Get entity by ID
     * @param {number} id
     * @returns {Entity|null}
     */
    getEntityById(id) {
        return this.entities.find(entity => entity.id === id) || null;
    }

    /**
     * Cleanup destroyed entities (call at end of frame)
     */
    cleanup() {
        if (this.entitiesToDestroy.length === 0) return;

        // Remove destroyed entities from main list
        this.entities = this.entities.filter(entity => entity.active);

        // Return destroyed entities to pool
        for (const entity of this.entitiesToDestroy) {
            entity.components.clear();
            this.entityPool.push(entity);
        }

        this.entitiesToDestroy.length = 0;
    }

    /**
     * Get total entity count
     */
    getEntityCount() {
        return this.entities.length;
    }

    /**
     * Get pool size (for debugging/profiling)
     */
    getPoolSize() {
        return this.entityPool.length;
    }

    /**
     * Clear all entities
     */
    clear() {
        this.entities.length = 0;
        this.entitiesToDestroy.length = 0;
        this.entityPool.length = 0;
    }
}
