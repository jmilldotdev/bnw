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

export function readArtConfig(search) {
  const params = new URLSearchParams(search);
  const seed = readSeedParam(params, 42);

  return {
    seed,
    animate: readBoolParam(params, "animate", true),
    speed: readNumberParam(params, "speed", 0.55, 0, 4),
    density: readNumberParam(params, "density", 1.0, 0.25, 2.25),
    warp: readNumberParam(params, "warp", 1.0, 0, 4),
    spin: readNumberParam(params, "spin", 0.0, -2, 2),
    grain: readNumberParam(params, "grain", 0.0, 0, 0.65),
    showHud: readBoolParam(params, "hud", false),
  };
}
