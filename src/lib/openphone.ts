const OP_BASE = "https://api.openphone.com/v1";

function getApiKey(): string {
  const key = process.env.QUO_API_KEY;
  if (!key) throw new Error("QUO_API_KEY not set");
  return key;
}

async function opRequest<T>(path: string, options: RequestInit = {}, attempt = 0): Promise<T> {
  const res = await fetch(`${OP_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getApiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 429 && attempt < 4) {
    await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
    return opRequest<T>(path, options, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenPhone API ${res.status}: ${body}`);
  }
  return res.json();
}

export type OpenPhoneContact = {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  company?: string;
  phoneNumbers?: { name: string; value: string | null }[];
  emails?: { name: string; value: string | null }[];
};

export type OpenPhoneContactFields = {
  firstName: string;
  lastName?: string;
  role?: string;
  company?: string;
  phoneNumbers?: { name: string; value: string | null }[];
  emails?: { name: string; value: string | null }[];
};

export type OpenPhoneContactPayload = {
  defaultFields: OpenPhoneContactFields;
};

export async function listOpenPhoneContacts(maxTotal = 1000): Promise<OpenPhoneContact[]> {
  type RawContact = { id: string; defaultFields?: OpenPhoneContactFields };
  type Resp = { data: RawContact[]; meta?: { nextPageToken?: string } };
  const all: OpenPhoneContact[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ maxResults: "50" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await opRequest<Resp>(`/contacts?${params}`);
    for (const raw of data.data ?? []) {
      const f: OpenPhoneContactFields = raw.defaultFields ?? {} as OpenPhoneContactFields;
      all.push({ id: raw.id, firstName: f.firstName, lastName: f.lastName, role: f.role, company: f.company, phoneNumbers: f.phoneNumbers, emails: f.emails });
    }
    pageToken = data.meta?.nextPageToken;
  } while (pageToken && all.length < maxTotal);
  return all;
}

export async function getOpenPhoneContact(id: string): Promise<OpenPhoneContact | null> {
  type RawContact = { id: string; defaultFields?: OpenPhoneContactFields };
  type Resp = { data: RawContact };
  try {
    const res = await opRequest<Resp>(`/contacts/${id}`);
    const f = res.data.defaultFields ?? ({} as OpenPhoneContactFields);
    return { id: res.data.id, firstName: f.firstName, lastName: f.lastName, role: f.role, company: f.company, phoneNumbers: f.phoneNumbers, emails: f.emails };
  } catch {
    return null;
  }
}

export async function createOpenPhoneContact(fields: OpenPhoneContactFields): Promise<string | null> {
  type Resp = { data: { id: string } };
  const res = await opRequest<Resp>("/contacts", {
    method: "POST",
    body: JSON.stringify({ defaultFields: fields }),
  });
  return res.data?.id ?? null;
}

export async function updateOpenPhoneContact(id: string, fields: OpenPhoneContactFields): Promise<void> {
  await opRequest(`/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ defaultFields: fields }),
  });
}

export async function deleteOpenPhoneContact(id: string): Promise<void> {
  await opRequest(`/contacts/${id}`, { method: "DELETE" });
}

export type OpenPhoneCall = {
  id: string;
  direction: string;
  from: string | string[];
  to: string | string[];
  answeredAt: string | null;
  completedAt: string | null;
  recordingUrl: string | null;
  createdAt: string;
};

export type OpenPhoneMessage = {
  id: string;
  direction: string;
  from: string | string[];
  to: string | string[];
  body: string;
  createdAt: string;
};

export async function fetchCallsByPhone(phone: string, maxTotal = 500): Promise<OpenPhoneCall[]> {
  type Resp = { data: OpenPhoneCall[]; meta?: { nextPageToken?: string } };
  const all: OpenPhoneCall[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ "participants[]": phone, maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await opRequest<Resp>(`/calls?${params}`);
    all.push(...(data.data ?? []));
    pageToken = data.meta?.nextPageToken;
  } while (pageToken && all.length < maxTotal);
  return all;
}

export async function fetchMessagesByPhone(phone: string, maxTotal = 500): Promise<OpenPhoneMessage[]> {
  type Resp = { data: OpenPhoneMessage[]; meta?: { nextPageToken?: string } };
  const all: OpenPhoneMessage[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ "participants[]": phone, maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await opRequest<Resp>(`/messages?${params}`);
    all.push(...(data.data ?? []));
    pageToken = data.meta?.nextPageToken;
  } while (pageToken && all.length < maxTotal);
  return all;
}

let cachedPhoneNumberId: string | null = null;

async function resolvePhoneNumberId(): Promise<string> {
  if (cachedPhoneNumberId) return cachedPhoneNumberId;
  const phoneNumber = process.env.QUO_PHONE_NUMBER;
  if (!phoneNumber) throw new Error("QUO_PHONE_NUMBER not set");
  type Resp = { data: { id: string; number: string }[] };
  const res = await opRequest<Resp>("/phone-numbers");
  const match = res.data.find((p) => p.number === phoneNumber);
  if (!match) throw new Error(`No OpenPhone number found matching ${phoneNumber}`);
  cachedPhoneNumberId = match.id;
  return match.id;
}

export async function sendSMS(to: string, content: string): Promise<void> {
  const phoneNumberId = await resolvePhoneNumberId();
  await opRequest("/messages", {
    method: "POST",
    body: JSON.stringify({ from: phoneNumberId, to: [to], content }),
  });
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}
