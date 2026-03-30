import { router } from "expo-router";
import React, { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Search, Bell } from "lucide-react-native";
import { Avatar } from "@/components/Avatar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, leads, logout } = useApp();
  const [searchVisible, setSearchVisible] = useState(false);

  const recentLeads = leads.filter(
    (l) => (Date.now() - l.createdAt) / 3.6e6 <= 1
  ).length;
  const hasNewActivity = recentLeads > 0;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => { logout(); router.replace("/"); } },
    ]);
  };

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      paddingTop: 67,
      paddingBottom: 14,
      paddingHorizontal: 20,
      backgroundColor: Colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: "#1a1a1a",
    }}>
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", color: Colors.primary, letterSpacing: -0.5 }}>
          {title ?? "Aria"}
        </Text>
        {user && <Text style={{ fontSize: 12, color: "#888" }}>{user.name}</Text>}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Pressable onPress={() => setSearchVisible(true)} style={{ padding: 4 }}>
          <Search size={22} color="#888" />
        </Pressable>
        <View>
          <Bell size={22} color="#888" />
          {hasNewActivity && (
            <View style={{
              position: "absolute", top: 0, right: 0,
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: Colors.red,
              borderWidth: 1.5, borderColor: Colors.bg,
            }} />
          )}
        </View>
        <Pressable onPress={handleLogout}>
          <Avatar name={user?.name ?? "?"} size={36} color={Colors.primary} />
        </Pressable>
      </View>
      <GlobalSearch visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </View>
  );
}
