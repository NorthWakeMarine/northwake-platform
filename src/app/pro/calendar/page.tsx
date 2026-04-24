import ProShell from "@/components/ProShell";
import CalendarClient from "./CalendarClient";
import type { CalendarEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

async function fetchEvents(): Promise<CalendarEvent[]> {
  try {
    const { listUpcomingEvents } = await import("@/lib/google-calendar");
    return await listUpcomingEvents(14);
  } catch {
    return [];
  }
}

export default async function CalendarPage() {
  const events = await fetchEvents();

  return (
    <ProShell>
      <div className="flex-1 flex flex-col">
        <CalendarClient events={events} />
      </div>
    </ProShell>
  );
}
