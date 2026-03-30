const DEV_DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || "";
const API_URL = DEV_DOMAIN
  ? `https://${DEV_DOMAIN}/api/aria`
  : "https://aria-auto-sales.fly.dev/api";

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const url = `${API_URL}${path}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null;
  }
  return res.json();
}

export const api = {
  getLeads: () => apiFetch("/leads"),

  updateLeadStatus: (id: number | string, status: string) =>
    apiFetch(`/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  updateLeadNotes: (id: number | string, notes: string) =>
    apiFetch(`/leads/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
    }),

  deleteLead: (id: number | string) =>
    apiFetch(`/leads/${id}`, { method: "DELETE" }),

  getClients: () => apiFetch("/clients"),

  searchClients: (term: string) =>
    apiFetch(`/clients?search=${encodeURIComponent(term)}`),

  updateClient: (id: string | number, data: Record<string, unknown>) =>
    apiFetch(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteClient: (id: number | string) =>
    apiFetch(`/clients/${id}`, { method: "DELETE" }),

  getCalls: () => apiFetch("/calls").catch(() => []),

  getCall: (id: string | number) => apiFetch(`/calls/${id}`),

  createClient: (client: Record<string, unknown>) =>
    apiFetch("/clients", {
      method: "POST",
      body: JSON.stringify({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        vehicle_purchased: client.vehicle_purchased || client.vehicle || "",
        notes: client.notes || "",
        tags: client.tags || [],
        salesperson_id: "00000000-0000-0000-0000-000000000001",
      }),
    }),

  getStats: () => apiFetch("/stats").catch(() => null),

  getAppointments: () => apiFetch("/appointments").catch(() => []),

  createAppointment: (appointment: Record<string, unknown>) =>
    apiFetch("/appointments", {
      method: "POST",
      body: JSON.stringify({
        salesperson_id: "00000000-0000-0000-0000-000000000001",
        title: appointment.title || "Callback",
        datetime_start: appointment.datetime_start,
        datetime_end: appointment.datetime_end,
        start_time: appointment.datetime_start,
        end_time: appointment.datetime_end,
        purpose: appointment.purpose || "callback",
        client_id: appointment.client_id || null,
        lead_id: appointment.lead_id || null,
        notes: appointment.notes || "",
        status: "scheduled",
        booked_by: "manual",
      }),
    }),

  deleteAppointment: (id: number | string) =>
    apiFetch(`/appointments/${id}`, { method: "DELETE" }),

  getConversations: () => apiFetch("/conversations"),

  getConversation: (phone: string) =>
    apiFetch(`/conversations/${encodeURIComponent(phone)}`),

  connectCall: (to: string, signal?: AbortSignal) =>
    apiFetch("/call/proxy", {
      method: "POST",
      body: JSON.stringify({ to_number: to }),
      signal,
    }),
};
