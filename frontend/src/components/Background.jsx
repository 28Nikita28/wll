import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Float } from '@react-three/drei'

const Background = () => (
  <Canvas className="canvas">
    <ambientLight intensity={0.3} />
    <pointLight position={[5, 5, 5]} intensity={1.5} />
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
  <mesh>
    <sphereGeometry args={[1, 64, 64]} />
    <meshStandardMaterial color="#8b5cf6" emissive="#6366f1" />
  </mesh>
</Float>

    <Stars 
      radius={150}
      depth={70}
      count={1000}
      factor={3}
      saturation={0}
      fade
      speed={1}
    />
    <OrbitControls 
      enableZoom={false}
      autoRotate
      autoRotateSpeed={0.5}
    />
  </Canvas>
)

export default Background