import { Suspense } from "react";
import IslandPageClient from "@/components/IslandPageClient";

export default function IslandPage() {
  return (
    <Suspense fallback={<div className="pt-32" />}>
      <IslandPageClient />
    </Suspense>
  );
}
