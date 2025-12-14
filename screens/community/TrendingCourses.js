import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import styles from "./styles/TrendingCourses.styles";
import {
  getAllCourses,
  toggleCourseLike,
  addCourse,
} from "../../services/runningCourseService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CURRENT_USER_ID = "currentUser";

// 두 지점 간의 거리 계산 (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

export default function TrendingCourses({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [likedCourses, setLikedCourses] = useState({});
  const [sortType, setSortType] = useState("likes");
  const [userLocation, setUserLocation] = useState(null);

  // 코스 등록 모달 관련 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    distance: "",
    startLocation: null,
    endLocation: null,
    waypoints: [],
    description: "",
    routeCoordinates: [],
  });
  const [selectingLocation, setSelectingLocation] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // 기본 지도 중심 (서울)
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // 플로팅 메뉴 상태
  const [fabOpen, setFabOpen] = useState(false);
  const fabAnimation = useRef(new Animated.Value(0)).current;

  const toggleFab = () => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnimation, {
      toValue,
      friction: 5,
      useNativeDriver: true,
    }).start();
    setFabOpen(!fabOpen);
  };

  // 메뉴 아이템 애니메이션
  const menu1Style = {
    transform: [
      {
        translateY: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -80],
        }),
      },
      {
        scale: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    ],
    opacity: fabAnimation,
  };

  const menu2Style = {
    transform: [
      {
        translateY: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -160],
        }),
      },
      {
        scale: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    ],
    opacity: fabAnimation,
  };

  const menu3Style = {
    transform: [
      {
        translateY: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -240],
        }),
      },
      {
        scale: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    ],
    opacity: fabAnimation,
  };

  const rotateStyle = {
    transform: [
      {
        rotate: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "45deg"],
        }),
      },
    ],
  };

  // 사용자 위치 가져오기
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.log("위치 권한이 거부되었습니다.");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error("위치 가져오기 실패:", error);
      }
    })();
  }, []);

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

  // 검색어 및 정렬 타입 변경 시 필터링 및 정렬
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

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortType === "likes") {
        // 좋아요 + 별점 합산으로 정렬 (좋아요 가중치 10배)
        const scoreA = (a.likes || 0) * 10 + (a.averageRating || 0);
        const scoreB = (b.likes || 0) * 10 + (b.averageRating || 0);
        return scoreB - scoreA;
      } else if (sortType === "distance" && userLocation) {
        // 사용자 위치와의 거리순 정렬 (오름차순)
        const distanceA = a.startLocation
          ? calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              a.startLocation.latitude,
              a.startLocation.longitude
            )
          : Infinity;
        const distanceB = b.startLocation
          ? calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              b.startLocation.latitude,
              b.startLocation.longitude
            )
          : Infinity;
        return distanceA - distanceB;
      }
      return 0;
    });

    setFilteredCourses(sorted);
  }, [searchText, courses, sortType, userLocation]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await getAllCourses();
      // 좋아요 + 별점 합산으로 정렬
      const sortedCourses = coursesData.sort((a, b) => {
        const scoreA = (a.likes || 0) * 10 + (a.averageRating || 0);
        const scoreB = (b.likes || 0) * 10 + (b.averageRating || 0);
        return scoreB - scoreA;
      });
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
        setCourses((prevCourses) =>
          prevCourses
            .map((course) =>
              course.id === courseId
                ? {
                    ...course,
                    likes: (course.likes || 0) + (newLikedState ? 1 : -1),
                  }
                : course
            )
            .sort((a, b) => {
              const scoreA = (a.likes || 0) * 10 + (a.averageRating || 0);
              const scoreB = (b.likes || 0) * 10 + (b.averageRating || 0);
              return scoreB - scoreA;
            })
        );
      }
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  // 코스 등록 관련 함수들
  const handleAddCourse = async () => {
    if (
      !newCourse.name ||
      !newCourse.distance ||
      !newCourse.startLocation ||
      !newCourse.endLocation
    ) {
      Alert.alert("알림", "모든 필수 항목을 입력해주세요.");
      return;
    }

    try {
      await addCourse({
        ...newCourse,
        createdBy: CURRENT_USER_ID, // 작성자 ID 추가
      });
      Alert.alert("성공", "러닝 코스가 등록되었습니다!");

      setNewCourse({
        name: "",
        distance: "",
        startLocation: null,
        endLocation: null,
        waypoints: [],
        description: "",
        routeCoordinates: [],
      });

      setModalVisible(false);
      loadCourses();
    } catch (error) {
      Alert.alert("오류", "러닝 코스 등록에 실패했습니다.");
      console.error(error);
    }
  };

  const updateField = (field, value) => {
    setNewCourse((prev) => ({ ...prev, [field]: value }));
  };

  const addWaypoint = () => {
    setNewCourse((prev) => ({
      ...prev,
      waypoints: [...prev.waypoints, null],
    }));
  };

  const removeWaypoint = (index) => {
    setNewCourse((prev) => ({
      ...prev,
      waypoints: prev.waypoints.filter((_, i) => i !== index),
      routeCoordinates: [],
    }));
  };

  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;

    if (selectingLocation === "start") {
      setNewCourse((prev) => ({
        ...prev,
        startLocation: coordinate,
        routeCoordinates: [],
      }));
      setSelectingLocation(null);

      if (newCourse.endLocation) {
        await calculateFullRoute(
          coordinate,
          newCourse.waypoints,
          newCourse.endLocation
        );
      }
    } else if (selectingLocation === "end") {
      setNewCourse((prev) => ({ ...prev, endLocation: coordinate }));
      setSelectingLocation(null);

      if (newCourse.startLocation) {
        await calculateFullRoute(
          newCourse.startLocation,
          newCourse.waypoints,
          coordinate
        );
      }
    } else if (typeof selectingLocation === "number") {
      const newWaypoints = [...newCourse.waypoints];
      newWaypoints[selectingLocation] = coordinate;
      setNewCourse((prev) => ({
        ...prev,
        waypoints: newWaypoints,
        routeCoordinates: [],
      }));
      setSelectingLocation(null);

      if (newCourse.startLocation && newCourse.endLocation) {
        await calculateFullRoute(
          newCourse.startLocation,
          newWaypoints,
          newCourse.endLocation
        );
      }
    }
  };

  const calculateFullRoute = async (start, waypoints, end) => {
    if (!start || !end) return;

    try {
      setLoadingRoute(true);

      const allPoints = [start, ...waypoints.filter((wp) => wp !== null), end];
      const coordinates = allPoints
        .map((point) => `${point.longitude},${point.latitude}`)
        .join(";");

      const url = `https://router.project-osrm.org/route/v1/walking/${coordinates}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const routeCoords = route.geometry.coordinates.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));

        const distanceInKm = (route.distance / 1000).toFixed(2);

        setNewCourse((prev) => ({
          ...prev,
          routeCoordinates: routeCoords,
          distance: `${distanceInKm}km`,
        }));
      } else {
        Alert.alert("알림", "경로를 찾을 수 없어 직선으로 표시됩니다.");
        setNewCourse((prev) => ({
          ...prev,
          routeCoordinates: allPoints,
        }));
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      Alert.alert("오류", "경로를 가져오는데 실패했습니다.");
    } finally {
      setLoadingRoute(false);
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
          <Text style={styles.headerTitle}>지금 뜨는 러닝코스</Text>
          <View style={styles.moreButton} />
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

        {/* 정렬 선택 */}
        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortType === "likes" && styles.sortButtonActive,
            ]}
            onPress={() => setSortType("likes")}
          >
            <Ionicons
              name="heart"
              size={16}
              color={sortType === "likes" ? "#fff" : "#71D9A1"}
            />
            <Text
              style={[
                styles.sortButtonText,
                sortType === "likes" && styles.sortButtonTextActive,
              ]}
            >
              좋아요순
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              sortType === "distance" && styles.sortButtonActive,
              !userLocation && styles.sortButtonDisabled,
            ]}
            onPress={() => userLocation && setSortType("distance")}
            disabled={!userLocation}
          >
            <Ionicons
              name="navigate"
              size={16}
              color={
                !userLocation
                  ? "#ccc"
                  : sortType === "distance"
                  ? "#fff"
                  : "#71D9A1"
              }
            />
            <Text
              style={[
                styles.sortButtonText,
                sortType === "distance" && styles.sortButtonTextActive,
                !userLocation && styles.sortButtonTextDisabled,
              ]}
            >
              정확도순
            </Text>
          </TouchableOpacity>
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

        {/* 플로팅 메뉴 */}
        <View style={styles.fabContainer}>
          {/* 배경 */}
          {fabOpen && <View style={styles.fabBackground} />}

          {/* 내 코스 목록 메뉴 */}
          <Animated.View style={[styles.fabMenuItem, menu3Style]}>
            <TouchableOpacity
              style={[styles.fabMenuButton, styles.fabMenuButtonBlue]}
              onPress={() => {
                toggleFab();
                navigation.navigate("RunningCourseRecommend");
              }}
            >
              <Ionicons name="list" size={28} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {/* 찜한 코스 목록 메뉴 */}
          <Animated.View style={[styles.fabMenuItem, menu2Style]}>
            <TouchableOpacity
              style={[styles.fabMenuButton, styles.fabMenuButtonPink]}
              onPress={() => {
                toggleFab();
                navigation.navigate("LikedCourses");
              }}
            >
              <Ionicons name="heart" size={28} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {/* 새 코스 추가 메뉴 */}
          <Animated.View style={[styles.fabMenuItem, menu1Style]}>
            <TouchableOpacity
              style={[styles.fabMenuButton, styles.fabMenuButtonGreen]}
              onPress={() => {
                toggleFab();
                setModalVisible(true);
              }}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {/* 메인 플로팅 버튼 */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={toggleFab}
            activeOpacity={0.8}
          >
            <Animated.View style={rotateStyle}>
              <Ionicons name="add" size={32} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* 러닝 코스 등록 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>러닝 코스 등록</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#333" />
                  </TouchableOpacity>
                </View>

                {/* 지도 영역 */}
                <View style={styles.mapInputContainer}>
                  <MapView
                    style={styles.mapInput}
                    region={mapRegion}
                    onRegionChangeComplete={setMapRegion}
                    onPress={handleMapPress}
                  >
                    {newCourse.startLocation && (
                      <Marker
                        coordinate={newCourse.startLocation}
                        pinColor="#71D9A1"
                        title="시작 위치"
                      />
                    )}
                    {newCourse.endLocation && (
                      <Marker
                        coordinate={newCourse.endLocation}
                        pinColor="#FF6B6B"
                        title="종료 위치"
                      />
                    )}
                    {newCourse.waypoints?.map((waypoint, index) =>
                      waypoint ? (
                        <Marker
                          key={`waypoint-${index}`}
                          coordinate={waypoint}
                          pinColor="#4A90E2"
                          title={`경유지 ${index + 1}`}
                        />
                      ) : null
                    )}
                    {newCourse.routeCoordinates &&
                    newCourse.routeCoordinates.length > 0 ? (
                      <Polyline
                        coordinates={newCourse.routeCoordinates}
                        strokeColor="#71D9A1"
                        strokeWidth={4}
                        lineCap="round"
                        lineJoin="round"
                      />
                    ) : (
                      newCourse.startLocation &&
                      newCourse.endLocation && (
                        <Polyline
                          coordinates={[
                            newCourse.startLocation,
                            newCourse.endLocation,
                          ]}
                          strokeColor="#999"
                          strokeWidth={2}
                          strokePattern={[10, 5]}
                        />
                      )
                    )}
                  </MapView>

                  {/* 위치 선택 버튼 */}
                  <View style={styles.locationButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.locationButton,
                        selectingLocation === "start" &&
                          styles.locationButtonActive,
                      ]}
                      onPress={() => setSelectingLocation("start")}
                    >
                      <Ionicons
                        name="play-circle"
                        size={20}
                        color={
                          selectingLocation === "start" ? "#fff" : "#71D9A1"
                        }
                      />
                      <Text
                        style={[
                          styles.locationButtonText,
                          selectingLocation === "start" &&
                            styles.locationButtonTextActive,
                        ]}
                      >
                        시작 위치
                        {newCourse.startLocation && " ✓"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.locationButton,
                        selectingLocation === "end" &&
                          styles.locationButtonActive,
                      ]}
                      onPress={() => setSelectingLocation("end")}
                    >
                      <Ionicons
                        name="stop-circle"
                        size={20}
                        color={selectingLocation === "end" ? "#fff" : "#FF6B6B"}
                      />
                      <Text
                        style={[
                          styles.locationButtonText,
                          selectingLocation === "end" &&
                            styles.locationButtonTextActive,
                        ]}
                      >
                        종료 위치
                        {newCourse.endLocation && " ✓"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addWaypointButton}
                      onPress={addWaypoint}
                    >
                      <Ionicons name="add-circle" size={20} color="#4A90E2" />
                      <Text style={styles.addWaypointButtonText}>
                        경유지 추가
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 경유지 목록 */}
                  {newCourse.waypoints && newCourse.waypoints.length > 0 && (
                    <View style={styles.waypointsContainer}>
                      <Text style={styles.waypointsTitle}>
                        경유지 ({newCourse.waypoints.length})
                      </Text>
                      {newCourse.waypoints.map((waypoint, index) => (
                        <View key={index} style={styles.waypointItem}>
                          <TouchableOpacity
                            style={[
                              styles.waypointSelectButton,
                              selectingLocation === index &&
                                styles.waypointSelectButtonActive,
                            ]}
                            onPress={() => setSelectingLocation(index)}
                          >
                            <Ionicons
                              name="location"
                              size={16}
                              color={
                                selectingLocation === index ? "#fff" : "#4A90E2"
                              }
                            />
                            <Text
                              style={[
                                styles.waypointText,
                                selectingLocation === index &&
                                  styles.waypointTextActive,
                              ]}
                            >
                              경유지 {index + 1}
                              {waypoint && " ✓"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removeWaypoint(index)}
                            style={styles.removeWaypointButton}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#FF6B6B"
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.mapHint}>
                    {loadingRoute ? (
                      <View style={styles.loadingRouteContainer}>
                        <ActivityIndicator size="small" color="#71D9A1" />
                        <Text style={styles.loadingRouteText}>
                          경로를 계산하는 중...
                        </Text>
                      </View>
                    ) : selectingLocation === "start" ? (
                      "지도를 클릭하여 시작 위치를 선택하세요"
                    ) : selectingLocation === "end" ? (
                      "지도를 클릭하여 종료 위치를 선택하세요"
                    ) : typeof selectingLocation === "number" ? (
                      `지도를 클릭하여 경유지 ${
                        selectingLocation + 1
                      }을 선택하세요`
                    ) : newCourse.routeCoordinates &&
                      newCourse.routeCoordinates.length > 0 ? (
                      "✓ 경로가 설정되었습니다"
                    ) : (
                      "시작/종료 버튼을 눌러 위치를 선택하세요"
                    )}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>코스명 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 한강 러닝코스"
                    value={newCourse.name}
                    onChangeText={(text) => updateField("name", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>거리 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 8.41km (자동 계산 가능)"
                    value={newCourse.distance}
                    onChangeText={(text) => updateField("distance", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>설명</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="코스에 대한 설명을 입력하세요"
                    value={newCourse.description}
                    onChangeText={(text) => updateField("description", text)}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleAddCourse}
                  >
                    <Text style={styles.submitButtonText}>등록</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
