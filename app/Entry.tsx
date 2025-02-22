import React, { useState } from "react";
import {
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function Entry() {
  const [url, setUrl] = useState("");

  const handleSubmit = () => {
    console.log("Analyse URL:", url);
    // add your analysis logic here
  };

  return (
    <LinearGradient
      style={styles.container}
      colors={["#f0f0f0", "#e0e0e0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={[styles.title, { color: "#333" }]}>Insightful.</Text>
      <TextInput
        placeholder="Enter Instagram Reel URL"
        style={[styles.input, { backgroundColor: "#fff", borderColor: "#ccc" }]}
        placeholderTextColor="#666"
        value={url}
        onChangeText={setUrl}
      />
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          { backgroundColor: "#000" },
        ]}
        onPress={handleSubmit}
      >
        <Text style={[styles.buttonText, { color: "#fff" }]}>Analyse</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    color: "#fff",
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    ...Platform.select({
      android: { elevation: 3 },
    }),
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    ...Platform.select({
      android: { elevation: 3 },
    }),
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
