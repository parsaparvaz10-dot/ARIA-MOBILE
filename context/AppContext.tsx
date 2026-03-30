import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/api";

export type Stage = "New" | "Contacted" | "Appt Set" | "Negotiating" | "Closed";
export type AppointmentType = "Test Drive" | "Consultation" | "Delivery" | "Service" | "Follow Up";

export interface Lead {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: string;
  stage: Stage;
  status?: string;
  isHot: boolean;
  notes: string;
  budget?: string;
  timeline?: string;
  lastConversationSummary?: string;
  createdAt: number;
  created_at?: string;
  vehicle_interest?: string;
  caller_name?: string;
  next_action?: string;
  call_id?: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: string;
  vehicleInterest?: string;
  purchaseDate: string;
  leaseExpiry?: string;
  tags: string[];
  notes: string;
  lastConversationSummary?: string;
  callCount: number;
  lastContact: number;
  interactions: Array<{ date: string; summary: string }>;
  vehicle_purchased?: string;
  created_at?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  type: AppointmentType;
  vehicle: string;
  date: number;
  bookedByAria: boolean;
  clientName?: string;
  clientPhone?: string;
  notes?: string;
  status?: string;
}

export interface CallRecord {
  id: string;
  caller_phone?: string;
  callerPhone?: string;
  started_at?: string;
  startedAt?: string;
  created_at?: string;
  duration?: number;
  duration_seconds?: number;
  status?: string;
  transcript?: string;
  summary?: string;
  call_id?: string;
}

export interface VoiceCapture {
  id: string;
  name: string;
  vehicle: string;
  timeline: string;
  notes: string;
  status: "Confirmed" | "Pending";
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

const DEFAULT_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Christopher Mazloomi",
  email: "christopher@porscheriveroaks.com",
};

const STATUS_TO_STAGE: Record<string, Stage> = {
  new: "New",
  contacted: "Contacted",
  appointment_set: "Appt Set",
  negotiating: "Negotiating",
  closed_won: "Closed",
  closed_lost: "Closed",
};

const ACTION_TO_STAGE: Record<string, Stage> = {
  callback_requested: "New",
  follow_up: "Contacted",
  appointment_set: "Appt Set",
  negotiating: "Negotiating",
  closed_won: "Closed",
  closed_lost: "Closed",
  send_info: "Contacted",
  schedule_test_drive: "Appt Set",
};

const STAGE_TO_STATUS: Record<Stage, string> = {
  New: "new",
  Contacted: "contacted",
  "Appt Set": "appointment_set",
  Negotiating: "negotiating",
  Closed: "closed_won",
};

const PURPOSE_TO_TYPE: Record<string, AppointmentType> = {
  test_drive: "Test Drive",
  delivery: "Delivery",
  follow_up: "Follow Up",
  consultation: "Consultation",
  service: "Service",
};

function normalizeLead(raw: Record<string, unknown>, userId: string): Lead {
  const nextAction = raw.next_action as string | undefined;
  const statusField = raw.status as string | undefined;
  const stage =
    (nextAction ? ACTION_TO_STAGE[nextAction] : undefined) ??
    (statusField ? STATUS_TO_STAGE[statusField] : undefined) ??
    "New";
  const callerName = raw.caller_name as string | undefined;
  const rawName = (raw.name as string) || callerName || "";
  const name = rawName && rawName !== "Unknown" ? rawName : "";
  return {
    id: String(raw.id),
    userId,
    name,
    phone: (raw.phone as string) || "",
    email: raw.email as string | undefined,
    vehicle: (raw.vehicle_interest as string) || "",
    stage,
    status: statusField || nextAction || "new",
    isHot: stage === "Negotiating" || nextAction === "negotiating",
    notes: (raw.notes as string) || "",
    budget: raw.budget as string | undefined,
    timeline: raw.timeline as string | undefined,
    lastConversationSummary: (raw.last_conversation_summary as string) || undefined,
    createdAt: raw.created_at
      ? new Date(raw.created_at as string).getTime()
      : Date.now(),
    created_at: raw.created_at as string | undefined,
    vehicle_interest: raw.vehicle_interest as string | undefined,
    caller_name: callerName,
    next_action: nextAction,
    call_id: raw.call_id ? String(raw.call_id) : undefined,
  };
}

function normalizeClient(raw: Record<string, unknown>, userId: string): Client {
  return {
    id: String(raw.id),
    userId,
    name: (raw.name as string) || "Unknown",
    phone: (raw.phone as string) || "",
    email: raw.email as string | undefined,
    vehicle: (raw.vehicle_purchased as string) || "",
    vehicleInterest: (raw.vehicle_interest as string) || undefined,
    purchaseDate: raw.purchase_date
      ? new Date(raw.purchase_date as string).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
    leaseExpiry: raw.lease_expiry
      ? new Date(raw.lease_expiry as string).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : undefined,
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    notes: (raw.notes as string) || "",
    lastConversationSummary: (raw.last_conversation_summary as string) || undefined,
    callCount: 0,
    lastContact: raw.created_at
      ? new Date(raw.created_at as string).getTime()
      : Date.now(),
    interactions: [],
    vehicle_purchased: raw.vehicle_purchased as string | undefined,
    created_at: raw.created_at as string | undefined,
  };
}

function normalizeAppointment(
  raw: Record<string, unknown>,
  userId: string
): Appointment {
  const purpose = (raw.purpose as string) || "follow_up";
  const type: AppointmentType = PURPOSE_TO_TYPE[purpose] ?? "Follow Up";
  const startField = (raw.datetime_start as string) || (raw.start_time as string) || "";
  const startMs = startField
    ? new Date(startField).getTime()
    : Date.now();
  const rawTitle = (raw.title as string) || "";
  const title = rawTitle || type;

  return {
    id: String(raw.id),
    userId,
    title,
    type,
    vehicle: (raw.vehicle as string) || "",
    date: startMs,
    bookedByAria: (raw.booked_by as string) === "aria",
    clientName: (raw.client_name as string) || undefined,
    clientPhone: (raw.client_phone as string) || undefined,
    notes: (raw.notes as string) || undefined,
    status: (raw.status as string) || "scheduled",
  };
}

interface AppState {
  user: User | null;
  leads: Lead[];
  clients: Client[];
  appointments: Appointment[];
  calls: CallRecord[];
  captures: VoiceCapture[];
  loading: boolean;
  refreshing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadData: () => Promise<void>;
  addLead: (lead: Omit<Lead, "id" | "userId" | "createdAt">) => void;
  updateLeadStage: (id: string, stage: Stage) => void;
  deleteLead: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, "id" | "userId" | "lastContact" | "callCount" | "interactions">) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addAppointment: (appt: Omit<Appointment, "id" | "userId">) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addCapture: (capture: Omit<VoiceCapture, "id" | "createdAt">) => void;
  confirmCapture: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [captures, setCaptures] = useState<VoiceCapture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const currentUserId = DEFAULT_USER.id;

  const loadData = useCallback(async () => {
    try {
      const [leadsRaw, clientsRaw, apptsRaw, callsRaw] = await Promise.all([
        api.getLeads().catch(() => []),
        api.getClients().catch(() => []),
        api.getAppointments().catch(() => []),
        api.getCalls().catch(() => []),
      ]);
      setLeads(
        Array.isArray(leadsRaw)
          ? (leadsRaw as Record<string, unknown>[]).map((r) =>
              normalizeLead(r, currentUserId)
            )
          : []
      );
      setClients(
        Array.isArray(clientsRaw)
          ? (clientsRaw as Record<string, unknown>[]).map((r) =>
              normalizeClient(r, currentUserId)
            )
          : []
      );
      setAppointments(
        Array.isArray(apptsRaw)
          ? (apptsRaw as Record<string, unknown>[]).map((r) =>
              normalizeAppointment(r, currentUserId)
            )
          : []
      );
      setCalls(Array.isArray(callsRaw) ? (callsRaw as CallRecord[]) : []);
    } catch (err) {
      console.error("Data load failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const login = useCallback(async (_email: string, _password: string) => {
    setUser(DEFAULT_USER);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setLeads([]);
    setClients([]);
    setAppointments([]);
    setCalls([]);
    setCaptures([]);
  }, []);

  const addLead = useCallback(
    (lead: Omit<Lead, "id" | "userId" | "createdAt">) => {
      const newLead: Lead = {
        ...lead,
        id: Date.now().toString(),
        userId: currentUserId,
        createdAt: Date.now(),
      };
      setLeads((prev) => [newLead, ...prev]);
    },
    [currentUserId]
  );

  const updateLeadStage = useCallback(
    (id: string, stage: Stage) => {
      const apiStatus = STAGE_TO_STATUS[stage];
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, stage, status: apiStatus, isHot: stage === "Negotiating" } : l
        )
      );
      try {
        api.updateLeadStatus(id, apiStatus).catch(() => {});
      } catch {}
    },
    []
  );

  const deleteLead = useCallback(
    async (id: string) => {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      try {
        await api.deleteLead(id);
      } catch {
        await loadData();
      }
    },
    [loadData]
  );

  const addClient = useCallback(
    async (
      client: Omit<Client, "id" | "userId" | "lastContact" | "callCount" | "interactions">
    ) => {
      const tempClient: Client = {
        ...client,
        id: Date.now().toString(),
        userId: currentUserId,
        callCount: 0,
        lastContact: Date.now(),
        interactions: [],
      };
      setClients((prev) => [tempClient, ...prev]);

      try {
        const saved = await api.createClient({
          name: client.name,
          phone: client.phone,
          email: client.email,
          vehicle_purchased: client.vehicle || "",
          notes: client.notes,
          tags: client.tags,
        });
        if (saved && saved.id) {
          setClients((prev) =>
            prev.map((c) =>
              c.id === tempClient.id
                ? normalizeClient(saved as Record<string, unknown>, currentUserId)
                : c
            )
          );
        } else {
          await loadData();
        }
      } catch (err) {
        console.error("Failed to save client:", err);
        setClients((prev) => prev.filter((c) => c.id !== tempClient.id));
        throw err;
      }
    },
    [currentUserId, loadData]
  );

  const deleteClient = useCallback(
    async (clientId: string) => {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      try {
        await api.deleteClient(clientId);
      } catch {
        await loadData();
      }
    },
    [loadData]
  );

  const addAppointment = useCallback(
    async (appt: Omit<Appointment, "id" | "userId">) => {
      const newAppt: Appointment = {
        ...appt,
        id: Date.now().toString(),
        userId: currentUserId,
      };
      setAppointments((prev) =>
        [...prev, newAppt].sort((a, b) => a.date - b.date)
      );

      const startDate = new Date(appt.date);
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

      const purposeMap: Record<string, string> = {
        "Test Drive": "test_drive",
        "Consultation": "consultation",
        "Delivery": "delivery",
        "Service": "service",
        "Follow Up": "follow_up",
      };

      try {
        const saved = await api.createAppointment({
          title: appt.title,
          datetime_start: startDate.toISOString(),
          datetime_end: endDate.toISOString(),
          purpose: purposeMap[appt.type] || "callback",
          notes: appt.vehicle ? `Vehicle: ${appt.vehicle}` : "",
        });
        if (saved && saved.id) {
          setAppointments((prev) =>
            prev.map((a) =>
              a.id === newAppt.id
                ? normalizeAppointment(saved as Record<string, unknown>, currentUserId)
                : a
            ).sort((a, b) => a.date - b.date)
          );
        } else {
          await loadData();
        }
      } catch (err: any) {
        console.error("Failed to save appointment:", err);
        setAppointments((prev) => prev.filter((a) => a.id !== newAppt.id));
        if (err?.message?.includes("conflict") || err?.message?.includes("409")) {
          throw new Error("conflict");
        }
        throw err;
      }
    },
    [currentUserId, loadData]
  );

  const deleteAppointment = useCallback(
    async (id: string) => {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      try {
        await api.deleteAppointment(id);
      } catch {
        await loadData();
      }
    },
    [loadData]
  );

  const addCapture = useCallback(
    (capture: Omit<VoiceCapture, "id" | "createdAt">) => {
      const newCapture: VoiceCapture = {
        ...capture,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      setCaptures((prev) => [newCapture, ...prev]);
    },
    []
  );

  const confirmCapture = useCallback((id: string) => {
    setCaptures((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "Confirmed" as const } : c))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        leads,
        clients,
        appointments,
        calls,
        captures,
        loading,
        refreshing,
        login,
        logout,
        loadData,
        addLead,
        updateLeadStage,
        deleteLead,
        addClient,
        deleteClient,
        addAppointment,
        deleteAppointment,
        addCapture,
        confirmCapture,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
