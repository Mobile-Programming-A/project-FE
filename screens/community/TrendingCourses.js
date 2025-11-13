import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import styles from "./styles/TrendingCourses.styles";
import {
  getAllCourses,
  toggleCourseLike,
} from "../../services/runningCourseService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TrendingCourses({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [likedCourses, setLikedCourses] = useState({});

  // Firestore에서 러닝 코스 데이터 불러오기
  useEffect(() => {
    loadCourses();
    loadLikedCourses();
  }, []);

  // 화면 포커스 시 좋아요 상태 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadLikedCourses();
      loadCourses();
    });

    return unsubscribe;
  }, [navigation]);

  // 검색어 변경 시 필터링 및 좋아요순 정렬
  useEffect(() => {
    let filtered = courses;

    // 검색 필터링
    if (searchText.trim() !== "") {
      filtered = courses.filter(
        (course) =>
          course.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          course.description
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          course.distance?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 좋아요순으로 정렬 (내림차순)
    const sorted = [...filtered].sort(
      (a, b) => (b.likes || 0) - (a.likes || 0)
    );

    setFilteredCourses(sorted);
  }, [searchText, courses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await getAllCourses();
      // 좋아요순으로 정렬
      const sortedCourses = coursesData.sort(
        (a, b) => (b.likes || 0) - (a.likes || 0)
      );
      setCourses(sortedCourses);
      setFilteredCourses(sortedCourses);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLikedCourses = async () => {
    try {
      const stored = await AsyncStorage.getItem("likedCourses");
      if (stored) {
        setLikedCourses(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading liked courses:", error);
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
      const success = await toggleCourseLike(courseId, newLikedState);

      if (success) {
        // 코스 목록의 좋아요 수 즉시 반영
        setCourses(
          (prevCourses) =>
            prevCourses
              .map((course) =>
                course.id === courseId
                  ? {
                      ...course,
                      likes: (course.likes || 0) + (newLikedState ? 1 : -1),
                    }
                  : course
              )
              .sort((a, b) => (b.likes || 0) - (a.likes || 0)) // 좋아요순 재정렬
        );
      }
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>지금 뜨는 러닝코스</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 검색바 */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="코스명, 설명, 거리로 검색하세요"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchText("")}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* 코스 리스트 */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7AC943" />
              <Text style={styles.loadingText}>로딩 중...</Text>
            </View>
          ) : filteredCourses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText
                  ? "검색 결과가 없습니다"
                  : "등록된 러닝 코스가 없습니다"}
              </Text>
              {searchText && (
                <TouchableOpacity
                  style={styles.resetSearchButton}
                  onPress={() => setSearchText("")}
                >
                  <Text style={styles.resetSearchText}>검색 초기화</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.courseList}>
              {filteredCourses.map((course, index) => (
                <View key={course.id} style={styles.courseCard}>
                  {/* 순위 뱃지 */}
                  {!searchText && index < 3 && (
                    <View
                      style={[
                        styles.rankBadge,
                        index === 0 && styles.rankBadgeGold,
                        index === 1 && styles.rankBadgeSilver,
                        index === 2 && styles.rankBadgeBronze,
                      ]}
                    >
                      <Text style={styles.rankBadgeText}>#{index + 1}</Text>
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
                            pinColor="#7AC943"
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
                              strokeColor="#7AC943"
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
                              strokeColor="#7AC943"
                              strokeWidth={3}
                              strokePattern={[1, 1]}
                            />
                          )}
                        </MapView>
                      ) : (
                        <View style={styles.mapPlaceholder}>
                          <Ionicons name="location" size={40} color="#7AC943" />
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
                          <Ionicons name="navigate" size={16} color="#7AC943" />
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
                    </View>
                  </TouchableOpacity>

                  {/* 좋아요 버튼 */}
                  <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => handleLike(course.id)}
                  >
                    <Ionicons
                      name={likedCourses[course.id] ? "heart" : "heart-outline"}
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
