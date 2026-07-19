import { Suspense } from "react";
import { DynamicCheckout } from "@/components/Marketplace";
export default function Page(){ return <Suspense fallback={<div className="loading-card">Preparing checkout…</div>}><DynamicCheckout/></Suspense>; }
