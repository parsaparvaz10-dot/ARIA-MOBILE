export const Colors = {
  bg: "#09090b",
  card: "#18181b",
  border: "#27272a",
  primary: "#a855f7",
  primaryMuted: "rgba(168,85,247,0.15)",
  text: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  green: "#22c55e",
  greenMuted: "rgba(34,197,94,0.15)",
  blue: "#3b82f6",
  blueMuted: "rgba(59,130,246,0.15)",
  red: "#ef4444",
  redMuted: "rgba(239,68,68,0.15)",
  amber: "#f59e0b",
  amberMuted: "rgba(245,158,11,0.15)",
  orange: "#f97316",
  orangeMuted: "rgba(249,115,22,0.15)",
  white: "#ffffff",
  overlay: "rgba(0,0,0,0.85)",
};

export const StageColors: Record<string, string> = {
  New: Colors.primary,
  Contacted: Colors.blue,
  "Appt Set": Colors.amber,
  Negotiating: Colors.orange,
  Closed: Colors.green,
};

export const AppointmentColors: Record<string, string> = {
  "Test Drive": Colors.primary,
  Consultation: Colors.blue,
  Delivery: Colors.green,
  Service: Colors.amber,
  "Follow Up": Colors.textMuted,
};

export default Colors;
