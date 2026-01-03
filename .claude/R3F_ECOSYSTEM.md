# React Three Fiber Ecosystem Reference

This document provides a comprehensive reference for the R3F ecosystem libraries, based on in-depth analysis of the source repositories.

## Currently Used Libraries

| Library | Purpose | Status |
|---------|---------|--------|
| react-three-fiber | React renderer for Three.js | Active |
| @react-three/drei | Useful helpers (Trail, Float, Stats) | Underutilized |
| @react-three/rapier | 3D physics with Rapier WASM | Active |
| @react-three/a11y | Accessibility for 3D scenes | Active |
| zustand | Flux-based state management | Active |
| @react-spring/web | Spring-physics animations | Active |
| leva | GUI controls for development | Active |
| miniplex | Entity Component System | Needs Improvement |

---

## Recommended Additions & Improvements

### HIGH PRIORITY

#### 1. maath - Math Helpers
**Install:** `npm install maath`

Replaces our custom math utilities with battle-tested implementations:

```typescript
// Replace our distance2D function
import { distance } from 'maath/vector2'
const dist = distance([a.x, a.z], [b.x, b.z])

// Smooth movement with damping (better than lerp)
import * as easing from 'maath/easing'
useFrame((_, delta) => {
  easing.damp3(position, targetPosition, 0.25, delta)
})

// Random spawn positions
import * as random from 'maath/random'
const buffer = new Float32Array(playerCount * 3)
random.inCircle(buffer, { radius: 20, center: [0, 0] })
```

**Key Functions:**
- `easing.damp3()` - Smooth position interpolation with velocity
- `vector3.distance()`, `vector3.lengthSqr()` - Efficient distance checks
- `misc.clamp()`, `misc.remap()` - Value constraints
- `random.inSphere()`, `random.onCircle()` - Spawn distributions
- `noise.simplex3()` - Procedural variation

#### 2. @react-three/postprocessing - Visual Effects
**Install:** `npm install @react-three/postprocessing postprocessing`

```tsx
import { EffectComposer, Bloom, SSAO, Vignette, SMAA } from '@react-three/postprocessing'

<EffectComposer multisampling={8}>
  <SMAA />
  <SSAO radius={20} intensity={1} samples={30} />
  <Bloom luminanceThreshold={0.95} height={300} />
  <Vignette offset={0.1} darkness={0.4} />
</EffectComposer>
```

**Recommended Stack:**
| Effect | Purpose | Performance Cost |
|--------|---------|------------------|
| SMAA | Anti-aliasing | Low |
| Bloom | Glow on highlights | Low-Medium |
| SSAO | Ambient occlusion depth | Medium-High |
| Vignette | Focus edges | Very Low |
| DepthOfField | Cinematic focus | Medium |

#### 3. miniplex-react - Proper React Integration
**Install:** `npm install miniplex-react`

Our current implementation uses polling with `setInterval`. The proper pattern:

```typescript
import { createReactAPI } from 'miniplex-react'
import { world } from './ecs'

const ECS = createReactAPI(world)

// Replace our custom Team.tsx
function Team({ team }) {
  const query = world.with("player").where(e => e.player.team === team)

  return (
    <ECS.Entities in={query}>
      {(entity) => <Player key={entity.id} entity={entity} />}
    </ECS.Entities>
  )
}
```

**Key Hooks:**
- `useEntities(bucket)` - Subscribes to entity changes (no polling!)
- `useOnEntityAdded(bucket, callback)` - React to additions
- `useOnEntityRemoved(bucket, callback)` - React to removals

### MEDIUM PRIORITY

#### 4. Drei Components We're Not Using

| Component | Use Case for Frisbee |
|-----------|---------------------|
| `Instances` | Crowd rendering, repeated geometry |
| `PerformanceMonitor` | Auto-adjust quality based on FPS |
| `KeyboardControls` | Zustand-powered input management |
| `CameraShake` | Impact effects, celebrations |
| `Detailed` | LOD for player models at distance |
| `Bvh` | Faster raycasting for collision |
| `Segments` | Efficient field line rendering |
| `Points` | Particle effects, crowd as points |

**Example: KeyboardControls**
```tsx
import { KeyboardControls, useKeyboardControls } from '@react-three/drei'

const keyMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'throw', keys: ['Space'] },
]

<KeyboardControls map={keyMap}>
  <Canvas>
    <Game />
  </Canvas>
</KeyboardControls>

// In component
const [, getKeys] = useKeyboardControls()
useFrame(() => {
  const { forward, backward, throw: throwDisc } = getKeys()
  // Handle input
})
```

#### 5. @react-three/uikit - WebGL UI
**Install:** `npm install @react-three/uikit`

Replace HTML overlay scoreboard with WebGL-rendered UI:

```tsx
import { Fullscreen, Container, Text } from '@react-three/uikit'

<Fullscreen flexDirection="column" padding={20}>
  <Container flexDirection="row" justifyContent="space-between">
    <Text fontSize={32}>HOME: {homeScore}</Text>
    <Text fontSize={24}>{minutes}:{seconds}</Text>
    <Text fontSize={32}>AWAY: {awayScore}</Text>
  </Container>
</Fullscreen>
```

**Benefits:**
- VR/XR compatible (no HTML overlays)
- 60fps with 30,000+ UI elements
- Unified coordinate space with 3D scene
- Yoga flexbox layout

### LOWER PRIORITY (Polish Phase)

#### 6. vfx-composer - Particle Effects
**Install:** `npm install vfx-composer vfx-composer-r3f`

For score celebrations, impact effects:
```tsx
import { InstancedParticles, Emitter } from 'vfx-composer-r3f'

function ScoreCelebration() {
  return (
    <InstancedParticles capacity={500}>
      <Emitter count={100} setup={particle => {
        particle.position.set(0, 0, 0)
        particle.velocity.set(random.range(-1, 1), random.range(2, 5), random.range(-1, 1))
        particle.lifetime = random.range(1, 3)
      }} />
    </InstancedParticles>
  )
}
```

#### 7. timeline-composer - Sequenced Animations
```tsx
import { Delay, Repeat, Lifetime } from 'timeline-composer'

// Celebration sequence
<Delay seconds={0.5}>
  <Lifetime seconds={3}>
    <Confetti />
    <CameraShake intensity={0.5} />
  </Lifetime>
</Delay>
```

---

## Best Practices Reference

### Zustand Optimization

**1. Precise Selectors (Critical)**
```typescript
// GOOD - only re-renders when score changes
const score = useSimulationStore((s) => s.score)

// BAD - re-renders on ANY state change
const store = useSimulationStore()
```

**2. useShallow for Objects/Arrays**
```typescript
import { useShallow } from 'zustand/react/shallow'

// Prevents re-renders when array identity changes but values don't
const { x, y } = useSimulationStore(
  useShallow((s) => ({ x: s.position.x, y: s.position.y }))
)
```

**3. Transient Updates (for useFrame)**
```typescript
// Use getState() to avoid component re-renders at 60fps
useFrame((_, delta) => {
  const state = useSimulationStore.getState()
  useSimulationStore.setState({
    gameTime: state.gameTime + delta
  })
})
```

**4. subscribeWithSelector for Side Effects**
```typescript
// Subscribe without React re-renders
const unsubscribe = useSimulationStore.subscribe(
  (state) => state.phase,
  (phase) => {
    if (phase === 'score') playSound('celebration')
  }
)
```

### React Three Rapier Patterns

**1. Sensors for Scoring Zones**
```tsx
<RigidBody type="fixed" position={endZonePosition}>
  <CuboidCollider
    args={[width/2, 5, depth/2]}
    sensor  // Critical: no physics response, just events
    onIntersectionEnter={({ other }) => {
      if (other.rigidBody?.userData?.type === 'disc') {
        score(team)
      }
    }}
  />
</RigidBody>
```

**2. Kinematic Bodies for AI Players**
```typescript
const ref = useRef<RapierRigidBody>(null)

useFrame(() => {
  // Move kinematic body smoothly
  ref.current?.setNextKinematicTranslation({
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z
  })
})

<RigidBody type="kinematicPosition" ref={ref}>
  <PlayerMesh />
</RigidBody>
```

**3. CCD for Fast Objects**
```tsx
// Prevent disc tunneling through geometry
<RigidBody ccd={true}>
  <Disc />
</RigidBody>
```

**4. Performance with Instanced Bodies**
```tsx
<InstancedRigidBodies instances={playerInstances} colliders="hull">
  <instancedMesh args={[geometry, undefined, MAX_PLAYERS]} />
</InstancedRigidBodies>
```

### Miniplex Patterns

**1. Query-Based Systems**
```typescript
// Create query once at module level
const movingPlayers = world.with("player", "velocity", "position")

// System runs every frame
function MovementSystem() {
  useFrame((_, delta) => {
    for (const entity of movingPlayers) {
      entity.position.x += entity.velocity.x * delta
      entity.position.z += entity.velocity.z * delta
    }
  })
  return null
}
```

**2. Event Subscriptions**
```typescript
// Subscribe to entity lifecycle
movingPlayers.onEntityAdded.subscribe((entity) => {
  console.log('Player started moving:', entity.id)
})

movingPlayers.onEntityRemoved.subscribe((entity) => {
  console.log('Player stopped:', entity.id)
})
```

---

## Performance Optimization Checklist

### Rendering
- [ ] Use `<Instances>` for duplicate geometry (crowd, markers)
- [ ] Add `<PerformanceMonitor>` for adaptive quality
- [ ] Use `<Detailed>` (LOD) for player models at distance
- [ ] Add `<Bvh>` for complex collision detection

### State
- [ ] Use precise selectors (not full store)
- [ ] Use `useShallow` for computed/array returns
- [ ] Use `getState()` in useFrame (no re-render)
- [ ] Batch state updates when possible

### Physics
- [ ] Use sensors for triggers (not full collision)
- [ ] Use `InstancedRigidBodies` for many bodies
- [ ] Tune solver iterations (4 default)
- [ ] Enable CCD for fast-moving disc

### Effects
- [ ] Start with SMAA + Bloom + Vignette
- [ ] Add SSAO only if performance allows
- [ ] Use resolution scaling for expensive effects
- [ ] Disable effects during menus/pause

---

## Code Improvements to Make

### 1. Replace Custom ECS Polling
**Current (Team.tsx):**
```typescript
// Polling with setInterval - inefficient!
function subscribeToWorld(callback: () => void) {
  const interval = setInterval(callback, 100)
  return () => clearInterval(interval)
}
```

**Better:**
```typescript
import { subscribeToWorld } from '@/ecs'
// Uses miniplex's native onEntityAdded/onEntityRemoved
```

### 2. Replace Custom Math
**Current (aiSystem.ts):**
```typescript
function distance2D(a: Position, b: Position): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.z - b.z, 2))
}
```

**Better (with maath):**
```typescript
import { distance } from 'maath/vector2'
const dist = distance([a.x, a.z], [b.x, b.z])
```

### 3. Add Visual Effects
**Current:** No post-processing

**Add:**
```tsx
<EffectComposer>
  <SMAA />
  <Bloom luminanceThreshold={0.9} />
  <Vignette darkness={0.3} />
</EffectComposer>
```

---

## Repository References

All cloned to `/Users/josh/Projects/r3f-ecosystem/`:

| Package | Location | Key Files |
|---------|----------|-----------|
| maath | `/maath` | `/packages/maath/src/` |
| drei | `/drei` | `/src/core/` |
| rapier | `/react-three-rapier` | `/packages/react-three-rapier/src/` |
| postprocessing | `/react-postprocessing` | `/src/effects/` |
| miniplex | `/miniplex` | `/packages/react/src/` |
| zustand | `/zustand` | `/src/middleware/` |
| uikit | `/uikit` | `/packages/uikit/src/` |
| composer-suite | `/composer-suite` | `/packages/vfx-composer/` |

---

## Quick Links

- [R3F Docs](https://r3f.docs.pmnd.rs/)
- [Drei Docs](https://github.com/pmndrs/drei)
- [Rapier Docs](https://rapier.rs/docs/)
- [Zustand Docs](https://zustand.docs.pmnd.rs/)
- [Miniplex Docs](https://github.com/hmans/miniplex)
- [PostProcessing Docs](https://github.com/pmndrs/react-postprocessing)

---

*Last updated: December 2024 - Based on source code analysis*
