import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import Video, { OnLoadData, OnProgressData } from "react-native-video";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "@react-native-community/blur";
import { Pause, Play } from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Sample transcription data
const transcription = [
  { start: 0, end: 5, text: "Welcome to our demonstration video." },
  { start: 5, end: 10, text: "Today we'll be exploring key concepts." },
  { start: 10, end: 15, text: "Let's dive into the details." },
];

interface ControlButtonProps {
  onPress: () => void;
  children: React.ReactNode;
}

const ControlButton = ({ onPress, children }: ControlButtonProps) => (
  <TouchableOpacity
    style={styles.controlButton}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.controlButtonText}>{children}</Text>
  </TouchableOpacity>
);

export default function VideoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const videoRef = useRef(null);
  const controlsOpacity = useSharedValue(1);
  const floatingCardOffset = useSharedValue(0);

  const getCurrentTranscription = () => {
    return (
      transcription.find(
        (item) => currentTime >= item.start && currentTime <= item.end
      )?.text || ""
    );
  };

  const toggleControls = () => {
    setIsControlsVisible(!isControlsVisible);
    controlsOpacity.value = withTiming(isControlsVisible ? 0 : 1, {
      duration: 300,
    });
  };

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const floatingCardStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withSpring(floatingCardOffset.value, {
          damping: 15,
          stiffness: 100,
        }),
      },
    ],
    opacity: interpolate(controlsOpacity.value, [0, 1], [0, 1]),
  }));

  const onProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
  };

  const onLoad = (data: OnLoadData) => {
    setDuration(data.duration);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoContainer}
        onPress={toggleControls}
      >
        <Video
          ref={videoRef}
          source={{
            uri: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          }}
          style={styles.video}
          paused={!isPlaying}
          onProgress={onProgress}
          onLoad={onLoad}
          resizeMode="cover"
          posterResizeMode="cover"
          poster="https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
        />

        <Animated.View style={[styles.controlsContainer, controlsStyle]}>
          <Animated.View style={[styles.floatingIsland, floatingCardStyle]}>
            {Platform.OS === "ios" ? (
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="dark"
                blurAmount={20}
              />
            ) : null}
            <View style={styles.contentWrapper}>
              <View style={styles.timelineContainer}>
                <TouchableOpacity
                  style={styles.progressBarContainer}
                  onPress={(event) => {
                    const { locationX } = event.nativeEvent;
                    const percentage = locationX / (SCREEN_WIDTH - 40);
                  }}
                >
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${(currentTime / (duration || 1)) * 100}%` },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>

              <ScrollView
                style={styles.transcriptionContainer}
                contentContainerStyle={styles.transcriptionContent}
              >
                <Text style={styles.transcriptionText}>
                  {getCurrentTranscription()}
                </Text>
              </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  controlsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  floatingIsland: {
    margin: 20,
    marginBottom: 40,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Platform.select({
      ios: "transparent",
      android: "rgba(15, 15, 15, 0.95)",
    }),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  contentWrapper: {
    padding: 20,
    backgroundColor: Platform.select({
      ios: "transparent",
      android: "transparent",
    }),
  },
  timelineContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    padding: 10,
    marginHorizontal: -10,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#a855f7", // Purple from shadcn
    borderRadius: 2,
  },
  timeDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.9,
  },
  transcriptionContainer: {
    maxHeight: 80,
    marginBottom: 16,
  },
  transcriptionContent: {
    paddingVertical: 4,
  },
  transcriptionText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
    opacity: 0.9,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  controlButtonText: {
    fontSize: 20,
  },
});
