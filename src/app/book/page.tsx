"use client";

import { Suspense } from "react";
import ServicesPage from "@/app/pages/ServicesPage";

export default function BookPage() {
  return (
    <Suspense fallback={<div className="wf-page">Loading booking…</div>}>
      <ServicesPage />
    </Suspense>
  );
}
