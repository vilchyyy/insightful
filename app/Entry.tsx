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
import { useNavigation } from "@react-navigation/native";
import { Conversation } from "@/app/Conversation";
export default function Entry() {
  const [url, setUrl] = useState("");
  const navigation = useNavigation<any>();

  const handleSubmit = async (url: string) => {
    console.log(url);
    const response = await fetch(
      `${env.process.API}${encodeURIComponent(url)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-cache",
      }
    );
    const data = await response.json();
    navigation.navigate("Main", { data });
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
        onPress={() => handleSubmit(url)}
      >
        <Text style={[styles.buttonText, { color: "#fff" }]}>Analyse</Text>
      </Pressable>
      <Conversation />
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
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 25, // Made more rounded for pill shape
  },
  input: {
    width: "100%",
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25, // Made more rounded for pill shape
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
    borderRadius: 25, // Made more rounded for pill shape
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
