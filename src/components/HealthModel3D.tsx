import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface HealthModel3DProps {
  timeframe: string;
  baseBmi: number;
  overallRisk: number; // 0 to 100
  activityLevel: string;
  gender: string;
}

function Mannequin({ baseBmi, overallRisk, activityLevel, timeframe, gender }: HealthModel3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const hipsRef = useRef<THREE.Mesh>(null);
  const chestRef = useRef<THREE.Mesh>(null);

  // Calculate simulated BMI based on timeframe and risk
  // If risk is high, BMI tends to increase over time in this simulation
  const years = timeframe === 'Now' ? 0 : parseInt(timeframe.split(' ')[0]) || 0;
  const simulatedBmi = baseBmi + (overallRisk > 50 ? (years * 0.5) : (years * -0.2));
  
  const isFemale = gender.toLowerCase() === 'female';

  // Base proportions based on gender
  const baseShoulderWidth = isFemale ? 0.8 : 1.0;
  const baseHipWidth = isFemale ? 1.1 : 0.9;
  
  // Scale torso based on BMI (Normal BMI ~ 22)
  // Men tend to gain weight more in the belly (targetScaleZ), Women more in hips/thighs
  const targetScaleX = Math.max(0.8, Math.min(2.5, simulatedBmi / 22));
  const targetScaleZ = Math.max(0.8, Math.min(3.0, simulatedBmi / 20));
  
  const targetHipScaleX = isFemale ? targetScaleX * 1.2 : targetScaleX;
  const targetBellyScaleZ = isFemale ? targetScaleZ * 0.8 : targetScaleZ * 1.2;

  // Slouch based on activity level and risk
  const isSedentary = activityLevel === 'Sedentary';
  const targetSlouch = isSedentary || overallRisk > 60 ? (overallRisk / 100) * 0.5 : 0;

  // Color based on risk (Healthy = warm skin tone, Unhealthy = pale/grayish)
  const healthColor = new THREE.Color().lerpColors(
    new THREE.Color('#fcd5ce'), // Healthy warm
    new THREE.Color('#cad2c5'), // Unhealthy pale/gray
    overallRisk / 100
  );

  useFrame((state, delta) => {
    if (torsoRef.current) {
      // Smoothly animate to target scales
      torsoRef.current.scale.x = THREE.MathUtils.lerp(torsoRef.current.scale.x, targetScaleX * baseShoulderWidth, 4 * delta);
      torsoRef.current.scale.z = THREE.MathUtils.lerp(torsoRef.current.scale.z, targetBellyScaleZ, 4 * delta);
    }
    if (hipsRef.current) {
      hipsRef.current.scale.x = THREE.MathUtils.lerp(hipsRef.current.scale.x, targetHipScaleX * baseHipWidth, 4 * delta);
      hipsRef.current.scale.z = THREE.MathUtils.lerp(hipsRef.current.scale.z, targetScaleZ, 4 * delta);
    }
    if (groupRef.current) {
      // Smoothly animate slouch (bending forward)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetSlouch, 4 * delta);
    }
    if (headRef.current) {
      // Head compensates for slouch to look forward
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -targetSlouch * 0.8, 4 * delta);
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.5, 0]}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color={healthColor} roughness={0.4} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.5, 16]} />
        <meshStandardMaterial color={healthColor} roughness={0.4} />
      </mesh>

      {/* Upper Torso / Chest */}
      <mesh ref={torsoRef} position={[0, 1.8, 0]}>
        <capsuleGeometry args={[0.45, 0.6, 16, 32]} />
        <meshStandardMaterial color={healthColor} roughness={0.5} />
      </mesh>
      
      {/* Lower Torso / Hips */}
      <mesh ref={hipsRef} position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.45, 0.4, 16, 32]} />
        <meshStandardMaterial color={healthColor} roughness={0.5} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.8 * baseShoulderWidth, 1.5, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.12, 1.2, 16, 16]} />
        <meshStandardMaterial color={healthColor} roughness={0.5} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.8 * baseShoulderWidth, 1.5, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.12, 1.2, 16, 16]} />
        <meshStandardMaterial color={healthColor} roughness={0.5} />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.25 * baseHipWidth, 0.4, 0]}>
        <capsuleGeometry args={[0.18, 1.4, 16, 16]} />
        <meshStandardMaterial color={healthColor} roughness={0.5} />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.25 * baseHipWidth, 0.4, 0]}>
        <capsuleGeometry args={[0.18, 1.4, 16, 16]} />
        <meshStandardMaterial color={healthColor} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function HealthModel3D(props: HealthModel3DProps) {
  return (
    <div className="w-full h-[500px] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 relative">
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Interactive 3D View</p>
        <p className="text-xs text-slate-500">Drag to rotate • Scroll to zoom</p>
      </div>
      <Canvas camera={{ position: [0, 1, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <Environment preset="city" />
        
        <Mannequin {...props} />
        
        <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} far={4} />
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2 + 0.1} 
          minDistance={3} 
          maxDistance={10} 
        />
      </Canvas>
    </div>
  );
}
