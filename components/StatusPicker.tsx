import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Stage } from "@/context/AppContext";

const LEAD_STATUSES: Array<{ value: Stage; label: string; color: string }> = [
  { value: "New", label: "New", color: "#3B82F6" },
  { value: "Contacted", label: "Contacted", color: "#8B5CF6" },
  { value: "Appt Set", label: "Appt Set", color: "#F59E0B" },
  { value: "Negotiating", label: "Negotiating", color: "#F97316" },
  { value: "Closed", label: "Closed", color: "#22C55E" },
];

interface StatusPickerProps {
  leadId: string;
  currentStage: Stage;
  onStageChange: (leadId: string, newStage: Stage) => void;
}

export function StatusPicker({ leadId, currentStage, onStageChange }: StatusPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const current = LEAD_STATUSES.find((s) => s.value === currentStage) || LEAD_STATUSES[0];

  const handleSelect = (newStage: Stage) => {
    setShowModal(false);
    if (newStage !== currentStage) {
      onStageChange(leadId, newStage);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setShowModal(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: current.color + "44",
          backgroundColor: current.color + "22",
          gap: 5,
          alignSelf: "flex-start",
        }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: current.color }} />
        <Text style={{ fontSize: 11, fontWeight: "600", color: current.color }}>{current.label}</Text>
      </Pressable>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowModal(false)}
        >
          <View
            style={{
              backgroundColor: "#1A1A1A",
              borderRadius: 16,
              padding: 8,
              width: 240,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <Text
              style={{
                color: "#888",
                fontSize: 12,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              Update Status
            </Text>
            {LEAD_STATUSES.map((s) => (
              <Pressable
                key={s.value}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  gap: 10,
                  backgroundColor: s.value === currentStage ? s.color + "22" : "transparent",
                }}
                onPress={() => handleSelect(s.value)}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                <Text
                  style={{
                    color: s.value === currentStage ? s.color : "#CCC",
                    fontSize: 14,
                    flex: 1,
                    fontWeight: s.value === currentStage ? "700" : "400",
                  }}
                >
                  {s.label}
                </Text>
                {s.value === currentStage && (
                  <Text style={{ color: s.color, fontSize: 16, fontWeight: "700" }}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
