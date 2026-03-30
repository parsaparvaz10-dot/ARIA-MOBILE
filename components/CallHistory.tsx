import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Phone, ChevronDown, ChevronUp } from "lucide-react-native";
import { phonesMatch } from "@/utils/phone";

interface CallHistoryProps {
  phone: string | null | undefined;
  calls: any[];
  contactName?: string;
}

function formatCallDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} sec`;
  return s > 0 ? `${m} min ${s} sec` : `${m} min`;
}

function TranscriptBlock({ transcript, contactName }: { transcript: string; contactName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = String(transcript).split("\n").filter((l) => l.trim());
  const needsCollapse = lines.length > 10;
  const displayLines = needsCollapse && !expanded ? lines.slice(0, 5) : lines;

  return (
    <View style={{ backgroundColor: "#0a0a0a", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#1a1a1a", marginTop: 8 }}>
      {displayLines.map((line, i) => {
        const isAria = /^(aria|agent|assistant):/i.test(line);
        const isCaller = /^(caller|customer|user):/i.test(line);
        const cleanedLine = line.replace(/^(aria|agent|assistant|caller|customer|user):\s*/i, "");

        return line.trim() ? (
          <View key={i} style={{ marginBottom: 8 }}>
            {(isAria || isCaller) ? (
              <>
                <Text style={{ color: isAria ? "#a855f7" : "#3b82f6", fontSize: 10, fontWeight: "700", marginBottom: 1 }}>
                  {isAria ? "ARIA" : (contactName?.split(" ")[0]?.toUpperCase() || "CALLER")}
                </Text>
                <Text style={{ color: "#ddd", fontSize: 13, lineHeight: 18 }}>{cleanedLine}</Text>
              </>
            ) : (
              <Text style={{ color: "#ccc", fontSize: 13, lineHeight: 18 }}>{line}</Text>
            )}
          </View>
        ) : null;
      })}
      {needsCollapse && (
        <Pressable onPress={() => setExpanded(!expanded)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
          {expanded ? <ChevronUp size={14} color="#C8A951" /> : <ChevronDown size={14} color="#C8A951" />}
          <Text style={{ color: "#C8A951", fontSize: 13, fontWeight: "600" }}>
            {expanded ? "Show less" : "Show full transcript"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function CallHistory({ phone, calls, contactName }: CallHistoryProps) {
  const matchingCalls = calls
    .filter((call: any) => {
      const callPhone = call.caller_phone || call.callerPhone || call.phone || "";
      return phonesMatch(phone, callPhone);
    })
    .sort((a: any, b: any) =>
      new Date(b.started_at || b.created_at).getTime() - new Date(a.started_at || a.created_at).getTime()
    );

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Phone size={14} color="#888" />
        <Text style={{ color: "#888", fontSize: 12, fontWeight: "700" }}>CALL HISTORY</Text>
        {matchingCalls.length > 0 && (
          <View style={{ backgroundColor: "#222", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color: "#888", fontSize: 11 }}>{matchingCalls.length}</Text>
          </View>
        )}
      </View>

      {matchingCalls.length === 0 ? (
        <Text style={{ color: "#555", fontSize: 14, fontStyle: "italic", textAlign: "center", paddingVertical: 16 }}>
          No calls yet
        </Text>
      ) : (
        matchingCalls.map((call: any, idx: number) => {
          const dateStr = call.started_at || call.created_at;
          const duration = call.duration_seconds || call.duration || 0;
          const direction = call.direction || "inbound";
          const transcript = call.transcript
            ? (typeof call.transcript === "string" ? call.transcript : JSON.stringify(call.transcript, null, 2))
            : null;

          return (
            <View key={call.id || idx} style={{ backgroundColor: "#1a1a1e", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#222" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                    {dateStr ? formatCallDate(dateStr) : "Unknown date"}
                  </Text>
                  {duration > 0 && (
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      {formatDuration(duration)}
                    </Text>
                  )}
                </View>
                <View style={{
                  backgroundColor: direction === "outbound" ? "#22c55e22" : "#3b82f622",
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                }}>
                  <Text style={{
                    fontSize: 10, fontWeight: "700",
                    color: direction === "outbound" ? "#22c55e" : "#3b82f6",
                  }}>
                    {direction === "outbound" ? "OUTBOUND" : "INBOUND"}
                  </Text>
                </View>
              </View>

              {transcript ? (
                <TranscriptBlock transcript={transcript} contactName={contactName} />
              ) : (
                <Text style={{ color: "#555", fontSize: 13, fontStyle: "italic", marginTop: 4 }}>
                  Transcript processing...
                </Text>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}
