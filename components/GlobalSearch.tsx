import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Search, X, Clock, ChevronRight, User, CircleUser, Calendar } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { router } from "expo-router";

interface SearchResult {
  id: string;
  type: "lead" | "client" | "appointment";
  title: string;
  subtitle: string;
  icon: "lead" | "client" | "appointment";
}

export function GlobalSearch({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { leads, clients, appointments } = useApp();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [visible]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text), 300);
  }, []);

  const q = debouncedQuery.toLowerCase();
  const shouldSearch = q.length >= 3;

  const leadResults: SearchResult[] = shouldSearch
    ? leads
        .filter((l) =>
          l.name?.toLowerCase().includes(q) ||
          l.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          l.vehicle?.toLowerCase().includes(q)
        )
        .map((l) => ({
          id: `lead-${l.id}`,
          type: "lead" as const,
          title: l.name && l.name !== "Unknown" ? l.name : l.phone || "Unknown",
          subtitle: l.vehicle || l.stage,
          icon: "lead" as const,
        }))
    : [];

  const clientResults: SearchResult[] = shouldSearch
    ? clients
        .filter((c) =>
          c.name?.toLowerCase().includes(q) ||
          c.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          c.email?.toLowerCase().includes(q) ||
          c.vehicle?.toLowerCase().includes(q)
        )
        .map((c) => ({
          id: `client-${c.id}`,
          type: "client" as const,
          title: c.name,
          subtitle: c.vehicle || c.phone || "",
          icon: "client" as const,
        }))
    : [];

  const apptResults: SearchResult[] = shouldSearch
    ? appointments
        .filter((a) =>
          a.title?.toLowerCase().includes(q) ||
          a.type?.toLowerCase().includes(q) ||
          a.vehicle?.toLowerCase().includes(q)
        )
        .map((a) => ({
          id: `appt-${a.id}`,
          type: "appointment" as const,
          title: a.title,
          subtitle: a.type + " · " + new Date(a.date).toLocaleDateString(),
          icon: "appointment" as const,
        }))
    : [];

  const totalResults = leadResults.length + clientResults.length + apptResults.length;

  const handleResultTap = (result: SearchResult) => {
    if (query.trim()) {
      const updated = [query.trim(), ...recentSearches.filter((s) => s !== query.trim())].slice(0, 5);
      setRecentSearches(updated);
    }
    onClose();
    if (result.type === "lead") router.navigate("/(tabs)/leads");
    else if (result.type === "client") router.navigate("/(tabs)/clients");
    else router.navigate("/(tabs)/calendar");
  };

  const ResultIcon = ({ type }: { type: string }) => {
    if (type === "lead") return <User size={16} color={Colors.primary} />;
    if (type === "client") return <CircleUser size={16} color={Colors.primary} />;
    return <Calendar size={16} color={Colors.primary} />;
  };

  const renderResultSection = (title: string, results: SearchResult[]) => {
    if (results.length === 0) return null;
    return (
      <View>
        <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, color: Colors.primary, paddingTop: 16, paddingBottom: 8 }}>
          {title} ({results.length})
        </Text>
        {results.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => handleResultTap(r)}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${Colors.primary}18`, alignItems: "center", justifyContent: "center" }}>
              <ResultIcon type={r.icon} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }} numberOfLines={1}>{r.title}</Text>
              <Text style={{ fontSize: 12, color: "#888" }}>{r.subtitle}</Text>
            </View>
            <ChevronRight size={14} color="#444" />
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(9,9,11,0.97)",
        paddingTop: 77,
        paddingHorizontal: 16,
      }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: "#161618",
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: "#2a2a2e",
        }}>
          <Search size={18} color={Colors.primary} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search leads, clients, appointments..."
            placeholderTextColor="#555"
            style={{ flex: 1, fontSize: 16, color: "#fff" }}
          />
          <Pressable onPress={onClose}>
            <X size={22} color="#888" />
          </Pressable>
        </View>

        {!shouldSearch && query.length > 0 && query.length < 3 && (
          <Text style={{ fontSize: 13, color: "#555", textAlign: "center", paddingTop: 24 }}>
            Type at least 3 characters to search
          </Text>
        )}

        {!shouldSearch && recentSearches.length > 0 && (
          <View style={{ paddingTop: 20, gap: 6 }}>
            <Text style={{ fontSize: 11, color: "#444", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              RECENT SEARCHES
            </Text>
            {recentSearches.map((s) => (
              <Pressable
                key={s}
                onPress={() => { setQuery(s); setDebouncedQuery(s); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}
              >
                <Clock size={14} color="#555" />
                <Text style={{ fontSize: 14, color: "#888" }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {shouldSearch && totalResults === 0 && (
          <View style={{ alignItems: "center", paddingTop: 80, gap: 12 }}>
            <Search size={40} color="#333" />
            <Text style={{ fontSize: 15, color: "#555" }}>No results for "{debouncedQuery}"</Text>
          </View>
        )}

        {shouldSearch && totalResults > 0 && (
          <ScrollView style={{ flex: 1, paddingTop: 8 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {renderResultSection("Leads", leadResults)}
            {renderResultSection("Clients", clientResults)}
            {renderResultSection("Appointments", apptResults)}
          </ScrollView>
        )}
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
