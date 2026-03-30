import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleRetry = () => {
    resetError();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <View style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: "#000",
    }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 16 }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>
        Please reload the app to continue.
      </Text>
      <Pressable
        onPress={handleRetry}
        style={{
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 8,
          backgroundColor: "#007AFF",
          minWidth: 200,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
          Try Again
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setShowDetails(!showDetails)}
        style={{ marginTop: 16 }}
      >
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          {showDetails ? "Hide" : "Show"} error details
        </Text>
      </Pressable>
      {showDetails && (
        <View style={{
          marginTop: 16,
          padding: 16,
          backgroundColor: "#1C1C1E",
          borderRadius: 8,
          maxWidth: "100%",
        }}>
          <Text style={{ fontSize: 12, lineHeight: 18, color: "#fff" }}>
            {error.message}{"\n\n"}{error.stack}
          </Text>
        </View>
      )}
    </View>
  );
}
