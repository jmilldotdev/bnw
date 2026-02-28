import { Suspense } from "react";
import ArtPageClient from "./ArtPageClient";

export default function Page() {
  return (
    <Suspense fallback={<main className="app" />}>
      <ArtPageClient />
    </Suspense>
  );
}
