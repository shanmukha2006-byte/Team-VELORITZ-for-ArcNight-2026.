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
        <div className="flex flex-col items-center justify-center w-full h-full bg-[#0a0f1d] border border-[#1e2d4a]/50 rounded-xl p-6 text-center select-none">
          <div className="text-red-500 font-mono text-xs font-bold uppercase mb-2">
            3D ENGINE INIT FAILED
          </div>
          <p className="text-slate-400 text-[10px] font-mono max-w-sm">
            WebGL acceleration is disabled or unsupported in this browser/device. 
            TerraGuard 3D is running in flat data telemetry mode.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- DYNAMIC PULSING HOTSPOT MARKER ---
function PulsingHotspot({ position, frp }: { position: [number, number, number]; frp: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      // Animate pulsing scale based on FRP intensity
      const pulseSpeed = 4 + (frp > 100 ? 4 : 0);
      const scaleFactor = 1 + Math.sin(time * pulseSpeed) * 0.25;
      meshRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  });

  // Hotspots are scaled based on fire radiative power (FRP)
  const size = Math.min(Math.max(frp / 200, 0.025), 0.08);

  return (
    <mesh position={position} ref={meshRef}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color="#ff2244" toneMapped={false} />
    </mesh>
  );
}

// --- HAZARDOUS ASTEROID ORBIT RING ---
function AsteroidOrbit({ index }: { index: number }) {
  // Compute distinct inclinations and tilts for each orbit
  const tiltX = (index * 0.35) % Math.PI;
  const tiltZ = (index * 0.18) % Math.PI;
  // Slowly space orbits outward
  const radius = 2.3 + index * 0.12;

  return (
    <mesh rotation={[tiltX, 0, tiltZ]}>
      <torusGeometry args={[radius, 0.007, 8, 64]} />
      <meshBasicMaterial color="#ffaa00" transparent opacity={0.2} toneMapped={false} />
    </mesh>
  );
}

// --- HOLOGRAPHIC EARTH MESH AND GROUP ROTATION ---
function InteractiveEarth() {
  const earthGroupRef = useRef<THREE.Group>(null);
  const { firms } = useTelemetryStore();

  // Slow rotation on the Y axis
  useFrame(() => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += 0.002;
    }
  });

  // Convert Lat/Lng coordinates to 3D Cartesian coordinates
  // Earth Sphere Radius: 2.0
  const convertLatLng = (lat: number, lng: number, radius = 2.01): [number, number, number] => {
    const phi = (lat * Math.PI) / 180;
    const theta = ((360 - lng) * Math.PI) / 180; // invert for standard clockwise rotation

    const x = radius * Math.cos(phi) * Math.sin(theta);
    const y = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * Math.cos(theta);

    return [x, y, z];
  };

  // Limit to top 50 active hotspots by FRP
  const activeHotspots = [...firms]
    .sort((a, b) => b.frpMegawatts - a.frpMegawatts)
    .slice(0, 50);

  return (
    <group ref={earthGroupRef}>
      {/* Solid inner dark earth core */}
      <mesh>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshBasicMaterial color="#060b13" />
      </mesh>

      {/* Holographic Wireframe Grid */}
      <mesh>
        <sphereGeometry args={[2.005, 32, 32]} />
        <meshBasicMaterial
          color="#1e3a8a"
          wireframe
          transparent
          opacity={0.15}
          toneMapped={false}
        />
      </mesh>

      {/* Wildfire markers group */}
      {activeHotspots.map((hotspot, idx) => {
        const pos = convertLatLng(hotspot.latitude, hotspot.longitude);
        return <PulsingHotspot key={idx} position={pos} frp={hotspot.frpMegawatts} />;
      })}
    </group>
  );
}

// --- SCENE IMPLEMENTATION ---
function Scene() {
  const { neows } = useTelemetryStore();

  // Filter and limit potentially hazardous asteroids
  const dangerousAsteroids = neows
    .filter(a => a.isPotentiallyHazardous)
    .slice(0, 10);

  return (
    <>
      {/* Background Starfield */}
      <Stars radius={100} depth={50} count={800} factor={3} saturation={0.5} fade speed={1.2} />

      {/* Ambient and directional lights */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1.0} />

      {/* The rotating Earth and its hotspots */}
      <InteractiveEarth />

      {/* Asteroid Orbits (Fixed outer rings - do not rotate with Earth) */}
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

  // Quick feature test for WebGL availability
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
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#0a0f1d] border border-[#1e2d4a]/50 rounded-xl p-6 text-center select-none">
        <div className="text-red-500 font-mono text-xs font-bold uppercase mb-2">
          WEBGL GRAPHICS NOT AVAILABLE
        </div>
        <p className="text-slate-400 text-[10px] font-mono max-w-sm">
          WebGL acceleration is disabled or unsupported in this browser/device. 
          TerraGuard 3D is running in flat data telemetry mode.
        </p>
      </div>
    );
  }

  return (
    <WebGLErrorBoundary>
      <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden">
        
        {/* Visual telemetry HUD indicators overlay */}
        <div className="absolute top-4 left-4 z-10 font-mono text-[9px] text-cyan-400/70 pointer-events-none select-none bg-[#090e17]/60 border border-cyan-500/20 px-2.5 py-1.5 rounded backdrop-blur-sm">
          <div>LATENCY: NOMINAL</div>
          <div>MARKERS: ACTIVE HOTSPOTS (FRP &gt; 50)</div>
          <div>ORBITS: NEOWS THREAT CONTOURS</div>
        </div>

        {/* Loading overlay spinner */}
        {loading && (
          <div className="absolute inset-0 bg-[#080d17]/80 z-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
              Initializing 3D viewport...
            </span>
          </div>
        )}

        {/* Canvas viewport */}
        <Canvas
          camera={{ position: [0, 0, 4.2], fov: 60 }}
          style={{ width: '100%', height: '100%', background: '#070a13' }}
        >
          <Scene />
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
