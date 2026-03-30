import React from "react";
import { Pressable, ViewStyle } from "react-native";

interface PressableScaleProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  onClick?: () => void;
  disabled?: boolean;
}

export function PressableScale({ children, style, onPress, onClick, disabled, ...props }: PressableScaleProps) {
  const handlePress = () => {
    if (disabled) return;
    onPress?.();
    onClick?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        style,
        pressed && !disabled ? { opacity: 0.7, transform: [{ scale: 0.96 }] } : undefined,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
