/**
 * InstancedDroneRenderer - Manages GPU-instanced rendering of drones
 * Uses THREE.InstancedMesh for maximum performance
 */

import * as THREE from 'three';

export class InstancedDroneRenderer {
    constructor(scene, maxInstances = 10000) {
        this.scene = scene;
        this.maxInstances = maxInstances;

        // Create instanced mesh
        this.instancedMesh = this.createInstancedMesh();
        this.scene.add(this.instancedMesh);

        // Temporary objects (reused to avoid allocations)
        this.tempMatrix = new THREE.Matrix4();
        this.tempPosition = new THREE.Vector3();
        this.tempRotation = new THREE.Euler();
        this.tempQuaternion = new THREE.Quaternion();
        this.tempScale = new THREE.Vector3();
        this.tempColor = new THREE.Color();

        // Track active instance count
        this.activeCount = 0;

        // Entity to instance mapping
        this.entityToInstance = new Map();
        this.instanceToEntity = new Map();
        this.availableInstances = [];

        // Initialize available instances
        for (let i = 0; i < maxInstances; i++) {
            this.availableInstances.push(i);
        }
    }

    createInstancedMesh() {
        // Create drone geometry (simple sphere with some detail)
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);

        // Create material with instance color support
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3,
            metalness: 0.7,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        });

        // Create instanced mesh
        const instancedMesh = new THREE.InstancedMesh(
            geometry,
            material,
            this.maxInstances
        );

        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = false;

        // Set initial count to 0
        instancedMesh.count = 0;

        return instancedMesh;
    }

    /**
     * Allocate an instance for an entity
     */
    allocateInstance(entity) {
        if (this.availableInstances.length === 0) {
            console.warn('No available instances!');
            return -1;
        }

        const instanceId = this.availableInstances.pop();
        this.entityToInstance.set(entity.id, instanceId);
        this.instanceToEntity.set(instanceId, entity);
        this.activeCount++;

        return instanceId;
    }

    /**
     * Free an instance
     */
    freeInstance(entity) {
        const instanceId = this.entityToInstance.get(entity.id);
        if (instanceId === undefined) return;

        this.entityToInstance.delete(entity.id);
        this.instanceToEntity.delete(instanceId);
        this.availableInstances.push(instanceId);
        this.activeCount--;
    }

    /**
     * Update all instances from entities
     */
    updateInstances(entities) {
        this.activeCount = 0;

        for (const entity of entities) {
            const transform = entity.getComponent('TransformComponent');
            const instancedMeshComp = entity.getComponent('InstancedMeshComponent');
            const agent = entity.getComponent('AgentComponent');

            if (!transform || !instancedMeshComp || !instancedMeshComp.visible) {
                continue;
            }

            let instanceId = this.entityToInstance.get(entity.id);

            // Allocate instance if needed
            if (instanceId === undefined) {
                instanceId = this.allocateInstance(entity);
                if (instanceId === -1) continue;

                // Update component with allocated instance ID
                instancedMeshComp.instanceId = instanceId;
            }

            // Update matrix
            this.tempPosition.copy(transform.position);
            this.tempRotation.copy(transform.rotation);
            this.tempScale.copy(transform.scale);

            this.tempQuaternion.setFromEuler(this.tempRotation);
            this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);

            this.instancedMesh.setMatrixAt(instanceId, this.tempMatrix);

            // Update color based on health
            if (agent) {
                const healthPercent = agent.health / agent.maxHealth;
                this.tempColor.setRGB(
                    1.0 - healthPercent, // More red when damaged
                    healthPercent,       // Less green when damaged
                    0.2
                );
                this.tempColor.multiplyScalar(instancedMeshComp.opacity);
            } else {
                this.tempColor.copy(instancedMeshComp.color);
            }

            this.instancedMesh.setColorAt(instanceId, this.tempColor);

            this.activeCount++;
        }

        // Update instance count
        this.instancedMesh.count = this.activeCount;

        // Mark for update
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
            this.instancedMesh.instanceColor.needsUpdate = true;
        }
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            maxInstances: this.maxInstances,
            activeInstances: this.activeCount,
            availableInstances: this.availableInstances.length,
            drawCalls: 1 // Always 1 with instancing!
        };
    }

    /**
     * Cleanup
     */
    dispose() {
        this.instancedMesh.geometry.dispose();
        this.instancedMesh.material.dispose();
        this.scene.remove(this.instancedMesh);
        this.entityToInstance.clear();
        this.instanceToEntity.clear();
    }
}
