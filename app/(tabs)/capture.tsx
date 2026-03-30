import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl, Modal, TextInput, FlatList } from "react-native";
import { Header } from "@/components/Header";
import { Colors } from "@/constants/colors";
import { formatPhone, initiateCall } from "@/utils/phone";
import { relativeTime } from "@/utils/time";
import { api } from "@/lib/api";
import { Phone, MessageCircle, ArrowLeft } from "lucide-react-native";

interface Conversation {
  customer_phone: string;
  customer_name: string;
  last_message: string;
  last_message_at: string;
  last_direction: string;
  message_count: number;
  lead_id: string | null;
  client_id: string | null;
}

interface Message {
  id: string;
  direction: string;
  body: string;
  created_at: string;
  from_number?: string;
  to_number?: string;
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setError(false);
      const data = await api.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const openConversation = async (convo: Conversation) => {
    setSelectedConvo(convo);
    setMessages([]);
    setMessagesError(false);
    setLoadingMessages(true);
    try {
      const data = await api.getConversation(convo.customer_phone);
      const msgs = Array.isArray(data) ? data : (data?.messages || []);
      setMessages(msgs);
    } catch {
      setMessagesError(true);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <Header />
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{
            flexDirection: "row", alignItems: "center", backgroundColor: "#161618",
            marginHorizontal: 16, marginVertical: 4, borderRadius: 12, padding: 14, height: 68, gap: 12,
          }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#222" }} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ width: "55%", height: 11, borderRadius: 6, backgroundColor: "#222" }} />
              <View style={{ width: "75%", height: 11, borderRadius: 6, backgroundColor: "#222" }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Header />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {error ? (
          <View style={{ alignItems: "center", paddingTop: 80, gap: 10, paddingHorizontal: 40 }}>
            <MessageCircle size={48} color="#555" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#555" }}>Could not load messages</Text>
            <Text style={{ fontSize: 14, color: "#444", textAlign: "center", lineHeight: 22 }}>
              Check your connection and pull down to retry.
            </Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80, gap: 10, paddingHorizontal: 40 }}>
            <MessageCircle size={48} color="#333" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#555" }}>No messages yet</Text>
            <Text style={{ fontSize: 14, color: "#444", textAlign: "center", lineHeight: 22 }}>
              When customers text the business number, their messages will appear here.
            </Text>
          </View>
        ) : (
          conversations.map((convo) => {
            const initial = (convo.customer_name || "?")[0].toUpperCase();
            return (
              <Pressable
                key={convo.customer_phone}
                onPress={() => openConversation(convo)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: "#161618", marginHorizontal: 16, marginVertical: 4,
                  borderRadius: 12, padding: 14,
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 22, backgroundColor: "#2a1a4a",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.primary }}>{initial}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }} numberOfLines={1}>
                    {convo.customer_name || formatPhone(convo.customer_phone)}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#888" }} numberOfLines={1}>{convo.last_message || "No messages"}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ fontSize: 11, color: "#666" }}>
                    {convo.last_message_at ? relativeTime(new Date(convo.last_message_at).getTime()) : ""}
                  </Text>
                  {convo.message_count > 1 && (
                    <View style={{ backgroundColor: `${Colors.primary}22`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: "700" }}>{convo.message_count}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!selectedConvo} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{
            flex: 1, marginTop: 60, backgroundColor: "#111",
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
          }}>
            <View style={{
              flexDirection: "row", justifyContent: "space-between", alignItems: "center",
              padding: 16, borderBottomWidth: 1, borderBottomColor: "#222",
            }}>
              <Pressable onPress={() => setSelectedConvo(null)} style={{ padding: 4 }}>
                <ArrowLeft size={22} color="#888" />
              </Pressable>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                  {selectedConvo?.customer_name || "Customer"}
                </Text>
                <Text style={{ color: "#C8A951", fontSize: 13, marginTop: 2 }}>
                  {formatPhone(selectedConvo?.customer_phone)}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  const phone = selectedConvo?.customer_phone;
                  setSelectedConvo(null);
                  setTimeout(() => initiateCall(phone), 350);
                }}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#153a15" : "#1a3a1a",
                  paddingHorizontal: 14, paddingVertical: 8,
                  borderRadius: 8, flexDirection: "row" as const, alignItems: "center" as const, gap: 6,
                  opacity: pressed ? 0.8 : 1, minHeight: 36,
                })}
              >
                <Phone size={16} color="#22c55e" />
                <Text style={{ color: "#22c55e", fontSize: 13, fontWeight: "600" }}>Call</Text>
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, gap: 8 }}
            >
              {loadingMessages ? (
                <View style={{ alignItems: "center", paddingTop: 40 }}>
                  <Text style={{ color: "#555", fontSize: 14 }}>Loading messages...</Text>
                </View>
              ) : messagesError ? (
                <View style={{ alignItems: "center", paddingTop: 40, gap: 8 }}>
                  <Text style={{ color: "#555", fontSize: 14 }}>Could not load messages</Text>
                  <Pressable onPress={() => selectedConvo && openConversation(selectedConvo)}>
                    <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: "600" }}>Retry</Text>
                  </Pressable>
                </View>
              ) : messages.length === 0 ? (
                <View style={{ alignItems: "center", paddingTop: 40 }}>
                  <Text style={{ color: "#555", fontSize: 14 }}>No messages yet</Text>
                </View>
              ) : (
                messages.map((msg, idx) => {
                  const isOutbound = msg.direction === "outbound";
                  const time = msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                    : "";
                  return (
                    <View
                      key={msg.id || idx}
                      style={{
                        alignSelf: isOutbound ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        marginBottom: 4,
                      }}
                    >
                      <View style={{
                        backgroundColor: isOutbound ? "#C8A951" : "#2a2a2e",
                        borderRadius: 16,
                        borderBottomRightRadius: isOutbound ? 4 : 16,
                        borderBottomLeftRadius: isOutbound ? 16 : 4,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                      }}>
                        <Text style={{
                          fontSize: 14,
                          lineHeight: 20,
                          color: isOutbound ? "#1a1a1a" : "#fff",
                        }}>
                          {msg.body}
                        </Text>
                      </View>
                      <Text style={{
                        fontSize: 10, color: "#555", marginTop: 3,
                        textAlign: isOutbound ? "right" : "left",
                        paddingHorizontal: 4,
                      }}>
                        {time}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={{ borderTopWidth: 1, borderTopColor: "#222", padding: 16, gap: 10 }}>
              <View style={{
                backgroundColor: "#1a1a1e", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                borderWidth: 1, borderColor: "#2a2a2e",
              }}>
                <TextInput
                  editable={false}
                  placeholder="Text replies coming soon"
                  placeholderTextColor="#444"
                  style={{ fontSize: 14, color: "#444" }}
                />
              </View>
              <Pressable
                onPress={() => {
                  const phone = selectedConvo?.customer_phone;
                  const name = selectedConvo?.customer_name;
                  setSelectedConvo(null);
                  setTimeout(() => initiateCall(phone), 350);
                }}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#153a15" : "#1a3a1a", borderRadius: 12, padding: 14,
                  flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Phone size={18} color="#22c55e" />
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#22c55e" }}>
                  Call {selectedConvo?.customer_name?.split(" ")[0] || "Customer"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
