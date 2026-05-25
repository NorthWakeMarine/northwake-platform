"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// --- GLSL Simplex 3D Noise (Ashima Arts) ---
const simplexNoiseGLSL = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 10.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857; // 1.0/7.0
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// --- Poisson Disk Sampling helper ---
function poissonDiskSampling(width: number, height: number, minDistance: number, maxTries: number = 20) {
  const cellSize = minDistance / Math.sqrt(2);
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid: (number[] | null)[] = Array(gridWidth * gridHeight).fill(null);

  const activeList: number[][] = [];
  const points: number[][] = [];

  function getGridIndex(x: number, y: number) {
    return Math.floor(x / cellSize) + Math.floor(y / cellSize) * gridWidth;
  }

  function isValid(x: number, y: number) {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    for (let i = Math.max(0, col - 2); i <= Math.min(gridWidth - 1, col + 2); i++) {
      for (let j = Math.max(0, row - 2); j <= Math.min(gridHeight - 1, row + 2); j++) {
        const pt = grid[i + j * gridWidth];
        if (pt) {
          const dx = pt[0] - x;
          const dy = pt[1] - y;
          if (dx * dx + dy * dy < minDistance * minDistance) return false;
        }
      }
    }
    return true;
  }

  const startPt = [width / 2, height / 2];
  points.push(startPt);
  activeList.push(startPt);
  grid[getGridIndex(startPt[0], startPt[1])] = startPt;

  while (activeList.length > 0) {
    const idx = Math.floor(Math.random() * activeList.length);
    const pt = activeList[idx];
    let found = false;

    for (let i = 0; i < maxTries; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = minDistance + Math.random() * minDistance;
      const x = pt[0] + Math.cos(angle) * r;
      const y = pt[1] + Math.sin(angle) * r;

      if (isValid(x, y)) {
        const newPt = [x, y];
        points.push(newPt);
        activeList.push(newPt);
        grid[getGridIndex(x, y)] = newPt;
        found = true;
        break;
      }
    }

    if (!found) {
      activeList.splice(idx, 1);
    }
  }

  return points;
}

export interface AntigravityBackgroundProps {
  color1?: string; // Signature Blue
  color2?: string; // Signature Red/Pink
  color3?: string; // Signature Yellow/Orange
}

export default function AntigravityBackground({
  color1 = "#000080",
  color2 = "#686a6c",
  color3 = "#a8aaac",
}: AntigravityBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.offsetWidth || window.innerWidth;
    const height = container.offsetHeight || window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    // --- 1. Three.js Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 3.1;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
      stencil: false,
      precision: "highp",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    container.appendChild(renderer.domElement);

    // Ring parked permanently off-screen (no cursor interaction)
    const ringPos = new THREE.Vector2(10, 10);

    // --- 3. Generate Points ---
    const size = 128;
    const count = size * size;
    // Map density to Poisson Disk Sampling distance
    const densityVal = 200; // default density option
    const minDistance = (densityVal - 0) * (2 - 10) / (300 - 0) + 10; // ~4.667
    const generatedPoints = poissonDiskSampling(500, 500, minDistance, 20);

    // Center and Normalize to [-1, 1]
    const pointsData: number[] = [];
    for (let i = 0; i < count; i++) {
      if (i < generatedPoints.length) {
        const pt = generatedPoints[i];
        pointsData.push((pt[0] - 250) / 250, (pt[1] - 250) / 250);
      } else {
        // Fallback for remaining slots if Poisson sampling generated fewer points
        pointsData.push((Math.random() * 500 - 250) / 250, (Math.random() * 500 - 250) / 250);
      }
    }

    // Initialize Float32Array for position texture
    // channels: r = x, g = y, b = scale (0), a = velocity (0)
    const initialPositions = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const idx = i * 4;
      initialPositions[idx + 0] = pointsData[i * 2 + 0];
      initialPositions[idx + 1] = pointsData[i * 2 + 1];
      initialPositions[idx + 2] = 0;
      initialPositions[idx + 3] = 0;
    }

    const posTex = new THREE.DataTexture(
      initialPositions,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    posTex.needsUpdate = true;

    // --- 4. WebGL Render Targets for simulation ---
    const rtOptions = {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    let rt1 = new THREE.WebGLRenderTarget(size, size, rtOptions);
    let rt2 = new THREE.WebGLRenderTarget(size, size, rtOptions);

    // Pre-clear render targets
    renderer.setRenderTarget(rt1);
    renderer.setClearColor(0, 0);
    renderer.clear();
    renderer.setRenderTarget(rt2);
    renderer.setClearColor(0, 0);
    renderer.clear();
    renderer.setRenderTarget(null);

    // --- 5. Simulation Scene & Material ---
    const simScene = new THREE.Scene();
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPosition: { value: posTex },
        uPosRefs: { value: posTex },
        uRingPos: { value: ringPos },
        uRingRadius: { value: 0.2 },
        uDeltaTime: { value: 0 },
        uRingWidth: { value: 0.107 },
        uRingWidth2: { value: 0.05 },
        uRingDisplacement: { value: 0.05 },
        uTime: { value: 0 },
      },
      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform sampler2D uPosition;
        uniform sampler2D uPosRefs;
        uniform vec2 uRingPos;
        uniform float uTime;
        uniform float uDeltaTime;
        uniform float uRingRadius;
        uniform float uRingWidth;
        uniform float uRingWidth2;
        uniform float uRingDisplacement;

        ${simplexNoiseGLSL}

        void main() {
          vec2 simTexCoords = gl_FragCoord.xy / ${size}.0;
          vec4 pFrame = texture2D(uPosition, simTexCoords);

          float scale = pFrame.z;
          float velocity = pFrame.w;
          vec2 refPos = texture2D(uPosRefs, simTexCoords).xy;

          float time = uTime * 0.12;
          vec2 curentPos = refPos;

          vec2 pos = pFrame.xy;
          pos *= 0.8;

          float dist = distance(curentPos.xy, uRingPos);
          float noise0 = snoise(vec3(curentPos.xy * 0.2 + vec2(18.4924, 72.9744), time * 0.5));
          float dist1 = distance(curentPos.xy + (noise0 * 0.005), uRingPos);

          float t = smoothstep(uRingRadius - (uRingWidth * 2.0), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth, dist1);
          float t2 = smoothstep(uRingRadius - (uRingWidth2 * 2.0), uRingRadius, dist) - smoothstep(uRingRadius, uRingRadius + uRingWidth2, dist1);
          float t3 = smoothstep(uRingRadius + uRingWidth2, uRingRadius, dist);

          t = pow(t, 2.0);
          t2 = pow(t2, 3.0);

          t += t2 * 2.5;
          t += t3 * 0.3;
          t += snoise(vec3(curentPos.xy * 30.0 + vec2(11.4924, 12.9744), time * 0.5)) * t3 * 0.4;

          float nS = snoise(vec3(curentPos.xy * 2.0 + vec2(18.4924, 72.9744), time * 0.5));
          t += pow((nS + 1.5) * 0.5, 2.0) * 0.75;

          float noise1 = snoise(vec3(curentPos.xy * 4.0 + vec2(88.494, 32.4397), time * 0.2));
          float noise2 = snoise(vec3(curentPos.xy * 4.0 + vec2(50.904, 120.947), time * 0.2));

          float noise3 = snoise(vec3(curentPos.xy * 20.0 + vec2(18.4924, 72.9744), time * 0.3));
          float noise4 = snoise(vec3(curentPos.xy * 20.0 + vec2(50.904, 120.947), time * 0.3));

          vec2 disp = vec2(noise1, noise2) * 0.012;
          disp += vec2(noise3, noise4) * 0.002;

          disp.x += sin((refPos.x * 20.0) + (time * 1.5)) * 0.006 * clamp(dist, 0.0, 1.0);
          disp.y += cos((refPos.y * 20.0) + (time * 1.2)) * 0.006 * clamp(dist, 0.0, 1.0);

          pos -= (uRingPos - (curentPos + disp)) * pow(t2, 0.75) * uRingDisplacement;

          float scaleDiff = t - scale;
          scaleDiff *= 0.2;
          scale += scaleDiff;

          vec2 finalPos = curentPos + disp + (pos * 0.25);

          velocity *= 0.5;
          velocity += scale * 0.25;

          gl_FragColor = vec4(finalPos, scale, velocity);
        }
      `,
    });

    const simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
    simScene.add(simMesh);

    // --- 6. Render Scene & Material ---
    const renderGeometry = new THREE.BufferGeometry();
    const uvs = new Float32Array(count * 2);
    const seeds = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      const u = (i % size) / size;
      const v = Math.floor(i / size) / size;
      uvs[i * 2 + 0] = u;
      uvs[i * 2 + 1] = v;

      seeds[i * 4 + 0] = Math.random();
      seeds[i * 4 + 1] = Math.random();
      seeds[i * 4 + 2] = Math.random();
      seeds[i * 4 + 3] = Math.random();
    }

    const dummyPositions = new Float32Array(count * 3);
    renderGeometry.setAttribute("position", new THREE.BufferAttribute(dummyPositions, 3));
    renderGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    renderGeometry.setAttribute("seeds", new THREE.BufferAttribute(seeds, 4));

    const particlesScale = 1.0;
    const dynamicParticleScale = (width / pixelRatio / 2000.0) * particlesScale;

    const renderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPosition: { value: posTex },
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(color1) },
        uColor2: { value: new THREE.Color(color2) },
        uColor3: { value: new THREE.Color(color3) },
        uAlpha: { value: 1.0 },
        uRingPos: { value: ringPos },
        uRez: { value: new THREE.Vector2(width, height) },
        uParticleScale: { value: dynamicParticleScale },
        uPixelRatio: { value: pixelRatio },
        uColorScheme: { value: 1 }, // 1 = light mode, 0 = dark mode
      },
      vertexShader: `
        precision highp float;
        attribute vec4 seeds;

        uniform sampler2D uPosition;
        uniform float uTime;
        uniform float uParticleScale;
        uniform float uPixelRatio;

        varying vec4 vSeeds;
        varying float vVelocity;
        varying vec2 vLocalPos;
        varying vec2 vScreenPos;
        varying float vScale;

        void main() {
          vec4 pos = texture2D(uPosition, uv);
          vSeeds = seeds;
          vVelocity = pos.w;
          vScale = pos.z;
          vLocalPos = pos.xy;

          vec4 viewSpace = modelViewMatrix * vec4(vec3(pos.xy, 0.0), 1.0);
          gl_Position = projectionMatrix * viewSpace;
          vScreenPos = gl_Position.xy;

          gl_PointSize = (vScale * 4.5) * (uPixelRatio * 0.5) * uParticleScale;
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec4 vSeeds;
        varying vec2 vScreenPos;
        varying vec2 vLocalPos;
        varying float vScale;
        varying float vVelocity;

        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;

        uniform vec2 uRingPos;
        uniform vec2 uRez;

        uniform float uAlpha;
        uniform float uTime;
        uniform int uColorScheme;

        ${simplexNoiseGLSL}

        #define PI 3.14159265358979323846

        float sdRoundBox(in vec2 p, in vec2 b, in vec4 r) {
          r.xy = (p.x > 0.0) ? r.xy : r.zw;
          r.x  = (p.y > 0.0) ? r.x  : r.y;
          vec2 q = abs(p) - b + r.x;
          return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
        }

        vec2 rotate(vec2 v, float a) {
          float s = sin(a);
          float c = cos(a);
          mat2 m = mat2(c, s, -s, c);
          return m * v;
        }

        void main() {
          float uBorderSize = 0.2;
          float ratio = uRez.x / uRez.y;

          float noiseAngle = snoise(vec3(vLocalPos * 10.0 + vec2(18.4924, 72.9744), uTime * 0.85));
          float noiseColor = snoise(vec3(vLocalPos * 2.0 + vec2(74.664, 91.556), uTime * 0.5));
          noiseColor = (noiseColor + 1.0) * 0.5;

          float angle = atan(vLocalPos.y - uRingPos.y, vLocalPos.x - uRingPos.x);

          vec2 uv = gl_PointCoord.xy;
          uv -= vec2(0.5);
          uv.y *= -1.0;
          uv = rotate(uv, -angle + (noiseAngle * 0.5));

          float h = 0.8;
          float progress = smoothstep(0.0, 0.75, pow(noiseColor, 2.0));
          vec3 col = mix(mix(uColor1, uColor2, progress / h), mix(uColor2, uColor3, (progress - h) / (1.0 - h)), step(h, progress));

          float rounded = sdRoundBox(uv, vec2(0.5, 0.2), vec4(0.25));
          rounded = smoothstep(0.1, 0.0, rounded);

          // Radial falloff: fade out particles far from center
          float centerDist = length(vLocalPos);
          float radialFade = smoothstep(0.8, 0.4, centerDist);

          float a = uAlpha * rounded * smoothstep(0.1, 0.2, vScale) * radialFade;
          if (a < 0.01) {
            discard;
          }

          vec3 finalColor = clamp(col, 0.0, 1.0);
          finalColor = mix(finalColor, finalColor * clamp(vVelocity, 0.0, 1.0), float(uColorScheme));

          gl_FragColor = vec4(finalColor, clamp(a, 0.0, 1.0));
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });

    const particlesMesh = new THREE.Points(renderGeometry, renderMaterial);
    // Position/scale values copied from the original Three.js implementation
    particlesMesh.position.set(0, 0, 0);
    particlesMesh.scale.set(5, 5, 5);
    scene.add(particlesMesh);

    // --- 7. Event & Mouse Handlers ---
    const handleResize = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderMaterial.uniforms.uRez.value.set(w, h);
      renderMaterial.uniforms.uParticleScale.value = (w / pixelRatio / 2000.0) * particlesScale;
      renderMaterial.needsUpdate = true;
    };
    window.addEventListener("resize", handleResize);

    // --- 8. Animation loop ---
    let lastTime = 0;
    let everRendered = false;
    let animationFrameId: number;

    const clock = new THREE.Clock();

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);

      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - lastTime;
      lastTime = elapsedTime;

      // Update simulation uniforms (ring parked off-screen, ambient only)
      simMaterial.uniforms.uPosition.value = everRendered ? rt1.texture : posTex;
      simMaterial.uniforms.uTime.value = elapsedTime;
      simMaterial.uniforms.uDeltaTime.value = deltaTime;
      simMaterial.uniforms.uRingPos.value = ringPos;
      simMaterial.uniforms.uRingRadius.value = 0.12;

      // Step simulation: render to rt2
      renderer.setRenderTarget(rt2);
      renderer.render(simScene, simCamera);
      renderer.setRenderTarget(null);

      // Render actual particles to screen
      renderMaterial.uniforms.uPosition.value = everRendered ? rt2.texture : posTex;
      renderMaterial.uniforms.uTime.value = elapsedTime;
      renderMaterial.uniforms.uRingPos.value = ringPos;

      renderer.render(scene, camera);

      // Swap buffers for next frame simulation
      const temp = rt1;
      rt1 = rt2;
      rt2 = temp;
      everRendered = true;
    };

    animationFrameId = requestAnimationFrame(tick);

    // --- 9. Clean up resources ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);

      particlesMesh.geometry.dispose();
      renderMaterial.dispose();
      simMesh.geometry.dispose();
      simMaterial.dispose();
      rt1.dispose();
      rt2.dispose();
      posTex.dispose();

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [color1, color2, color3]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
