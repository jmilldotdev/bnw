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

mat2 rot2(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
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

  float sphereFreq = 6.0 + randSeed(8.0) * 11.0;
  float sphereSpin = (randSeed(9.0) - 0.5) * 2.0;

  float shapeTempo = 0.6 + uSpeed * 0.95 + abs(uSpin) * 0.45;
  float tt = t * shapeTempo + randSeed(12.0) * 6.2831853;

  vec2 offset = vec2(randSeed(10.0) - 0.5, randSeed(11.0) - 0.5);
  vec2 baseCenter = vec2(offset.x * 0.24 * aspect, -0.04 + offset.y * 0.18);
  vec2 centerDrift = vec2(
    sin(tt * 0.43 + randSeed(13.0) * 6.2831853),
    cos(tt * 0.37 + randSeed(14.0) * 6.2831853)
  ) * vec2(0.11 * aspect, 0.09) * (0.45 + 0.55 * (uWarp / 4.0));
  vec2 center = baseCenter + centerDrift;

  float pulse = 1.0 + 0.20 * sin(tt * 0.71) + 0.08 * cos(tt * 1.17 + fBase.w);
  float size = (0.41 + 0.05 * sin(tt * 0.59 + randSeed(15.0) * 6.2831853)) * pulse;
  float faceTilt = 0.14 + 0.08 * sin(tt * 0.92 + randSeed(16.0) * 6.2831853);
  float roofLift = 0.20 + 0.06 * cos(tt * 1.08 + randSeed(17.0) * 6.2831853);
  float sideInset = 0.14 + 0.06 * sin(tt * 0.84 + randSeed(18.0) * 6.2831853);
  float sideDrop = 0.18 + 0.07 * cos(tt * 0.73 + randSeed(19.0) * 6.2831853);
  float cubeSpin = (uSpin * 0.62 + (randSeed(20.0) - 0.5) * 0.7) * sin(tt * 0.51);

  vec4 front = vec4(
    center.x - size * 0.58,
    center.y + size * 0.03,
    center.x + size * 0.56,
    center.y + size * 1.10
  );

  vec2 topA = vec2(front.x, front.y);
  vec2 topB = vec2(front.z, front.y);
  vec2 topC = vec2(front.z - size * sideInset, front.y - size * roofLift);
  vec2 topD = vec2(front.x + size * faceTilt, front.y - size * roofLift);

  vec2 sideA = vec2(front.z, front.y);
  vec2 sideB = vec2(front.z, front.w);
  vec2 sideC = vec2(front.z - size * sideInset, front.w - size * sideDrop);
  vec2 sideD = vec2(front.z - size * sideInset * 1.12, front.y - size * roofLift);

  vec4 topRect = vec4(
    min(min(topA.x, topB.x), min(topC.x, topD.x)),
    min(min(topA.y, topB.y), min(topC.y, topD.y)),
    max(max(topA.x, topB.x), max(topC.x, topD.x)),
    max(max(topA.y, topB.y), max(topC.y, topD.y))
  );

  vec4 sideRect = vec4(
    min(min(sideA.x, sideB.x), min(sideC.x, sideD.x)),
    min(min(sideA.y, sideB.y), min(sideC.y, sideD.y)),
    max(max(sideA.x, sideB.x), max(sideC.x, sideD.x)),
    max(max(sideA.y, sideB.y), max(sideC.y, sideD.y))
  );

  float bgField = labyrinth(p, t, fBase, kBase);
  float fieldValue = bgField;

  bool inFront = p.x >= front.x && p.x <= front.z && p.y >= front.y && p.y <= front.w;
  bool inTop = pointInQuad(p, topA, topB, topC, topD);
  bool inSide = pointInQuad(p, sideA, sideB, sideC, sideD);
  float aliasBlend = 0.35 + 0.22 * sin(tt * 0.48 + randSeed(21.0) * 6.2831853);

  if (inFront) {
    vec2 uv = mapToRect(p, front);
    vec2 q = vec2((uv.x * 2.0 - 1.0) * 1.3, (uv.y * 2.0 - 1.0) * 1.3);
    q = rot2(cubeSpin * 0.7) * q;
    float shapeField = labyrinth(
      q,
      t * 0.95 + 1.6,
      fBase,
      vec3(kBase.x * 1.1, kBase.y * 0.9, kBase.z)
    );
    float alias = sin(
      (bgField * 20.0) + (q.x * 13.0 - q.y * 10.0) + tt * 2.6 + fBase.w
    );
    fieldValue = mix(bgField, shapeField + alias * aliasBlend, 0.88);
  } else if (inTop) {
    vec2 uv = mapToRect(p, topRect);
    vec2 q = vec2((uv.x * 2.0 - 1.0) * 1.6, (uv.y * 2.0 - 1.0) * 1.1);
    q = rot2(cubeSpin * 1.18 + 0.31) * q;
    float shapeField = labyrinth(
      q,
      t + 2.1,
      fBase,
      vec3(kBase.x * 1.22, kBase.y * 1.07, kBase.z)
    );
    float alias = sin(
      (bgField * 17.0) + (q.x * 10.0 + q.y * 12.0) - tt * 2.1
    );
    fieldValue = mix(bgField, shapeField + alias * aliasBlend * 0.8, 0.84);
  } else if (inSide) {
    vec2 uv = mapToRect(p, sideRect);
    vec2 q = vec2((uv.x * 2.0 - 1.0) * 1.2, (uv.y * 2.0 - 1.0) * 1.6);
    q = rot2(cubeSpin * 0.92 - 0.27) * q;
    float shapeField = labyrinth(
      q,
      t + 3.1,
      fBase,
      vec3(kBase.x * 0.83, kBase.y * 1.16, kBase.z)
    );
    float alias = sin(
      (bgField * 18.5) + (-q.x * 11.0 + q.y * 9.0) + tt * 1.9
    );
    fieldValue = mix(bgField, shapeField + alias * aliasBlend * 0.76, 0.84);
  }

  vec2 sphereOrbit = vec2(
    cos(tt * 0.83 + fBase.w),
    sin(tt * 0.71 + fBase.w * 0.7)
  ) * size * 0.11;
  vec2 sphereCenter = vec2(center.x + size * 0.02, front.y - size * 0.30) + sphereOrbit;
  float sphereR =
    size * (0.26 + 0.08 * (0.5 + 0.5 * sin(tt * 1.03 + randSeed(22.0) * 6.2831853)));
  vec2 d = p - sphereCenter;
  float rr = dot(d, d);

  if (rr <= sphereR * sphereR) {
    vec2 nxy = d / sphereR;
    float nz = sqrt(max(0.0, 1.0 - dot(nxy, nxy)));
    float lon = atan(nxy.y, nxy.x) + t * (sphereSpin + uSpin * 0.6);
    float lat = acos(clamp(nz, -1.0, 1.0));
    vec2 su = vec2((lon / 3.14159265) * 0.9, (lat / 3.14159265) * 2.0 - 1.0);
    float shade = 0.55 + nz * 0.45;
    float shapeField = labyrinth(
      su,
      t + 5.2,
      fBase,
      vec3(sphereFreq, sphereFreq * 0.82, kBase.z)
    ) * shade;
    float alias = sin((bgField * 21.0) + (su.x * 15.0 + su.y * 12.0) - tt * 2.8);
    fieldValue = mix(bgField, shapeField + alias * aliasBlend, 0.92);
  } else {
    float sphereEdge = abs(length(d) - sphereR);
    if (sphereEdge < 0.045) {
      float edgeAlias = sin(
        (sphereEdge * 240.0) + (bgField * 16.0) - tt * 4.2
      );
      fieldValue += edgeAlias * (0.14 + 0.11 * aliasBlend);
    }
  }

  float frontEdge = min(
    min(abs(p.x - front.x), abs(p.x - front.z)),
    min(abs(p.y - front.y), abs(p.y - front.w))
  );
  if (frontEdge < 0.032 && !inFront) {
    float edgePhase = sin((frontEdge * 260.0) - tt * 3.8 + bgField * 12.0);
    fieldValue += edgePhase * 0.12;
  }

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
