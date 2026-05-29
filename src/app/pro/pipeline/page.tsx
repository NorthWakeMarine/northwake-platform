export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import ProShell from "@/components/ProShell";
import { getPipelineBoard } from "@/lib/pipeline";

const PipelineBoard = nextDynamic(() => import("./PipelineBoard"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
      Loading pipeline...
    </div>
  ),
});

export default async function ProDashboardPage() {
  const cards = await getPipelineBoard();
  return (
    <ProShell>
      <PipelineBoard initialCards={cards} />
    </ProShell>
  );
}
