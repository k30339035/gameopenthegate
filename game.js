// Game state
let scene, camera, renderer, raycaster, mouse;
let doors = [];
let currentLevel = 1;
let difficulty = 'medium';
let wrongDoorIndices = [];
let gameActive = false;
let character = null;
let characterMixer = null;
let characterAnimations = {};
let isMoving = false;
let targetDoor = null;
let clock = new THREE.Clock();

// Difficulty settings
const difficultySettings = {
    easy: { wrongDoorsCount: 2 },
    medium: { wrongDoorsCount: 3 },
    hard: { wrongDoorsCount: 4 }
};

// Level configuration (level 1 = 10 doors, level 2 = 9 doors, ..., level 9 = 2 doors)
const getLevelDoorCount = (level) => {
    return 11 - level;
};

// Initialize Three.js scene
function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2, 15);
    camera.lookAt(0, 2, 0);

    // Create renderer
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x667eea, 1, 50);
    pointLight.position.set(0, 5, 10);
    scene.add(pointLight);

    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Initialize raycaster for mouse picking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Handle mouse click
    canvas.addEventListener('click', onMouseClick);

    // Load character
    loadCharacter();
}

// Load FBX character
function loadCharacter() {
    // First, create placeholder character so game is playable immediately
    createPlaceholderCharacter();

    // Then try to load FBX file if available
    if (typeof THREE.FBXLoader !== 'undefined') {
        const fbxLoader = new THREE.FBXLoader();

        fbxLoader.load(
            'character.fbx',
            (fbx) => {
                // Remove placeholder character
                if (character) {
                    scene.remove(character);
                }

                character = fbx;
                character.scale.setScalar(0.01); // Adjust scale as needed
                character.position.set(0, 0, 8); // Start position in front of camera
                character.rotation.y = Math.PI; // Face the doors

                // Enable shadows
                character.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // Setup animations if available
                if (fbx.animations && fbx.animations.length > 0) {
                    characterMixer = new THREE.AnimationMixer(character);

                    fbx.animations.forEach((clip) => {
                        characterAnimations[clip.name] = characterMixer.clipAction(clip);
                    });

                    // Play idle animation if available
                    if (characterAnimations['Idle']) {
                        characterAnimations['Idle'].play();
                    } else if (characterAnimations['idle']) {
                        characterAnimations['idle'].play();
                    }
                }

                scene.add(character);
                console.log('FBX Character loaded successfully!');
            },
            (xhr) => {
                console.log('Loading character: ' + (xhr.loaded / xhr.total * 100) + '%');
            },
            (error) => {
                console.log('FBX file not found. Using placeholder character.');
            }
        );
    } else {
        console.log('FBXLoader not available. Using placeholder character.');
    }
}

// Create placeholder character if FBX not found
function createPlaceholderCharacter() {
    character = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    character.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xf39c12 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.8;
    head.castShadow = true;
    character.add(head);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.6, 8, 16);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 1, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    character.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 1, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    character.add(rightArm);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8, 8, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, 0.4, 0);
    leftLeg.castShadow = true;
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, 0.4, 0);
    rightLeg.castShadow = true;
    character.add(rightLeg);

    character.position.set(0, 0, 8);
    character.rotation.y = Math.PI;
    scene.add(character);

    console.log('Placeholder character created.');
}

// Create a door
function createDoor(x, y, z, isWrong = false) {
    const doorGroup = new THREE.Group();

    // Door frame
    const frameGeometry = new THREE.BoxGeometry(2.2, 3.2, 0.2);
    const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a6a,
        roughness: 0.5,
        metalness: 0.5
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    doorGroup.add(frame);

    // Door panel
    const doorGeometry = new THREE.BoxGeometry(2, 3, 0.15);
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x667eea,
        roughness: 0.3,
        metalness: 0.7
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.castShadow = true;
    door.position.z = 0.025;
    doorGroup.add(door);

    // Door handle
    const handleGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.7, 0, 0.15);
    doorGroup.add(handle);

    // Add glow effect
    const glowGeometry = new THREE.PlaneGeometry(2.3, 3.3);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: isWrong ? 0xff0000 : 0x667eea,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = -0.05;
    doorGroup.add(glow);

    doorGroup.position.set(x, y, z);
    doorGroup.userData = {
        isWrong,
        clicked: false,
        door: door,
        glow: glow,
        originalColor: door.material.color.clone()
    };

    return doorGroup;
}

// Create doors for current level
function createDoors() {
    // Clear existing doors
    doors.forEach(door => scene.remove(door));
    doors = [];

    const doorCount = getLevelDoorCount(currentLevel);
    const wrongDoorsCount = difficultySettings[difficulty].wrongDoorsCount;

    // Generate random indices for wrong doors
    wrongDoorIndices = [];
    while (wrongDoorIndices.length < Math.min(wrongDoorsCount, doorCount - 1)) {
        const randomIndex = Math.floor(Math.random() * doorCount);
        if (!wrongDoorIndices.includes(randomIndex)) {
            wrongDoorIndices.push(randomIndex);
        }
    }

    // Calculate door positions
    const spacing = 3;
    const totalWidth = (doorCount - 1) * spacing;
    const startX = -totalWidth / 2;

    // Create doors
    for (let i = 0; i < doorCount; i++) {
        const x = startX + i * spacing;
        const isWrong = wrongDoorIndices.includes(i);
        const door = createDoor(x, 1.6, 0, isWrong);
        scene.add(door);
        doors.push(door);
    }

    // Update UI
    updateUI();
}

// Update UI
function updateUI() {
    document.getElementById('current-level').textContent = currentLevel;
    document.getElementById('door-count').textContent = getLevelDoorCount(currentLevel);
    document.getElementById('current-difficulty').textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

// Handle mouse click
function onMouseClick(event) {
    if (!gameActive || !character || isMoving) return;

    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObjects(doors, true);

    if (intersects.length > 0) {
        let doorGroup = intersects[0].object;

        // Find the door group
        while (doorGroup.parent && doorGroup.parent.type !== 'Scene') {
            doorGroup = doorGroup.parent;
        }

        if (doorGroup.userData && !doorGroup.userData.clicked) {
            moveCharacterToDoor(doorGroup);
        }
    }
}

// Move character to door
function moveCharacterToDoor(doorGroup) {
    isMoving = true;
    targetDoor = doorGroup;
    targetDoor.userData.clicked = true;

    const targetPosition = new THREE.Vector3(
        doorGroup.position.x,
        0,
        doorGroup.position.z + 3
    );

    // Play walking animation if available
    if (characterAnimations['Walking'] || characterAnimations['walking'] || characterAnimations['Walk'] || characterAnimations['walk']) {
        const walkAnim = characterAnimations['Walking'] || characterAnimations['walking'] || characterAnimations['Walk'] || characterAnimations['walk'];
        const idleAnim = characterAnimations['Idle'] || characterAnimations['idle'];

        if (idleAnim) idleAnim.stop();
        if (walkAnim) walkAnim.play();
    }

    // Animate movement
    const startPosition = character.position.clone();
    const distance = startPosition.distanceTo(targetPosition);
    const duration = distance * 500; // Speed control
    const startTime = Date.now();

    // Rotate character to face door
    const direction = new THREE.Vector3().subVectors(targetPosition, startPosition);
    const angle = Math.atan2(direction.x, direction.z);
    character.rotation.y = angle;

    const moveInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        character.position.lerpVectors(startPosition, targetPosition, progress);

        if (progress >= 1) {
            clearInterval(moveInterval);
            isMoving = false;

            // Stop walking animation
            if (characterAnimations['Walking'] || characterAnimations['walking'] || characterAnimations['Walk'] || characterAnimations['walk']) {
                const walkAnim = characterAnimations['Walking'] || characterAnimations['walking'] || characterAnimations['Walk'] || characterAnimations['walk'];
                const idleAnim = characterAnimations['Idle'] || characterAnimations['idle'];

                if (walkAnim) walkAnim.stop();
                if (idleAnim) idleAnim.play();
            }

            // Open door when character arrives
            setTimeout(() => handleDoorClick(targetDoor), 300);
        }
    }, 16);
}

// Handle door click
function handleDoorClick(doorGroup) {
    doorGroup.userData.clicked = true;

    // Animate door opening
    const door = doorGroup.userData.door;
    const glow = doorGroup.userData.glow;

    // Open animation
    const openAnimation = () => {
        let rotation = 0;
        const openInterval = setInterval(() => {
            rotation += 0.1;
            door.rotation.y = rotation;

            if (rotation >= Math.PI / 2) {
                clearInterval(openInterval);

                // Show result after door opens
                setTimeout(() => {
                    if (doorGroup.userData.isWrong) {
                        showXMark(doorGroup);
                        setTimeout(() => gameOver(), 1500);
                    } else {
                        showCheckMark(doorGroup);
                        setTimeout(() => nextLevel(), 1500);
                    }
                }, 300);
            }
        }, 16);
    };

    // Glow effect
    let glowOpacity = 0;
    const glowInterval = setInterval(() => {
        glowOpacity += 0.05;
        glow.material.opacity = Math.min(glowOpacity, 0.3);

        if (glowOpacity >= 0.3) {
            clearInterval(glowInterval);
        }
    }, 16);

    openAnimation();
}

// Show X mark on wrong door
function showXMark(doorGroup) {
    const xGroup = new THREE.Group();

    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const lineGeometry = new THREE.BoxGeometry(2, 0.2, 0.1);

    const line1 = new THREE.Mesh(lineGeometry, lineMaterial);
    line1.rotation.z = Math.PI / 4;
    xGroup.add(line1);

    const line2 = new THREE.Mesh(lineGeometry, lineMaterial);
    line2.rotation.z = -Math.PI / 4;
    xGroup.add(line2);

    xGroup.position.copy(doorGroup.position);
    xGroup.position.z = 0.2;
    scene.add(xGroup);

    doorGroup.userData.xMark = xGroup;
}

// Show check mark on correct door
function showCheckMark(doorGroup) {
    const checkGroup = new THREE.Group();

    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    const line1Geometry = new THREE.BoxGeometry(1, 0.2, 0.1);
    const line1 = new THREE.Mesh(line1Geometry, lineMaterial);
    line1.rotation.z = -Math.PI / 4;
    line1.position.set(-0.3, -0.3, 0);
    checkGroup.add(line1);

    const line2Geometry = new THREE.BoxGeometry(1.5, 0.2, 0.1);
    const line2 = new THREE.Mesh(line2Geometry, lineMaterial);
    line2.rotation.z = Math.PI / 4;
    line2.position.set(0.4, 0.2, 0);
    checkGroup.add(line2);

    checkGroup.position.copy(doorGroup.position);
    checkGroup.position.z = 0.2;
    scene.add(checkGroup);

    doorGroup.userData.checkMark = checkGroup;
}

// Next level
function nextLevel() {
    currentLevel++;

    // Check if won (completed level 9 with 2 doors)
    if (currentLevel > 9) {
        win();
        return;
    }

    // Reset character position
    if (character) {
        character.position.set(0, 0, 8);
        character.rotation.y = Math.PI;
    }

    createDoors();
}

// Game over
function gameOver() {
    gameActive = false;

    document.getElementById('final-level').textContent = currentLevel;

    showScreen('game-over-screen');
}

// Win
function win() {
    gameActive = false;

    document.getElementById('win-difficulty-text').textContent =
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

    showScreen('win-screen');
}

// Show screen
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));

    document.getElementById(screenId).classList.add('active');
}

// Start game
function startGame(selectedDifficulty) {
    console.log('Starting game with difficulty:', selectedDifficulty);
    difficulty = selectedDifficulty;
    currentLevel = 1;
    gameActive = true;

    createDoors();
    showScreen('game-screen');
    console.log('Game started! Level:', currentLevel);
}

// Restart game
function restartGame() {
    // Clear all marks
    doors.forEach(door => {
        if (door.userData.xMark) {
            scene.remove(door.userData.xMark);
        }
        if (door.userData.checkMark) {
            scene.remove(door.userData.checkMark);
        }
    });

    // Reset character position
    if (character) {
        character.position.set(0, 0, 8);
        character.rotation.y = Math.PI;
        isMoving = false;
        targetDoor = null;
    }

    showScreen('title-screen');
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update character animations
    if (characterMixer) {
        characterMixer.update(delta);
    }

    // Rotate camera slightly for effect
    if (gameActive) {
        camera.position.x = Math.sin(Date.now() * 0.0001) * 0.5;
    }

    renderer.render(scene, camera);
}

// Initialize game
function init() {
    console.log('Initializing game...');
    initScene();
    animate();

    // Setup event listeners
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    console.log('Found difficulty buttons:', difficultyButtons.length);

    difficultyButtons.forEach((btn, index) => {
        console.log('Setting up button', index, 'with difficulty:', btn.getAttribute('data-difficulty'));
        btn.addEventListener('click', (e) => {
            console.log('Difficulty button clicked!');
            const selectedDifficulty = e.target.getAttribute('data-difficulty');
            console.log('Selected difficulty:', selectedDifficulty);
            startGame(selectedDifficulty);
        });
    });

    const restartBtn = document.getElementById('restart-btn');
    const winRestartBtn = document.getElementById('win-restart-btn');

    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
        console.log('Restart button listener added');
    }

    if (winRestartBtn) {
        winRestartBtn.addEventListener('click', restartGame);
        console.log('Win restart button listener added');
    }

    console.log('Game initialized successfully!');
}

// Start when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
