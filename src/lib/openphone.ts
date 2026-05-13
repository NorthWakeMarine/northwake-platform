const OP_BASE = "https://api.openphone.com/v1";

function getApiKey(): string {
  const key = process.env.OPENPHONE_API_KEY;
  if (!key) throw new Error("OPENPHONE_API_KEY not set");
  return key;
}

async function opRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${OP_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: getApiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });
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
  phoneNumbers?: { number: string }[];
  emails?: { address: string }[];
};

export type OpenPhoneContactFields = {
  firstName: string;
  lastName?: string;
  role?: string;
  company?: string;
  phoneNumbers?: { number: string }[];
  emails?: { address: string }[];
};

export type OpenPhoneContactPayload = {
  defaultFields: OpenPhoneContactFields;
};

export async function listOpenPhoneContacts(maxTotal = 1000): Promise<OpenPhoneContact[]> {
  type Resp = { data: OpenPhoneContact[]; meta?: { nextPageToken?: string } };
  const all: OpenPhoneContact[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ maxResults: "50" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await opRequest<Resp>(`/contacts?${params}`);
    all.push(...(data.data ?? []));
    pageToken = data.meta?.nextPageToken;
  } while (pageToken && all.length < maxTotal);
  return all;
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

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}
