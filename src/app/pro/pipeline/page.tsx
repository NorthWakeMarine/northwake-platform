export const dynamic = "force-dynamic";

import ProShell from "@/components/ProShell";
import PipelineBoard from "./PipelineBoard";
import { getPipelineBoard } from "@/lib/pipeline";

export default async function ProDashboardPage() {
  const cards = await getPipelineBoard();
  return (
    <ProShell>
      <PipelineBoard initialCards={cards} />
    </ProShell>
  );
}
