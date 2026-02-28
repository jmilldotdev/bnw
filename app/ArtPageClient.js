"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { readArtConfigFromParams } from "../lib/artConfig";
import {
  applyRemoteControl,
  buildAppControlsPayload,
  DEFAULT_APP_ID,
} from "../lib/appControls";
import { mountWebglArt } from "../lib/webglArt";

function readAppId(params) {
  const appId = (params.get("appId") || params.get("app") || "").trim();
  return appId || DEFAULT_APP_ID;
}

function resolveWsUrl(params) {
  const raw = (params.get("ws") || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, window.location.href);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

export default function Page() {
  const searchParams = useSearchParams();
  const paramsText = searchParams.toString();
  const canvasRef = useRef(null);
  const hudRef = useRef(null);
  const artRef = useRef(null);
  const socketRef = useRef(null);
  const parsedParams = useMemo(() => new URLSearchParams(paramsText), [paramsText]);
  const initialConfig = useMemo(
    () => readArtConfigFromParams(parsedParams),
    [parsedParams]
  );
  const configRef = useRef(initialConfig);

  const appId = useMemo(() => readAppId(parsedParams), [parsedParams]);
  const wsUrl = useMemo(() => resolveWsUrl(parsedParams), [parsedParams]);
  const [config, setConfig] = useState(initialConfig);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  useEffect(() => {
    function onKeyDown(event) {
      const key = event.key.toLowerCase();
      if (key === "h") {
        setConfig((prev) => ({ ...prev, showHud: !prev.showHud }));
      }
      if (key === "r") {
        setConfig((prev) => applyRemoteControl(prev, "randomize"));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const app = mountWebglArt(canvas, config);
    artRef.current = app;

    return () => {
      artRef.current = null;
      app.destroy();
    };
    // Mount once; updates are handled in a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    artRef.current?.update(config);
    const hudEl = hudRef.current;
    if (hudEl) {
      hudEl.textContent = [
        `app=${appId}`,
        `seed=${config.seed}`,
        `speed=${config.speed.toFixed(2)} density=${config.density.toFixed(2)}`,
        `warp=${config.warp.toFixed(2)} spin=${config.spin.toFixed(2)} grain=${config.grain.toFixed(2)}`,
        `animate=${config.animate ? "on" : "off"} ws=${wsUrl ? "connected" : "none"}`,
      ].join("\n");
    }
  }, [appId, config, wsUrl]);

  useEffect(() => {
    if (!wsUrl) {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          // noop
        }
        socketRef.current = null;
      }
      return undefined;
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    const sendControls = () => {
      if (socket.readyState !== WebSocket.OPEN) return;
      const payload = buildAppControlsPayload({
        appId,
        config: configRef.current,
      });
      socket.send(
        JSON.stringify({
          type: "controls",
          appId: payload.appId,
          controls: payload.controls,
        })
      );
    };

    socket.addEventListener("open", sendControls);
    socket.addEventListener("message", (event) => {
      let msg = null;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "control" && msg.appId === appId) {
        setConfig((prev) => applyRemoteControl(prev, String(msg.controlId || ""), msg.value));
        return;
      }

      if (msg.type === "controls_request" && (!msg.appId || msg.appId === appId)) {
        sendControls();
      }
    });

    return () => {
      try {
        socket.close();
      } catch {
        // noop
      }
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [appId, wsUrl]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const payload = buildAppControlsPayload({ appId, config });
    socket.send(
      JSON.stringify({
        type: "controls",
        appId: payload.appId,
        controls: payload.controls,
      })
    );
  }, [appId, config]);

  return (
    <main className={`app ${config.showHud ? "show-hud" : ""}`}>
      <canvas ref={canvasRef} className="art-canvas" />
      <div ref={hudRef} className="hud" aria-live="polite" />
    </main>
  );
}
