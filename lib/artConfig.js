function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readNumberParam(params, name, fallback, min, max) {
  const raw = params.get(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
}

function readBoolParam(params, name, fallback = false) {
  const raw = (params.get(name) || "").toLowerCase().trim();
  if (!raw) return fallback;
  if (raw === "1" || raw === "true" || raw === "yes" || raw === "on") return true;
  if (raw === "0" || raw === "false" || raw === "no" || raw === "off") return false;
  return fallback;
}

function readSeedParam(params, fallback = 42) {
  const raw = (params.get("seed") || "").trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return (Math.floor(Math.abs(parsed)) >>> 0) || fallback;
}

export const ART_LIMITS = {
  seed: { min: 1, max: 999999, step: 1 },
  speed: { min: 0, max: 4, step: 0.01 },
  density: { min: 0.25, max: 2.25, step: 0.01 },
  warp: { min: 0, max: 4, step: 0.01 },
  spin: { min: -2, max: 2, step: 0.01 },
  grain: { min: 0, max: 0.65, step: 0.01 },
};

export function toSearchParams(input) {
  if (typeof input === "string") return new URLSearchParams(input);
  if (input instanceof URLSearchParams) return input;
  if (input && typeof input.get === "function") {
    return new URLSearchParams(input.toString());
  }
  return new URLSearchParams();
}

export function readArtConfigFromParams(input) {
  const params = toSearchParams(input);
  const seed = readSeedParam(params, 42);

  return {
    seed,
    animate: readBoolParam(params, "animate", true),
    speed: readNumberParam(
      params,
      "speed",
      0.55,
      ART_LIMITS.speed.min,
      ART_LIMITS.speed.max
    ),
    density: readNumberParam(
      params,
      "density",
      1.0,
      ART_LIMITS.density.min,
      ART_LIMITS.density.max
    ),
    warp: readNumberParam(params, "warp", 1.0, ART_LIMITS.warp.min, ART_LIMITS.warp.max),
    spin: readNumberParam(params, "spin", 0.0, ART_LIMITS.spin.min, ART_LIMITS.spin.max),
    grain: readNumberParam(
      params,
      "grain",
      0.0,
      ART_LIMITS.grain.min,
      ART_LIMITS.grain.max
    ),
    showHud: readBoolParam(params, "hud", false),
  };
}

export function readArtConfig(search) {
  return readArtConfigFromParams(search);
}

export function clampArtNumber(key, value, fallback) {
  const limits = ART_LIMITS[key];
  if (!limits) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, limits.min, limits.max);
}

export function clampSeed(value, fallback) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.floor(Math.abs(parsed));
  return Math.min(ART_LIMITS.seed.max, Math.max(ART_LIMITS.seed.min, clamped || fallback));
}

export function parseBooleanControl(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    if (!raw) return fallback;
    if (raw === "1" || raw === "true" || raw === "yes" || raw === "on") return true;
    if (raw === "0" || raw === "false" || raw === "no" || raw === "off") return false;
  }
  return fallback;
}
