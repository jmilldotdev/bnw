import {
  ART_LIMITS,
  clampArtNumber,
  clampSeed,
  parseBooleanControl,
} from "./artConfig";

export const DEFAULT_APP_ID = "bnw-slop";

function slider(id, label, limits, value) {
  return {
    id,
    label,
    type: "range",
    min: limits.min,
    max: limits.max,
    step: limits.step,
    value,
  };
}

export function buildAppControlsPayload(args) {
  const appId = (args.appId || DEFAULT_APP_ID).trim() || DEFAULT_APP_ID;
  const config = args.config;
  return {
    ok: true,
    appId,
    controls: [
      slider("seed", "Seed", ART_LIMITS.seed, config.seed),
      { id: "randomize", label: "Randomize", type: "button" },
      { id: "animate", label: "Animate", type: "toggle", value: config.animate },
      slider("speed", "Speed", ART_LIMITS.speed, config.speed),
      slider("density", "Density", ART_LIMITS.density, config.density),
      slider("warp", "Warp", ART_LIMITS.warp, config.warp),
      slider("spin", "Spin", ART_LIMITS.spin, config.spin),
      slider("grain", "Grain", ART_LIMITS.grain, config.grain),
      { id: "hud", label: "Debug HUD", type: "toggle", value: config.showHud },
    ],
  };
}

export function applyRemoteControl(config, controlId, rawValue) {
  if (controlId === "randomize") {
    return {
      ...config,
      seed:
        Math.floor(Math.random() * (ART_LIMITS.seed.max - ART_LIMITS.seed.min + 1)) +
        ART_LIMITS.seed.min,
    };
  }
  if (controlId === "seed") {
    return { ...config, seed: clampSeed(rawValue, config.seed) };
  }
  if (controlId === "animate") {
    return {
      ...config,
      animate: parseBooleanControl(rawValue, config.animate),
    };
  }
  if (controlId === "hud") {
    return {
      ...config,
      showHud: parseBooleanControl(rawValue, config.showHud),
    };
  }
  if (
    controlId === "speed" ||
    controlId === "density" ||
    controlId === "warp" ||
    controlId === "spin" ||
    controlId === "grain"
  ) {
    return {
      ...config,
      [controlId]: clampArtNumber(controlId, rawValue, config[controlId]),
    };
  }
  return config;
}
