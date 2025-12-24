/**
 * DroneFactory - Creates drone entities from text data
 */

import { TransformComponent } from '../components/TransformComponent.js';
import { VelocityComponent } from '../components/VelocityComponent.js';
import { AgentComponent, AgentState } from '../components/AgentComponent.js';
import { BoidComponent } from '../components/BoidComponent.js';
import { FormationComponent } from '../components/FormationComponent.js';
import { RigidbodyComponent } from '../components/RigidbodyComponent.js';
import { ColliderComponent, ColliderShape } from '../components/ColliderComponent.js';
import { InstancedMeshComponent } from '../components/InstancedMeshComponent.js';
import { LODComponent } from '../components/LODComponent.js';
import { MathUtils } from '../utils/MathUtils.js';
import * as THREE from 'three';

export class DroneFactory {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.formationIdCounter = 0;
    }

    /**
     * Create drones from text conversion result
     * @param {object} textData - Result from TextToVectorConverter
     * @param {object} options - Spawning options
     * @returns {object} - { entities, formationId }
     */
    createDronesFromText(textData, options = {}) {
        const {
            spawnCenter = new THREE.Vector3(0, 10, 0),
            spawnRadius = 20,
            scale = 0.05,
            color = 0x00ff00
        } = options;

        const formationId = this.formationIdCounter++;
        const entities = [];
        let instanceId = 0;

        // Iterate through each letter
        for (let letterIndex = 0; letterIndex < textData.letters.length; letterIndex++) {
            const letter = textData.letters[letterIndex];

            // Create a drone for each point
            for (let pointIndex = 0; pointIndex < letter.points.length; pointIndex++) {
                const point = letter.points[pointIndex];

                // Create entity
                const entity = this.entityManager.createEntity();

                // Transform - spawn at random position
                const spawnOffset = MathUtils.randomInSphere(spawnRadius);
                const spawnPos = new THREE.Vector3().addVectors(spawnCenter, spawnOffset);
                const transform = new TransformComponent(spawnPos.x, spawnPos.y, spawnPos.z);
                transform.scale.setScalar(0.2); // Drone size

                // Formation position - scaled version of the glyph point
                const formationPoint = new THREE.Vector3(
                    point.x * scale,
                    -point.y * scale, // Flip Y (canvas coords)
                    point.z * scale
                );
                formationPoint.add(spawnCenter); // Offset to spawn center

                // Velocity
                const velocity = new VelocityComponent();
                velocity.maxSpeed = 15.0;

                // Agent
                const agent = new AgentComponent();
                agent.state = AgentState.SPAWNING;
                agent.formationId = formationId;

                // Boid
                const boid = new BoidComponent();

                // Formation
                const formation = new FormationComponent();
                formation.formationPoint.copy(formationPoint);
                formation.letterIndex = letterIndex;
                formation.pointIndex = pointIndex;

                // Rigidbody
                const rigidbody = new RigidbodyComponent();
                rigidbody.mass = 0.5;
                rigidbody.drag = 0.95;

                // Collider
                const collider = new ColliderComponent(ColliderShape.SPHERE, 0.15);

                // Instanced Mesh
                const instancedMesh = new InstancedMeshComponent(instanceId++, color);

                // LOD
                const lod = new LODComponent();

                // Add components to entity
                entity
                    .addComponent(transform)
                    .addComponent(velocity)
                    .addComponent(agent)
                    .addComponent(boid)
                    .addComponent(formation)
                    .addComponent(rigidbody)
                    .addComponent(collider)
                    .addComponent(instancedMesh)
                    .addComponent(lod);

                entities.push(entity);
            }
        }

        return {
            entities,
            formationId,
            droneCount: entities.length
        };
    }

    /**
     * Create a single drone entity (for pooling/reuse)
     */
    createDrone(position, formationPoint, formationId, instanceId) {
        const entity = this.entityManager.createEntity();

        const transform = new TransformComponent(position.x, position.y, position.z);
        const velocity = new VelocityComponent();
        const agent = new AgentComponent();
        const boid = new BoidComponent();
        const formation = new FormationComponent();
        const rigidbody = new RigidbodyComponent();
        const collider = new ColliderComponent(ColliderShape.SPHERE, 0.15);
        const instancedMesh = new InstancedMeshComponent(instanceId, 0x00ff00);
        const lod = new LODComponent();

        agent.state = AgentState.SPAWNING;
        agent.formationId = formationId;
        formation.formationPoint.copy(formationPoint);

        entity
            .addComponent(transform)
            .addComponent(velocity)
            .addComponent(agent)
            .addComponent(boid)
            .addComponent(formation)
            .addComponent(rigidbody)
            .addComponent(collider)
            .addComponent(instancedMesh)
            .addComponent(lod);

        return entity;
    }
}
