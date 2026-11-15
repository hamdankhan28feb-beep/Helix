import React, { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ENVIRONMENT_CONFIG } from '../../lib/tokens';
import { getStatusColor } from '../../lib/utils';
import {
  BodyRegion,
  HazardId,
  MissionEnvironment,
  RegionId,
  TwinLayer,
} from '../../types/helix';

// Module-scope reusable math helpers (zero per-frame GC allocation)
const _targetVec = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _tempColor = new THREE.Color();

export interface CameraCommand {
  type: 'reset' | 'rotateLeft' | 'rotateRight' | 'rotateUp' | 'rotateDown' | 'zoomIn' | 'zoomOut';
  nonce: number;
}

interface AnatomyScene3DProps {
  regions: BodyRegion[];
  selectedRegionId: RegionId | null;
  hoveredRegionId: RegionId | null;
  layer: TwinLayer;
  activeHazards: HazardId[];
  environment: MissionEnvironment;
  colorBlindSafe: boolean;
  reduceMotion: boolean;
  isSoftwareGl: boolean;
  cameraCommand: CameraCommand | null;
  onSelectRegion: (id: RegionId) => void;
  onHoverRegion: (id: RegionId | null) => void;
}

function getRegionState(
  regions: BodyRegion[],
  id: RegionId,
  activeHazards: HazardId[],
  colorBlindSafe: boolean
) {
  const region = regions.find((r) => r.id === id);
  if (!region) {
    return {
      color: '#3DE0C5',
      drifted: false,
      offset: [0, 0, 0] as [number, number, number],
      dimmed: false,
      glow: 0.08,
    };
  }
  const drifted = region.status !== 'nominal';
  const dimmed =
    activeHazards.length > 0 &&
    !region.affectedByHazards.some((h) => activeHazards.includes(h));
  const color = getStatusColor(region.status, colorBlindSafe);
  const glow =
    region.status === 'escalate'
      ? 0.85
      : region.status === 'caution'
      ? 0.58
      : region.status === 'watch'
      ? 0.35
      : 0.05;

  return {
    color,
    drifted,
    offset: drifted ? region.driftOffset : ([0, 0, 0] as [number, number, number]),
    dimmed,
    glow,
  };
}

// Translucent Earth baseline Ghost wireframe behind live mesh
function EarthBaselineGhost() {
  return (
    <group position={[-0.035, 0.01, -0.04]}>
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.13, 14, 14]} />
        <meshBasicMaterial color="#7FB2FF" wireframe transparent opacity={0.11} />
      </mesh>
      <mesh position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.17, 0.14, 0.54, 12, 4]} />
        <meshBasicMaterial color="#7FB2FF" wireframe transparent opacity={0.09} />
      </mesh>
      <mesh position={[-0.24, 1.14, 0]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.045, 0.48, 4, 8]} />
        <meshBasicMaterial color="#7FB2FF" wireframe transparent opacity={0.08} />
      </mesh>
      <mesh position={[0.24, 1.14, 0]} rotation={[0, 0, -0.12]}>
        <capsuleGeometry args={[0.045, 0.48, 4, 8]} />
        <meshBasicMaterial color="#7FB2FF" wireframe transparent opacity={0.08} />
      </mesh>
      <mesh position={[-0.1, 0.46, 0]}>
        <capsuleGeometry args={[0.06, 0.68, 4, 8]} />
        <meshBasicMaterial color="#7FB2FF" wireframe transparent opacity={0.08} />
      </mesh>
      <mesh position={[0.1, 0.46, 0]}>
        <capsuleGeometry args={[0.06, 0.68, 4, 8]} />
        <meshBasicMaterial color="#7FB2FF" wireframe transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

// Skeleton Layer (Default "wow" view)
function SkeletonLayer({
  regions,
  activeHazards,
  colorBlindSafe,
}: {
  regions: BodyRegion[];
  activeHazards: HazardId[];
  colorBlindSafe: boolean;
}) {
  const brain = getRegionState(regions, 'brain_eyes', activeHazards, colorBlindSafe);
  const mind = getRegionState(regions, 'mind_sleep', activeHazards, colorBlindSafe);
  const bones = getRegionState(regions, 'bones_muscles', activeHazards, colorBlindSafe);
  const heart = getRegionState(regions, 'heart_vessels', activeHazards, colorBlindSafe);

  const boneBaseColor = '#D8E2F0';

  return (
    <group>
      {/* Cranium + Jaw */}
      <group position={brain.offset}>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.125, 24, 24]} />
          <meshStandardMaterial
            color={brain.drifted ? brain.color : boneBaseColor}
            emissive={brain.drifted ? brain.color : '#000000'}
            emissiveIntensity={brain.glow * 0.45}
            roughness={0.42}
            metalness={0.08}
            transparent={brain.dimmed}
            opacity={brain.dimmed ? 0.25 : 1}
          />
        </mesh>
        <mesh position={[0, 1.5, 0.03]}>
          <boxGeometry args={[0.11, 0.08, 0.1]} />
          <meshStandardMaterial
            color={boneBaseColor}
            roughness={0.45}
            transparent={brain.dimmed}
            opacity={brain.dimmed ? 0.25 : 1}
          />
        </mesh>
      </group>

      {/* Mind & Sleep Head Halo */}
      <mesh position={[mind.offset[0], 1.72 + mind.offset[1], mind.offset[2]]} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[0.18, 0.008, 12, 48]} />
        <meshStandardMaterial
          color={mind.color}
          emissive={mind.color}
          emissiveIntensity={mind.glow + 0.25}
          transparent
          opacity={mind.dimmed ? 0.2 : 0.85}
        />
      </mesh>

      {/* Spine Vertebrae */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[0, 0.94 + i * 0.048, -0.04]}>
          <cylinderGeometry args={[0.026, 0.028, 0.032, 12]} />
          <meshStandardMaterial color={boneBaseColor} roughness={0.4} />
        </mesh>
      ))}

      {/* Ribcage Rings */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 1.36 - i * 0.055;
        const r = 0.145 - Math.abs(i - 2) * 0.015;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.15, 0.72, 1]}>
            <torusGeometry args={[r, 0.011, 10, 32]} />
            <meshStandardMaterial color="#CBD7E8" roughness={0.38} metalness={0.1} />
          </mesh>
        );
      })}

      {/* Subtle Heart Core inside Ribcage */}
      <mesh position={[0.03 + heart.offset[0], 1.24 + heart.offset[1], 0.02 + heart.offset[2]]}>
        <sphereGeometry args={[0.052, 20, 20]} />
        <meshStandardMaterial
          color={heart.color}
          emissive={heart.color}
          emissiveIntensity={heart.glow}
          roughness={0.35}
        />
      </mesh>

      {/* Clavicles & Arms */}
      <mesh position={[0, 1.41, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 12]} />
        <meshStandardMaterial color={boneBaseColor} roughness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.2, 1.38, 0]} rotation={[0, 0, side * -0.1]}>
          <mesh position={[side * 0.02, -0.14, 0]}>
            <capsuleGeometry args={[0.018, 0.24, 6, 12]} />
            <meshStandardMaterial color={boneBaseColor} roughness={0.42} />
          </mesh>
          <mesh position={[side * 0.04, -0.4, 0.02]}>
            <capsuleGeometry args={[0.015, 0.22, 6, 12]} />
            <meshStandardMaterial color={boneBaseColor} roughness={0.42} />
          </mesh>
        </group>
      ))}

      {/* Pelvis */}
      <mesh position={[0, 0.9, 0]} scale={[1.25, 0.65, 0.75]}>
        <torusGeometry args={[0.11, 0.03, 12, 28]} />
        <meshStandardMaterial
          color={bones.drifted ? bones.color : boneBaseColor}
          emissive={bones.drifted ? bones.color : '#000000'}
          emissiveIntensity={bones.glow * 0.4}
          roughness={0.42}
        />
      </mesh>

      {/* Femurs & Tibias (Bones & Muscles hotspot target) */}
      <group position={bones.offset}>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.1, 0.66, 0]} rotation={[0, 0, side * 0.03]}>
              <capsuleGeometry args={[0.026, 0.34, 8, 14]} />
              <meshStandardMaterial
                color={bones.drifted ? bones.color : boneBaseColor}
                emissive={bones.drifted ? bones.color : '#000000'}
                emissiveIntensity={bones.glow * 0.5}
                roughness={0.4}
                transparent={bones.dimmed}
                opacity={bones.dimmed ? 0.28 : 1}
              />
            </mesh>
            <mesh position={[side * 0.1, 0.26, 0]}>
              <capsuleGeometry args={[0.021, 0.34, 8, 14]} />
              <meshStandardMaterial
                color={bones.drifted ? bones.color : boneBaseColor}
                emissive={bones.drifted ? bones.color : '#000000'}
                emissiveIntensity={bones.glow * 0.5}
                roughness={0.4}
                transparent={bones.dimmed}
                opacity={bones.dimmed ? 0.28 : 1}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

// Organs Layer
function OrgansLayer({
  regions,
  activeHazards,
  colorBlindSafe,
}: {
  regions: BodyRegion[];
  activeHazards: HazardId[];
  colorBlindSafe: boolean;
}) {
  const brain = getRegionState(regions, 'brain_eyes', activeHazards, colorBlindSafe);
  const lungs = getRegionState(regions, 'lungs_oxygen', activeHazards, colorBlindSafe);
  const heart = getRegionState(regions, 'heart_vessels', activeHazards, colorBlindSafe);
  const gut = getRegionState(regions, 'gut_metabolism', activeHazards, colorBlindSafe);
  const ear = getRegionState(regions, 'inner_ear', activeHazards, colorBlindSafe);

  return (
    <group>
      {/* Translucent Outer Silhouette */}
      <mesh position={[0, 1.18, 0]}>
        <capsuleGeometry args={[0.17, 0.42, 8, 24]} />
        <meshStandardMaterial color="#8A97AD" transparent opacity={0.14} roughness={0.6} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.135, 20, 20]} />
        <meshStandardMaterial color="#8A97AD" transparent opacity={0.14} roughness={0.6} depthWrite={false} />
      </mesh>

      {/* Brain */}
      <mesh position={[brain.offset[0], 1.59 + brain.offset[1], brain.offset[2]]} scale={[0.95, 0.85, 1.1]}>
        <sphereGeometry args={[0.095, 24, 24]} />
        <meshStandardMaterial
          color={brain.color}
          emissive={brain.color}
          emissiveIntensity={brain.glow * 0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Inner Ear */}
      <mesh position={[0.095, 1.53, 0]}>
        <torusGeometry args={[0.018, 0.006, 10, 24]} />
        <meshStandardMaterial color={ear.color} emissive={ear.color} emissiveIntensity={ear.glow + 0.2} />
      </mesh>

      {/* Lungs */}
      {[-0.08, 0.08].map((x, idx) => (
        <mesh key={idx} position={[x, 1.26, 0]} scale={[0.85, 1.3, 0.75]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshStandardMaterial
            color={lungs.color}
            emissive={lungs.color}
            emissiveIntensity={lungs.glow + 0.15}
            transparent
            opacity={0.72}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Heart */}
      <mesh position={[0.03 + heart.offset[0], 1.24 + heart.offset[1], 0.04 + heart.offset[2]]}>
        <sphereGeometry args={[0.056, 22, 22]} />
        <meshStandardMaterial
          color={heart.color}
          emissive={heart.color}
          emissiveIntensity={heart.glow + 0.35}
          roughness={0.25}
        />
      </mesh>

      {/* Gut & Metabolism */}
      <mesh position={[0, 1.0, 0.02]} scale={[1.15, 0.85, 0.85]}>
        <torusKnotGeometry args={[0.068, 0.02, 48, 8, 2, 3]} />
        <meshStandardMaterial
          color={gut.color}
          emissive={gut.color}
          emissiveIntensity={gut.glow + 0.12}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}

// Muscles Layer
function MusclesLayer({
  regions,
  activeHazards,
  colorBlindSafe,
}: {
  regions: BodyRegion[];
  activeHazards: HazardId[];
  colorBlindSafe: boolean;
}) {
  const bones = getRegionState(regions, 'bones_muscles', activeHazards, colorBlindSafe);
  const immune = getRegionState(regions, 'immune_skin', activeHazards, colorBlindSafe);

  return (
    <group>
      <mesh position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshStandardMaterial color="#3A4B69" roughness={0.55} metalness={0.1} />
      </mesh>
      {/* Chest & Core */}
      <mesh position={[0, 1.22, 0]} scale={[1.18, 1, 0.72]}>
        <capsuleGeometry args={[0.155, 0.36, 12, 24]} />
        <meshStandardMaterial color="#3F5375" roughness={0.5} metalness={0.12} />
      </mesh>
      {/* Arms (Immune & skin proximity) */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.24, 1.16, 0]}
          rotation={[0, 0, side * 0.1]}
        >
          <capsuleGeometry args={[0.048, 0.48, 8, 16]} />
          <meshStandardMaterial
            color={side < 0 && immune.drifted ? immune.color : '#3A4B69'}
            emissive={side < 0 && immune.drifted ? immune.color : '#000000'}
            emissiveIntensity={immune.glow * 0.5}
            roughness={0.5}
          />
        </mesh>
      ))}
      {/* Legs */}
      <group position={bones.offset}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.1, 0.48, 0]}>
            <capsuleGeometry args={[0.064, 0.68, 10, 20]} />
            <meshStandardMaterial
              color={bones.drifted ? bones.color : '#3F5375'}
              emissive={bones.drifted ? bones.color : '#000000'}
              emissiveIntensity={bones.glow * 0.55}
              roughness={0.46}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// EVA Suit Layer
function SuitLayer({
  regions,
  activeHazards,
  colorBlindSafe,
}: {
  regions: BodyRegion[];
  activeHazards: HazardId[];
  colorBlindSafe: boolean;
}) {
  const heart = getRegionState(regions, 'heart_vessels', activeHazards, colorBlindSafe);
  const rad = getRegionState(regions, 'radiation', activeHazards, colorBlindSafe);

  return (
    <group>
      {/* Helmet + Visor */}
      <mesh position={[0, 1.59, 0]}>
        <sphereGeometry args={[0.165, 28, 28]} />
        <meshPhysicalMaterial color="#CFD9E8" roughness={0.28} metalness={0.18} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 1.59, 0.055]} scale={[0.92, 0.78, 0.85]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshPhysicalMaterial color="#0A1326" roughness={0.08} metalness={0.85} clearcoat={1} />
      </mesh>
      {/* Collar Ring */}
      <mesh position={[0, 1.43, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.135, 0.018, 12, 32]} />
        <meshStandardMaterial color="#7FB2FF" roughness={0.3} metalness={0.75} />
      </mesh>
      {/* Suit Torso + Chest Display */}
      <mesh position={[0, 1.18, 0]} scale={[1.18, 1, 0.82]}>
        <capsuleGeometry args={[0.18, 0.36, 12, 24]} />
        <meshStandardMaterial color="#D5DFEE" roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.24, 0.155]}>
        <boxGeometry args={[0.14, 0.1, 0.03]} />
        <meshStandardMaterial
          color="#0E1522"
          emissive={heart.color}
          emissiveIntensity={0.35}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* Life-support Backpack */}
      <mesh position={[0, 1.22, -0.18]}>
        <boxGeometry args={[0.24, 0.36, 0.12]} />
        <meshStandardMaterial
          color="#9EB0C9"
          emissive={rad.drifted ? rad.color : '#000000'}
          emissiveIntensity={rad.glow * 0.25}
          roughness={0.38}
          metalness={0.35}
        />
      </mesh>
      {/* Arms & Legs */}
      {[-1, 1].map((side) => (
        <mesh key={`arm-${side}`} position={[side * 0.255, 1.14, 0]} rotation={[0, 0, side * 0.12]}>
          <capsuleGeometry args={[0.06, 0.48, 8, 16]} />
          <meshStandardMaterial color="#CFD9E8" roughness={0.48} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`leg-${side}`} position={[side * 0.105, 0.48, 0]}>
          <capsuleGeometry args={[0.074, 0.68, 8, 18]} />
          <meshStandardMaterial color="#CFD9E8" roughness={0.48} />
        </mesh>
      ))}
    </group>
  );
}

// Subtle 3D Hazard Lens Effects
function HazardEffects({
  activeHazards,
  environment,
  reduceMotion,
}: {
  activeHazards: HazardId[];
  environment: MissionEnvironment;
  reduceMotion: boolean;
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const boundaryRef = useRef<THREE.Mesh>(null);

  const particlePositions = useMemo(() => {
    const arr = new Float32Array(72 * 3);
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const radius = 0.45 + (i % 5) * 0.14;
      arr[i * 3] = Math.cos(angle * 3) * radius;
      arr[i * 3 + 1] = 0.15 + ((i * 0.19) % 1.75);
      arr[i * 3 + 2] = Math.sin(angle * 3) * radius;
    }
    return arr;
  }, []);

  const earthLineObject = useMemo(() => {
    const dist = ENVIRONMENT_CONFIG[environment].distanceFactor;
    const pts = [
      new THREE.Vector3(0.12, 1.24, 0),
      new THREE.Vector3(0.65 + dist * 0.55, 1.72, -0.35),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: '#7FB2FF',
      transparent: true,
      opacity: 0.45,
    });
    return new THREE.Line(geo, mat);
  }, [environment]);

  useEffect(() => {
    return () => {
      earthLineObject.geometry.dispose();
      (earthLineObject.material as THREE.Material).dispose();
    };
  }, [earthLineObject]);

  useFrame((_, delta) => {
    if (reduceMotion) return;
    if (particlesRef.current && activeHazards.includes('radiation')) {
      particlesRef.current.rotation.y += delta * 0.18;
    }
    if (haloRef.current && activeHazards.includes('isolation')) {
      const s = 0.92 + Math.sin(performance.now() * 0.0018) * 0.06;
      haloRef.current.scale.set(s, s, s);
    }
    if (boundaryRef.current && activeHazards.includes('closed')) {
      boundaryRef.current.rotation.y -= delta * 0.08;
    }
  });

  const distFactor = ENVIRONMENT_CONFIG[environment].distanceFactor;

  return (
    <group>
      {/* Radiation: subtle drifting particles */}
      {activeHazards.includes('radiation') && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial color="#FFB547" size={0.022} transparent opacity={0.68} sizeAttenuation />
        </points>
      )}

      {/* Isolation: narrowing halo */}
      {activeHazards.includes('isolation') && (
        <mesh ref={haloRef} position={[0, 1.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.005, 8, 48]} />
          <meshBasicMaterial color="#FFB547" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Distance: stretched thin link line toward small Earth marker */}
      {activeHazards.includes('distance') && (
        <group>
          <primitive object={earthLineObject} />
          <mesh position={[0.65 + distFactor * 0.55, 1.72, -0.35]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color="#6CB6FF" emissive="#6CB6FF" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}

      {/* Closed environment: soft boundary shimmer */}
      {activeHazards.includes('closed') && (
        <mesh ref={boundaryRef} position={[0, 1.0, 0]}>
          <icosahedronGeometry args={[0.92, 1]} />
          <meshBasicMaterial color="#7FB2FF" wireframe transparent opacity={0.09} />
        </mesh>
      )}
    </group>
  );
}

// Camera Controller with smooth damping, auto-rotate stopping on interaction, fly-to region, and keyboard commands
function CameraRig({
  selectedRegion,
  cameraCommand,
  reduceMotion,
  isSoftwareGl,
}: {
  selectedRegion: BodyRegion | null;
  cameraCommand: CameraCommand | null;
  reduceMotion: boolean;
  isSoftwareGl: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { camera } = useThree();
  const userInteractedRef = useRef(false);
  const flyActiveRef = useRef(false);

  useEffect(() => {
    if (selectedRegion) {
      _targetVec.set(...selectedRegion.cameraTarget);
      _camGoal.set(...selectedRegion.cameraPos);
      flyActiveRef.current = true;
    }
  }, [selectedRegion]);

  useEffect(() => {
    if (!cameraCommand || !controlsRef.current) return;
    const ctrl = controlsRef.current;
    userInteractedRef.current = true;
    flyActiveRef.current = false;

    if (cameraCommand.type === 'reset') {
      _targetVec.set(0, 0.88, 0);
      _camGoal.set(0, 0.88, 2.85);
      flyActiveRef.current = true;
      return;
    }

    const offset = camera.position.clone().sub(ctrl.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    if (cameraCommand.type === 'rotateLeft') spherical.theta += 0.32;
    if (cameraCommand.type === 'rotateRight') spherical.theta -= 0.32;
    if (cameraCommand.type === 'rotateUp') spherical.phi = Math.max(0.45, spherical.phi - 0.18);
    if (cameraCommand.type === 'rotateDown') spherical.phi = Math.min(2.2, spherical.phi + 0.18);
    if (cameraCommand.type === 'zoomIn') spherical.radius = Math.max(1.05, spherical.radius - 0.3);
    if (cameraCommand.type === 'zoomOut') spherical.radius = Math.min(3.8, spherical.radius + 0.3);

    offset.setFromSpherical(spherical);
    camera.position.copy(ctrl.target).add(offset);
    ctrl.update();
  }, [cameraCommand, camera]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    if (flyActiveRef.current) {
      if (reduceMotion) {
        camera.position.copy(_camGoal);
        ctrl.target.copy(_targetVec);
        flyActiveRef.current = false;
      } else {
        const k = 1 - Math.exp(-5.5 * delta);
        camera.position.lerp(_camGoal, k);
        ctrl.target.lerp(_targetVec, k);
        if (camera.position.distanceTo(_camGoal) < 0.015) {
          flyActiveRef.current = false;
        }
      }
    }
    ctrl.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0, 0.88, 0]}
      enablePan={false}
      enableDamping={!isSoftwareGl && !reduceMotion}
      dampingFactor={0.07}
      minDistance={1.1}
      maxDistance={3.8}
      minPolarAngle={0.45}
      maxPolarAngle={2.25}
      autoRotate={!userInteractedRef.current && !selectedRegion && !reduceMotion && !isSoftwareGl}
      autoRotateSpeed={0.55}
      onStart={() => {
        userInteractedRef.current = true;
        flyActiveRef.current = false;
      }}
    />
  );
}

// Body Assembly with gentle microgravity float/weight-shift and invisible anatomical hotspots
function TwinAssembly(props: AnatomyScene3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gravityStrength = ENVIRONMENT_CONFIG[props.environment].gravityStrength;
  const gravityHazard = props.activeHazards.includes('gravity');

  useFrame(({ clock }) => {
    if (!groupRef.current || props.reduceMotion) return;
    const t = clock.getElapsedTime();
    // Subtle weight shift when Gravity lens is active or microgravity float
    const floatAmp = gravityStrength === 0 ? 0.018 : 0.006;
    const baseShiftY = gravityHazard ? -0.025 : 0;
    groupRef.current.position.y = baseShiftY + Math.sin(t * 1.1) * floatAmp;
  });

  return (
    <group ref={groupRef}>
      <EarthBaselineGhost />

      {props.layer === 'skeleton' && (
        <SkeletonLayer
          regions={props.regions}
          activeHazards={props.activeHazards}
          colorBlindSafe={props.colorBlindSafe}
        />
      )}
      {props.layer === 'organs' && (
        <OrgansLayer
          regions={props.regions}
          activeHazards={props.activeHazards}
          colorBlindSafe={props.colorBlindSafe}
        />
      )}
      {props.layer === 'muscles' && (
        <MusclesLayer
          regions={props.regions}
          activeHazards={props.activeHazards}
          colorBlindSafe={props.colorBlindSafe}
        />
      )}
      {props.layer === 'suit' && (
        <SuitLayer
          regions={props.regions}
          activeHazards={props.activeHazards}
          colorBlindSafe={props.colorBlindSafe}
        />
      )}

      {/* Invisible anatomically placed Hotspot meshes + subtle status beacon */}
      {props.regions.map((region) => {
        const isSelected = props.selectedRegionId === region.id;
        const isHovered = props.hoveredRegionId === region.id;
        const color = getStatusColor(region.status, props.colorBlindSafe);
        const showRing = region.status !== 'nominal' || isSelected || isHovered;

        return (
          <group key={region.id} position={region.hotspotPos}>
            {/* Invisible wider hit sphere */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                props.onSelectRegion(region.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
                props.onHoverRegion(region.id);
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
                props.onHoverRegion(null);
              }}
            >
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Calm status marker */}
            {showRing && (
              <mesh>
                <sphereGeometry args={[isSelected || isHovered ? 0.024 : 0.017, 12, 12]} />
                <meshBasicMaterial color={_tempColor.set(color)} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Floor calibration ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.38, 48]} />
        <meshBasicMaterial color="#7FB2FF" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export const AnatomyScene3D: React.FC<AnatomyScene3DProps> = (props) => {
  const selectedRegion =
    props.regions.find((r) => r.id === props.selectedRegionId) || null;

  return (
    <Canvas
      dpr={props.isSoftwareGl ? 1 : [1, 1.75]}
      camera={{ position: [0, 0.88, 2.85], fov: 40, near: 0.1, far: 30 }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      gl={{
        antialias: !props.isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: true,
      }}
      frameloop={props.reduceMotion ? 'demand' : 'always'}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#9EC5FF', '#141D2E', 0.75]} />
      <directionalLight position={[2.8, 3.6, 3.2]} intensity={1.35} color="#FFF3E0" />
      <directionalLight position={[-2.6, 1.8, -2.5]} intensity={0.75} color="#7FB2FF" />

      <TwinAssembly {...props} />
      <HazardEffects
        activeHazards={props.activeHazards}
        environment={props.environment}
        reduceMotion={props.reduceMotion}
      />
      <CameraRig
        selectedRegion={selectedRegion}
        cameraCommand={props.cameraCommand}
        reduceMotion={props.reduceMotion}
        isSoftwareGl={props.isSoftwareGl}
      />
    </Canvas>
  );
};
