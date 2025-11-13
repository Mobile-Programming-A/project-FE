import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import styles from "./styles/RunningCourseDetail.styles";
import {
  getCourseById,
  deleteCourse,
  updateCourse,
} from "../../services/runningCourseService";

export default function RunningCourseDetail({ route, navigation }) {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedCourse, setEditedCourse] = useState({
    name: "",
    description: "",
  });

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
      setEditedCourse({
        name: courseData.name,
        description: courseData.description || "",
      });
    } catch (error) {
      console.error("Error loading course:", error);
      Alert.alert("오류", "코스 정보를 불러오는데 실패했습니다.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleDelete = () => {
    Alert.alert(
      "코스 삭제",
      "이 러닝 코스를 삭제하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCourse(courseId);
              Alert.alert("성공", "코스가 삭제되었습니다.", [
                {
                  text: "확인",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error("Error deleting course:", error);
              Alert.alert("오류", "코스 삭제에 실패했습니다.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEdit = async () => {
    if (!editedCourse.name.trim()) {
      Alert.alert("알림", "코스명을 입력해주세요.");
      return;
    }

    try {
      await updateCourse(courseId, {
        name: editedCourse.name,
        description: editedCourse.description,
      });

      Alert.alert("성공", "코스가 수정되었습니다.");
      setEditModalVisible(false);
      loadCourseDetail();
    } catch (error) {
      console.error("Error updating course:", error);
      Alert.alert("오류", "코스 수정에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7AC943" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  if (!course) {
    return null;
  }

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
          <Text style={styles.headerTitle}>코스 상세</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setEditModalVisible(true)}
            >
              <Ionicons name="create-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
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
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
              >
                <Marker
                  coordinate={course.startLocation}
                  pinColor="#7AC943"
                  title="시작 위치"
                />
                <Marker
                  coordinate={course.endLocation}
                  pinColor="#FF6B6B"
                  title="종료 위치"
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
                    strokeColor="#7AC943"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                ) : (
                  <Polyline
                    coordinates={[course.startLocation, course.endLocation]}
                    strokeColor="#7AC943"
                    strokeWidth={3}
                    strokePattern={[10, 5]}
                  />
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="location" size={60} color="#ccc" />
              </View>
            )}
          </View>

          {/* 코스 정보 */}
          <View style={styles.infoContainer}>
            <View style={styles.titleSection}>
              <Text style={styles.courseName}>{course.name}</Text>
              {course.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="navigate" size={24} color="#7AC943" />
                <Text style={styles.statLabel}>거리</Text>
                <Text style={styles.statValue}>{course.distance}</Text>
              </View>
              {course.waypoints && course.waypoints.length > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="location" size={24} color="#4A90E2" />
                  <Text style={styles.statLabel}>경유지</Text>
                  <Text style={styles.statValue}>
                    {course.waypoints.length}개
                  </Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={24} color="#666" />
                <Text style={styles.statLabel}>등록일</Text>
                <Text style={styles.statValue}>
                  {new Date(course.createdAt).toLocaleDateString("ko-KR")}
                </Text>
              </View>
            </View>

            {course.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>코스 설명</Text>
                <Text style={styles.descriptionText}>{course.description}</Text>
              </View>
            )}

            {/* 위치 정보 */}
            <View style={styles.locationsContainer}>
              <Text style={styles.sectionTitle}>위치 정보</Text>

              <View style={styles.locationItem}>
                <View style={styles.locationIcon}>
                  <Ionicons name="play-circle" size={20} color="#7AC943" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>시작 위치</Text>
                  <Text style={styles.locationCoords}>
                    {course.startLocation.latitude.toFixed(6)},{" "}
                    {course.startLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>

              {course.waypoints?.map((waypoint, index) => (
                <View key={index} style={styles.locationItem}>
                  <View style={[styles.locationIcon, styles.waypointIcon]}>
                    <Ionicons name="location" size={20} color="#4A90E2" />
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>경유지 {index + 1}</Text>
                    <Text style={styles.locationCoords}>
                      {waypoint.latitude.toFixed(6)},{" "}
                      {waypoint.longitude.toFixed(6)}
                    </Text>
                  </View>
                </View>
              ))}

              <View style={styles.locationItem}>
                <View style={[styles.locationIcon, styles.endIcon]}>
                  <Ionicons name="stop-circle" size={20} color="#FF6B6B" />
                </View>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>종료 위치</Text>
                  <Text style={styles.locationCoords}>
                    {course.endLocation.latitude.toFixed(6)},{" "}
                    {course.endLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 수정 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>코스 수정</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>코스명 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="코스명을 입력하세요"
                  value={editedCourse.name}
                  onChangeText={(text) =>
                    setEditedCourse((prev) => ({ ...prev, name: text }))
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>설명</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="코스에 대한 설명을 입력하세요"
                  value={editedCourse.description}
                  onChangeText={(text) =>
                    setEditedCourse((prev) => ({ ...prev, description: text }))
                  }
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleEdit}
                >
                  <Text style={styles.submitButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
