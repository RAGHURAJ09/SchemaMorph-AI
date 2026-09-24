import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

const COLORS = ["#1D9E75", "#534AB7", "#185FA5", "#BA7517", "#993556"];

function GraphNetwork({ count = 50 }) {
  const points = useRef();
  const lines = useRef();

  // Initialize random points
  const initialPoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 15 - 5
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015,
          (Math.random() - 0.5) * 0.015
        ),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 0.15 + 0.05
      });
    }
    return pts;
  }, [count]);

  const [positions, setPositions] = useState(() => initialPoints.map(p => p.position));

  useFrame((state) => {
    const newPositions = [];
    initialPoints.forEach((pt) => {
      // Move point
      pt.position.add(pt.velocity);
      
      // Bounce off invisible boundaries
      if (pt.position.x > 12 || pt.position.x < -12) pt.velocity.x *= -1;
      if (pt.position.y > 12 || pt.position.y < -12) pt.velocity.y *= -1;
      if (pt.position.z > 2 || pt.position.z < -15) pt.velocity.z *= -1;

      newPositions.push(pt.position.clone());
    });
    
    // Animate entire group slowly
    if (points.current) {
      points.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      points.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.1) * 0.05;
    }
    if (lines.current) {
      lines.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
      lines.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.1) * 0.05;
    }
    
    setPositions(newPositions);
  });

  // Calculate lines based on distance
  const edges = useMemo(() => {
    const e = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < 4.0) {
          // Adjust opacity based on distance
          const opacity = (1 - dist / 4.0) * 0.3;
          e.push({ pts: [positions[i], positions[j]], opacity });
        }
      }
    }
    return e;
  }, [positions]);

  return (
    <>
      <group ref={points}>
        {initialPoints.map((pt, i) => (
          <mesh key={i} position={positions[i]}>
            <sphereGeometry args={[pt.size, 16, 16]} />
            <meshBasicMaterial color={pt.color} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      <group ref={lines}>
        {edges.map((edge, i) => (
          <Line
            key={i}
            points={edge.pts}
            color="white"
            opacity={edge.opacity}
            transparent
            lineWidth={0.5}
          />
        ))}
      </group>
    </>
  );
}

export default function Background3D() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <color attach="background" args={['#090c12']} />
        <ambientLight intensity={0.5} />
        <GraphNetwork count={60} />
      </Canvas>
    </div>
  );
}
