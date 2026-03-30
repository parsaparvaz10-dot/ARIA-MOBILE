import React from "react";
import { View, Text } from "react-native";
import { Colors } from "@/constants/colors";
import { getInitials } from "@/utils/time";

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

export function Avatar({ name, size = 40, color = Colors.primary }: AvatarProps) {
  const fontSize = size * 0.38;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}22`,
        borderWidth: 1,
        borderColor: `${color}44`,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize, fontWeight: "700", color }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
