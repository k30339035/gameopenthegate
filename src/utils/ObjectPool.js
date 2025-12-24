/**
 * ObjectPool - Generic object pooling for zero-allocation performance
 */

export class ObjectPool {
    constructor(factory, initialSize = 100) {
        this.factory = factory; // Function that creates new objects
        this.available = [];
        this.active = new Set();

        // Pre-allocate initial objects
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.factory());
        }
    }

    /**
     * Get an object from the pool
     * @returns {T}
     */
    acquire() {
        let obj;
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            obj = this.factory();
        }
        this.active.add(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     * @param {T} obj
     */
    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            this.available.push(obj);
        }
    }

    /**
     * Get pool statistics
     */
    getStats() {
        return {
            available: this.available.length,
            active: this.active.size,
            total: this.available.length + this.active.size
        };
    }

    /**
     * Clear the pool
     */
    clear() {
        this.available.length = 0;
        this.active.clear();
    }
}
