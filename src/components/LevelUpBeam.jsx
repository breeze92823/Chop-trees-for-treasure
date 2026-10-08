import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, DoubleSide } from 'three'
import { usePlayerData } from '../store/usePlayerData.js'
import { player } from '../systems/playerState.js'

// Level-up light beam: a golden shaft drops from the sky onto the player, a shockwave ring
// spreads over the ground and sparks rise inside the shaft. Local player only; plays on any
// `level` rise (same trigger as components/LevelUpPopup.jsx).
const DURATION = 1.5 // s
const BEAM_HEIGHT = 90
const BEAM_RADIUS = 1.5
const SPARKS = 70
const CORE = '#fff6c4'
const GLOW = '#ffc933'

const beamVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// uv.y: 0 at the feet → 1 at the top. Bright base, long fade into the sky, drifting streaks.
const beamFrag = /* glsl */ `
  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float h = vUv.y;
    float fade = pow(1.0 - h, 1.6) * smoothstep(0.0, 0.015, h);
    float a = vUv.x * 6.2831853;
    float streak = 0.75 + 0.25 * sin(a * 7.0 + uTime * 3.0 + h * 12.0) * sin(a * 3.0 - uTime * 2.0 - h * 5.0);
    float pulse = 0.9 + 0.1 * sin(uTime * 14.0 - h * 30.0);
    gl_FragColor = vec4(uColor * (1.0 + (1.0 - h) * 0.8), fade * streak * pulse * uAlpha);
  }
`
const glowVert = beamVert
// Soft radial falloff for the ground glow / ring.
const discFrag = /* glsl */ `
  uniform float uAlpha;
  uniform vec3 uColor;
  uniform float uInner;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float edge = 1.0 - smoothstep(0.78, 1.0, r);
    float hole = smoothstep(uInner, uInner + 0.18, r);
    float ring = smoothstep(0.55, 0.9, r) * edge;
    float core = (1.0 - smoothstep(0.0, 0.9, r)) * 0.55;
    gl_FragColor = vec4(uColor, (ring * 0.9 + core) * hole * edge * uAlpha);
  }
`

const easeOut = (t) => 1 - (1 - t) * (1 - t)

export default function LevelUpBeam() {
  const root = useRef(null)
  const beam = useRef(null)
  const halo = useRef(null)
  const ring = useRef(null)
  const glow = useRef(null)
  const sparks = useRef(null)
  const t = useRef(-1) // seconds since trigger; <0 = idle

  const beamUniforms = useMemo(() => ({ uTime: { value: 0 }, uAlpha: { value: 0 }, uColor: { value: null } }), [])
  const haloUniforms = useMemo(() => ({ uTime: { value: 0 }, uAlpha: { value: 0 }, uColor: { value: null } }), [])
  const ringUniforms = useMemo(() => ({ uAlpha: { value: 0 }, uColor: { value: null }, uInner: { value: 0 } }), [])
  const glowUniforms = useMemo(() => ({ uAlpha: { value: 0 }, uColor: { value: null }, uInner: { value: 0 } }), [])

  // Per-spark seed: angle, radius, speed, phase.
  const seeds = useMemo(
    () =>
      Array.from({ length: SPARKS }, () => ({
        a: Math.random() * Math.PI * 2,
        r: Math.random() * BEAM_RADIUS * 0.9,
        v: 3 + Math.random() * 6,
        p: Math.random() * 3,
      })),
    [],
  )
  const sparkPos = useMemo(() => new Float32Array(SPARKS * 3), [])

  useEffect(() => {
    let last = usePlayerData.getState().level
    return usePlayerData.subscribe((s) => {
      if (s.level > last) t.current = 0
      last = s.level
    })
  }, [])

  useFrame((_, dt) => {
    const g = root.current
    if (!g) return
    if (t.current < 0) {
      g.visible = false
      return
    }
    t.current += Math.min(dt, 0.05)
    const k = t.current / DURATION
    if (k >= 1) {
      t.current = -1
      g.visible = false
      return
    }
    g.visible = true
    g.position.set(player.position.x, player.position.y + 0.04, player.position.z)

    // Envelope: quick flash in, hold, soft fade.
    const env = Math.min(1, t.current / 0.18) * (1 - Math.pow(Math.max(0, (k - 0.55) / 0.45), 2))
    const flare = 1 + Math.max(0, 1 - t.current / 0.35) * 0.9 // wide flash on impact
    const radius = BEAM_RADIUS * flare * (0.75 + 0.25 * easeOut(Math.min(1, t.current / 0.25)))

    beamUniforms.uTime.value = t.current
    beamUniforms.uAlpha.value = env * 0.95
    haloUniforms.uTime.value = t.current
    haloUniforms.uAlpha.value = env * 0.35
    beam.current.scale.set(radius, 1, radius)
    halo.current.scale.set(radius * 2.1, 1, radius * 2.1)

    // Shockwave ring expands and thins out; glow disc pulses under the feet.
    const rk = easeOut(Math.min(1, t.current / 0.7))
    ring.current.scale.setScalar(1 + rk * 7)
    ringUniforms.uAlpha.value = (1 - rk) * Math.min(1, t.current / 0.1)
    ringUniforms.uInner.value = 0.55 + rk * 0.35
    glow.current.scale.setScalar(3.2 + Math.sin(t.current * 10) * 0.15)
    glowUniforms.uAlpha.value = env * 0.9

    // Sparks drift up the shaft, wrapping, wrapping at the top.
    for (let i = 0; i < SPARKS; i++) {
      const s = seeds[i]
      const y = (s.p * 2 + t.current * s.v) % 14
      const w = s.a + t.current * 1.2
      const rr = s.r * (1 + y * 0.03)
      sparkPos[i * 3] = Math.cos(w) * rr
      sparkPos[i * 3 + 1] = y
      sparkPos[i * 3 + 2] = Math.sin(w) * rr
    }
    sparks.current.geometry.attributes.position.needsUpdate = true
    sparks.current.material.opacity = env
  })

  return (
    <group ref={root} visible={false} frustumCulled={false}>
      {/* inner bright shaft */}
      <mesh ref={beam} position={[0, BEAM_HEIGHT / 2, 0]} frustumCulled={false} renderOrder={10}>
        <cylinderGeometry args={[1, 1, BEAM_HEIGHT, 32, 1, true]} />
        <shaderMaterial
          vertexShader={beamVert}
          fragmentShader={beamFrag}
          uniforms={{ ...beamUniforms, uColor: { value: new Color(CORE) } }}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
      {/* wider soft golden halo */}
      <mesh ref={halo} position={[0, BEAM_HEIGHT / 2, 0]} frustumCulled={false} renderOrder={9}>
        <cylinderGeometry args={[1, 1, BEAM_HEIGHT, 32, 1, true]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={beamFrag}
          uniforms={{ ...haloUniforms, uColor: { value: new Color(GLOW) } }}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
      {/* ground glow */}
      <mesh ref={glow} rotation-x={-Math.PI / 2} frustumCulled={false} renderOrder={8}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={discFrag}
          uniforms={{ ...glowUniforms, uColor: { value: new Color(GLOW) } }}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      {/* shockwave ring */}
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} frustumCulled={false} renderOrder={8}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={discFrag}
          uniforms={{ ...ringUniforms, uColor: { value: new Color(CORE) } }}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      {/* rising sparks */}
      <points ref={sparks} frustumCulled={false} renderOrder={11}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={sparkPos} count={SPARKS} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          color={CORE}
          size={0.28}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
