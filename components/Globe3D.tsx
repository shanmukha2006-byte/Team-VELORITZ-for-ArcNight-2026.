'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import * as THREE from 'three';

// --- WEBGL SUPPORT CHECK & ERROR BOUNDARY ---
class WebGLErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WebGL Graphics Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[#030712] border border-slate-900 p-6 text-center select-none">
          <div className="text-slate-500 font-mono text-[10px] font-bold uppercase mb-2">
            3D ENGINE INIT DEGRADED
          </div>
          <p className="text-slate-600 text-[9px] font-mono max-w-sm leading-normal">
            WebGL acceleration is unsupported on this hardware configuration. 
            Telemetry is routing to the tabular cockpit feeds.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- PRECISION THERMAL SPIKE MARKER ---
function ThermalSpike({ position, frp }: { position: [number, number, number]; frp: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate spike parameters
  const height = Math.min(Math.max(frp / 250, 0.15), 0.6);
  const dir = new THREE.Vector3(...position).normalize();
  // Align Y-axis (cylinder direction) with outward position vector
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  return (
    <group position={position} quaternion={quaternion}>
      {/* Tall, narrow, semi-translucent cylinder representing fire radiative power */}
      <mesh position={[0, height / 2, 0]} ref={meshRef}>
        <cylinderGeometry args={[0.003, 0.012, height, 6]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.65} />
      </mesh>
      {/* Matte warning core dot at base */}
      <mesh>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial color="#EF4444" />
      </mesh>
    </group>
  );
}

// --- HAZARDOUS ASTEROID ORBIT RING ---
function AsteroidOrbit({ index }: { index: number }) {
  const tiltX = (index * 0.35) % Math.PI;
  const tiltZ = (index * 0.18) % Math.PI;
  const radius = 2.3 + index * 0.12;

  return (
    <mesh rotation={[tiltX, 0, tiltZ]}>
      {/* Razor-thin torus representing orbit */}
      <torusGeometry args={[radius, 0.0015, 6, 64]} />
      <meshBasicMaterial color="#94A3B8" transparent opacity={0.08} />
    </mesh>
  );
}

// --- HOLOGRAPHIC EARTH MESH AND GROUP ROTATION ---
function InteractiveEarth() {
  const earthGroupRef = useRef<THREE.Group>(null);
  const { firms } = useTelemetryStore();

  useFrame(() => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += 0.0015; // Slow rotation
    }
  });

  const convertLatLng = (lat: number, lng: number, radius = 2.0): [number, number, number] => {
    const phi = (lat * Math.PI) / 180;
    const theta = ((360 - lng) * Math.PI) / 180;

    const x = radius * Math.cos(phi) * Math.sin(theta);
    const y = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * Math.cos(theta);

    return [x, y, z];
  };

  const activeHotspots = [...firms]
    .sort((a, b) => b.frpMegawatts - a.frpMegawatts)
    .slice(0, 50);

  return (
    <group ref={earthGroupRef}>
      {/* Matte inner core */}
      <mesh>
        <sphereGeometry args={[1.99, 32, 32]} />
        <meshBasicMaterial color="#040812" />
      </mesh>

      {/* Titanium Wireframe Grid */}
      <mesh>
        <sphereGeometry args={[2.0, 30, 30]} />
        <meshBasicMaterial
          color="#475569"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Wildfire spikes */}
      {activeHotspots.map((hotspot, idx) => {
        const pos = convertLatLng(hotspot.latitude, hotspot.longitude);
        return <ThermalSpike key={idx} position={pos} frp={hotspot.frpMegawatts} />;
      })}
    </group>
  );
}

// --- SCENE IMPLEMENTATION ---
function Scene() {
  const { neows } = useTelemetryStore();

  const dangerousAsteroids = neows
    .filter(a => a.isPotentiallyHazardous)
    .slice(0, 10);

  return (
    <>
      {/* Subtle depth stars */}
      <Stars radius={100} depth={40} count={200} factor={1.5} saturation={0} fade speed={0.5} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />

      <InteractiveEarth />

      {/* Asteroid vector rings */}
      {dangerousAsteroids.map((_, idx) => (
        <AsteroidOrbit key={idx} index={idx} />
      ))}
    </>
  );
}

// --- EXPORTED VIEWPORT WRAPPER ---
export default function Globe3D() {
  const { loading } = useTelemetryStore();
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebGlSupported(support);
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  if (!webGlSupported) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#030712] border border-slate-900 p-6 text-center select-none">
        <div className="text-slate-500 font-mono text-[10px] font-bold uppercase mb-2">
          WEBGL DEGRADED
        </div>
        <p className="text-slate-600 text-[9px] font-mono max-w-sm">
          WebGL acceleration is disabled or unsupported in this environment. 
          Telemetry is routing to the tabular cockpit feeds.
        </p>
      </div>
    );
  }

  return (
    <WebGLErrorBoundary>
      <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden bg-[#030712]">
        
        {/* Visual telemetry HUD indicators overlay */}
        <div className="absolute top-4 left-4 z-10 font-mono text-[8px] text-slate-500 pointer-events-none select-none border border-slate-900 bg-[#040812]/85 px-2.5 py-1.5">
          <div>LATENCY: NOMINAL</div>
          <div>MARKERS: THERMAL SPIKES (FRP &gt; 50)</div>
          <div>ORBITS: NEOWS VECTOR TRAJECTORIES</div>
        </div>

        {/* Loading overlay spinner */}
        {loading && (
          <div className="absolute inset-0 bg-[#030712]/90 z-20 flex flex-col items-center justify-center space-y-2">
            <div className="w-5 h-5 border border-slate-800 border-t-transparent rounded-full animate-spin" />
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
              SYNCING GRAPHICS VIEWPORT...
            </span>
          </div>
        )}

        {/* Canvas viewport */}
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 60 }}
          style={{ width: '100%', height: '100%', background: '#030712' }}
        >
          <Scene />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
