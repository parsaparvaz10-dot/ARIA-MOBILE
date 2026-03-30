import { Link, Stack } from "expo-router";
import React from "react";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#09090b",
      }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>This screen doesn't exist.</Text>
        <Link href="/" style={{ color: "#a855f7", marginTop: 16 }}>
          Go to home screen
        </Link>
      </View>
    </>
  );
}
