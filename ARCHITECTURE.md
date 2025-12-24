# Drone Swarm Text Game - System Architecture

## Overview
A high-performance 3D game where text transforms into swarms of autonomous drone agents that form living, interactive structures. Built with Three.js using modern ECS (Entity-Component-System) architecture.

## Performance Targets
- **60 FPS** with 10,000+ active agents
- **GPU Instancing** for all drone rendering
- **LOD System** with distance-based culling
- **Memory Pooling** for zero-allocation updates
- **Spatial Hashing** for efficient collision detection

---

## Core Architecture: ECS Pattern

### Entity
Pure data container with unique ID. No logic.
```javascript
class Entity {
  id: number
  components: Map<ComponentType, Component>
}
```

### Component
Pure data structures. No methods except initialization.
```javascript
// Examples:
- TransformComponent: position, rotation, scale
- VelocityComponent: velocity, acceleration
- AgentComponent: targetPosition, state, energy
- FormationComponent: letterIndex, glyphPoint, formationId
```

### System
Pure logic. Operates on entities with specific component combinations.
```javascript
class System {
  update(entities: Entity[], deltaTime: number): void
  requiredComponents: ComponentType[]
}
```

---

## System Architecture Layers

### Layer 1: Core ECS Framework
```
EntityManager
├── Entity creation/destruction
├── Component add/remove/query
└── Memory pooling

ComponentRegistry
├── Component type definitions
└── Component factories

SystemManager
├── System registration
├── Update order management
└── Parallel system execution (future optimization)
```

### Layer 2: Agent Systems

#### 2.1 Text-to-Agent Conversion Pipeline
```
TextInput
  ↓
TextToVectorConverter (uses opentype.js or canvas API)
  ↓ Converts text to glyph outlines
VectorPath (bezier curves, line segments)
  ↓
GlyphSampler (adaptive sampling based on curvature)
  ↓ Generates 50-200 points per character
SampledPoints (world-space positions)
  ↓
DroneSpawner (entity creation with components)
  ↓
DroneEntities (ready for simulation)
```

**Key Classes:**
- `TextToVectorConverter`: Uses Canvas2D or opentype.js for font rendering
- `GlyphSampler`: Adaptive point distribution (more points on curves)
- `DroneFactory`: Entity template with all required components

#### 2.2 Swarm AI System (Boids Algorithm Enhanced)

**Components:**
- `AgentComponent`: state, targetPosition, formationPoint, energy
- `BoidComponent`: separationWeight, alignmentWeight, cohesionWeight
- `StateComponent`: currentState (FORMING, FORMED, ATTACKING, DEFENDING, PANICKING)

**Systems:**
- `FormationSystem`: Maintains text shape using spring forces
- `BoidSystem`: Applies separation, alignment, cohesion
- `StateSystem`: State machine updates (Finite State Machine)
- `SteeringSystem`: Combines all forces and applies to velocity

**Boid Algorithm Implementation:**
```
For each drone:
  1. Separation: Avoid crowding neighbors (inverse square law)
  2. Alignment: Steer towards average heading of neighbors
  3. Cohesion: Steer towards average position of neighbors
  4. Formation: Spring force towards assigned glyph point
  5. Obstacle Avoidance: Raycast ahead, steer away

  Combined Force =
    formation * 0.4 +
    separation * 0.3 +
    cohesion * 0.2 +
    alignment * 0.1 +
    obstacleAvoidance * 0.5 (if obstacle detected)
```

**Spatial Optimization:**
- Use 3D grid-based spatial hash
- Only check neighbors within 2-unit radius
- O(1) neighbor queries instead of O(n²)

#### 2.3 Behavior Tree System

**Node Types:**
- `Selector`: Execute children until one succeeds (OR)
- `Sequence`: Execute children until one fails (AND)
- `Condition`: Check state/environment
- `Action`: Perform behavior

**Example Tree for Drone:**
```
Root (Selector)
├── Sequence (Panic Behavior)
│   ├── Condition: Health < 20%
│   └── Action: FleeRandomly
├── Sequence (Attack Behavior)
│   ├── Condition: PlayerNearby AND State == ATTACKING
│   └── Action: ChargeAtPlayer
├── Sequence (Defend Formation)
│   ├── Condition: State == DEFENDING
│   └── Action: ReturnToFormation (with aggression)
└── Sequence (Maintain Formation - Default)
    └── Action: MaintainFormationPoint
```

**State Machine Integration:**
```
States:
- SPAWNING: Drones flying to initial formation points
- FORMING: Actively assembling into text shape
- FORMED: Holding formation, idle behaviors
- ATTACKING: Aggressive movement towards target
- DEFENDING: Return to formation with defensive posture
- PANICKING: Loss of cohesion, random movement
- DYING: Explosion animation, cleanup

Transitions:
- SPAWNING → FORMING (reached 80% of drones)
- FORMING → FORMED (formation stable for 2s)
- FORMED → ATTACKING (player input / timer)
- ATTACKING → DEFENDING (hit by player)
- ANY → PANICKING (formation integrity < 30%)
- ANY → DYING (health <= 0)
```

### Layer 3: Physics & Destruction

#### 3.1 Physics System

**Components:**
- `RigidbodyComponent`: mass, drag, useGravity
- `ColliderComponent`: shape (sphere/box), radius/size, isTrigger
- `PhysicsConstraintComponent`: constraints on movement

**Systems:**
- `PhysicsSystem`: Apply forces, integrate velocity, update positions
- `CollisionDetectionSystem`: Broad phase (spatial hash) + narrow phase
- `CollisionResponseSystem`: Apply impulses, trigger events

**Optimization:**
```
Broad Phase: Spatial hash grid (cell size = 5 units)
  - Only test entities in same/adjacent cells
  - O(n) instead of O(n²)

Narrow Phase: Sphere-sphere or sphere-AABB only
  - Drones: sphere colliders (cheapest)
  - Environment: AABB (axis-aligned bounding box)

Sleep System:
  - Entities with velocity < 0.01 for 1s → sleep
  - Skip physics updates for sleeping entities
  - Wake on collision or external force
```

#### 3.2 Destruction System

**Environment Structure:**
```
Building
├── StructuralElement (pillar, beam, wall)
│   ├── DestructibleComponent
│   │   ├── health
│   │   ├── fractureThreshold
│   │   └── debrisTemplate
│   └── StructuralIntegrityComponent
│       ├── supportedElements (what this supports)
│       └── supportingElements (what supports this)
```

**Destruction Algorithm:**
```
On Collision:
  1. Reduce element health by impact force
  2. If health <= 0:
     a. Check structural integrity
     b. If supporting critical elements:
        - Propagate damage to supported elements
        - Reduce their structural integrity
     c. Fracture into debris pieces
     d. Spawn debris entities with physics
     e. Remove original element
  3. Visual effects: particles, dust, sound
```

**Debris System:**
- Pre-baked fracture patterns (Voronoi cells)
- Pooled debris entities (reuse instead of allocate)
- Auto-cleanup after 10s or when far from camera

### Layer 4: Rendering & Performance

#### 4.1 GPU Instancing System

**InstancedMeshComponent:**
```javascript
{
  mesh: THREE.InstancedMesh,
  capacity: 10000,
  count: 0, // actual instances
  instanceMatrix: Float32Array,
  instanceColor: Float32Array
}
```

**RenderSystem:**
```
Per Frame:
  1. Group entities by mesh type
  2. For each group:
     a. Update instance matrices from TransformComponents
     b. Update instance colors from HealthComponents
     c. Set instancedMesh.count = active instances
     d. Mark instanceMatrix.needsUpdate = true
  3. Three.js renders all instances in one draw call
```

**Performance:**
- 10,000 drones = **1 draw call** (vs 10,000 without instancing)
- Update matrices: 10,000 * 16 floats = 160KB per frame
- Bandwidth: ~9.6 MB/s at 60 FPS (acceptable)

#### 4.2 LOD (Level of Detail) System

**LODComponent:**
```javascript
{
  levels: [
    { distance: 20, geometryIndex: 0 }, // High poly (sphere 32 segments)
    { distance: 50, geometryIndex: 1 }, // Medium (sphere 16 segments)
    { distance: 100, geometryIndex: 2 }, // Low (sphere 8 segments)
    { distance: 200, geometryIndex: 3 }  // Billboard (single quad)
  ]
}
```

**LODSystem:**
```
Per Frame:
  1. Calculate distance to camera for each entity
  2. Determine LOD level from LODComponent table
  3. Swap geometry if level changed
  4. For very distant objects (>200 units):
     - Switch to billboard (camera-facing quad with sprite)
```

#### 4.3 Culling System

**FrustumCullingSystem:**
```javascript
Per Frame:
  1. Update camera frustum
  2. For each entity:
     - Check if bounding sphere intersects frustum
     - Set visible = true/false
  3. RenderSystem only processes visible entities
```

**Occlusion Culling (Future):**
- Raycast from camera to entity
- If blocked by large structure, mark not visible
- Only check every 10 frames (stagger checks)

### Layer 5: Player Interaction

#### 5.1 Weapon System

**Projectile Weapon (Gun):**
```javascript
ProjectileComponent {
  damage: number,
  speed: number,
  lifetime: number,
  penetration: number // how many drones it can pierce
}
```

**Melee Weapon (Laser Slice):**
```javascript
SliceComponent {
  startPoint: Vector3,
  endPoint: Vector3,
  width: number,
  damage: number,
  duration: 0.2s // visual effect duration
}

SliceSystem:
  1. Create line segment from start to end
  2. For each drone:
     - Calculate distance from point to line segment
     - If distance < width: apply damage
  3. Visual: Render glowing line with trail effect
```

**Explosion (Grenade):**
```javascript
ExplosionComponent {
  position: Vector3,
  radius: number,
  maxDamage: number,
  falloffExponent: 2 // damage = maxDamage * (1 - (distance/radius)^2)
}
```

#### 5.2 Text Rewriting System

**Flow:**
```
User types new text
  ↓
Old formation enters DISSOLVE state
  ↓ (Drones scatter with outward velocity)
DronePoolSystem marks old drones as "available"
  ↓ (1 second transition)
New text processed by TextToVectorConverter
  ↓
DroneFactory reuses pooled drones OR spawns new ones
  ↓
New drones enter SPAWNING state
  ↓
Formation assembles
```

**Smooth Transition:**
- Old drones fade out over 1s (alpha: 1 → 0)
- New drones fade in over 1s (alpha: 0 → 1)
- Reuse drone entities to avoid GC pressure
- Maximum pool size: 20,000 drones

---

## Data Structures

### Spatial Hash Grid
```javascript
class SpatialHash {
  cellSize: number = 5.0
  grid: Map<string, Entity[]>

  getCell(position: Vector3): string {
    const x = Math.floor(position.x / cellSize)
    const y = Math.floor(position.y / cellSize)
    const z = Math.floor(position.z / cellSize)
    return `${x},${y},${z}`
  }

  getNearby(position: Vector3): Entity[] {
    // Return entities in current cell + 26 adjacent cells
  }
}
```

### Object Pooling
```javascript
class ObjectPool<T> {
  available: T[] = []
  active: Set<T> = new Set()
  factory: () => T

  acquire(): T {
    return available.pop() || factory()
  }

  release(obj: T): void {
    active.delete(obj)
    available.push(obj)
  }
}
```

---

## Update Flow (Per Frame)

```
1. Input System (process player input)
   ↓
2. Behavior Tree System (AI decision making)
   ↓
3. State Machine System (state transitions)
   ↓
4. Steering System (calculate forces)
   ↓ (separation, alignment, cohesion, formation)
5. Physics System (integrate forces → velocity → position)
   ↓
6. Collision Detection System (broad + narrow phase)
   ↓
7. Collision Response System (apply impulses)
   ↓
8. Destruction System (process damage, fracture geometry)
   ↓
9. LOD System (update detail levels)
   ↓
10. Culling System (frustum culling)
    ↓
11. Render System (update instance matrices, draw)
    ↓
12. Cleanup System (remove dead entities, return to pool)
```

**Execution Time Budget (60 FPS = 16.67ms):**
- AI Systems (1-3): 3ms
- Steering (4): 2ms
- Physics (5-7): 4ms
- Destruction (8): 1ms
- LOD/Culling (9-10): 1ms
- Rendering (11): 4ms
- Cleanup (12): 0.5ms
- **Total: 15.5ms** (0.17ms safety margin)

---

## Technology Stack

### Core
- **Three.js r128+**: 3D rendering, instancing, shaders
- **JavaScript/ES6**: Main language (TypeScript optional for production)
- **Web Workers**: Offload text-to-vector conversion (future optimization)

### Libraries
- **opentype.js** or **Canvas2D**: Font glyph extraction
- **stats.js**: Performance monitoring (FPS, memory)

### Rendering Features
- **GPU Instancing**: THREE.InstancedMesh
- **Custom Shaders**: Glow effects, dissolution, hit flashes
- **Post-Processing**: Bloom for sci-fi look (optional, costs ~2ms)

---

## Performance Optimizations

### 1. Memory Management
- **Object Pooling**: Zero allocations during gameplay
- **Typed Arrays**: Float32Array for matrices/vectors
- **Avoid Array Operations**: No splice, push in hot paths

### 2. Computational
- **Spatial Hashing**: O(1) neighbor queries
- **LOD**: Reduce vertex count at distance
- **Frustum Culling**: Skip invisible entities
- **Dirty Flags**: Only update changed data
- **Fixed Time Step**: Decouple physics from render (optional)

### 3. Rendering
- **GPU Instancing**: 1 draw call per mesh type
- **Texture Atlasing**: Single texture for all drones
- **Shader Complexity**: Keep fragment shaders simple
- **Reduce Overdraw**: Sort transparent objects back-to-front

### 4. Profiling Strategy
- **stats.js**: Monitor FPS, MS, MB
- **Chrome DevTools**: Profile hot functions
- **Three.js Renderer Info**: Track draw calls, triangles
- **Custom Timers**: Measure each system's update time

---

## Modularity & Extension Points

### Adding New Agent Behaviors
1. Create new `Action` node for behavior tree
2. Implement logic in node's `execute()` method
3. Add to behavior tree structure
4. No changes to core systems needed

### Adding New Weapon Types
1. Create new Component (e.g., `FlamethrowerComponent`)
2. Create new System (e.g., `FlamethrowerSystem`)
3. Register system in SystemManager
4. Add UI binding in InputSystem

### Adding New Destruction Types
1. Add fracture pattern to `FractureLibrary`
2. Configure in `DestructibleComponent`
3. Destruction system handles automatically

### Swapping Rendering Engine
ECS architecture allows replacing Three.js with Babylon.js, Unity, etc.:
1. Implement new `RenderSystem` for target engine
2. Keep all game logic systems unchanged
3. Update Component data structures if needed (e.g., Vector3 type)

---

## File Structure

```
/src
  /core
    Entity.js
    Component.js
    System.js
    EntityManager.js
    SystemManager.js

  /components
    TransformComponent.js
    VelocityComponent.js
    AgentComponent.js
    BoidComponent.js
    FormationComponent.js
    RigidbodyComponent.js
    ColliderComponent.js
    DestructibleComponent.js
    InstancedMeshComponent.js
    LODComponent.js

  /systems
    FormationSystem.js
    BoidSystem.js
    SteeringSystem.js
    PhysicsSystem.js
    CollisionSystem.js
    DestructionSystem.js
    BehaviorTreeSystem.js
    StateMachineSystem.js
    LODSystem.js
    CullingSystem.js
    RenderSystem.js

  /ai
    BehaviorTree.js
    BehaviorNodes.js (Selector, Sequence, Condition, Action)
    StateMachine.js

  /text
    TextToVectorConverter.js
    GlyphSampler.js
    DroneFactory.js

  /physics
    SpatialHash.js
    CollisionDetector.js

  /utils
    ObjectPool.js
    MathUtils.js

  /rendering
    InstancedDroneRenderer.js
    ShaderLibrary.js

  Game.js (main entry point)
  index.html
```

---

## Next Steps: Implementation Order

1. ✅ Core ECS framework (Entity, Component, System, Managers)
2. ✅ Basic rendering with GPU instancing
3. ✅ Text-to-vector conversion and glyph sampling
4. ✅ Drone spawning and formation system
5. ✅ Boid steering behaviors
6. ✅ State machine and behavior trees
7. ✅ Physics and collision detection
8. ✅ Player interaction (shooting)
9. ✅ Destruction system
10. ✅ Performance optimizations (LOD, culling, pooling)
11. ✅ Polish (VFX, sound, UI)

This architecture provides a solid foundation for a AAA-quality game prototype while remaining flexible for future enhancements.
