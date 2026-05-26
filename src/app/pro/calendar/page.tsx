import ProShell from "@/components/ProShell";
import CalendarClient from "./CalendarClient";
import type { CalendarEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

async function fetchEvents(): Promise<CalendarEvent[]> {
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const to   = new Date(now.getFullYear(), now.getMonth() + 3, 1);
    return await listEvents(from, to);
  } catch {
    return [];
  }
}

export default async function CalendarPage() {
  const events = await fetchEvents();
  return (
    <ProShell>
      <div className="flex-1 flex flex-col min-h-0">
        <CalendarClient events={events} />
      </div>
    </ProShell>
  );
}
