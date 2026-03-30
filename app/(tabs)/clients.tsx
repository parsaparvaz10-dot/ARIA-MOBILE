import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, Alert,
  RefreshControl, Modal,
} from "react-native";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { PressableScale } from "@/components/PressableScale";
import { SlideSheet } from "@/components/SlideSheet";
import { Colors } from "@/constants/colors";
import { Client, useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { CallHistory } from "@/components/CallHistory";
import { formatPhone, initiateCall } from "@/utils/phone";
import {
  Phone, Clock, X, Search, Plus,
} from "lucide-react-native";

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return "?";
}

const getClientEngagement = (client: any, allCalls: any[]) => {
  const clientPhone = (client.phone || "").replace(/\D/g, "");
  const matchingCalls = allCalls.filter((call: any) => {
    const callPhone = (call.caller_phone || call.callerPhone || call.phone || "").replace(/\D/g, "");
    return clientPhone && callPhone && (
      clientPhone === callPhone ||
      clientPhone.endsWith(callPhone) ||
      callPhone.endsWith(clientPhone)
    );
  });

  const callCount = matchingCalls.length;

  let level: string;
  let color: string;
  let bg: string;

  if (callCount >= 5) {
    level = "VERY ENGAGED";
    color = "#22c55e";
    bg = "rgba(34,197,94,0.15)";
  } else if (callCount >= 3) {
    level = "ENGAGED";
    color = "#3b82f6";
    bg = "rgba(59,130,246,0.15)";
  } else if (callCount >= 1) {
    level = "ACTIVE";
    color = "#f59e0b";
    bg = "rgba(245,158,11,0.15)";
  } else {
    level = "NEW";
    color = "#6b7280";
    bg = "rgba(107,114,128,0.15)";
  }

  return { callCount, matchingCalls, level, color, bg };
};

interface InsightCard {
  type: "lease_expiring" | "no_contact";
  client: Client;
  daysLeft: number;
  message: string;
  tint: string;
}

function getClientInsights(clients: Client[]): InsightCard[] {
  const insights: InsightCard[] = [];
  const now = Date.now();
  clients.forEach((c) => {
    if (c.leaseExpiry) {
      const expiryDate = new Date(c.leaseExpiry);
      if (!isNaN(expiryDate.getTime())) {
        const daysLeft = Math.floor((expiryDate.getTime() - now) / 86400000);
        if (daysLeft > 0 && daysLeft <= 90) {
          insights.push({ type: "lease_expiring", client: c, daysLeft, message: `${c.name}'s lease expires in ${daysLeft} days`, tint: "#1a1a0a" });
        }
      }
    }
    const daysSinceContact = Math.floor((now - c.lastContact) / 86400000);
    if (daysSinceContact >= 60) {
      insights.push({ type: "no_contact", client: c, daysLeft: daysSinceContact, message: `Haven't spoken with ${c.name} in ${daysSinceContact} days`, tint: "#0a0a1a" });
    }
  });
  return insights.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 3);
}

function SkeletonRow() {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", backgroundColor: "#161618",
      marginHorizontal: 16, marginVertical: 4, borderRadius: 12, padding: 14, height: 68, gap: 12,
    }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#222" }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: "52%", height: 11, borderRadius: 6, backgroundColor: "#222" }} />
        <View style={{ width: "36%", height: 11, borderRadius: 6, backgroundColor: "#222" }} />
      </View>
    </View>
  );
}

export default function ClientsScreen() {
  const { clients, calls, addClient, deleteClient, loading, loadData } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPurchaseDate, setNewPurchaseDate] = useState("");

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  const [editingClientNotes, setEditingClientNotes] = useState(false);
  const [clientNotesText, setClientNotesText] = useState("");
  const [savingClientNotes, setSavingClientNotes] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const insights = useMemo(
    () => getClientInsights(clients).filter((i) => !dismissedInsights.includes(i.client.id + i.type)),
    [clients, dismissedInsights]
  );

  const sortedClients = [...clients]
    .filter((c) => {
      const q = search.toLowerCase();
      return !search || c.name.toLowerCase().includes(q) || (c.vehicle || "").toLowerCase().includes(q) || (c.phone || "").replace(/\D/g, "").includes(q.replace(/\D/g, ""));
    })
    .sort((a, b) => {
      const engA = getClientEngagement(a, calls);
      const engB = getClientEngagement(b, calls);
      return engB.callCount - engA.callCount;
    });

  const handleAddClient = async () => {
    if (!newName.trim()) { Alert.alert("Error", "Name is required"); return; }
    try {
      await addClient({ name: newName.trim(), phone: newPhone.trim(), vehicle: newVehicle.trim(), purchaseDate: newPurchaseDate || "Unknown", tags: [], notes: newNotes.trim() });
      setNewName(""); setNewPhone(""); setNewVehicle(""); setNewNotes(""); setNewPurchaseDate("");
      setShowAdd(false);
    } catch (err: any) {
      console.error("Failed to create client:", err);
      Alert.alert("Error", "Failed to save client. Please try again.");
    }
  };

  const handleClientPress = (client: Client) => {
    setSelectedClient(client);
    setClientNotesText(client.notes || "");
    setEditingClientNotes(false);
  };

  const handleDelete = (client: Client) => {
    Alert.alert("Remove Client", `Remove ${client.name} from your client list?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteClient(client.id) },
    ]);
  };

  if (loading && clients.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <Header />
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#161618", borderRadius: 10, paddingHorizontal: 12 }}>
            <Search size={15} color="#555" />
            <View style={{ flex: 1, height: 14, backgroundColor: "#222", borderRadius: 4 }} />
          </View>
        </View>
        {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Header />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 }}>
          {insights.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {insights.map((insight) => (
                <View key={insight.client.id + insight.type} style={{
                  width: 260, borderRadius: 12, padding: 14,
                  flexDirection: "row", alignItems: "flex-start", gap: 8,
                  backgroundColor: insight.tint, borderWidth: 1, borderColor: "#1e1e1e",
                }}>
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                    {insight.type === "lease_expiring"
                      ? <Clock size={14} color={Colors.amber} style={{ marginTop: 2 }} />
                      : <Phone size={14} color={Colors.blue} style={{ marginTop: 2 }} />
                    }
                    <Text style={{ fontSize: 13, color: "#ccc", flex: 1, lineHeight: 18 }}>{insight.message}</Text>
                  </View>
                  <Pressable onPress={() => setDismissedInsights((prev) => [...prev, insight.client.id + insight.type])}>
                    <X size={14} color="#555" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#161618", borderRadius: 10, paddingHorizontal: 12 }}>
            <Search size={15} color="#555" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search clients..."
              placeholderTextColor="#555"
              style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.text }}
            />
          </View>
        </View>

        {sortedClients.map((client) => {
          const initials = getInitials(client.name);
          const engagement = getClientEngagement(client, calls);

          return (
            <Pressable
              key={client.id}
              onPress={() => handleClientPress(client)}
              onLongPress={() => setShowMenuId(client.id)}
              style={{
                backgroundColor: "#161618", marginHorizontal: 16, marginVertical: 4, borderRadius: 12,
                padding: 14, gap: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22, backgroundColor: "#2a1a4a",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.primary }}>{initials}</Text>
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }} numberOfLines={1}>{client.name}</Text>
                  <Text style={{ fontSize: 13, color: "#888" }} numberOfLines={1}>{client.vehicle || "No vehicle on file"}</Text>
                  <Text style={{ fontSize: 14, color: "#C8A951", fontWeight: "500", marginTop: 2 }}>{formatPhone(client.phone)}</Text>
                  {(client.lastConversationSummary || client.notes)?.trim() ? (
                    <Text style={{ color: "#666", fontSize: 11, marginTop: 2, fontStyle: "italic" }} numberOfLines={2}>
                      {client.lastConversationSummary
                        ? client.lastConversationSummary.split("\n").filter((l: string) => l.startsWith("Caller:")).slice(-1)[0]?.replace("Caller: ", "") || client.lastConversationSummary.split("\n")[0]
                        : client.notes}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
                    <Pressable
                      onPress={(e: any) => { e.stopPropagation(); initiateCall(client.phone); }}
                      style={({ pressed }) => ({
                        flexDirection: "row" as const, alignItems: "center" as const,
                        backgroundColor: pressed ? "#2a2a2a" : "#1A1A1A",
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
                        opacity: client.phone ? (pressed ? 0.8 : 1) : 0.4,
                        minHeight: 36,
                      })}
                    >
                      <Phone size={16} color="#C8A951" />
                      <Text style={{ color: "#C8A951", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Call</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ backgroundColor: engagement.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: engagement.color, fontSize: 10, fontWeight: "800" }}>{engagement.level}</Text>
                  </View>
                  <Text style={{ color: "#888", fontSize: 11, marginTop: 4 }}>
                    {engagement.callCount} call{engagement.callCount !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {showMenuId === client.id && (
                <View style={{
                  position: "absolute", top: 0, right: 0, zIndex: 100,
                  backgroundColor: "#222", borderRadius: 12, padding: 4,
                  borderWidth: 1, borderColor: "#333", minWidth: 160,
                }}>
                  {[
                    { label: "Call", action: () => { if (client.phone) initiateCall(client.phone); } },
                    { label: "View Details", action: () => handleClientPress(client) },
                    { label: "Remove Client", action: () => handleDelete(client), danger: true },
                  ].map((item) => (
                    <Pressable key={item.label} onPress={() => { item.action(); setShowMenuId(null); }}
                      style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}
                    >
                      <Text style={{ fontSize: 14, color: (item as any).danger ? Colors.red : "#fff" }}>{item.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => setShowMenuId(null)} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 }}>
                    <Text style={{ fontSize: 14, color: "#888" }}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          );
        })}

        {sortedClients.length === 0 && (
          <View style={{ paddingTop: 40, paddingHorizontal: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 22, textAlign: "center" }}>
              {search ? "No clients found." : "Christopher's clients will appear here after importing contacts or converting leads."}
            </Text>
          </View>
        )}

        {!search && sortedClients.length > 0 && (
          <View style={{ paddingVertical: 24, paddingHorizontal: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: "#444" }}>Import Christopher's contacts to see all clients here.</Text>
          </View>
        )}
      </ScrollView>

      <PressableScale
        style={{
          position: "absolute", right: 20, bottom: 124, width: 56, height: 56, borderRadius: 28,
          backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
          zIndex: 100,
        }}
        onPress={() => setShowAdd(true)}
      >
        <Plus size={28} color="#fff" />
      </PressableScale>

      <SlideSheet visible={showAdd} onClose={() => setShowAdd(false)} title="New Client">
        <FormField label="Name *" value={newName} onChangeText={setNewName} placeholder="Full name" />
        <FormField label="Phone" value={newPhone} onChangeText={setNewPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" />
        <FormField label="Vehicle Purchased" value={newVehicle} onChangeText={setNewVehicle} placeholder="e.g. 2025 Cayenne S" />
        <FormField label="Purchase Date" value={newPurchaseDate} onChangeText={setNewPurchaseDate} placeholder="e.g. Jan 15, 2025" />
        <FormField label="Notes" value={newNotes} onChangeText={setNewNotes} placeholder="Client notes..." multiline numberOfLines={3} style={{ minHeight: 80 }} />
        <PressableScale
          style={{ backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: "center", justifyContent: "center", marginTop: 8 }}
          onPress={handleAddClient}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Add Client</Text>
        </PressableScale>
      </SlideSheet>

      <Modal visible={!!selectedClient} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{
            flex: 1, marginTop: 60, backgroundColor: "#111",
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
          }}>
            <View style={{
              flexDirection: "row", justifyContent: "space-between", alignItems: "center",
              padding: 20, borderBottomWidth: 1, borderBottomColor: "#222",
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                  {selectedClient?.name || "Client"}
                </Text>
                <Text style={{ color: "#C8A951", fontSize: 20, fontWeight: "600", marginTop: 4 }}>
                  {formatPhone(selectedClient?.phone)}
                </Text>
                {(() => {
                  if (!selectedClient) return null;
                  const eng = getClientEngagement(selectedClient, calls);
                  return (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <View style={{ backgroundColor: eng.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ color: eng.color, fontSize: 11, fontWeight: "800" }}>{eng.level}</Text>
                      </View>
                      <Text style={{ color: "#888", fontSize: 12 }}>{eng.callCount} interaction{eng.callCount !== 1 ? "s" : ""}</Text>
                    </View>
                  );
                })()}
              </View>
              <Pressable onPress={() => setSelectedClient(null)}>
                <Text style={{ color: "#888", fontSize: 16, padding: 8 }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              {(selectedClient?.vehicle_purchased || selectedClient?.vehicle) ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>VEHICLE</Text>
                  <Text style={{ color: "#fff", fontSize: 15 }}>
                    {selectedClient.vehicle_purchased || selectedClient.vehicle}
                  </Text>
                </View>
              ) : null}

              {selectedClient?.vehicleInterest ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>INTERESTED IN</Text>
                  <Text style={{ color: "#fff", fontSize: 15 }}>{selectedClient.vehicleInterest}</Text>
                </View>
              ) : null}

              {selectedClient?.email ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>EMAIL</Text>
                  <Text style={{ color: "#fff", fontSize: 15 }}>{selectedClient.email}</Text>
                </View>
              ) : null}

              {selectedClient?.lastConversationSummary ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: "#888", fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 }}>LAST CONVERSATION WITH ARIA</Text>
                  <View style={{
                    backgroundColor: "#1a1a2e", borderRadius: 10, padding: 14,
                    borderWidth: 1, borderColor: "#2a2a4e",
                  }}>
                    {selectedClient.lastConversationSummary.split("\n").map((line: string, i: number) => {
                      const isAria = line.startsWith("Aria:");
                      const isCaller = line.startsWith("Caller:");
                      return (
                        <Text key={i} style={{
                          color: isAria ? "#C8A951" : isCaller ? "#ddd" : "#999",
                          fontSize: 13, lineHeight: 20,
                          fontWeight: isAria ? "600" : "400",
                          marginBottom: 4,
                        }}>
                          {line}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: "#888", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>NOTES</Text>
                  {!editingClientNotes ? (
                    <Pressable onPress={() => setEditingClientNotes(true)}>
                      <Text style={{ color: "#C8A951", fontSize: 12, fontWeight: "600" }}>
                        {clientNotesText ? "Edit" : "+ Add Note"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {editingClientNotes ? (
                  <View>
                    <TextInput
                      value={clientNotesText}
                      onChangeText={setClientNotesText}
                      placeholder="Add notes about this client..."
                      placeholderTextColor="#555"
                      multiline
                      autoFocus
                      style={{
                        backgroundColor: "#1a1a1a", color: "#fff", borderRadius: 10,
                        padding: 14, fontSize: 14, lineHeight: 20, minHeight: 100, maxHeight: 200,
                        borderWidth: 1, borderColor: "#333",
                      }}
                    />
                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 10 }}>
                      <Pressable onPress={() => { setEditingClientNotes(false); setClientNotesText(selectedClient?.notes || ""); }}>
                        <Text style={{ color: "#888", fontSize: 14, padding: 8 }}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          if (!selectedClient) return;
                          setSavingClientNotes(true);
                          try {
                            await api.updateClient(selectedClient.id, { notes: clientNotesText });
                            setSelectedClient((prev) => prev ? { ...prev, notes: clientNotesText } : prev);
                            loadData();
                            setEditingClientNotes(false);
                          } catch (err: any) {
                            console.error("Failed to save client notes:", err);
                            Alert.alert("Error", "Could not save notes. Try again.");
                          } finally {
                            setSavingClientNotes(false);
                          }
                        }}
                        disabled={savingClientNotes}
                        style={{
                          backgroundColor: "#C8A951", paddingHorizontal: 16, paddingVertical: 8,
                          borderRadius: 8, opacity: savingClientNotes ? 0.6 : 1,
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                          {savingClientNotes ? "Saving..." : "Save"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : clientNotesText ? (
                  <Pressable onPress={() => setEditingClientNotes(true)}>
                    <View style={{
                      backgroundColor: "#1a1a1a", borderRadius: 10, padding: 14,
                      borderWidth: 1, borderColor: "#222",
                    }}>
                      <Text style={{ color: "#ddd", fontSize: 14, lineHeight: 20 }}>{clientNotesText}</Text>
                      <Text style={{ color: "#555", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>Tap to edit</Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setEditingClientNotes(true)}>
                    <View style={{
                      backgroundColor: "#1a1a1a", borderRadius: 10, padding: 14,
                      borderWidth: 1, borderColor: "#222",
                    }}>
                      <Text style={{ color: "#555", fontSize: 14, textAlign: "center" }}>No notes yet — tap to add</Text>
                    </View>
                  </Pressable>
                )}
              </View>

              <View style={{ gap: 8, marginBottom: 16 }}>
                <PressableScale
                  onPress={() => {
                    const phone = selectedClient?.phone;
                    setSelectedClient(null);
                    setTimeout(() => initiateCall(phone), 350);
                  }}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                    backgroundColor: "#1A1A1A", borderRadius: 8, padding: 14,
                  }}
                >
                  <Phone size={18} color="#C8A951" />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#C8A951" }}>
                    Call {selectedClient?.name?.split(" ")[0] || "Client"}
                  </Text>
                </PressableScale>
              </View>

              <CallHistory
                phone={selectedClient?.phone}
                calls={calls}
                contactName={selectedClient?.name}
              />

              <PressableScale
                onPress={() => {
                  Alert.alert("Remove Client", `Remove ${selectedClient?.name}?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => { deleteClient(selectedClient!.id); setSelectedClient(null); } },
                  ]);
                }}
                style={{ padding: 10, alignItems: "center", marginTop: 20 }}
              >
                <Text style={{ fontSize: 13, color: Colors.red, fontWeight: "600" }}>Remove Client</Text>
              </PressableScale>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
