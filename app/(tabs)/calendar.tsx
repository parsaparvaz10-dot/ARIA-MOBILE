import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, RefreshControl } from "react-native";
import { FormField } from "@/components/FormField";
import { Header } from "@/components/Header";
import { PressableScale } from "@/components/PressableScale";
import { SlideSheet } from "@/components/SlideSheet";
import { AppointmentColors, Colors } from "@/constants/colors";
import { Appointment, AppointmentType, useApp } from "@/context/AppContext";
import { formatTime } from "@/utils/time";
import { formatPhone, initiateCall } from "@/utils/phone";
import { Calendar as CalendarIcon, MoreVertical, Phone, Plus } from "lucide-react-native";

const APPT_TYPES: AppointmentType[] = ["Test Drive", "Consultation", "Delivery", "Service", "Follow Up"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getWeekDays(center: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(center);
  start.setDate(start.getDate() - start.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function ApptCard({ appt, onDelete }: { appt: Appointment; onDelete: () => void }) {
  const color = AppointmentColors[appt.type] ?? Colors.textMuted;

  const handleMenu = () => {
    Alert.alert("Delete Appointment", `Delete "${appt.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <View style={{ flexDirection: "row", backgroundColor: "#161618", borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      <View style={{ width: 4, backgroundColor: color }} />
      <View style={{ flex: 1, padding: 14, gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{formatTime(appt.date)}</Text>
        <Text style={{ fontSize: 14, color: "#ccc" }} numberOfLines={1}>{appt.title}</Text>
        <Text style={{ fontSize: 13, color: "#888" }}>{appt.type}</Text>
        {!!appt.clientName && (
          <Text style={{ fontSize: 13, color: "#C8A951", fontWeight: "600" }}>{appt.clientName}</Text>
        )}
        {!!appt.clientPhone && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
            <Text style={{ fontSize: 12, color: "#C8A951" }}>{formatPhone(appt.clientPhone)}</Text>
            <Pressable onPress={(e) => { e.stopPropagation(); initiateCall(appt.clientPhone!); }} style={({ pressed }) => ({ flexDirection: "row" as const, alignItems: "center" as const, gap: 3, backgroundColor: pressed ? "#2a2a2a" : "#1A1A1A", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, opacity: pressed ? 0.8 : 1, minHeight: 28 })}>
              <Phone size={10} color="#C8A951" />
              <Text style={{ fontSize: 10, color: "#C8A951", fontWeight: "600" }}>Call</Text>
            </Pressable>
          </View>
        )}
        {!!appt.vehicle && <Text style={{ fontSize: 12, color: "#555" }} numberOfLines={1}>{appt.vehicle}</Text>}
        {!!appt.notes && <Text style={{ fontSize: 12, color: "#666" }} numberOfLines={2}>{appt.notes}</Text>}
        {appt.bookedByAria && (
          <View style={{ alignSelf: "flex-start", paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6, backgroundColor: `${Colors.primary}18`, marginTop: 2 }}>
            <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: "700" }}>Booked by Aria</Text>
          </View>
        )}
      </View>
      <Pressable onPress={handleMenu} style={{ padding: 14, alignItems: "center", justifyContent: "center" }}>
        <MoreVertical size={16} color="#555" />
      </Pressable>
    </View>
  );
}

export default function CalendarScreen() {
  const { appointments, addAppointment, deleteAppointment, loadData } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<AppointmentType>("Test Drive");
  const [newVehicle, setNewVehicle] = useState("");

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const weekDays = getWeekDays(selectedDate);
  const today = new Date();
  const apptForDay = (date: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.date), date)).sort((a, b) => a.date - b.date);

  const todayAppts = apptForDay(selectedDate);
  const isToday = isSameDay(selectedDate, today);
  const dateLabel = `${WEEKDAY_FULL[selectedDate.getDay()]}, ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}`;
  const apptCountLabel = todayAppts.length > 0
    ? `${todayAppts.length} appointment${todayAppts.length > 1 ? "s" : ""} ${isToday ? "today" : "scheduled"}`
    : isToday ? "No appointments today — open schedule" : "No appointments scheduled";

  const comingUp = appointments
    .filter((a) => a.date > Date.now() && !isSameDay(new Date(a.date), selectedDate))
    .sort((a, b) => a.date - b.date)
    .slice(0, 3);

  const handleAddAppt = async () => {
    if (!newTitle.trim()) { Alert.alert("Error", "Title required"); return; }
    const d = new Date(selectedDate);
    d.setHours(10, 0, 0, 0);
    try {
      await addAppointment({ title: newTitle.trim(), type: newType, vehicle: newVehicle.trim(), date: d.getTime(), bookedByAria: false });
      setNewTitle(""); setNewVehicle(""); setShowAdd(false);
    } catch (err: any) {
      if (err?.message === "conflict") {
        Alert.alert("Time Conflict", "Christopher already has something booked at that time. Choose a different time.");
      } else {
        Alert.alert("Error", "Failed to save appointment. Please try again.");
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <Header />

      <View style={{
        flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingHorizontal: 8,
        borderBottomWidth: 1, borderBottomColor: "#1a1a1a", backgroundColor: "#111",
      }}>
        {weekDays.map((d, i) => {
          const sel = isSameDay(d, selectedDate);
          const isT = isSameDay(d, today);
          const hasAppts = apptForDay(d).length > 0;
          return (
            <PressableScale
              key={i}
              onPress={() => setSelectedDate(d)}
              style={{
                alignItems: "center",
                paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12, minWidth: 44, gap: 3,
                backgroundColor: sel ? Colors.primary : "transparent",
              }}
            >
              <Text style={{ fontSize: 10, color: sel ? "#fff" : "#555", fontWeight: "600", textTransform: "uppercase" }}>{DAY_NAMES[d.getDay()]}</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: isT && !sel ? Colors.primary : "#fff" }}>{d.getDate()}</Text>
              {hasAppts && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: sel ? "#fff" : Colors.primary }} />}
            </PressableScale>
          );
        })}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        <View style={{ paddingVertical: 16, gap: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#fff" }}>{dateLabel}</Text>
          <Text style={{ fontSize: 14, color: "#888" }}>{apptCountLabel}</Text>
        </View>

        {todayAppts.length > 0 ? (
          todayAppts.map((a) => (
            <ApptCard key={a.id} appt={a} onDelete={() => deleteAppointment(a.id)} />
          ))
        ) : (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 40 }}>
            <CalendarIcon size={48} color="#333" />
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#555" }}>No appointments</Text>
            <Text style={{ fontSize: 14, color: "#444", textAlign: "center", lineHeight: 22 }}>
              Schedule test drives and follow-ups here.
            </Text>
          </View>
        )}

        {comingUp.length > 0 && (
          <>
            <Text style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, color: "#666", paddingTop: 24, paddingBottom: 10 }}>COMING UP</Text>
            {comingUp.map((a) => {
              const d = new Date(a.date);
              const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const color = AppointmentColors[a.type] ?? Colors.textMuted;
              return (
                <View key={a.id} style={{
                  flexDirection: "row", alignItems: "center", gap: 10,
                  backgroundColor: "#161618", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 6,
                }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
                  <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: "600", width: 80 }}>{dateStr}</Text>
                  <Text style={{ fontSize: 12, color: "#888", width: 60 }}>{formatTime(a.date)}</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: "#ccc" }} numberOfLines={1}>{a.title}</Text>
                  <Text style={{ fontSize: 11, color: "#555" }}>{a.type}</Text>
                </View>
              );
            })}
          </>
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

      <SlideSheet visible={showAdd} onClose={() => setShowAdd(false)} title="New Appointment">
        <FormField label="Title *" value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Test Drive — John Smith" />
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {APPT_TYPES.map((t) => {
              const active = t === newType;
              const color = AppointmentColors[t] ?? Colors.textMuted;
              return (
                <PressableScale
                  key={t}
                  onPress={() => setNewType(t)}
                  style={{
                    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20,
                    borderWidth: 1, borderColor: active ? `${color}55` : "#222",
                    backgroundColor: active ? `${color}22` : "#111",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "500", color: active ? color : "#555" }}>{t}</Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
        <FormField label="Vehicle" value={newVehicle} onChangeText={setNewVehicle} placeholder="e.g. Taycan 4S" />
        <PressableScale
          style={{
            backgroundColor: Colors.primary, borderRadius: 12, padding: 16,
            alignItems: "center", justifyContent: "center", marginTop: 8,
          }}
          onPress={handleAddAppt}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>Add Appointment</Text>
        </PressableScale>
      </SlideSheet>
    </View>
  );
}
