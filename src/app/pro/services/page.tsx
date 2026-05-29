export const dynamic = "force-dynamic";

import ProShell from "@/components/ProShell";
import { getServiceTemplates } from "@/app/actions";
import ServicesClient from "./ServicesClient";

export default async function ServicesPage() {
  const templates = await getServiceTemplates();

  return (
    <ProShell>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-[#eceef1] border-b border-[#dcdee3] px-6 py-4">
          <h1 className="text-[#1E2938] text-base font-bold tracking-tight">Services</h1>
          <p className="text-[#1E2938]/50 text-sm mt-0.5">Recurring service templates</p>
        </div>
        <div className="flex-1 px-6 py-6 overflow-auto">
          <div className="max-w-3xl">
            <ServicesClient templates={templates} />
          </div>
        </div>
      </div>
    </ProShell>
  );
}
