/**
 * InputSystem - Handles player input
 */

import { System } from '../core/System.js';
import * as THREE from 'three';

export class InputSystem extends System {
    constructor(camera, canvas, weaponSystem) {
        super();
        this.requiredComponents = []; // Doesn't operate on entities
        this.camera = camera;
        this.canvas = canvas;
        this.weaponSystem = weaponSystem;

        // Input state
        this.mouse = {
            x: 0,
            y: 0,
            buttons: { left: false, right: false }
        };
        this.keys = {};

        // Raycaster for mouse picking
        this.raycaster = new THREE.Raycaster();
        this.mouseNDC = new THREE.Vector2();

        // Setup event listeners
        this.setupListeners();

        // Current weapon
        this.currentWeapon = null;

        // Callbacks
        this.onTextSubmit = null;
    }

    setupListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            // Normalized device coordinates
            this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.buttons.left = true;
                this.onMouseDown(e);
            } else if (e.button === 2) {
                this.mouse.buttons.right = true;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.buttons.left = false;
            } else if (e.button === 2) {
                this.mouse.buttons.right = false;
            }
        });

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            if (e.key === 'Enter' && this.onTextSubmit) {
                this.onTextSubmit();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseDown(e) {
        if (!this.currentWeapon) return;

        // Get ray from camera through mouse position
        this.raycaster.setFromCamera(this.mouseNDC, this.camera);

        const origin = this.raycaster.ray.origin.clone();
        const direction = this.raycaster.ray.direction.clone();

        // Fire weapon
        this.weaponSystem.fireWeapon(origin, direction, this.currentWeapon);
    }

    update(entities, deltaTime) {
        // Continuous firing if mouse held
        if (this.mouse.buttons.left && this.currentWeapon) {
            this.raycaster.setFromCamera(this.mouseNDC, this.camera);
            const origin = this.raycaster.ray.origin.clone();
            const direction = this.raycaster.ray.direction.clone();
            this.weaponSystem.fireWeapon(origin, direction, this.currentWeapon);
        }

        // Camera movement (optional)
        const moveSpeed = 10;
        if (this.keys['w']) {
            this.camera.position.z -= moveSpeed * deltaTime;
        }
        if (this.keys['s']) {
            this.camera.position.z += moveSpeed * deltaTime;
        }
        if (this.keys['a']) {
            this.camera.position.x -= moveSpeed * deltaTime;
        }
        if (this.keys['d']) {
            this.camera.position.x += moveSpeed * deltaTime;
        }
        if (this.keys['q']) {
            this.camera.position.y -= moveSpeed * deltaTime;
        }
        if (this.keys['e']) {
            this.camera.position.y += moveSpeed * deltaTime;
        }
    }

    setWeapon(weapon) {
        this.currentWeapon = weapon;
    }

    setTextSubmitCallback(callback) {
        this.onTextSubmit = callback;
    }
}
