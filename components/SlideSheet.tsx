import React from "react";
import { View, Text, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { X } from "lucide-react-native";
import { Colors } from "@/constants/colors";

interface SlideSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SlideSheet({ visible, onClose, title, children }: SlideSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            onPress={() => { Keyboard.dismiss(); onClose(); }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)" }}
          />
            <View style={{
              backgroundColor: Colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "90%",
              borderTopWidth: 1,
              borderTopColor: Colors.border,
            }}>
              <View style={{ width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 14,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
              }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.text }}>{title}</Text>
                <Pressable
                  onPress={onClose}
                  style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: Colors.bg,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={22} color={Colors.textSecondary} />
                </Pressable>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 12 }}
              >
                {children}
              </ScrollView>
            </View>
          </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
