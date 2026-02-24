# bnw-slop

Seeded black/white geometric web art, now as a Vite + React app with hot reload.

## Dev (hot reload)

```bash
cd /Users/jmill/projects/bnw-slop
npm install
npm run dev
```

Vite prints local and network URLs (configured on port `5175`), for example:
- `http://localhost:5175/`
- `http://192.168.0.117:5175/`

To run with query args in dev, open e.g.:

`http://localhost:5175/?seed=42&speed=0.35&density=1.2&warp=1.4`

## Build + preview

```bash
cd /Users/jmill/projects/bnw-slop
npm run build
npm run preview
```

## Query args

- `seed` (`number`): deterministic motif seed that drives the full composition.
- `animate` (`0|1|true|false`, default `true`): continuous redraw.
- `speed` (`0..4`): animation speed scalar.
- `density` (`0.25..2.25`): stripe density.
- `warp` (`0..4`): spatial distortion amount.
- `spin` (`-2..2`): rotational drift for sphere mapping.
- `grain` (`0..0.65`): procedural grain.
- `hud` (`0|1|true|false`): debug overlay (toggle anytime with `h`).

## Chiba URL media config example

```json
{
  "args": {
    "seed": { "mode": "int_range", "min": 1, "max": 999999, "perScreen": true },
    "animate": 1,
    "speed": 0.3,
    "density": 1.1,
    "warp": 1.3
  }
}
```

With this config, every node/screen gets a stable different `seed` while the rest of args stay fixed.
