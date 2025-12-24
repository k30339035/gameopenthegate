/**
 * SpatialHash - 3D grid-based spatial partitioning for efficient neighbor queries
 * Reduces neighbor search from O(n²) to O(n)
 */

export class SpatialHash {
    constructor(cellSize = 5.0) {
        this.cellSize = cellSize;
        this.grid = new Map(); // "x,y,z" -> Entity[]
    }

    /**
     * Get cell key for a position
     * @param {THREE.Vector3} position
     * @returns {string}
     */
    getCellKey(position) {
        const x = Math.floor(position.x / this.cellSize);
        const y = Math.floor(position.y / this.cellSize);
        const z = Math.floor(position.z / this.cellSize);
        return `${x},${y},${z}`;
    }

    /**
     * Clear the grid
     */
    clear() {
        this.grid.clear();
    }

    /**
     * Insert an entity into the grid
     * @param {Entity} entity - Must have TransformComponent
     */
    insert(entity) {
        const transform = entity.getComponent('TransformComponent');
        if (!transform) return;

        const key = this.getCellKey(transform.position);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
    }

    /**
     * Get entities near a position (current cell + 26 adjacent cells)
     * @param {THREE.Vector3} position
     * @param {number} radius - Search radius
     * @returns {Entity[]}
     */
    getNearby(position, radius = this.cellSize) {
        const nearby = [];
        const cellX = Math.floor(position.x / this.cellSize);
        const cellY = Math.floor(position.y / this.cellSize);
        const cellZ = Math.floor(position.z / this.cellSize);

        // Determine how many cells to check based on radius
        const cellRadius = Math.ceil(radius / this.cellSize);

        // Check current cell and adjacent cells
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                for (let dz = -cellRadius; dz <= cellRadius; dz++) {
                    const key = `${cellX + dx},${cellY + dy},${cellZ + dz}`;
                    const cell = this.grid.get(key);
                    if (cell) {
                        nearby.push(...cell);
                    }
                }
            }
        }

        return nearby;
    }

    /**
     * Get count of entities in grid (for debugging)
     */
    getEntityCount() {
        let count = 0;
        for (const cell of this.grid.values()) {
            count += cell.length;
        }
        return count;
    }

    /**
     * Get cell count (for debugging)
     */
    getCellCount() {
        return this.grid.size;
    }
}
