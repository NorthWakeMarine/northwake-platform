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
  phoneNumbers?: { number: string }[];
  emails?: { address: string }[];
};

export async function listOpenPhoneContacts(maxTotal = 500): Promise<OpenPhoneContact[]> {
  type Resp = { data: OpenPhoneContact[]; meta?: { nextPageToken?: string } };
  const all: OpenPhoneContact[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({ maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await opRequest<Resp>(`/contacts?${params}`);
    all.push(...(data.data ?? []));
    pageToken = data.meta?.nextPageToken;
  } while (pageToken && all.length < maxTotal);
  return all;
}

export async function createOpenPhoneContact(data: {
  firstName: string;
  lastName?: string;
  phoneNumbers?: { number: string }[];
  emails?: { address: string }[];
}): Promise<string | null> {
  type Resp = { data: { id: string } };
  const res = await opRequest<Resp>("/contacts", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data?.id ?? null;
}

export async function updateOpenPhoneContact(id: string, data: {
  firstName?: string;
  lastName?: string;
  phoneNumbers?: { number: string }[];
  emails?: { address: string }[];
}): Promise<void> {
  await opRequest(`/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
