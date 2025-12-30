# @react-three/drei Quick Reference

A comprehensive reference of drei components and hooks organized by category.

## Controls

### OrbitControls ✓ (Currently Used)
```tsx
<OrbitControls
  enablePan={true}
  enableZoom={true}
  enableRotate={true}
  minDistance={10}
  maxDistance={100}
  maxPolarAngle={Math.PI / 2}
/>
```

### KeyboardControls
Maps keyboard inputs to named actions. Better than manual event listeners.
```tsx
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';

const keyMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'throw', keys: ['Space'] },
];

// Wrap your app
<KeyboardControls map={keyMap}>
  <Canvas>...</Canvas>
</KeyboardControls>

// Use in components
function Player() {
  const [sub, get] = useKeyboardControls();

  useFrame(() => {
    const { forward, backward, left, right } = get();
    // Move player based on keys
  });
}
```

### ScrollControls
Scroll-driven animations (useful for intros/cutscenes).
```tsx
<ScrollControls pages={3} damping={0.1}>
  <Scroll>
    {/* 3D content that moves with scroll */}
  </Scroll>
  <Scroll html>
    {/* HTML content that moves with scroll */}
  </Scroll>
</ScrollControls>
```

---

## Shapes (Primitives)

Pre-built geometries with sensible defaults:

```tsx
import { Box, Sphere, Plane, Cylinder, Torus, RoundedBox } from '@react-three/drei';

<Box args={[1, 1, 1]} />           // width, height, depth
<Sphere args={[1, 32, 32]} />      // radius, widthSegments, heightSegments
<Plane args={[10, 10]} />          // width, height
<Cylinder args={[1, 1, 2, 32]} />  // radiusTop, radiusBottom, height, segments
<Torus args={[1, 0.4, 16, 32]} />  // radius, tube, radialSegments, tubularSegments
<RoundedBox args={[1, 1, 1]} radius={0.1} smoothness={4} />
```

### Line ✓ (Currently Used)
```tsx
<Line
  points={[[0, 0, 0], [1, 1, 0], [2, 0, 0]]}
  color="white"
  lineWidth={2}
  dashed={false}
/>
```

---

## Loaders

### useGLTF
Load GLTF/GLB 3D models with caching.
```tsx
import { useGLTF } from '@react-three/drei';

function PlayerModel() {
  const { scene, nodes, materials, animations } = useGLTF('/models/player.glb');
  return <primitive object={scene} />;
}

// Preload for faster initial render
useGLTF.preload('/models/player.glb');
```

### useTexture
Load textures with automatic disposal.
```tsx
import { useTexture } from '@react-three/drei';

function Field() {
  const [grass, grassNormal] = useTexture([
    '/textures/grass.jpg',
    '/textures/grass-normal.jpg'
  ]);

  return (
    <mesh>
      <planeGeometry args={[100, 37]} />
      <meshStandardMaterial map={grass} normalMap={grassNormal} />
    </mesh>
  );
}
```

### useProgress
Track loading progress for loading screens.
```tsx
import { useProgress, Html } from '@react-three/drei';

function Loader() {
  const { progress, active } = useProgress();

  return active ? (
    <Html center>
      <div>Loading... {progress.toFixed(0)}%</div>
    </Html>
  ) : null;
}
```

---

## Performance

### Stats
Display FPS, memory, render time.
```tsx
import { Stats } from '@react-three/drei';

// Add inside Canvas (dev only)
{process.env.NODE_ENV === 'development' && <Stats />}
```

### PerformanceMonitor
Auto-adjust quality based on FPS.
```tsx
import { PerformanceMonitor } from '@react-three/drei';

function Scene() {
  const [quality, setQuality] = useState(1);

  return (
    <PerformanceMonitor
      onIncline={() => setQuality(Math.min(quality + 0.1, 1))}
      onDecline={() => setQuality(Math.max(quality - 0.1, 0.5))}
    >
      {/* Adjust shadow map size, geometry detail based on quality */}
    </PerformanceMonitor>
  );
}
```

### Instances
GPU instancing for many identical objects.
```tsx
import { Instances, Instance } from '@react-three/drei';

function Crowd() {
  return (
    <Instances limit={1000}>
      <boxGeometry />
      <meshStandardMaterial />
      {positions.map((pos, i) => (
        <Instance key={i} position={pos} />
      ))}
    </Instances>
  );
}
```

### Detailed (LOD)
Level of Detail - swap models based on camera distance.
```tsx
import { Detailed } from '@react-three/drei';

<Detailed distances={[0, 50, 100]}>
  <HighDetailModel />   {/* 0-50 units */}
  <MediumDetailModel /> {/* 50-100 units */}
  <LowDetailModel />    {/* 100+ units */}
</Detailed>
```

### Bvh
Faster raycasting for many objects.
```tsx
import { Bvh } from '@react-three/drei';

<Bvh firstHitOnly>
  {/* All meshes inside get BVH acceleration */}
  <Buildings />
</Bvh>
```

---

## Staging & Atmosphere

### Sky
Procedural sky dome with sun.
```tsx
import { Sky } from '@react-three/drei';

<Sky
  distance={450000}
  sunPosition={[0, 1, 0]}
  inclination={0.5}
  azimuth={0.25}
/>
```

### Stars
Starfield background.
```tsx
import { Stars } from '@react-three/drei';

<Stars
  radius={100}
  depth={50}
  count={5000}
  factor={4}
  saturation={0}
  fade
/>
```

### Environment
HDR environment maps for realistic lighting/reflections.
```tsx
import { Environment } from '@react-three/drei';

// Using preset
<Environment preset="night" />

// Using custom HDR
<Environment files="/hdri/stadium.hdr" />

// Background only
<Environment background preset="sunset" />
```

### ContactShadows
Soft ground shadows (cheaper than shadow maps).
```tsx
import { ContactShadows } from '@react-three/drei';

<ContactShadows
  position={[0, 0, 0]}
  opacity={0.5}
  scale={10}
  blur={2}
  far={10}
  resolution={256}
/>
```

### Float
Subtle floating animation.
```tsx
import { Float } from '@react-three/drei';

<Float
  speed={1}
  rotationIntensity={0.5}
  floatIntensity={0.5}
>
  <Disc />
</Float>
```

### Sparkles
Particle effects.
```tsx
import { Sparkles } from '@react-three/drei';

<Sparkles
  count={100}
  scale={5}
  size={2}
  speed={0.4}
  color="gold"
/>
```

---

## Effects & Materials

### Trail
Motion trail effect.
```tsx
import { Trail } from '@react-three/drei';

<Trail
  width={1}
  length={5}
  color="white"
  attenuation={(t) => t * t}
>
  <Disc />
</Trail>
```

### MeshReflectorMaterial
Reflective floor/surface.
```tsx
import { MeshReflectorMaterial } from '@react-three/drei';

<mesh rotation={[-Math.PI / 2, 0, 0]}>
  <planeGeometry args={[100, 100]} />
  <MeshReflectorMaterial
    blur={[300, 100]}
    resolution={2048}
    mixBlur={1}
    mixStrength={50}
    roughness={1}
    depthScale={1.2}
    color="#101010"
    metalness={0.5}
  />
</mesh>
```

### Outlines
Object outlines (selection highlight).
```tsx
import { Outlines } from '@react-three/drei';

<mesh>
  <boxGeometry />
  <meshStandardMaterial />
  <Outlines thickness={0.05} color="hotpink" />
</mesh>
```

---

## UI & Text

### Html
HTML elements positioned in 3D space.
```tsx
import { Html } from '@react-three/drei';

<Html
  position={[0, 2, 0]}
  center
  distanceFactor={10}  // Scale with distance
  occlude              // Hide when behind objects
>
  <div className="player-label">Player 7</div>
</Html>
```

### Text
SDF text rendering (fast, sharp at any scale).
```tsx
import { Text } from '@react-three/drei';

<Text
  position={[0, 5, 0]}
  fontSize={2}
  color="white"
  anchorX="center"
  anchorY="middle"
>
  HOME 7 - 3 AWAY
</Text>
```

### Text3D
Extruded 3D text.
```tsx
import { Text3D, Center } from '@react-three/drei';

<Center>
  <Text3D
    font="/fonts/roboto.json"
    size={1}
    height={0.2}
    bevelEnabled
    bevelSize={0.02}
  >
    SCORE!
    <meshStandardMaterial color="gold" />
  </Text3D>
</Center>
```

### Billboard
Always faces camera.
```tsx
import { Billboard, Text } from '@react-three/drei';

<Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
  <Text>Player Name</Text>
</Billboard>
```

---

## Animation

### useAnimations
Play animations from GLTF files.
```tsx
import { useGLTF, useAnimations } from '@react-three/drei';

function AnimatedPlayer() {
  const { scene, animations } = useGLTF('/player.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    actions.run?.play();
  }, [actions]);

  return <primitive object={scene} />;
}
```

---

## Helpers

### Grid
Reference grid.
```tsx
import { Grid } from '@react-three/drei';

<Grid
  args={[100, 100]}
  cellSize={1}
  cellThickness={0.5}
  cellColor="#6f6f6f"
  sectionSize={10}
  sectionThickness={1}
  sectionColor="#9d4b4b"
  fadeDistance={400}
  fadeStrength={1}
  followCamera={false}
/>
```

### useHelper
Visualize lights, cameras, etc.
```tsx
import { useHelper } from '@react-three/drei';
import { SpotLightHelper } from 'three';

function DebugLight() {
  const lightRef = useRef();
  useHelper(lightRef, SpotLightHelper, 'cyan');

  return <spotLight ref={lightRef} />;
}
```

---

## Hooks

### useCursor
Change cursor on hover.
```tsx
import { useCursor } from '@react-three/drei';

function InteractiveObject() {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <mesh
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    />
  );
}
```

### useDetectGPU
Detect GPU capabilities for quality presets.
```tsx
import { useDetectGPU } from '@react-three/drei';

function AdaptiveScene() {
  const gpu = useDetectGPU();

  const shadowMapSize = gpu.tier >= 2 ? 2048 : 512;
  const enablePostProcessing = gpu.tier >= 2;
}
```

---

*Reference for @react-three/drei v10.x*
