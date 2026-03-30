import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator } from "react-native";
import { Phone, X } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { onCallRequest, executeCall, type CallRequest } from "@/utils/phone";

type CallState = "confirm" | "connecting" | "success" | "error" | "timeout";

export function CallConfirmModal() {
  const [request, setRequest] = useState<CallRequest | null>(null);
  const [state, setState] = useState<CallState>("confirm");
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callIdRef = useRef(0);

  useEffect(() => {
    return onCallRequest((req) => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      callIdRef.current++;
      setRequest(req);
      setState("confirm");
    });
  }, []);

  const handleCall = useCallback(() => {
    if (!request) return;
    setState("connecting");
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    const thisCallId = ++callIdRef.current;
    safetyTimerRef.current = setTimeout(() => {
      if (callIdRef.current === thisCallId) setState("timeout");
    }, 15000);
    executeCall(request.to)
      .then((result) => {
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        if (callIdRef.current === thisCallId) setState(result);
      })
      .catch(() => {
        if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
        if (callIdRef.current === thisCallId) setState("error");
      });
  }, [request]);

  const handleClose = useCallback(() => {
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    callIdRef.current++;
    setRequest(null);
    setState("confirm");
  }, []);

  if (!request) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable onPress={handleClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 32 }}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: "#1a1a1e", borderRadius: 16, padding: 24, width: "100%", maxWidth: 340, borderWidth: 1, borderColor: "#333" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>Connect Call</Text>
            <Pressable onPress={handleClose} hitSlop={12} style={{ padding: 4 }}>
              <X size={20} color="#666" />
            </Pressable>
          </View>

          {state === "confirm" && (
            <>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#1a3a1a", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Phone size={28} color="#4ade80" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "600", color: "#fff", marginBottom: 4 }}>{request.formatted}</Text>
                <Text style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20 }}>
                  Your phone will ring. When you pick up, you'll be connected to the customer.
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                <Pressable
                  onPress={handleCall}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#15803d" : "#16a34a",
                    borderRadius: 10, paddingVertical: 14, alignItems: "center",
                    flexDirection: "row", justifyContent: "center", gap: 8,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Phone size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Call Now</Text>
                </Pressable>
                <Pressable onPress={handleClose} style={{ paddingVertical: 12, alignItems: "center" }}>
                  <Text style={{ color: "#888", fontSize: 15 }}>Cancel</Text>
                </Pressable>
              </View>
            </>
          )}

          {state === "connecting" && (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ color: "#aaa", fontSize: 15, marginTop: 12 }}>Connecting call...</Text>
            </View>
          )}

          {state === "success" && (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#1a3a1a", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Phone size={28} color="#4ade80" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#4ade80", marginBottom: 4 }}>Call Connected</Text>
              <Text style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
                Your phone will ring shortly. Pick up to connect with the customer.
              </Text>
              <Pressable onPress={handleClose} style={{ backgroundColor: "#222", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 }}>
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Done</Text>
              </Pressable>
            </View>
          )}

          {state === "timeout" && (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#f59e0b", marginBottom: 8 }}>Connection Timed Out</Text>
              <Text style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
                The call took too long to connect. Please try again.
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={handleCall}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#15803d" : "#16a34a",
                    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24,
                    flexDirection: "row", alignItems: "center", gap: 6,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Phone size={16} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Retry</Text>
                </Pressable>
                <Pressable onPress={handleClose} style={{ backgroundColor: "#222", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 }}>
                  <Text style={{ color: "#888", fontSize: 15 }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {state === "error" && (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#ef4444", marginBottom: 8 }}>Call Failed</Text>
              <Text style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
                Could not connect the call. Check your connection and try again.
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={handleCall}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#15803d" : "#16a34a",
                    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24,
                    flexDirection: "row", alignItems: "center", gap: 6,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Phone size={16} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Retry</Text>
                </Pressable>
                <Pressable onPress={handleClose} style={{ backgroundColor: "#222", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 }}>
                  <Text style={{ color: "#888", fontSize: 15 }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
