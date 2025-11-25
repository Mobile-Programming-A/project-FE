import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import styles from "./styles/RunningCourseRecommend.styles";
import { getAllCourses, addCourse } from "../../services/runningCourseService";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";


export default function RunningCourseRecommend({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    distance: "",
    startLocation: null,
    endLocation: null,
    waypoints: [], // 경유지들
    description: "",
    routeCoordinates: [], // 실제 경로 좌표들
  });
  const [selectingLocation, setSelectingLocation] = useState(null); // 'start', 'end', or waypoint index
  const [loadingRoute, setLoadingRoute] = useState(false);

  // 기본 지도 중심 (서울)
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    loadCourses();
  }, []);

  // 화면에 포커스될 때마다 코스 목록 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
    }, [])
  );

  // 검색어 변경 시 필터링
  useEffect(() => {
    if (searchText.trim() !== "") {
      const filtered = courses.filter(
        (course) =>
          course.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          course.description
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          course.distance?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchText, courses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const allCourses = await getAllCourses();
      setCourses(allCourses);
    } catch (error) {
      console.error("Error loading courses:", error);
      Alert.alert("오류", "러닝 코스를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    // 필수 입력값 확인
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
      await addCourse(newCourse);
      Alert.alert("성공", "러닝 코스가 등록되었습니다!");

      // 입력 필드 초기화
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
      loadCourses(); // 목록 새로고침
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
      routeCoordinates: [], // 경유지 변경시 경로 초기화
    }));
  };

  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;

    if (selectingLocation === "start") {
      setNewCourse((prev) => ({
        ...prev,
        startLocation: coordinate,
        routeCoordinates: [], // 시작 위치 변경시 경로 초기화
      }));
      setSelectingLocation(null);

      // 시작 위치 설정 후 종료 위치가 이미 있으면 경로 계산
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

      // 종료 위치 설정 후 시작 위치가 있으면 경로 계산
      if (newCourse.startLocation) {
        await calculateFullRoute(
          newCourse.startLocation,
          newCourse.waypoints,
          coordinate
        );
      }
    } else if (typeof selectingLocation === "number") {
      // 경유지 선택
      const newWaypoints = [...newCourse.waypoints];
      newWaypoints[selectingLocation] = coordinate;
      setNewCourse((prev) => ({
        ...prev,
        waypoints: newWaypoints,
        routeCoordinates: [], // 경유지 변경시 경로 초기화
      }));
      setSelectingLocation(null);

      // 시작과 종료 위치가 모두 설정되어 있으면 경로 자동 재계산
      if (newCourse.startLocation && newCourse.endLocation) {
        await calculateFullRoute(
          newCourse.startLocation,
          newWaypoints,
          newCourse.endLocation
        );
      }
    }
  };

  // 전체 경로 계산 (시작 -> 경유지들 -> 종료)
  const calculateFullRoute = async (start, waypoints, end) => {
    if (!start || !end) return;

    try {
      setLoadingRoute(true);

      // 모든 포인트 조합: 시작 + 경유지들 + 종료
      const allPoints = [start, ...waypoints.filter((wp) => wp !== null), end];

      // OSRM URL 생성 (모든 포인트를 세미콜론으로 연결)
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

        // 거리 계산 (미터를 킬로미터로 변환)
        const distanceInKm = (route.distance / 1000).toFixed(2);

        setNewCourse((prev) => ({
          ...prev,
          routeCoordinates: routeCoords,
          distance: `${distanceInKm}km`,
        }));
      } else {
        // 경로를 찾을 수 없는 경우
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

    {/* 그라데이션 배경 */}
    <LinearGradient
      colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
      style={{ ...StyleSheet.absoluteFillObject }}
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
          <Text style={styles.headerTitle}>나의 러닝코스</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 나의 러닝 코스 섹션 */}
          <View style={styles.section}>
            {/* 코스 리스트 */}
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
                {filteredCourses.map((course) => (
                  <TouchableOpacity
                    key={course.id}
                    style={styles.courseCard}
                    onPress={() =>
                      navigation.navigate("RunningCourseDetail", {
                        courseId: course.id,
                        hideReviews: true,
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
                          {course.waypoints?.map((waypoint, index) => (
                            <Marker
                              key={`waypoint-${index}`}
                              coordinate={waypoint}
                              pinColor="#4A90E2"
                              title={`경유지 ${index + 1}`}
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
                      <Text style={styles.courseName}>{course.name}</Text>
                      <View style={styles.courseStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="navigate" size={16} color="#71D9A1" />
                          <Text style={styles.statValue}>
                            {course.distance}
                          </Text>
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
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

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
                    {newCourse.waypoints?.map((waypoint, index) => (
                      <Marker
                        key={`waypoint-${index}`}
                        coordinate={waypoint}
                        pinColor="#4A90E2"
                        title={`경유지 ${index + 1}`}
                      />
                    ))}
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
