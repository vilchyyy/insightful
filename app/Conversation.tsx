import React, { useCallback, useState, useRef } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import AudioRecord from "react-native-audio-record";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";

// Helper functions to add WAV header to raw PCM data.
function createWavHeader(
  dataLength: number,
  sampleRate: number,
  channels: number,
  bitsPerSample: number
): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, dataLength + 36, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, (sampleRate * channels * bitsPerSample) / 8, true);
  view.setUint16(32, (channels * bitsPerSample) / 8, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
  return new Uint8Array(header);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function convertPCMToWav(pcmBase64: string): string {
  const pcmBytes = base64ToUint8Array(pcmBase64);
  const header = createWavHeader(pcmBytes.byteLength, 16000, 1, 16);
  const wavBytes = new Uint8Array(header.byteLength + pcmBytes.byteLength);
  wavBytes.set(header, 0);
  wavBytes.set(pcmBytes, header.byteLength);
  return uint8ArrayToBase64(wavBytes);
}

export function Conversation() {
  const [status, setStatus] = useState("disconnected");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const webSocketRef = useRef<WebSocket | null>(null);

  const startConversation = useCallback(() => {
    if (webSocketRef.current) return;
    // Replace with your WebSocket URL
    webSocketRef.current = new WebSocket(
      "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=" + agentId"
    );
    setStatus("connecting");

    webSocketRef.current.onopen = () => {
      console.log("Connected");
      setStatus("connected");
    };

    webSocketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "audio") {
        setIsSpeaking(true);
        (async () => {
          const audioBase64 = message.audio_event.audio_base_64;
          try {
            await Audio.setAudioModeAsync({
              playsInSilentModeIOS: true,
              staysActiveInBackground: false,
            });

            // Convert raw PCM to a valid WAV file before playing
            const wavBase64 = convertPCMToWav(audioBase64);
            const fileUri = FileSystem.cacheDirectory + "temp.wav";
            await FileSystem.writeAsStringAsync(fileUri, wavBase64, {
              encoding: FileSystem.EncodingType.Base64,
            });

            const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
            await sound.playAsync();
          } catch (error) {
            console.error("Error playing audio:", error);
          }
        })();
      }
    };

    webSocketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      Alert.alert(
        "WebSocket Error",
        "An error occurred with the WebSocket connection."
      );
    };

    webSocketRef.current.onclose = () => {
      console.log("Disconnected");
      setStatus("disconnected");
      webSocketRef.current = null;
    };
  }, []);

  const stopConversation = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({ type: "stop" }));
      webSocketRef.current.close();
    }
  }, []);

  // Configure and start real-time recording with 16k PCM audio.
  const startRecording = async () => {
    if (isRecording) return;
    const options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: "stream.wav",
    };

    AudioRecord.init(options);

    AudioRecord.on("data", (data: string) => {
      if (webSocketRef.current) {
        const audioMessage = {
          user_audio_chunk: data,
        };
        webSocketRef.current.send(JSON.stringify(audioMessage));
      }
    });

    AudioRecord.start();
    setIsRecording(true);
    console.log("Real-time recording started");
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    const audioFile = await AudioRecord.stop();
    setIsRecording(false);
    console.log("Real-time recording stopped", audioFile);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button
          title="Start Conversation"
          onPress={startConversation}
          disabled={status === "connected" || status === "connecting"}
        />
        <Button
          title="Stop Conversation"
          onPress={stopConversation}
          disabled={status !== "connected"}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Start Recording"
          onPress={startRecording}
          disabled={isRecording}
        />
        <Button
          title="Stop Recording"
          onPress={stopRecording}
          disabled={!isRecording}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text>Status: {status}</Text>
        <Text>Agent is {isSpeaking ? "speaking" : "listening"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "space-around",
    width: "100%",
  },
  infoContainer: {
    alignItems: "center",
  },
});
