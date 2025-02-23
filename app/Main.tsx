import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Linking,
} from "react-native";
import Video, {
  OnLoadData,
  OnProgressData,
  VideoRef,
} from "react-native-video";
import AnimatedReanimated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { BlurView } from "@react-native-community/blur";
import * as FileSystem from "expo-file-system";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const springConfig = { damping: 30, stiffness: 300, mass: 1 };

export default function VideoPage({ route }) {
  const [segments, setSegments] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState(route.params.data);
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const videoRef = useRef<VideoRef>(null);

  // Fade in animation for the card content similar to FactCheck
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animation shared values
  const top = useSharedValue(SCREEN_HEIGHT - SCREEN_HEIGHT / 10.7);
  const bottom = useSharedValue(40);
  const borderRadius = useSharedValue(24);
  const marginHorizontal = useSharedValue(20);

  const floatingCardStyle = useAnimatedStyle(() => ({
    top: top.value,
    bottom: bottom.value,
    borderRadius: borderRadius.value,
    marginHorizontal: marginHorizontal.value,
  }));

  const currentSegment = segments[currentSegmentIndex];

  useEffect(() => {
    if (currentSegment && currentTime >= currentSegment?.end) {
      setIsPlaying(false);
      handleExpand();
    }
  }, [currentTime, currentSegment]);

  // Cache base64 video to local file system using expo-file-system
  useEffect(() => {
    async function cacheVideo() {
      const videoCacheDir = FileSystem.cacheDirectory + "videos/";
      try {
        await FileSystem.makeDirectoryAsync(videoCacheDir, {
          intermediates: true,
        });
      } catch (e) {
        // Directory might already exist
      }
      const fileUri = videoCacheDir + "video.mp4";
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(fileUri, data.video.data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      setCachedUri(fileUri);
      setIsPlaying(true);
      if (data) {
        data.movie.slides.forEach((slide) => {
          setSegments((prev) => [
            ...prev,
            {
              id: prev.length ? prev[prev.length - 1].id + 1 : 1,
              title: slide.assessment,
              start: slide.timestampBeginS,
              end: slide.timestampBeginS + slide.durationS,
              suggestions: slide.suggestions,
              explanation: slide.explanation,
              links: slide.links,
            },
          ]);
        });
      }
    }
    cacheVideo();
  }, [data]);

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

  const onProgress = (progressData: OnProgressData) => {
    setCurrentTime(progressData.currentTime);
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
            uri: cachedUri || `data:video/mp4;base64,${data.video.data}`,
          }}
          style={styles.video}
          paused={!isPlaying}
          onProgress={onProgress}
          onLoad={(loadData: OnLoadData) => {
            if (!isPlaying) {
              setDuration(loadData.duration);
              setIsPlaying(true);
            }
          }}
          resizeMode="cover"
        />
        <AnimatedReanimated.View
          style={[styles.floatingIsland, floatingCardStyle]}
        >
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
            {isExpanded && currentSegment && (
              <Animated.View
                style={[styles.expandedContent, { opacity: fadeAnim }]}
              >
                <Text style={styles.expandedTitle}>{currentSegment.title}</Text>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 26,
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: 20,
                    marginTop: 10,
                  }}
                >
                  {currentSegment.explanation}
                </Text>

                {currentSegment.links.map(
                  (link: { url: string; title: string }) => (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(link.url)}
                      key={link.url}
                    >
                      <Text
                        style={[
                          {
                            color: "#fff",
                            textDecorationLine: "underline",
                            marginVertical: 4,
                          },
                        ]}
                      >
                        • {link.title}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
                <TouchableOpacity>
                  <Text
                    style={{
                      color: "#fff",
                      backgroundColor: "#ad561c",
                      padding: 12,
                      borderRadius: 25,
                      fontSize: 20,
                      fontWeight: "bold",
                      marginBottom: 0,
                      marginTop: "10",
                    }}
                  >
                    Learn More with AI
                  </Text>
                </TouchableOpacity>
                {currentSegment.suggestions.map((suggestion: string) => (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(suggestion)}
                    key={suggestion}
                  >
                    <Text
                      style={[
                        {
                          color: "#fff",
                          marginVertical: 6,
                          marginHorizontal: 4,
                          fontSize: 14,
                        },
                      ]}
                    >
                      - {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </View>
        </AnimatedReanimated.View>
      </TouchableOpacity>
    </View>
  );
} // Replace the existing styles with these enhanced styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentWrapper: {
    padding: 24,
    flex: 1,
    backgroundColor: "transparent",
  },
  timelineContainer: {
    marginBottom: 20,
  },
  progressBarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    marginHorizontal: 3,
  },
  segmentFill: {
    height: "100%",
    backgroundColor: "#a855f7",
    borderRadius: 3,
  },
  expandedContent: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  expandedTitle: {
    color: "#fff",
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    overflow: "hidden",
    maxWidth: "90%",
  },
  explanation: {
    color: "#fff",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 24,
    lineHeight: 32,
  },
  suggestion: {
    color: "#fff",
    marginVertical: 8,
    marginHorizontal: 4,
    fontSize: 18,
    lineHeight: 24,
    opacity: 0.9,
  },
  link: {
    color: "#a855f7",
    textDecorationLine: "underline",
    marginVertical: 6,
    fontSize: 16,
  },
  aiButton: {
    backgroundColor: "#a855f7",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
