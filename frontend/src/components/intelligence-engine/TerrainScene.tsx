"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function TerrainMesh() {
  const group = useRef<THREE.Group>(null);

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(34, 34, 78, 78);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y =
        Math.sin(x * 0.26) * Math.cos(z * 0.23) * 0.9 +
        Math.sin(x * 0.085 + z * 0.13) * 1.35 +
        Math.cos(z * 0.42 + 1.4) * 0.22 +
        Math.sin((x + z) * 0.55) * 0.07;
      pos.setY(i, y);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  const baseY = useMemo(
    () => Float32Array.from((geom.attributes.position.array as Float32Array).filter((_, i) => i % 3 === 1)),
    [geom]
  );

  useFrame(({ clock, pointer }) => {
    // gentle breathing ripple
    const t = clock.elapsedTime;
    const arr = geom.attributes.position.array as Float32Array;
    let vi = 0;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const z = arr[i + 2];
      arr[i + 1] = baseY[vi++] + Math.sin(t * 0.45 + x * 0.38 + z * 0.31) * 0.11;
    }
    geom.attributes.position.needsUpdate = true;

    // pointer tilt
    if (group.current) {
      group.current.rotation.y += (pointer.x * 0.14 - group.current.rotation.y) * 0.03;
      group.current.rotation.x += (-0.02 - pointer.y * 0.05 - group.current.rotation.x) * 0.03;
    }
  });

  return (
    <group ref={group} position={[0, -1.4, 0]}>
      <mesh geometry={geom}>
        <meshBasicMaterial
          wireframe
          color="#3E8C6E"
          transparent
          opacity={0.24}
        />
      </mesh>
      {/* scattered settlement lights */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                Array.from({ length: 60 }, (_, i) => {
                  const r1 = Math.sin(i * 127.1) * 43758.5453;
                  const r2 = Math.sin(i * 311.7) * 43758.5453;
                  const fx = r1 - Math.floor(r1);
                  const fy = r2 - Math.floor(r2);
                  const gx = (fx - 0.5) * 26;
                  const gz = (fy - 0.5) * 26;
                  const gy =
                    Math.sin(gx * 0.26) * Math.cos(gz * 0.23) * 0.9 +
                    Math.sin(gx * 0.085 + gz * 0.13) * 1.35 +
                    0.35;
                  return [gx, gy, gz];
                }).flat()
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#E3B75B" transparent opacity={0.75} sizeAttenuation />
      </points>
    </group>
  );
}

/** Wireframe economic terrain — mounted only near viewport; static on mobile. */
export default function TerrainScene({ active }: { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 4.4, 9.5], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <fog attach="fog" args={["#06231A", 11, 27]} />
      <TerrainMesh />
    </Canvas>
  );
}
