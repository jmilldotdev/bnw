import * as THREE from "three";

function fragmentShader() {
  return `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSeed;
uniform float uAnimate;
uniform float uSpeed;
uniform float uDensity;
uniform float uWarp;
uniform float uSpin;
uniform float uGrain;

varying vec2 vUv;

float hash11(float x) {
  return fract(sin(x * 127.1 + 311.7) * 43758.5453123);
}

float randSeed(float n) {
  return hash11(uSeed * 0.00013 + n * 1.6180339887);
}

float labyrinth(vec2 p, float t, vec4 f, vec3 k) {
  float qx = p.x + sin(p.y * f.y + t * 0.61 + f.w) * (0.35 * uWarp * f.z);
  float qy = p.y + cos(p.x * f.x - t * 0.43 + f.w) * (0.35 * uWarp * (0.6 + f.z));

  float a = sin(qx * k.x * uDensity + t * 0.34);
  float b = cos(qy * k.y * uDensity - t * 0.28);
  float c = sin((qx + qy) * k.z + t * 0.19);
  return sin((a + b + c) * 3.4 + f.w);
}

float sign2d(vec2 a, vec2 b, vec2 p) {
  return (p.x - a.x) * (b.y - a.y) - (b.x - a.x) * (p.y - a.y);
}

bool pointInQuad(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  float s1 = sign2d(a, b, p);
  float s2 = sign2d(b, c, p);
  float s3 = sign2d(c, d, p);
  float s4 = sign2d(d, a, p);
  bool hasNeg = (s1 < 0.0) || (s2 < 0.0) || (s3 < 0.0) || (s4 < 0.0);
  bool hasPos = (s1 > 0.0) || (s2 > 0.0) || (s3 > 0.0) || (s4 > 0.0);
  return !(hasNeg && hasPos);
}

vec2 mapToRect(vec2 p, vec4 r) {
  vec2 d = max(vec2(1e-4), r.zw - r.xy);
  vec2 uv = (p - r.xy) / d;
  return clamp(uv, 0.0, 1.0);
}

void main() {
  float t = uAnimate > 0.5 ? (uTime * uSpeed) : 0.0;

  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= aspect;

  vec4 fBase = vec4(
    4.0 + randSeed(1.0) * 6.0,
    2.0 + randSeed(2.0) * 5.0,
    0.35 + randSeed(3.0) * 1.25,
    randSeed(4.0) * 6.2831853
  );

  vec3 kBase = vec3(
    4.0 + randSeed(5.0) * 10.0,
    4.0 + randSeed(6.0) * 10.0,
    2.0 + randSeed(7.0) * 5.0
  );

  float fieldValue = labyrinth(p, t, fBase, kBase);

  if (uGrain > 0.0) {
    float g = hash11((gl_FragCoord.x + gl_FragCoord.y * 131.0) * 0.013 + uSeed + floor(uTime * 60.0));
    fieldValue += (g - 0.5) * uGrain;
  }

  float bw = step(0.0, fieldValue);
  vec3 color = mix(vec3(1.0), vec3(0.0), bw);
  gl_FragColor = vec4(color, 1.0);
}
`;
}

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export function mountWebglArt(canvas, config) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  const uniforms = {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uSeed: { value: config.seed },
    uAnimate: { value: config.animate ? 1 : 0 },
    uSpeed: { value: config.speed },
    uDensity: { value: config.density },
    uWarp: { value: config.warp },
    uSpin: { value: config.spin },
    uGrain: { value: config.grain },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: fragmentShader(),
    depthWrite: false,
    depthTest: false,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let raf = 0;
  let running = false;
  const clock = new THREE.Clock();

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.floor(window.innerWidth));
    const height = Math.max(1, Math.floor(window.innerHeight));
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    uniforms.uResolution.value.set(width * dpr, height * dpr);
  }

  function renderNow() {
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  }

  function frame() {
    if (!running) return;
    renderNow();
    raf = window.requestAnimationFrame(frame);
  }

  function syncConfig(nextConfig) {
    uniforms.uSeed.value = nextConfig.seed;
    uniforms.uAnimate.value = nextConfig.animate ? 1 : 0;
    uniforms.uSpeed.value = nextConfig.speed;
    uniforms.uDensity.value = nextConfig.density;
    uniforms.uWarp.value = nextConfig.warp;
    uniforms.uSpin.value = nextConfig.spin;
    uniforms.uGrain.value = nextConfig.grain;
  }

  function setAnimating(nextAnimate) {
    if (nextAnimate && !running) {
      running = true;
      clock.start();
      frame();
      return;
    }
    if (!nextAnimate && running) {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      renderNow();
    }
  }

  resize();
  window.addEventListener("resize", resize);
  syncConfig(config);
  setAnimating(config.animate);
  if (!config.animate) renderNow();

  return {
    update(nextConfig) {
      syncConfig(nextConfig);
      setAnimating(nextConfig.animate);
      if (!nextConfig.animate) {
        renderNow();
      }
    },
    destroy() {
      running = false;
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
