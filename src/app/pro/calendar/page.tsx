import ProShell from "@/components/ProShell";
import CalendarClient from "./CalendarClient";
import type { CalendarEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

async function fetchEvents(): Promise<CalendarEvent[]> {
  try {
    const { listEvents } = await import("@/lib/google-calendar");
    const from = new Date();
    from.setDate(from.getDate() - 7); // 1 week back
    const to = new Date();
    to.setDate(to.getDate() + 56);   // 8 weeks ahead
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
