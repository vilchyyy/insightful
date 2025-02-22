import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import Video, {
  OnLoadData,
  OnProgressData,
  VideoRef,
} from "react-native-video";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { BlurView } from "@react-native-community/blur";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const segments = [
  { id: 1, start: 0, end: 5, title: "Introduction" },
  { id: 2, start: 10, end: 20, title: "Overview" },
  { id: 3, start: 20, end: 30, title: "Main Content" },
];

const springConfig = { damping: 30, stiffness: 300, mass: 1 };

export default function VideoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef<VideoRef>(null);

  // Animation shared values
  const top = useSharedValue(SCREEN_HEIGHT - SCREEN_HEIGHT / 10.7);
  const bottom = useSharedValue(40);
  const borderRadius = useSharedValue(24);
  const marginHorizontal = useSharedValue(20);

  // Animated style for the floating island
  const floatingCardStyle = useAnimatedStyle(() => ({
    top: top.value,
    bottom: bottom.value,
    borderRadius: borderRadius.value,
    marginHorizontal: marginHorizontal.value,
  }));

  const currentSegment = segments[currentSegmentIndex];

  useEffect(() => {
    if (currentTime >= currentSegment?.end) {
      setIsPlaying(false);
      handleExpand();
    }
  }, [currentTime, currentSegment]);

  const handleExpand = () => {
    setIsExpanded(true);
    top.value = withSpring(0, springConfig);
    bottom.value = withSpring(0, springConfig);
    borderRadius.value = withSpring(0, springConfig);
    marginHorizontal.value = withSpring(0, springConfig);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    top.value = withSpring(SCREEN_HEIGHT - SCREEN_HEIGHT / 10.7, springConfig);
    bottom.value = withSpring(40, springConfig);
    borderRadius.value = withSpring(24, springConfig);
    marginHorizontal.value = withSpring(20, springConfig);
  };

  const onProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
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
        onPress={() => {
          if (isExpanded) {
            handleCollapse();
            setIsPlaying(true);
            if (currentSegmentIndex < segments.length - 1) {
              setCurrentSegmentIndex((prev) => prev + 1);
              videoRef.current?.seek(segments[currentSegmentIndex + 1].start);
            }
          } else if (isPlaying) {
            setCurrentSegmentIndex((prev) => prev + 1);
            videoRef.current?.seek(segments[currentSegmentIndex + 1].start);
          }
        }}
      >
        <Video
          ref={videoRef}
          source={{
            uri: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          }}
          style={styles.video}
          paused={!isPlaying}
          onProgress={onProgress}
          onLoad={(data: OnLoadData) => {
            if (!isPlaying) {
              setDuration(data.duration);
              setIsPlaying(true);
            }
          }}
          resizeMode="cover"
          poster="https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
        />

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
              <View style={styles.progressBarContainer}>
                {segments.map((segment, index) => {
                  let progress = 0;
                  if (index < currentSegmentIndex) {
                    progress = 1;
                  } else if (index === currentSegmentIndex) {
                    progress = Math.min(
                      Math.max(
                        (currentTime - segment.start) /
                          (segment.end - segment.start),
                        0
                      ),
                      1
                    );
                  }
                  return (
                    <View key={segment.id} style={styles.segment}>
                      <View
                        style={[
                          styles.segmentFill,
                          { width: `${progress * 100}%` },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            {isExpanded && (
              <View style={styles.expandedContent}>
                <Text style={styles.expandedTitle}>{currentSegment.title}</Text>
                <Text style={styles.expandedSubtitle}>
                  Tap to continue to next segment
                </Text>
              </View>
            )}
          </View>
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
  floatingIsland: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  contentWrapper: {
    padding: 20,
    backgroundColor: "transparent",
  },
  timelineContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  segment: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    marginHorizontal: 2,
  },
  segmentFill: {
    height: "100%",
    backgroundColor: "#a855f7",
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
  expandedContent: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  expandedTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  expandedSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
  },
});
