import React from "react";
import { View, Text, TextInput, ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  style: extraStyle,
  keyboardType,
}: FormFieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{
        fontSize: 12,
        fontWeight: "600",
        color: Colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555"
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        style={[{
          backgroundColor: Colors.bg,
          borderRadius: 12,
          padding: 13,
          fontSize: 15,
          color: Colors.text,
          borderWidth: 1,
          borderColor: Colors.border,
        }, extraStyle]}
      />
    </View>
  );
}
