import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, ScrollView, Alert,
  RefreshControl, Modal,
} from "react-native";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { PressableScale } from "@/components/PressableScale";
import { SlideSheet } from "@/components/SlideSheet";
import { Colors } from "@/constants/colors";
import { Lead, useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { CallHistory } from "@/components/CallHistory";
import { formatPhone, initiateCall } from "@/utils/phone";
import { relativeTime } from "@/utils/time";
import {
  Phone, UserPlus, Search, Plus
} from "lucide-react-native";

function getLeadDisplayName(lead: any): string {
  if (!lead) return "Unknown";
  const hasName = !!(lead.name?.trim()) && lead.name !== "Unknown";
  return hasName ? lead.name : formatPhone(lead.phone);
}

const getLeadPriority = (lead: any) => {
  const created = lead.createdAt || new Date(lead.created_at).getTime();
  const hoursAgo = (Date.now() - created) / (1000 * 60 * 60);

  if (hoursAgo <= 1) return { label: "JUST NOW", color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
  if (hoursAgo <= 6) return { label: "HOT", color: "#f97316", bg: "rgba(249,115,22,0.15)" };
  if (hoursAgo <= 12) return { label: "WARM", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
  if (hoursAgo <= 24) return { label: "TODAY", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" };
  if (hoursAgo <= 48) return { label: "YESTERDAY", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" };
  return { label: `${Math.floor(hoursAgo / 24)}D AGO`, color: "#6b7280", bg: "rgba(107,114,128,0.15)" };
};

function SkeletonRow() {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", backgroundColor: "#161618",
      marginHorizontal: 16, marginVertical: 4, borderRadius: 12, padding: 14, height: 68, gap: 12,
    }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#222" }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: "55%", height: 11, borderRadius: 6, backgroundColor: "#222" }} />
        <View style={{ width: "38%", height: 11, borderRadius: 6, backgroundColor: "#222" }} />
      </View>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#222" }} />
    </View>
  );
}

export default function LeadsScreen() {
  const appCtx = useApp();
  const { leads, calls, addLead, deleteLead, loading, loadData } = appCtx;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const sortedLeads = [...leads].sort((a, b) =>
    b.createdAt - a.createdAt
  );

  const filtered = sortedLeads.filter((l) => {
    const q = search.toLowerCase();
    return !search || l.name?.toLowerCase().includes(q) || l.vehicle?.toLowerCase().includes(q) || l.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, ""));
  });

  const handleAddLead = () => {
    if (!newName.trim() && !newPhone.trim()) { Alert.alert("Error", "Name or phone required"); return; }
    addLead({ name: newName.trim() || "Unknown", phone: newPhone.trim(), vehicle: newVehicle.trim(), stage: "New", isHot: false, notes: newNotes.trim() });
    setNewName(""); setNewPhone(""); setNewVehicle(""); setNewNotes("");
    setShowAdd(false);
  };

  const handleMarkAsClient = (lead: Lead) => {
    Alert.alert("Move to Clients", `Move ${getLeadDisplayName(lead)} to your Clients list?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Move", onPress: async () => {
        try {
          await appCtx.addClient({
            name: lead.name || "Unknown",
            phone: lead.phone,
            email: lead.email,
            vehicle: lead.vehicle,
            purchaseDate: "Unknown",
            tags: [],
            notes: lead.notes,
          });
          deleteLead(lead.id);
        } catch (err) {
          console.error("Failed to convert lead to client:", err);
          Alert.alert("Error", "Failed to save client. Please try again.");
        }
      }},
    ]);
  };

  const handleLeadPress = (lead: Lead) => {
    setSelectedLead(lead);
    setNotesText(lead.notes || "");
    setEditingNotes(false);
  };

  if (loading && leads.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <Header />
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#111", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20 }}>
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                {i > 1 && <View style={{ width: 1, height: 36, backgroundColor: "#222" }} />}
                <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: "#222" }} />
                  <View style={{ width: 30 + i * 10, height: 11, borderRadius: 6, backgroundColor: "#222" }} />
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
        {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
      </View>
    );
  }

  const hotCount = sortedLeads.filter(l => {
    const hrs = (Date.now() - l.createdAt) / 3600000;
    return hrs <= 6;
  }).length;
  const warmCount = sortedLeads.filter(l => {
    const hrs = (Date.now() - l.createdAt) / 3600000;
    return hrs > 6 && hrs <= 12;
  }).length;
  const todayCount = sortedLeads.filter(l => {
    const hrs = (Date.now() - l.createdAt) / 3600000;
    return hrs <= 24;
  }).length;

  const callbacksNeeded = sortedLeads.filter((l) => {
    const hrs = (Date.now() - l.createdAt) / 3600000;
    return hrs <= 6;
  });
  const topHotLead = callbacksNeeded.find((l) => l.phone);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Header />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, gap: 12 }}>
          <View style={{ backgroundColor: "#1a1a2e", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
            {callbacksNeeded.length > 0 ? (
              <>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff", lineHeight: 22 }}>
                  You have {callbacksNeeded.length} lead{callbacksNeeded.length > 1 ? "s" : ""} waiting for a callback
                </Text>
                <PressableScale
                  onPress={() => {
                    const phone = callbacksNeeded.find((l) => l.phone)?.phone;
                    if (phone) initiateCall(phone);
                  }}
                  style={{ alignSelf: "flex-start", backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Start calling →</Text>
                </PressableScale>
              </>
            ) : (
              <Text style={{ fontSize: 14, color: "#888" }}>All caught up — no urgent callbacks right now</Text>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 12, paddingVertical: 8 }}>
            <Text style={{ color: "#f97316", fontSize: 13, fontWeight: "700" }}>{hotCount} HOT</Text>
            <Text style={{ color: "#f59e0b", fontSize: 13, fontWeight: "700" }}>{warmCount} WARM</Text>
            <Text style={{ color: "#3b82f6", fontSize: 13, fontWeight: "700" }}>{todayCount} TODAY</Text>
            <Text style={{ color: "#666", fontSize: 13 }}>{sortedLeads.length} TOTAL</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#161618", borderRadius: 10, paddingHorizontal: 12 }}>
              <Search size={15} color={Colors.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search leads..."
                placeholderTextColor="#555"
                style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: Colors.text }}
              />
            </View>
          </View>
        </View>

        {filtered.map((lead) => {
          const priority = getLeadPriority(lead);
          const hasName = !!(lead.name?.trim()) && lead.name !== "Unknown";
          const displayName = getLeadDisplayName(lead);
          const initials = hasName
            ? lead.name.trim().split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
            : "?";
          return (
            <Pressable
              key={lead.id}
              onPress={() => handleLeadPress(lead)}
              onLongPress={() => setShowMenuId(lead.id)}
              style={{
                backgroundColor: "#161618", marginHorizontal: 16, marginVertical: 4, borderRadius: 12,
                padding: 14, gap: 12, borderLeftWidth: 3, borderLeftColor: priority.color,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#2a1a4a", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.primary }}>{initials}</Text>
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }} numberOfLines={1}>{displayName}</Text>
                  {lead.vehicle ? <Text style={{ fontSize: 13, color: "#888" }} numberOfLines={1}>{lead.vehicle}</Text> : null}
                  <Text style={{ fontSize: 14, color: "#C8A951", fontWeight: "500", marginTop: 2 }}>{formatPhone(lead.phone)}</Text>
                  {(lead.lastConversationSummary || lead.notes)?.trim() ? (
                    <Text style={{ color: "#666", fontSize: 11, marginTop: 2, fontStyle: "italic" }} numberOfLines={2}>
                      {lead.lastConversationSummary
                        ? lead.lastConversationSummary.split("\n").filter((l: string) => l.startsWith("Caller:")).slice(-1)[0]?.replace("Caller: ", "") || lead.lastConversationSummary.split("\n")[0]
                        : lead.notes}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
                    <Pressable
                      onPress={(e: any) => { e.stopPropagation(); initiateCall(lead.phone); }}
                      style={({ pressed }) => ({
                        flexDirection: "row" as const, alignItems: "center" as const,
                        backgroundColor: pressed ? "#2a2a2a" : "#1A1A1A",
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6,
                        opacity: lead.phone ? (pressed ? 0.8 : 1) : 0.4,
                        minHeight: 36,
                      })}
                    >
                      <Phone size={16} color="#C8A951" />
                      <Text style={{ color: "#C8A951", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Call</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ backgroundColor: priority.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: priority.color, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>{priority.label}</Text>
                  </View>
                  <Text style={{ color: "#666", fontSize: 11, marginTop: 4 }}>{relativeTime(lead.createdAt)}</Text>
                </View>
              </View>

              {showMenuId === lead.id && (
                <View style={{
                  position: "absolute", top: 0, right: 0, zIndex: 100,
                  backgroundColor: "#222", borderRadius: 12, padding: 4,
                  borderWidth: 1, borderColor: "#333", minWidth: 160,
                }}>
                  {[
                    { label: "Call", action: () => { if (lead.phone) initiateCall(lead.phone); } },
                    { label: "View Details", action: () => handleLeadPress(lead) },
                    { label: "Mark as Client", action: () => handleMarkAsClient(lead) },
                    { label: "Delete Lead", action: () => {
                      Alert.alert("Delete Lead", `Remove ${displayName}?`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => deleteLead(lead.id) },
                      ]);
                    }, danger: true },
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

        {filtered.length === 0 && (
          <View style={{ paddingTop: 60, paddingHorizontal: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: "#555", lineHeight: 22, textAlign: "center" }}>
              {search ? "No leads found" : "No leads yet. When someone calls and Christopher isn't available, Aria captures the lead here automatically."}
            </Text>
          </View>
        )}
      </ScrollView>

      {topHotLead && (
        <PressableScale
          onPress={() => initiateCall(topHotLead.phone)}
          style={{
            position: "absolute", right: 20, bottom: 194, width: 44, height: 44, borderRadius: 22,
            backgroundColor: Colors.red, alignItems: "center", justifyContent: "center",
            zIndex: 100,
          }}
        >
          <Phone size={20} color="#fff" />
        </PressableScale>
      )}

      <PressableScale
        style={{
          position: "absolute", right: 20, bottom: 124, width: 56, height: 56, borderRadius: 28,
          backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
          zIndex: 100,
        }}
        onPress={() => setShowAdd(true)}
      >
        <Plus size={28} color={Colors.white} />
      </PressableScale>

      <SlideSheet visible={showAdd} onClose={() => setShowAdd(false)} title="New Lead">
        <FormField label="Name" value={newName} onChangeText={setNewName} placeholder="Full name" />
        <FormField label="Phone" value={newPhone} onChangeText={setNewPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" />
        <FormField label="Vehicle Interest" value={newVehicle} onChangeText={setNewVehicle} placeholder="e.g. 2025 Taycan 4S" />
        <FormField label="Notes" value={newNotes} onChangeText={setNewNotes} placeholder="Additional notes..." multiline numberOfLines={3} style={{ minHeight: 80 }} />
        <PressableScale
          style={{ backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: "center", justifyContent: "center", marginTop: 8 }}
          onPress={handleAddLead}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Add Lead</Text>
        </PressableScale>
      </SlideSheet>

      <Modal visible={!!selectedLead} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{
            flex: 1, marginTop: 60, backgroundColor: "#111",
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
          }}>
            <View style={{
              flexDirection: "row", justifyContent: "space-between", alignItems: "center",
              padding: 20, borderBottomWidth: 1, borderBottomColor: "#222",
            }}>
              <View>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                  {getLeadDisplayName(selectedLead)}
                </Text>
                <Text style={{ color: "#C8A951", fontSize: 20, fontWeight: "600", marginTop: 4 }}>
                  {formatPhone(selectedLead?.phone)}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedLead(null)}>
                <Text style={{ color: "#888", fontSize: 16, padding: 8 }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
              {selectedLead?.vehicle ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>INTERESTED IN</Text>
                  <Text style={{ color: "#fff", fontSize: 15 }}>{selectedLead.vehicle}</Text>
                </View>
              ) : null}

              {(() => {
                const p = selectedLead ? getLeadPriority(selectedLead) : null;
                return p ? (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>PRIORITY</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ backgroundColor: p.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: p.color, fontSize: 12, fontWeight: "800" }}>{p.label}</Text>
                      </View>
                      <Text style={{ color: "#999", fontSize: 13 }}>{relativeTime(selectedLead?.createdAt || 0)}</Text>
                    </View>
                  </View>
                ) : null;
              })()}

              {selectedLead?.lastConversationSummary ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: "#888", fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 }}>LAST CONVERSATION WITH ARIA</Text>
                  <View style={{
                    backgroundColor: "#1a1a2e", borderRadius: 10, padding: 14,
                    borderWidth: 1, borderColor: "#2a2a4e",
                  }}>
                    {selectedLead.lastConversationSummary.split("\n").map((line: string, i: number) => {
                      const isAria = line.startsWith("Aria:");
                      const isCaller = line.startsWith("Caller:");
                      return (
                        <Text key={i} style={{
                          color: isAria ? "#a855f7" : isCaller ? "#ddd" : "#999",
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

              {selectedLead?.budget ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>BUDGET</Text>
                  <Text style={{ color: "#fff", fontSize: 15 }}>{selectedLead.budget}</Text>
                </View>
              ) : null}

              {selectedLead?.email ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>EMAIL</Text>
                  <Text style={{ color: "#fff", fontSize: 15 }}>{selectedLead.email}</Text>
                </View>
              ) : null}

              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: "#888", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>NOTES</Text>
                  {!editingNotes ? (
                    <Pressable onPress={() => setEditingNotes(true)}>
                      <Text style={{ color: "#a855f7", fontSize: 12, fontWeight: "600" }}>
                        {notesText ? "Edit" : "+ Add Note"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {editingNotes ? (
                  <View>
                    <TextInput
                      value={notesText}
                      onChangeText={setNotesText}
                      placeholder="Add notes about this lead..."
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
                      <Pressable onPress={() => { setEditingNotes(false); setNotesText(selectedLead?.notes || ""); }}>
                        <Text style={{ color: "#888", fontSize: 14, padding: 8 }}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          if (!selectedLead) return;
                          setSavingNotes(true);
                          try {
                            await api.updateLeadNotes(selectedLead.id, notesText);
                            setSelectedLead((prev) => prev ? { ...prev, notes: notesText } : prev);
                            loadData();
                            setEditingNotes(false);
                          } catch (err: any) {
                            console.error("Failed to save notes:", err);
                            Alert.alert("Error", "Could not save notes. Try again.");
                          } finally {
                            setSavingNotes(false);
                          }
                        }}
                        disabled={savingNotes}
                        style={{
                          backgroundColor: "#a855f7", paddingHorizontal: 16, paddingVertical: 8,
                          borderRadius: 8, opacity: savingNotes ? 0.6 : 1,
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                          {savingNotes ? "Saving..." : "Save"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : notesText ? (
                  <Pressable onPress={() => setEditingNotes(true)}>
                    <View style={{
                      backgroundColor: "#1a1a1a", borderRadius: 10, padding: 14,
                      borderWidth: 1, borderColor: "#222",
                    }}>
                      {selectedLead?.call_id && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <Text style={{ color: "#a855f7", fontSize: 11, fontWeight: "700" }}>CAPTURED BY ARIA</Text>
                        </View>
                      )}
                      <Text style={{ color: "#ddd", fontSize: 14, lineHeight: 20 }}>{notesText}</Text>
                      <Text style={{ color: "#555", fontSize: 11, marginTop: 8, fontStyle: "italic" }}>Tap to edit</Text>
                    </View>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setEditingNotes(true)}>
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
                    const phone = selectedLead?.phone;
                    setSelectedLead(null);
                    setTimeout(() => initiateCall(phone), 350);
                  }}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                    backgroundColor: "#1A1A1A", borderRadius: 8, padding: 14,
                  }}
                >
                  <Phone size={18} color="#C8A951" />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#C8A951" }}>
                    Call {selectedLead?.name?.split(" ")[0] || "Lead"}
                  </Text>
                </PressableScale>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <PressableScale
                  onPress={() => handleMarkAsClient(selectedLead!)}
                  style={{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: 10, borderRadius: 10, borderWidth: 1, borderColor: `${Colors.primary}44`,
                    backgroundColor: `${Colors.primary}10`,
                  }}
                >
                  <UserPlus size={14} color={Colors.primary} />
                  <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: "600" }}>Mark as Client</Text>
                </PressableScale>
              </View>

              <CallHistory
                phone={selectedLead?.phone}
                calls={calls}
                contactName={selectedLead?.name}
              />

              <PressableScale
                onPress={() => {
                  Alert.alert("Delete Lead", `Remove ${getLeadDisplayName(selectedLead)}?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => { deleteLead(selectedLead!.id); setSelectedLead(null); } },
                  ]);
                }}
                style={{ padding: 10, alignItems: "center", marginTop: 20 }}
              >
                <Text style={{ fontSize: 13, color: Colors.red, fontWeight: "600" }}>Delete Lead</Text>
              </PressableScale>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
