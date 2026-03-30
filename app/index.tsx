import { router } from "expo-router";
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function AuthScreen() {
  const { user } = useApp();

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)/leads");
    }
  }, [user]);

  return (
    <View style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.bg,
      gap: 16,
    }}>
      <View style={{
        width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 40, fontWeight: "800", color: "#fff" }}>A</Text>
      </View>
      <Text style={{ fontSize: 32, fontWeight: "800", color: Colors.text, letterSpacing: -0.5 }}>Aria CRM</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 12 }} />
      <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Loading your data...</Text>
    </View>
  );
}
