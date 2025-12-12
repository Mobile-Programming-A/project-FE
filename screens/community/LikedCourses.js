import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import styles from "./styles/TrendingCourses.styles";
import { getAllCourses, toggleCourseLike } from "../../services/runningCourseService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_USER_ID = "currentUser";

export default function LikedCourses({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedCourses, setLikedCourses] = useState({});

  useEffect(() => {
    loadLikedCourses();
  }, []);

  // 화면 포커스 시 좋아요 상태 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadLikedCourses();
    });

    return unsubscribe;
  }, [navigation]);

  const loadLikedCourses = async () => {
    try {
      setLoading(true);

      // 좋아요 상태 불러오기
      const stored = await AsyncStorage.getItem("likedCourses");
      const likedState = stored ? JSON.parse(stored) : {};
      setLikedCourses(likedState);

      // 모든 코스 불러오기
      const allCourses = await getAllCourses();

      // 좋아요한 코스만 필터링
      const likedCoursesData = allCourses.filter(
        (course) => likedState[course.id] === true
      );

      setCourses(likedCoursesData);
    } catch (error) {
      console.error("Error loading liked courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveLikedCourses = async (likedState) => {
    try {
      await AsyncStorage.setItem("likedCourses", JSON.stringify(likedState));
    } catch (error) {
      console.error("Error saving liked courses:", error);
    }
  };

  const handleLike = async (courseId) => {
    try {
      const currentLikeState = likedCourses[courseId] || false;
      const newLikedState = !currentLikeState;

      // 로컬 상태 업데이트
      const updatedLikes = {
        ...likedCourses,
        [courseId]: newLikedState,
      };
      setLikedCourses(updatedLikes);
      await saveLikedCourses(updatedLikes);

      // Firestore 업데이트
      await toggleCourseLike(courseId, newLikedState);

      // 찜 해제 시 목록에서 제거
      if (!newLikedState) {
        setCourses((prevCourses) =>
          prevCourses.filter((course) => course.id !== courseId)
        );
      }
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <StatusBar barStyle="dark-content" />

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>찜한 러닝코스</Text>
          <View style={styles.moreButton} />
        </View>

        {/* 코스 리스트 */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#71D9A1" />
              <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
          ) : courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                찜한 러닝 코스가 없습니다
              </Text>
              <TouchableOpacity
                style={styles.resetSearchButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.resetSearchText}>코스 둘러보기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.courseList}>
              {courses.map((course) => (
                <View key={course.id} style={styles.courseCard}>
                  {/* 내 코스 표시 */}
                  {course.createdBy === CURRENT_USER_ID && (
                    <View style={styles.myCourseBadge}>
                      <Ionicons name="person" size={12} color="#fff" />
                      <Text style={styles.myCourseBadgeText}>MY</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("RunningCourseDetail", {
                        courseId: course.id,
                      })
                    }
                  >
                    {/* 지도 영역 */}
                    <View style={styles.mapContainer}>
                      {course.startLocation && course.endLocation ? (
                        <MapView
                          style={styles.mapView}
                          initialRegion={{
                            latitude:
                              (course.startLocation.latitude +
                                course.endLocation.latitude) /
                              2,
                            longitude:
                              (course.startLocation.longitude +
                                course.endLocation.longitude) /
                              2,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          }}
                          scrollEnabled={false}
                          zoomEnabled={false}
                          pitchEnabled={false}
                          rotateEnabled={false}
                        >
                          <Marker
                            coordinate={course.startLocation}
                            pinColor="#71D9A1"
                            title="시작"
                          />
                          <Marker
                            coordinate={course.endLocation}
                            pinColor="#FF6B6B"
                            title="종료"
                          />
                          {course.waypoints?.map((waypoint, idx) => (
                            <Marker
                              key={`waypoint-${idx}`}
                              coordinate={waypoint}
                              pinColor="#4A90E2"
                              title={`경유지 ${idx + 1}`}
                            />
                          ))}
                          {course.routeCoordinates &&
                          course.routeCoordinates.length > 0 ? (
                            <Polyline
                              coordinates={course.routeCoordinates}
                              strokeColor="#71D9A1"
                              strokeWidth={4}
                              lineCap="round"
                              lineJoin="round"
                            />
                          ) : (
                            <Polyline
                              coordinates={[
                                course.startLocation,
                                course.endLocation,
                              ]}
                              strokeColor="#71D9A1"
                              strokeWidth={3}
                              strokePattern={[1, 1]}
                            />
                          )}
                        </MapView>
                      ) : (
                        <View style={styles.mapPlaceholder}>
                          <Ionicons name="location" size={40} color="#71D9A1" />
                        </View>
                      )}
                    </View>

                    {/* 코스 정보 */}
                    <View style={styles.courseInfo}>
                      <View style={styles.courseHeader}>
                        <Text style={styles.courseName}>{course.name}</Text>
                      </View>

                      <View style={styles.courseStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="navigate" size={16} color="#71D9A1" />
                          <Text style={styles.statValue}>
                            {course.distance}
                          </Text>
                        </View>
                        {course.waypoints && course.waypoints.length > 0 && (
                          <View style={styles.statItem}>
                            <Ionicons
                              name="location"
                              size={16}
                              color="#4A90E2"
                            />
                            <Text style={styles.statValue}>
                              경유지 {course.waypoints.length}개
                            </Text>
                          </View>
                        )}
                      </View>

                      {course.description && (
                        <Text
                          style={styles.courseDescription}
                          numberOfLines={2}
                        >
                          {course.description}
                        </Text>
                      )}

                      {/* 별점 표시 */}
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.ratingText}>
                          {course.averageRating
                            ? course.averageRating.toFixed(1)
                            : "0.0"}
                          ({course.reviewCount || 0}개)
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* 좋아요 버튼 */}
                  <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => handleLike(course.id)}
                  >
                    <Ionicons
                      name={
                        likedCourses[course.id] ? "heart" : "heart-outline"
                      }
                      size={24}
                      color={likedCourses[course.id] ? "#FF6B6B" : "#999"}
                    />
                    <Text
                      style={[
                        styles.likeCount,
                        likedCourses[course.id] && styles.likeCountActive,
                      ]}
                    >
                      {course.likes || 0}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
