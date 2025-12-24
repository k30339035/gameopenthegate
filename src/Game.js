/**
 * Game - Main game class that orchestrates all systems
 * This is the entry point for the Drone Swarm Text Game
 */

import * as THREE from 'three';

// Core ECS
import { EntityManager } from './core/EntityManager.js';
import { SystemManager } from './core/SystemManager.js';

// Systems
import { SpatialHashSystem } from './systems/SpatialHashSystem.js';
import { BoidSystem } from './systems/BoidSystem.js';
import { FormationSystem } from './systems/FormationSystem.js';
import { SteeringSystem } from './systems/SteeringSystem.js';
import { BehaviorTreeSystem } from './systems/BehaviorTreeSystem.js';
import { StateMachineSystem } from './systems/StateMachineSystem.js';
import { PhysicsSystem } from './systems/PhysicsSystem.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { LODSystem } from './systems/LODSystem.js';
import { CullingSystem } from './systems/CullingSystem.js';
import { DestructionSystem } from './systems/DestructionSystem.js';
import { WeaponSystem } from './systems/WeaponSystem.js';
import { InputSystem } from './systems/InputSystem.js';

// Text processing
import { TextToVectorConverter } from './text/TextToVectorConverter.js';
import { DroneFactory } from './text/DroneFactory.js';

// Components
import { WeaponComponent, WeaponType } from './components/WeaponComponent.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.running = false;
        this.lastTime = performance.now();

        // Stats
        this.stats = {
            fps: 60,
            frameTime: 0,
            entities: 0,
            drones: 0
        };

        // Initialize Three.js
        this.initThreeJS();

        // Initialize ECS
        this.entityManager = new EntityManager();
        this.systemManager = new SystemManager(this.entityManager);

        // Initialize systems (ORDER MATTERS!)
        this.initSystems();

        // Text processing
        this.textConverter = new TextToVectorConverter();
        this.droneFactory = new DroneFactory(this.entityManager);

        // Current formation
        this.currentFormation = null;

        // Setup UI
        this.setupUI();

        console.log('🎮 Drone Swarm Text Game Initialized!');
    }

    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 20, 100);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            500
        );
        this.camera.position.set(0, 10, 30);
        this.camera.lookAt(0, 5, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0x00ff00, 1, 50);
        pointLight.position.set(0, 10, 0);
        this.scene.add(pointLight);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Grid helper
        const gridHelper = new THREE.GridHelper(200, 40, 0x00ff00, 0x004400);
        gridHelper.position.y = 0.01;
        this.scene.add(gridHelper);

        // Window resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Clock
        this.clock = new THREE.Clock();
    }

    initSystems() {
        // Create systems in execution order
        const spatialHashSystem = new SpatialHashSystem();
        const formationSystem = new FormationSystem();
        const boidSystem = new BoidSystem();
        const behaviorTreeSystem = new BehaviorTreeSystem();
        const stateMachineSystem = new StateMachineSystem();
        const steeringSystem = new SteeringSystem();
        const physicsSystem = new PhysicsSystem();
        const collisionSystem = new CollisionSystem(spatialHashSystem);
        const destructionSystem = new DestructionSystem(this.entityManager, this.scene);
        const lodSystem = new LODSystem(this.camera);
        const cullingSystem = new CullingSystem(this.camera);
        const renderSystem = new RenderSystem(this.scene, this.camera);
        const weaponSystem = new WeaponSystem(this.entityManager, this.camera);
        const inputSystem = new InputSystem(this.camera, this.canvas, weaponSystem);

        // Register systems in order
        this.systemManager
            .registerSystem(inputSystem)
            .registerSystem(spatialHashSystem)
            .registerSystem(behaviorTreeSystem)
            .registerSystem(stateMachineSystem)
            .registerSystem(formationSystem)
            .registerSystem(boidSystem)
            .registerSystem(steeringSystem)
            .registerSystem(physicsSystem)
            .registerSystem(collisionSystem)
            .registerSystem(destructionSystem)
            .registerSystem(weaponSystem)
            .registerSystem(lodSystem)
            .registerSystem(cullingSystem)
            .registerSystem(renderSystem);

        // Store references to commonly accessed systems
        this.inputSystem = inputSystem;
        this.weaponSystem = weaponSystem;
        this.renderSystem = renderSystem;

        // Setup default weapon
        const defaultWeapon = new WeaponComponent(WeaponType.GUN);
        defaultWeapon.damage = 15;
        defaultWeapon.fireRate = 0.15;
        this.inputSystem.setWeapon(defaultWeapon);
    }

    setupUI() {
        // Text input callback
        this.inputSystem.setTextSubmitCallback(() => {
            const input = document.getElementById('text-input');
            if (input && input.value.trim()) {
                this.spawnTextDrones(input.value.trim());
            }
        });

        // Button handlers
        const spawnBtn = document.getElementById('spawn-text-btn');
        if (spawnBtn) {
            spawnBtn.addEventListener('click', () => {
                const input = document.getElementById('text-input');
                if (input && input.value.trim()) {
                    this.spawnTextDrones(input.value.trim());
                }
            });
        }

        // Update stats display
        setInterval(() => this.updateStatsDisplay(), 500);
    }

    /**
     * Spawn drones from text input
     */
    spawnTextDrones(text) {
        console.log(`📝 Spawning drones for: "${text}"`);

        // Dissolve old formation if exists
        if (this.currentFormation) {
            this.dissolveFormation(this.currentFormation);
        }

        // Convert text to vector points
        const textData = this.textConverter.convertText(text, {
            fontSize: 200,
            samplingDensity: 0.3, // Adjust for performance
            spacing: 1.2
        });

        // Scale points to fit in world
        const allPoints = textData.letters.flatMap(l => l.points);
        this.textConverter.scalePoints(allPoints, 20); // 20 units wide

        console.log(`✨ Generated ${textData.totalPoints} points`);

        // Create drones
        const formation = this.droneFactory.createDronesFromText(textData, {
            spawnCenter: new THREE.Vector3(0, 10, 0),
            spawnRadius: 15,
            scale: 0.05,
            color: 0x00ff00
        });

        this.currentFormation = formation;

        console.log(`🚁 Spawned ${formation.droneCount} drones (Formation ID: ${formation.formationId})`);

        // Update UI
        const droneCount = document.getElementById('drone-count');
        if (droneCount) {
            droneCount.textContent = formation.droneCount;
        }
    }

    /**
     * Dissolve a formation (make drones scatter and die)
     */
    dissolveFormation(formation) {
        // Find all entities in this formation
        const formationEntities = this.entityManager.entities.filter(entity => {
            const agent = entity.getComponent('AgentComponent');
            return agent && agent.formationId === formation.formationId;
        });

        // Mark for destruction with delay
        for (const entity of formationEntities) {
            setTimeout(() => {
                if (entity.active) {
                    this.entityManager.destroyEntity(entity);
                }
            }, Math.random() * 1000); // Stagger destruction
        }
    }

    /**
     * Update stats display
     */
    updateStatsDisplay() {
        const fpsEl = document.getElementById('fps');
        const entitiesEl = document.getElementById('entity-count');
        const dronesEl = document.getElementById('drone-count');

        if (fpsEl) fpsEl.textContent = Math.round(this.stats.fps);
        if (entitiesEl) entitiesEl.textContent = this.entityManager.getEntityCount();

        // Count active drones
        const activeDrones = this.entityManager.entities.filter(e =>
            e.hasComponent('AgentComponent')
        ).length;
        if (dronesEl) dronesEl.textContent = activeDrones;
    }

    /**
     * Main game loop
     */
    update() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;

        // Update all systems
        this.systemManager.update(deltaTime);

        // Render
        this.renderer.render(this.scene, this.camera);

        // Update stats
        this.stats.frameTime = deltaTime * 1000;
        this.stats.fps = 1 / deltaTime;
        this.stats.entities = this.entityManager.getEntityCount();

        // Continue loop
        requestAnimationFrame(() => this.update());
    }

    /**
     * Start the game
     */
    start() {
        if (this.running) return;

        console.log('🚀 Game Started!');
        this.running = true;
        this.lastTime = performance.now();
        this.update();
    }

    /**
     * Stop the game
     */
    stop() {
        console.log('⏸️ Game Stopped');
        this.running = false;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stop();
        this.systemManager.clear();
        this.entityManager.clear();
        this.renderer.dispose();
        console.log('🗑️ Game Destroyed');
    }
}
