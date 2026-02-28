import { buildAppControlsPayload, DEFAULT_APP_ID } from "../../../lib/appControls";
import { readArtConfigFromParams } from "../../../lib/artConfig";

function readAppId(params) {
  const appId = (params.get("appId") || params.get("app") || "").trim();
  return appId || DEFAULT_APP_ID;
}

export async function GET(request) {
  const url = new URL(request.url);
  const config = readArtConfigFromParams(url.searchParams);
  const appId = readAppId(url.searchParams);
  return Response.json(buildAppControlsPayload({ appId, config }));
}
