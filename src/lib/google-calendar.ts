import { google } from "googleapis";

// Service account or OAuth2 credentials from env
// For OAuth2 (recommended): set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
// For Service Account: set GOOGLE_SERVICE_ACCOUNT_JSON
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "primary";

function getAuth() {
  const CAL_SCOPE = "https://www.googleapis.com/auth/calendar";
  const subject   = process.env.GOOGLE_CALENDAR_SUBJECT;

  // Option 1: full service account JSON blob
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: [CAL_SCOPE],
      clientOptions: subject ? { subject } : undefined,
    });
  }

  // Option 2: separate email + private key (standard Cloud Console copy-paste)
  // Private keys in .env files have literal \n — replace before passing to JWT.
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return new google.auth.JWT({
      email:   process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key:     process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes:  [CAL_SCOPE],
      subject: subject,
    });
  }

  // Option 3: OAuth2 refresh token (user account)
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? "urn:ietf:wg:oauth:2.0:oob"
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

export type CalendarEventInput = {
  title: string;
  description?: string;
  location?: string;
  startTime: string;  // ISO 8601 datetime or YYYY-MM-DD for all-day
  endTime: string;    // ISO 8601 datetime or YYYY-MM-DD for all-day
  isAllDay?: boolean;
  googleEventId?: string;
};

function gcalTime(iso: string, allDay: boolean) {
  return allDay
    ? { date: iso }
    : { dateTime: iso, timeZone: "America/New_York" };
}

export async function createCalendarEvent(event: CalendarEventInput): Promise<string> {
  const auth     = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const allDay   = event.isAllDay ?? false;

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary:     event.title,
      description: event.description,
      location:    event.location,
      start: gcalTime(event.startTime, allDay),
      end:   gcalTime(event.endTime,   allDay),
    },
  });

  const eventId = res.data.id;
  if (!eventId) throw new Error("Google Calendar did not return an event ID.");
  return eventId;
}

export async function updateCalendarEvent(
  googleEventId: string,
  patch: Partial<CalendarEventInput>
): Promise<void> {
  const auth     = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const allDay   = patch.isAllDay ?? false;

  await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId:    googleEventId,
    requestBody: {
      ...(patch.title       !== undefined ? { summary:     patch.title }       : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.location    !== undefined ? { location:    patch.location }    : {}),
      ...(patch.startTime   ? { start: gcalTime(patch.startTime, allDay) } : {}),
      ...(patch.endTime     ? { end:   gcalTime(patch.endTime,   allDay) } : {}),
    },
  });
}

export async function deleteCalendarEvent(googleEventId: string): Promise<void> {
  const auth     = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: googleEventId });
}

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
};

export async function listUpcomingEvents(days = 14): Promise<CalendarEvent[]> {
  const now    = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return listEvents(now, future);
}

export async function listEvents(from: Date, to: Date): Promise<CalendarEvent[]> {
  const auth     = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.list({
    calendarId:   CALENDAR_ID,
    timeMin:      from.toISOString(),
    timeMax:      to.toISOString(),
    singleEvents: true,
    orderBy:      "startTime",
    maxResults:   200,
  });

  return (res.data.items ?? [])
    .filter((e) => e.id && (e.start?.dateTime || e.start?.date))
    .map((e) => ({
      id:          e.id!,
      title:       e.summary ?? "(No title)",
      start:       e.start?.dateTime ?? e.start?.date ?? "",
      end:         e.end?.dateTime   ?? e.end?.date   ?? "",
      description: e.description ?? undefined,
      location:    e.location    ?? undefined,
    }));
}

// Fetch events and detect discrepancies (event moved/deleted outside CRM)
export type DiscrepancyReport = {
  googleEventId: string;
  status: "deleted" | "moved";
  originalStart?: string;
  currentStart?: string;
};

export async function detectCalendarDiscrepancies(
  googleEventIds: string[]
): Promise<DiscrepancyReport[]> {
  if (googleEventIds.length === 0) return [];

  const auth     = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  const reports: DiscrepancyReport[] = [];

  await Promise.all(
    googleEventIds.map(async (eventId) => {
      try {
        const res = await calendar.events.get({
          calendarId: CALENDAR_ID,
          eventId,
        });
        const ev = res.data;
        if (ev.status === "cancelled") {
          reports.push({ googleEventId: eventId, status: "deleted" });
        }
      } catch (err: unknown) {
        const status = (err as { code?: number })?.code;
        if (status === 404 || status === 410) {
          reports.push({ googleEventId: eventId, status: "deleted" });
        }
      }
    })
  );

  return reports;
}
