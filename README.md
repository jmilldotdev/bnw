# bnw-slop

Seeded black/white geometric web art, now running on Next.js (App Router).

## Dev

```bash
cd /Users/jmill/projects/bnw-slop
npm install
npm run dev
```

Server runs on port `5175`.

## Build + run

```bash
cd /Users/jmill/projects/bnw-slop
npm run build
npm run start
```

## Query args

- `seed` (`number`): deterministic motif seed.
- `animate` (`0|1|true|false`, default `true`): continuous redraw.
- `speed` (`0..4`): animation speed scalar.
- `density` (`0.25..2.25`): stripe density.
- `warp` (`0..4`): spatial distortion amount.
- `spin` (`-2..2`): rotational drift for sphere mapping.
- `grain` (`0..0.65`): procedural grain.
- `hud` (`0|1|true|false`): debug overlay (`h` toggles locally).
- `appId` (`string`, default `bnw-slop`): remote controls app identity.
- `ws` (`ws://` or `wss://` URL): control socket endpoint for live `control` messages.

## App controls API

`GET /api/app-controls`

Returns a standard controls payload:

```json
{
  "ok": true,
  "appId": "bnw-slop",
  "controls": [
    { "id": "seed", "label": "Seed", "type": "range", "min": 1, "max": 999999, "step": 1, "value": 42 },
    { "id": "randomize", "label": "Randomize", "type": "button" },
    { "id": "animate", "label": "Animate", "type": "toggle", "value": true }
  ]
}
```

It accepts the same query args as the main app, so default control values match runtime launch args.

## Chiba media config example

```json
{
  "sourceType": "url",
  "sourceValue": "https://bnw.example.com/?appId=bnw-slop&ws=wss%3A%2F%2Fcontrol.example.com%2Fws",
  "web": {
    "appControlsApi": "https://bnw.example.com/api/app-controls?appId=bnw-slop",
    "args": {
      "seed": { "mode": "int_range", "min": 1, "max": 999999, "perScreen": true },
      "speed": 0.3,
      "density": 1.1,
      "warp": 1.3
    }
  }
}
```

When `appControlsApi` is configured, chiba can fetch controls via `/api/controls/:appId`.
