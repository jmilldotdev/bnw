import { useEffect, useMemo, useRef, useState } from "react";
import { readArtConfig } from "./artConfig";
import { mountWebglArt } from "./webglArt";
import "./styles.css";

export default function App() {
  const config = useMemo(() => readArtConfig(window.location.search), []);
  const canvasRef = useRef(null);
  const hudRef = useRef(null);
  const [showHud, setShowHud] = useState(config.showHud);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key.toLowerCase() === "h") {
        setShowHud((prev) => !prev);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hudEl = hudRef.current;
    if (!canvas) return undefined;

    const app = mountWebglArt(canvas, config);
    if (hudEl) {
      hudEl.textContent = [
        `seed=${config.seed}`,
        `density=${config.density.toFixed(2)} warp=${config.warp.toFixed(2)}`,
        `speed=${config.speed.toFixed(2)} spin=${config.spin.toFixed(2)}`,
      ].join("\n");
    }

    return () => {
      app.destroy();
    };
  }, [config]);

  return (
    <main className={`app ${showHud ? "show-hud" : ""}`}>
      <canvas ref={canvasRef} className="art-canvas" />
      <div ref={hudRef} className="hud" aria-live="polite" />
    </main>
  );
}
