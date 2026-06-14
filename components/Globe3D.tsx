'use client';

import React, { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useTelemetryStore } from '../store/useTelemetryStore';

// TypeScript Interfaces for Explicit Safety
interface AsteroidData {
  id: string;
  name: string;
  relativeVelocityKmS: number;
  missDistanceKm: number;
  isPotentiallyHazardous: boolean;
}

interface FirmsData {
  latitude: number;
  longitude: number;
  frpMegawatts: number;
}

// Deterministic hash to map raw asteroid IDs to fixed orbital paths
function getStableCoordinates(id: string): { inclination: number; phase: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const inclination = ((Math.abs(hash) % 90) * Math.PI) / 180;
  const phase = ((Math.abs(hash >> 3) % 360) * Math.PI) / 180;
  return { inclination, phase };
}

function AuthenticSatellite({ radius, speed, inclination, phase, isISS }: {
  radius: number;
  speed: number;
  inclination: number;
  phase: number;
  isISS: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      const angle = phase + (time * speed);
      groupRef.current.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * Math.cos(inclination) * radius,
        Math.sin(angle) * Math.sin(inclination) * radius
      );
      groupRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <group ref={groupRef}>
      {isISS ? (
        <group scale={2.2}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.45, 12]} />
            <meshStandardMaterial color="#cbd5e1" emissive="#cbd5e1" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.01, 0.38, 0.1]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={1.5} metalness={0.8} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.01, 0.38, 0.1]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={1.5} metalness={0.8} roughness={0.15} />
          </mesh>
        </group>
      ) : (
        <group scale={1.8}>
          <mesh>
            <boxGeometry args={[0.04, 0.04, 0.04]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={1.2} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.07, 0, 0]}>
            <boxGeometry args={[0.09, 0.01, 0.03]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.5} metalness={0.7} roughness={0.2} />
          </mesh>
          <mesh position={[-0.07, 0, 0]}>
            <boxGeometry args={[0.09, 0.01, 0.03]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.5} metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function OrbitingAsteroid({ radius, speed, inclination, phase, isHazardous, scaleFactors }: {
  radius: number;
  speed: number;
  inclination: number;
  phase: number;
  isHazardous: boolean;
  scaleFactors: number[];
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      const angle = phase + (time * speed);
      meshRef.current.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * Math.cos(inclination) * radius,
        Math.sin(angle) * Math.sin(inclination) * radius
      );
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} scale={scaleFactors as [number, number, number]}>
      <icosahedronGeometry args={[0.24, 1]} />
      <meshStandardMaterial 
        color={isHazardous ? "#ef4444" : "#94a3b8"} 
        emissive={isHazardous ? "#ef4444" : "#475569"}
        emissiveIntensity={isHazardous ? 2.0 : 0.8}
        roughness={0.9} 
        flatShading={true} 
      />
    </mesh>
  );
}

function EarthMesh({ globeRef }: { globeRef: React.RefObject<THREE.Mesh> }) {
  const tex = useTexture("https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg");
  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[2.2, 64, 64]} />
      <meshStandardMaterial map={tex} roughness={0.45} metalness={0.1} />
    </mesh>
  );
}

function GlobeScene({ activeTab }: { activeTab: string }) {
  const { camera } = useThree();
  const globeRef = useRef<THREE.Mesh>(null);

  const viewportFocus = useTelemetryStore((state) => state.viewportFocus);
  const neows = useTelemetryStore((state) => state.neows as AsteroidData[]);
  const firms = useTelemetryStore((state) => state.firms as FirmsData[]);

  const lastFocusRef = useRef(viewportFocus);
  const lastTabRef = useRef(activeTab);
  const isTransitioningRef = useRef(true); // Start true to orient camera initially
  const targetPosRef = useRef(new THREE.Vector3(0, 0, 7.0));

  // Trigger camera transitions when focus or tab changes
  if (lastFocusRef.current !== viewportFocus || lastTabRef.current !== activeTab) {
    lastFocusRef.current = viewportFocus;
    lastTabRef.current = activeTab;
    isTransitioningRef.current = true;
    
    let targetZ = 7.0;
    let targetY = 0.0;
    
    if (activeTab === 'heliophysics') {
      targetZ = 8.0;
      targetY = 1.0;
    } else if (viewportFocus === 'SOLAR') {
      targetZ = 12.0;
      targetY = 2.5;
    } else {
      targetZ = 7.0;
      targetY = 0.0;
    }
    
    targetPosRef.current.set(0, targetY, targetZ);
  }

  // Smooth Camera Lerp Multi-Scale Mechanics
  useFrame((state, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.03;

    if (isTransitioningRef.current) {
      camera.position.lerp(targetPosRef.current, delta * 3.5);
      camera.lookAt(0, 0, 0);

      // Finish transition when close to target to release controls to the user
      if (camera.position.distanceTo(targetPosRef.current) < 0.05) {
        camera.position.copy(targetPosRef.current);
        isTransitioningRef.current = false;
      }
    }
  });

  const satellites = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      radius: 2.38 + i * 0.015,
      speed: 0.12 + Math.random() * 0.18,
      inclination: Math.random() * Math.PI,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);

  return (
    <group>
      {activeTab === 'globe' && (
        <>
          {/* 3D Earth Mesh */}
          <Suspense fallback={
            <mesh ref={globeRef}>
              <sphereGeometry args={[2.2, 64, 64]} />
              <meshStandardMaterial roughness={0.45} metalness={0.1} color="#0d1b2a" />
            </mesh>
          }>
            <EarthMesh globeRef={globeRef} />
          </Suspense>

          {/* FIRMS Lithospheric Thermal Anomalies Map */}
          {viewportFocus === 'EARTH' && firms.map((point: FirmsData, idx: number) => {
            const phi = (90 - point.latitude) * (Math.PI / 180);
            const theta = (Math.PI - point.longitude) * (Math.PI / 180);
            const baseRadius = 2.2;
            const spikeHeight = Math.min(0.05 + (point.frpMegawatts / 1000), 0.4);

            const x = baseRadius * Math.sin(phi) * Math.cos(theta);
            const y = baseRadius * Math.cos(phi);
            const z = baseRadius * Math.sin(phi) * Math.sin(theta);

            return (
              <mesh key={idx} position={[x, y, z]}>
                <boxGeometry args={[0.015, 0.015, spikeHeight]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            );
          })}

          {/* LEO Satellites Vector Layer */}
          {viewportFocus === 'EARTH' && (
            <group>
              {/* ISS Orbit Ring */}
              <mesh rotation={[51.6 * (Math.PI / 180), 0, 0]}>
                <ringGeometry args={[2.52, 2.526, 64]} />
                <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.25} />
              </mesh>
              <AuthenticSatellite radius={2.52} speed={0.35} inclination={51.6 * (Math.PI / 180)} phase={0} isISS={true} />
              
              {satellites.map((sat) => (
                <group key={sat.id}>
                  {/* Individual Satellite Orbit Paths */}
                  <mesh rotation={[sat.inclination, 0, sat.phase]}>
                    <ringGeometry args={[sat.radius, sat.radius + 0.003, 64]} />
                    <meshBasicMaterial color="#334155" side={THREE.DoubleSide} transparent opacity={0.08} />
                  </mesh>
                  <AuthenticSatellite 
                    radius={sat.radius} 
                    speed={sat.speed} 
                    inclination={sat.inclination} 
                    phase={sat.phase} 
                    isISS={false} 
                  />
                </group>
              ))}
            </group>
          )}

          {/* Macro Deep-Space Asteroids (NeoWS Layer) */}
          {neows.map((asteroid: AsteroidData) => {
            const velocity = asteroid.relativeVelocityKmS || 15;
            const missDistance = asteroid.missDistanceKm || 6000000;
            const { inclination, phase } = getStableCoordinates(asteroid.id);

            const orbitRadius = 4.0 + (missDistance % 3.5);
            const orbitSpeed = (velocity / 50) * 0.06;

            const idNum = parseInt(asteroid.id) || 0;
            const scaleX = 0.6 + ((idNum % 7) / 10);
            const scaleY = 0.5 + ((idNum % 5) / 10);
            const scaleZ = 0.6 + ((idNum % 9) / 10);

            return (
              <group key={asteroid.id}>
                <mesh>
                  <ringGeometry args={[orbitRadius, orbitRadius + 0.02, 64]} />
                  <meshBasicMaterial color="#475569" side={THREE.DoubleSide} transparent opacity={0.4} />
                </mesh>
                <OrbitingAsteroid 
                  radius={orbitRadius} 
                  speed={orbitSpeed} 
                  inclination={inclination} 
                  phase={phase} 
                  isHazardous={asteroid.isPotentiallyHazardous}
                  scaleFactors={[scaleX, scaleY, scaleZ]}
                />
              </group>
            );
          })}
        </>
      )}

      {activeTab === 'sandbox' && (
        <group>
          {/* Wireframe holographic Earth globe simulation */}
          <mesh ref={globeRef}>
            <sphereGeometry args={[2.2, 24, 24]} />
            <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.35} />
          </mesh>
          <gridHelper args={[8, 8, '#1e293b', '#1e293b']} position={[0, -2.3, 0]} />
          
          {/* Holographic rings representing countermeasure paths */}
          {[-0.5, 0, 0.5].map((off, i) => (
            <mesh key={i} rotation={[Math.PI / 4 + off, off * 0.5, 0]}>
              <ringGeometry args={[2.7, 2.72, 64]} />
              <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {activeTab === 'heliophysics' && (
        <group>
          {/* Coronal weather glowing sun core */}
          <mesh ref={globeRef}>
            <sphereGeometry args={[1.8, 32, 32]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.95, 32, 32]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.25} blending={THREE.AdditiveBlending} />
          </mesh>
          
          {/* Swirling flux rings */}
          {[0.2, 0.6].map((speed, i) => (
            <mesh key={i} rotation={[Math.PI / (2.5 + i), speed, 0]}>
              <ringGeometry args={[2.3, 2.36, 64]} />
              <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export default function Globe3D() {
  const [activeTab, setActiveTab] = useState<'globe' | 'sandbox' | 'heliophysics'>('globe');
  
  const viewportFocus = useTelemetryStore((state) => state.viewportFocus);
  const setViewportFocus = useTelemetryStore((state) => state.setViewportFocus);

  // Dynamic labels based on active tab and viewport focus
  let viewString = "GLOBE SCANNER";
  let scaleString = "VIEWPORT SCALE: INTRALEO SCANNER // OVERHEAD INTERCEPTS";
  let statusColor = "#10b981"; // nominal green
  
  if (activeTab === 'globe') {
    viewString = "GLOBE SCANNER";
    if (viewportFocus === 'SOLAR') {
      scaleString = "VIEWPORT SCALE: DEEP-SPACE APEX MATRIX // APOGEE VECTOR SECURED";
      statusColor = "#ef4444"; // alert crimson
    } else {
      scaleString = "VIEWPORT SCALE: INTRALEO SCANNER // OVERHEAD INTERCEPTS";
      statusColor = "#10b981"; // nominal green
    }
  } else if (activeTab === 'sandbox') {
    viewString = "COUNTERMEASURE SANDBOX";
    scaleString = "VIEWPORT SCALE: WIREFRAME SIMULATION // SANDBOX EMULATOR";
    statusColor = "#10b981";
  } else if (activeTab === 'heliophysics') {
    viewString = "HELIOPHYSICS WEATHER MATRIX";
    scaleString = "VIEWPORT SCALE: SOLAR CORONAL FLUX MAP // SOHO MATRIX";
    statusColor = "#f59e0b"; // weather amber
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#030712] select-none">
      
      {/* Dynamic Tab Selector Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900 shrink-0 font-mono text-[9px]">
        {/* Left side: View Tabs */}
        <div className="flex space-x-6">
          <button 
            onClick={() => setActiveTab('globe')}
            className={`pb-1 uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'globe' 
                ? 'border-emerald-500 text-white font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            01 Globe Scanner
          </button>
          <button 
            onClick={() => setActiveTab('sandbox')}
            className={`pb-1 uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'sandbox' 
                ? 'border-emerald-500 text-white font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            02 Countermeasure Sandbox
          </button>
          <button 
            onClick={() => setActiveTab('heliophysics')}
            className={`pb-1 uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'heliophysics' 
                ? 'border-emerald-500 text-white font-bold' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            03 Heliophysics Weather Matrix
          </button>
        </div>

        {/* Right side: Viewport Camera Toggles */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-500 uppercase tracking-widest text-[8px] font-bold mr-1">Focus</span>
          <button
            onClick={() => setViewportFocus('EARTH')}
            className={`px-2.5 py-0.5 rounded-sm border uppercase font-bold text-[8.5px] transition-colors ${
              viewportFocus === 'EARTH'
                ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-400'
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Earth
          </button>
          <button
            onClick={() => setViewportFocus('SOLAR')}
            className={`px-2.5 py-0.5 rounded-sm border uppercase font-bold text-[8.5px] transition-colors ${
              viewportFocus === 'SOLAR'
                ? 'bg-emerald-950/20 border-emerald-500/35 text-emerald-400'
                : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Solar
          </button>
        </div>
      </div>

      {/* Main WebGL Canvas Area */}
      <div className="flex-grow min-h-0 relative hud-frame border-slate-900">
        <span className="hud-bl" />
        <span className="hud-br" />
        <Canvas camera={{ position: [0, 0, 4.5], fov: 38, near: 0.1, far: 1000 }} dpr={[1, 2]} gl={{ antialias: true }}>
          <color attach="background" args={["#02040a"]} />
          <ambientLight intensity={0.25} />
          <directionalLight position={[10, 5, 10]} intensity={2.5} castShadow />
          <Stars radius={viewportFocus === 'SOLAR' ? 200 : 60} depth={viewportFocus === 'SOLAR' ? 120 : 40} count={viewportFocus === 'SOLAR' ? 8000 : 4000} factor={3} fade speed={0.3} />
          <GlobeScene activeTab={activeTab} />
          <OrbitControls enablePan={false} enableZoom minDistance={1.4} maxDistance={20} rotateSpeed={0.4} />
        </Canvas>

        {/* HUD Data Plates */}
        <div className="pointer-events-none absolute left-4 top-4 data-plate px-2.5 py-1 text-[9px] text-slate-400">
          <span 
            className="inline-block h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse" 
            style={{ backgroundColor: statusColor }} 
          />
          {activeTab === 'heliophysics' ? 'SOLAR-WEATHER-INTEGRITY · SOHO SYNC OK' : 'EARTH-CENTERED-INERTIAL · ECEF SYNC OK'}
        </div>
        <div className="pointer-events-none absolute right-4 top-4 data-plate px-2.5 py-1 text-[9px] text-slate-400">
          VIEW · <span className="text-white uppercase font-bold">{viewString}</span>
        </div>
        <div
          className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 data-plate px-2.5 py-1 text-[9px] whitespace-nowrap"
          style={{ color: statusColor }}
        >
          {scaleString}
        </div>
      </div>
    </div>
  );
}