import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { Effects } from '@react-three/drei';
import * as THREE from 'three';

// ── Post-processing imports (optional bloom) ─────────────────────────────────
// We use drei's Effects wrapper with Three.js built-in passes for lightweight bloom
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
extend({ UnrealBloomPass, RenderPass });

// ── Constants ────────────────────────────────────────────────────────────────
const SCHEMA_GROUPS = [
  { name: 'Users', tables: ['users', 'sessions', 'auth_tokens', 'profiles'], color: '#1D9E75', position: [4.2, 2.3, -1.8] },
  { name: 'Orders', tables: ['orders', 'order_items', 'order_status'], color: '#534AB7', position: [-4.0, 2.5, -2.5] },
  { name: 'Products', tables: ['products', 'categories', 'inventory'], color: '#185FA5', position: [4.6, -1.8, -2.2] },
  { name: 'Payments', tables: ['payments', 'invoices', 'refunds'], color: '#BA7517', position: [-4.2, -1.8, -2.8] },
  { name: 'Inventory', tables: ['warehouses', 'stock_levels', 'shipments'], color: '#993556', position: [1.6, -3.4, -2.2] },
  { name: 'Notifications', tables: ['notifications', 'templates', 'channels'], color: '#639922', position: [-1.8, -3.2, -2.5] },
];

const EDGES = [
  [0, 1], [0, 3], [1, 2], [1, 3], [2, 4], [3, 5], [4, 5], [0, 2], [1, 5], [2, 3],
];

const NODE_COUNT = 120;
const PARTICLE_COUNT = 200;

// ── Reusable geometries & materials (created once) ───────────────────────────
const sharedSphereGeo = new THREE.SphereGeometry(0.08, 8, 8);
const sharedSmallSphereGeo = new THREE.SphereGeometry(0.04, 6, 6);

// ── Utility: detect reduced motion preference ───────────────────────────────
function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefersReduced;
}

// ── Utility: detect mobile ──────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ── Mouse tracker (normalized -1..1) ────────────────────────────────────────
function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return mouse;
}

// ── Scroll tracker (normalized 0..1 with smoothed interpolation & velocity) ──
function useScrollProgress() {
  const scroll = useRef({ current: 0, target: 0, velocity: 0 });
  useEffect(() => {
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let animId;

    const onScroll = (e) => {
      let currentY = window.scrollY;
      let max = Math.max(1, (document.scrollingElement || document.documentElement).scrollHeight - window.innerHeight);

      if (e && e.target && e.target !== document && typeof e.target.scrollTop === 'number' && e.target.scrollHeight > e.target.clientHeight) {
        currentY = e.target.scrollTop;
        max = Math.max(1, e.target.scrollHeight - e.target.clientHeight);
      }

      const raw = Math.min(1, Math.max(0, currentY / max));

      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dy = currentY - lastY;
      const v = Math.min(3, (Math.abs(dy) / dt) * 1.5);

      scroll.current.target = raw;
      scroll.current.velocity = v;
      lastY = currentY;
      lastTime = now;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    onScroll();

    const decayLoop = () => {
      scroll.current.velocity *= 0.92;
      animId = requestAnimationFrame(decayLoop);
    };
    animId = requestAnimationFrame(decayLoop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll, { capture: true });
      cancelAnimationFrame(animId);
    };
  }, []);
  return scroll;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTRAL DATABASE CYLINDER
// ═══════════════════════════════════════════════════════════════════════════════
function CentralDatabase({ reducedMotion, isMobile, scroll }) {
  const groupRef = useRef();
  const ringsRef = useRef([]);
  const diskRefs = useRef([]);
  const diskCount = 5;

  const diskGeo = useMemo(() => new THREE.CylinderGeometry(1.2, 1.2, 0.18, 36), []);
  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.7, 0.025, 12, 64), []);
  const scanRingGeo = useMemo(() => new THREE.TorusGeometry(1.45, 0.035, 12, 64), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const sp = scroll?.current?.target ?? 0;
    const vel = scroll?.current?.velocity ?? 0;
    const speed = (reducedMotion ? 0.05 : 0.2) + vel * 0.5;
    groupRef.current.rotation.y = t * speed + sp * Math.PI * 0.8;

    // Dramatic Disks accordion expansion with scroll
    const expansion = sp * 1.5;
    diskRefs.current.forEach((disk, i) => {
      if (!disk) return;
      const baseY = (i - (diskCount - 1) / 2) * (0.35 + expansion);
      disk.position.y = baseY;
      disk.rotation.y = (i - 2) * sp * 0.75;
    });

    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const phase = t * (0.4 + i * 0.2 + vel * 0.6) + i * Math.PI * 0.5;
      ring.position.y = Math.sin(phase) * (1.3 + expansion * 0.9);
      ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.25 + i) * 0.25;
      ring.rotation.z = t * (0.15 + i * 0.08 + vel * 0.3) + sp * 2;
    });
  });

  return (
    <group ref={groupRef} position={isMobile ? [0, 0.6, -3.2] : [2.0, 0.2, -2.5]}>
      {/* Stacked database disks with vibrant cybernetic glow */}
      {Array.from({ length: diskCount }).map((_, i) => {
        const y = (i - (diskCount - 1) / 2) * 0.35;
        const isCenter = i === 2;
        return (
          <group key={`disk-group-${i}`} ref={(el) => (diskRefs.current[i] = el)} position={[0, y, 0]}>
            <mesh geometry={diskGeo}>
              <meshStandardMaterial
                color="#0f293d"
                metalness={0.9}
                roughness={0.15}
                emissive={isCenter ? "#22d3ee" : "#1D9E75"}
                emissiveIntensity={isCenter ? 0.95 : 0.65}
                transparent
                opacity={0.96}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} geometry={ringGeo}>
              <meshBasicMaterial color={isCenter ? "#22d3ee" : "#1D9E75"} transparent opacity={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Scanning rings that orbit vertically */}
      {[0, 1].map((i) => (
        <mesh
          key={`scan-${i}`}
          ref={(el) => (ringsRef.current[i] = el)}
          geometry={scanRingGeo}
        >
          <meshBasicMaterial color={i === 0 ? '#22d3ee' : '#c084fc'} transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Core glow */}
      <pointLight color="#22d3ee" intensity={5.0} distance={12} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA NODES – instanced spheres for the scattered network
// ═══════════════════════════════════════════════════════════════════════════════
function NetworkNodes({ reducedMotion, isMobile }) {
  const meshRef = useRef();
  const count = isMobile ? 50 : NODE_COUNT;

  const nodeData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 7;
      data.push({
        basePos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.6,
          r * Math.cos(phi) * 0.5 - 3
        ),
        speed: 0.1 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        amplitude: 0.15 + Math.random() * 0.35,
        colorIndex: Math.floor(Math.random() * SCHEMA_GROUPS.length),
        scale: 0.5 + Math.random() * 1.0,
      });
    }
    return data;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Set instance colors via ref after mount
  useEffect(() => {
    if (!meshRef.current) return;
    const color = new THREE.Color();
    nodeData.forEach((node, i) => {
      color.set(SCHEMA_GROUPS[node.colorIndex].color);
      meshRef.current.setColorAt(i, color);
    });
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [nodeData]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const speedMult = reducedMotion ? 0.2 : 1;

    nodeData.forEach((node, i) => {
      const drift = Math.sin(t * node.speed * speedMult + node.phase) * node.amplitude;
      dummy.position.set(
        node.basePos.x + drift * 0.5,
        node.basePos.y + Math.cos(t * node.speed * 0.7 * speedMult + node.phase) * node.amplitude * 0.8,
        node.basePos.z + Math.sin(t * node.speed * 0.3 * speedMult + node.phase * 2) * node.amplitude * 0.3
      );
      dummy.scale.setScalar(node.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial
        emissive="#1D9E75"
        emissiveIntensity={0.45}
        metalness={0.5}
        roughness={0.5}
        transparent
        opacity={0.88}
      />
    </instancedMesh>
  );

}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCY EDGES – lines connecting schema groups with flowing particles
// ═══════════════════════════════════════════════════════════════════════════════
function DependencyEdges({ reducedMotion, scroll }) {
  const linesRef = useRef();

  // Build line segment positions
  const { positions, colors, edgeMeta } = useMemo(() => {
    const pos = [];
    const col = [];
    const meta = [];
    EDGES.forEach(([a, b]) => {
      const pa = SCHEMA_GROUPS[a].position;
      const pb = SCHEMA_GROUPS[b].position;
      const ca = new THREE.Color(SCHEMA_GROUPS[a].color);
      const cb = new THREE.Color(SCHEMA_GROUPS[b].color);

      pos.push(pa[0], pa[1], pa[2], pb[0], pb[1], pb[2]);
      col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
      meta.push({ from: new THREE.Vector3(...pa), to: new THREE.Vector3(...pb) });
    });
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
      edgeMeta: meta,
    };
  }, []);

  return (
    <group>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.25} />
      </lineSegments>
      {/* Flowing particles on edges */}
      {!reducedMotion && edgeMeta.map((edge, i) => (
        <EdgeParticle key={i} from={edge.from} to={edge.to} index={i} scroll={scroll} />
      ))}
    </group>
  );
}

function EdgeParticle({ from, to, index, scroll }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const vel = scroll?.current?.velocity ?? 0;
    const speedMult = 1 + vel * 2.5;
    const progress = ((t * 0.3 * speedMult + index * 0.37) % 1);
    ref.current.position.lerpVectors(from, to, progress);
    ref.current.material.opacity = Math.sin(progress * Math.PI) * (0.8 + Math.min(0.2, vel));
  });

  return (
    <mesh ref={ref} geometry={sharedSmallSphereGeo}>
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA GROUP NODES – larger spheres at group positions with glow
// ═══════════════════════════════════════════════════════════════════════════════
function SchemaGroupNodes({ reducedMotion, scroll }) {
  const groupsRef = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = reducedMotion ? 0.15 : 0.4;
    const sp = scroll?.current?.target ?? 0;
    // As user scrolls, the schema clusters spread outward (visualizing decomposition into microservices!)
    const expansion = 1 + sp * 1.25;

    groupsRef.current.forEach((group, i) => {
      if (!group) return;
      const orig = SCHEMA_GROUPS[i].position;
      const pulse = Math.sin(t * speed + i * 1.2) * 0.1 + 1;
      group.position.set(orig[0] * expansion, orig[1] * expansion, orig[2]);
      group.scale.setScalar(pulse);
    });
  });

  return (
    <group>
      {SCHEMA_GROUPS.map((group, i) => (
        <group key={group.name} ref={(el) => (groupsRef.current[i] = el)} position={group.position}>
          {/* Outer glow sphere */}
          <mesh>
            <sphereGeometry args={[0.42, 16, 16]} />
            <meshBasicMaterial color={group.color} transparent opacity={0.25} />
          </mesh>
          {/* Core node */}
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial
              color={group.color}
              emissive={group.color}
              emissiveIntensity={1.3}
              metalness={0.7}
              roughness={0.2}
              transparent
              opacity={0.96}
            />
          </mesh>
          {/* Point light */}
          <pointLight color={group.color} intensity={2.2} distance={7} decay={2} />
        </group>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC PANELS – floating transparent rectangles
// ═══════════════════════════════════════════════════════════════════════════════
function HolographicPanels({ reducedMotion }) {
  const panelsRef = useRef([]);

  const panelData = useMemo(() => [
    { pos: [-5.5, 3.0, -4], rot: [0.1, 0.3, 0.02], color: '#1D9E75', scale: [1.4, 0.9, 1] },
    { pos: [5.0, 2.5, -5], rot: [-0.05, -0.25, 0.01], color: '#534AB7', scale: [1.2, 0.8, 1] },
    { pos: [-4.0, -2.5, -6], rot: [0.08, 0.15, -0.03], color: '#185FA5', scale: [1.6, 1.0, 1] },
    { pos: [6.0, -1.0, -5.5], rot: [-0.1, -0.2, 0.04], color: '#BA7517', scale: [1.0, 0.7, 1] },
    { pos: [0, 4.0, -7], rot: [0.15, 0, -0.02], color: '#22d3ee', scale: [2.0, 1.2, 1] },
  ], []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = reducedMotion ? 0.1 : 0.25;
    panelsRef.current.forEach((panel, i) => {
      if (!panel) return;
      const pd = panelData[i];
      panel.position.y = pd.pos[1] + Math.sin(t * speed + i * 1.5) * 0.25;
      panel.rotation.y = pd.rot[1] + Math.sin(t * 0.15 + i) * 0.04;
      panel.rotation.x = pd.rot[0] + Math.cos(t * 0.12 + i) * 0.03;
    });
  });

  return (
    <group>
      {panelData.map((pd, i) => (
        <mesh
          key={i}
          ref={(el) => (panelsRef.current[i] = el)}
          position={pd.pos}
          rotation={pd.rot}
          scale={pd.scale}
        >
          <planeGeometry args={[1.6, 1.0, 1, 1]} />
          <meshStandardMaterial
            color={pd.color}
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            emissive={pd.color}
            emissiveIntensity={0.18}
            metalness={0.3}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING MINI DATABASES – smaller cylinder structures at varying depths
// ═══════════════════════════════════════════════════════════════════════════════
function FloatingMiniDatabases({ reducedMotion }) {
  const refs = useRef([]);
  const miniGeo = useMemo(() => new THREE.CylinderGeometry(0.25, 0.25, 0.12, 16), []);

  const miniData = useMemo(() => [
    { pos: [-6, 1.5, -3], color: '#534AB7' },
    { pos: [6.5, -2, -4], color: '#185FA5' },
    { pos: [-2, 4.5, -6], color: '#BA7517' },
    { pos: [3, -4, -5], color: '#993556' },
    { pos: [7, 3, -7], color: '#639922' },
    { pos: [-5.5, -3, -5], color: '#1D9E75' },
  ], []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = reducedMotion ? 0.08 : 0.2;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.position.y = miniData[i].pos[1] + Math.sin(t * speed + i * 2) * 0.4;
      mesh.rotation.y = t * (0.05 + i * 0.02);
      mesh.rotation.x = Math.sin(t * 0.1 + i) * 0.1;
    });
  });

  return (
    <group>
      {miniData.map((md, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} position={md.pos}>
          {/* Two stacked mini disks */}
          <mesh position={[0, 0.08, 0]} geometry={miniGeo}>
            <meshStandardMaterial color="#0a1628" metalness={0.8} roughness={0.25} emissive={md.color} emissiveIntensity={0.15} transparent opacity={0.82} />
          </mesh>
          <mesh position={[0, -0.08, 0]} geometry={miniGeo}>
            <meshStandardMaterial color="#0a1628" metalness={0.8} roughness={0.25} emissive={md.color} emissiveIntensity={0.10} transparent opacity={0.82} />
          </mesh>
          <pointLight color={md.color} intensity={0.35} distance={3.5} decay={2} />
        </group>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT PARTICLES – instanced small points drifting through space
// ═══════════════════════════════════════════════════════════════════════════════
function AmbientParticles({ reducedMotion, isMobile }) {
  const meshRef = useRef();
  const count = isMobile ? 80 : PARTICLE_COUNT;

  const particleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 24,
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 14 - 4
        ),
        speed: 0.02 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const speedMult = reducedMotion ? 0.3 : 1;

    particleData.forEach((p, i) => {
      dummy.position.set(
        p.pos.x + Math.sin(t * p.speed * speedMult + p.phase) * 0.5,
        p.pos.y + Math.cos(t * p.speed * 0.8 * speedMult + p.phase) * 0.3,
        p.pos.z
      );
      const s = 0.3 + Math.sin(t * 0.5 + p.phase) * 0.15;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} frustumCulled={false}>
      <sphereGeometry args={[0.02, 4, 4]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.45} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFLECTIVE GRID FLOOR
// ═══════════════════════════════════════════════════════════════════════════════
function GridFloor() {
  return (
    <group position={[0, -5, -3]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[40, 60, '#0d3d2e', '#091f18']} rotation={[Math.PI / 2, 0, 0]} />
      {/* Reflective plane beneath */}
      <mesh>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#050810"
          metalness={0.9}
          roughness={0.6}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PULSING RELATIONSHIP HIGHLIGHTS – edges that glow sequentially
// ═══════════════════════════════════════════════════════════════════════════════
function PulsingHighlights({ reducedMotion }) {
  const meshRefs = useRef([]);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      // Sequentially illuminate edges
      const phase = (t * 0.5 + i * 0.8) % (EDGES.length * 0.8);
      const active = Math.abs(phase - i * 0.8) < 0.4;
      mesh.material.opacity = active ? 0.45 : 0.05;
    });
  });

  return (
    <group>
      {EDGES.map(([a, b], i) => {
        const pa = SCHEMA_GROUPS[a].position;
        const pb = SCHEMA_GROUPS[b].position;
        const mid = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2];
        const len = Math.sqrt((pb[0] - pa[0]) ** 2 + (pb[1] - pa[1]) ** 2 + (pb[2] - pa[2]) ** 2);
        const dir = new THREE.Vector3(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        return (
          <mesh
            key={i}
            ref={(el) => (meshRefs.current[i] = el)}
            position={mid}
            quaternion={quaternion}
          >
            <cylinderGeometry args={[0.025, 0.025, len, 6]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.05} />
          </mesh>
        );
      })}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAMERA CONTROLLER – cinematic multi-phase trajectory + mouse parallax + scroll
// ═══════════════════════════════════════════════════════════════════════════════
function CameraController({ mouse, scroll, reducedMotion }) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0, 0, 10));
  const lookTarget = useRef(new THREE.Vector3(0, 0, -2));
  const smoothScroll = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const driftSpeed = reducedMotion ? 0.02 : 0.05;
    const parallaxStrength = reducedMotion ? 0.15 : 0.65;

    // Smoothly interpolate scroll target
    const targetScroll = scroll?.current?.target ?? 0;
    smoothScroll.current += (targetScroll - smoothScroll.current) * Math.min(1, delta * 4.5);
    const sp = smoothScroll.current;

    // Multi-waypoint cinematic curve based on page scroll:
    let camX = 0;
    let camY = 0;
    let camZ = 10;
    let lookX = 0;
    let lookY = 0;

    if (sp < 0.33) {
      const p = sp / 0.33;
      camX = THREE.MathUtils.lerp(0, 2.0, p);
      camY = THREE.MathUtils.lerp(0, -1.0, p);
      camZ = THREE.MathUtils.lerp(10, 8.8, p);
      lookX = THREE.MathUtils.lerp(0, 0.6, p);
      lookY = THREE.MathUtils.lerp(0.2, -0.2, p);
    } else if (sp < 0.66) {
      const p = (sp - 0.33) / 0.33;
      camX = THREE.MathUtils.lerp(2.0, -2.2, p);
      camY = THREE.MathUtils.lerp(-1.0, -2.6, p);
      camZ = THREE.MathUtils.lerp(8.8, 9.4, p);
      lookX = THREE.MathUtils.lerp(0.6, -0.5, p);
      lookY = THREE.MathUtils.lerp(-0.2, -1.3, p);
    } else {
      const p = (sp - 0.66) / 0.34;
      camX = THREE.MathUtils.lerp(-2.2, 0.4, p);
      camY = THREE.MathUtils.lerp(-2.6, -4.0, p);
      camZ = THREE.MathUtils.lerp(9.4, 10.6, p);
      lookX = THREE.MathUtils.lerp(-0.5, 0, p);
      lookY = THREE.MathUtils.lerp(-1.3, -2.0, p);
    }

    // Parallax mouse + subtle breathing drift
    const mx = mouse.current.x * parallaxStrength;
    const my = mouse.current.y * parallaxStrength * 0.45;
    const driftX = Math.sin(t * driftSpeed) * 0.35;
    const driftY = Math.cos(t * driftSpeed * 0.8) * 0.2;

    const targetPos = new THREE.Vector3(camX + mx + driftX, camY + my + driftY, camZ);
    currentPos.current.lerp(targetPos, Math.min(1, delta * 3.5));
    camera.position.copy(currentPos.current);

    const targetLook = new THREE.Vector3(lookX, lookY, -2);
    lookTarget.current.lerp(targetLook, Math.min(1, delta * 3.5));
    camera.lookAt(lookTarget.current);
  });

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK BREATHING – subtle light intensity modulation
// ═══════════════════════════════════════════════════════════════════════════════
function NetworkBreathing({ reducedMotion }) {
  const lightRef = useRef();

  useFrame((state) => {
    if (!lightRef.current || reducedMotion) return;
    const t = state.clock.elapsedTime;
    lightRef.current.intensity = 0.2 + Math.sin(t * 0.3) * 0.08;
  });

  return <ambientLight ref={lightRef} intensity={0.2} color="#8ab4f8" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECOMPOSITION SEQUENCE – occasional visual transformation
// ═══════════════════════════════════════════════════════════════════════════════
function DecompositionSequence({ reducedMotion }) {
  const groupsRef = useRef([]);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    // Every ~20 seconds, clusters spread apart then recombine
    const cycle = t % 20;
    const spread = cycle > 14 && cycle < 18
      ? Math.sin((cycle - 14) * Math.PI / 4) * 0.6
      : 0;

    groupsRef.current.forEach((mesh, i) => {
      if (!mesh) return;
      const sg = SCHEMA_GROUPS[i];
      const dir = new THREE.Vector3(...sg.position).normalize();
      mesh.position.set(
        sg.position[0] + dir.x * spread,
        sg.position[1] + dir.y * spread,
        sg.position[2] + dir.z * spread * 0.3
      );
    });
  });

  // Invisible group anchors that SchemaGroupNodes can reference via context
  return (
    <group>
      {SCHEMA_GROUPS.map((sg, i) => (
        <group key={sg.name} ref={(el) => (groupsRef.current[i] = el)} position={sg.position} />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOOM POST-PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════
function BloomEffect({ isMobile }) {
  const { size } = useThree();

  return (
    <Effects disableGamma>
      <unrealBloomPass
        args={[new THREE.Vector2(size.width, size.height), isMobile ? 0.28 : 0.45, 0.35, 0.82]}
      />
    </Effects>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISIBILITY-BASED PAUSE
// ═══════════════════════════════════════════════════════════════════════════════
function VisibilityPause() {
  const { gl } = useThree();

  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        gl.setAnimationLoop(null);
      } else {
        gl.setAnimationLoop(() => { });
        // R3F manages its own loop, but we signal to re-enable
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [gl]);

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD CONTAINER – continuous 3D orbital rotation and depth glide on scroll
// ═══════════════════════════════════════════════════════════════════════════════
function WorldContainer({ scroll, mouse, children }) {
  const groupRef = useRef();
  const smoothScroll = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScroll = scroll?.current?.target ?? 0;
    smoothScroll.current += (targetScroll - smoothScroll.current) * Math.min(1, delta * 4.5);
    const sp = smoothScroll.current;
    const t = state.clock.elapsedTime;

    // Dramatic continuous 3D rotation with scroll (orbits ~200 deg as you scroll):
    groupRef.current.rotation.y = sp * (Math.PI * 1.35) + t * 0.04;

    // Isometric pitch/tilt on scroll:
    groupRef.current.rotation.x = Math.sin(sp * Math.PI) * 0.38 + mouse.current.y * 0.06;

    // Scroll parallax translation: pulls the whole world dynamically
    groupRef.current.position.y = (sp - 0.2) * 3.8;
    groupRef.current.position.z = Math.sin(sp * Math.PI) * 2.2;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENE (assembles everything inside Canvas)
// ═══════════════════════════════════════════════════════════════════════════════
function Scene({ mouse, scroll, reducedMotion, isMobile }) {
  return (
    <>
      {/* Background color */}
      <color attach="background" args={['#060810']} />

      {/* Distant fog that doesn't wash out foreground objects */}
      <fog attach="fog" args={['#060810', 30, 75]} />

      {/* Vibrant scene lighting */}
      <ambientLight intensity={0.6} color="#c7d2fe" />
      <directionalLight position={[6, 8, 7]} intensity={1.2} color="#5DCAA5" />
      <directionalLight position={[-6, 5, 4]} intensity={0.8} color="#a78bfa" />
      <pointLight position={[0, 0, 4]} intensity={4.0} color="#22d3ee" distance={20} decay={2} />

      {/* Entire 3D constellation dynamically rotating and transforming with scroll */}
      <WorldContainer scroll={scroll} mouse={mouse}>
        {/* Central database */}
        <CentralDatabase reducedMotion={reducedMotion} isMobile={isMobile} scroll={scroll} />

        {/* Schema group nodes */}
        <SchemaGroupNodes reducedMotion={reducedMotion} scroll={scroll} />

        {/* Dependency edges + flowing particles */}
        <DependencyEdges reducedMotion={reducedMotion} scroll={scroll} />

        {/* Pulsing highlights on edges */}
        <PulsingHighlights reducedMotion={reducedMotion} />

        {/* Scattered network nodes */}
        <NetworkNodes reducedMotion={reducedMotion} isMobile={isMobile} />

        {/* Ambient particles */}
        <AmbientParticles reducedMotion={reducedMotion} isMobile={isMobile} />

        {/* Holographic panels */}
        <HolographicPanels reducedMotion={reducedMotion} />

        {/* Floating mini databases */}
        <FloatingMiniDatabases reducedMotion={reducedMotion} />

        {/* Reflective grid floor */}
        <GridFloor />

        {/* Decomposition sequence */}
        <DecompositionSequence reducedMotion={reducedMotion} />
      </WorldContainer>

      {/* Camera controller */}
      <CameraController mouse={mouse} scroll={scroll} reducedMotion={reducedMotion} />

      {/* Bloom post-processing */}
      {!isMobile && <BloomEffect isMobile={isMobile} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBGL FALLBACK
// ═══════════════════════════════════════════════════════════════════════════════
function WebGLFallback() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(29,158,117,0.08) 0%, transparent 70%), #060810',
      zIndex: 0, pointerEvents: 'none',
    }} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Background3D() {
  const mouse = useMousePosition();
  const scroll = useScrollProgress();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!ctx) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  if (!webGLSupported) return <WebGLFallback />;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55, near: 0.1, far: 50 }}
        dpr={isMobile ? 1 : Math.min(window.devicePixelRatio, 2)}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        style={{ width: '100%', height: '100%' }}
        frameloop="always"
      >
        <Scene mouse={mouse} scroll={scroll} reducedMotion={reducedMotion} isMobile={isMobile} />
      </Canvas>
      {/* Ultra-subtle edge vignette to ensure 3D scene shines through with brilliance */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 65%, rgba(6, 8, 16, 0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
