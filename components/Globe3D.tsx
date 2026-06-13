'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useTelemetryStore } from '../store/useTelemetryStore';

function PlanetaryMatrix() {
  const globeRef = useRef<THREE.Mesh>(null);
  const firms = useTelemetryStore((state) => state.firms);
  const neows = useTelemetryStore((state) => state.neows);

  // Constant rotation step directly utilizing hardware clock frames
  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08;
    }
  });

  // Performance Guard: Extract top 50 highest FRP fires for rendering safety
  const safeFires = useMemo(() => {
    return [...firms]
      .sort((a, b) => b.frpMegawatts - a.frpMegawatts)
      .slice(0, 50);
  }, [firms]);

  // Performance Guard: Capture hazardous paths
  const hazardousAsteroids = useMemo(() => {
    return neows.filter(a => a.isPotentiallyHazardous).slice(0, 10);
  }, [neows]);

  // Standard Cartesian projection handler for mapping coordinates
  const convertCoords = (lat: number, lon: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.sin(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
  };

  return (
    <group>
      {/* Dynamic Earth Sphere Target Map */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial 
          color="#0f172a" 
          wireframe={true}
          transparent={true}
          opacity={0.25}
        />
        
        {/* Render Lit Wildfire Hotspots directly onto surface geometry */}
        {safeFires.map((fire, idx) => {
          const pos = convertCoords(fire.latitude, fire.longitude, 2.22);
          return (
            <mesh key={idx} position={pos}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color="#ff3300" toneMapped={false} />
            </mesh>
          );
        })}
      </mesh>

      {/* Render Intercepting Asteroid Orbital Pathway Rings */}
      {hazardousAsteroids.map((ast, idx) => (
        <mesh key={ast.id} rotation={[Math.sin(idx) * 2, 0, Math.cos(idx) * 2]}>
          <torusGeometry args={[2.6 + idx * 0.12, 0.006, 8, 48]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

export default function Globe3D() {
  const loading = useTelemetryStore((state) => state.loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#020408] text-slate-500 font-mono text-xs animate-pulse">
        &gt; INITIALIZING GRAPHICS HARDWARE CAPTURE FIELD...
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#020306] relative rounded-md overflow-hidden border border-slate-950">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <Stars radius={100} depth={50} count={600} factor={4} saturation={0} fade speed={1} />
        <PlanetaryMatrix />
      </Canvas>
      <div className="absolute bottom-3 left-3 font-mono text-[9px] text-slate-600 bg-black/40 px-2 py-1 rounded border border-slate-900/40 pointer-events-none">
        RENDER HARDWARE: WEBG_CORE PROJECTION TARGET // GPU ACCELERATED
      </div>
    </div>
  );
}
