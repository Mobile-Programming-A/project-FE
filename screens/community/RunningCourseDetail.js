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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";
import styles from "./styles/RunningCourseDetail.styles";


import {
  getCourseById,
  deleteCourse,
  updateCourse,
  getCourseReviews,
  addCourseReview,
  deleteCourseReview,
} from "../../services/runningCourseService";

// 임시 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
const CURRENT_USER_ID = "currentUser";

export default function RunningCourseDetail({ route, navigation }) {
  const { courseId, hideReviews } = route.params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedCourse, setEditedCourse] = useState({
    name: "",
    description: "",
  });

  // 리뷰 관련 상태
  const [reviews, setReviews] = useState([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const loadReviews = async () => {
    try {
      const reviewsData = await getCourseReviews(courseId);
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error loading reviews:", error);
    }
  };

  useEffect(() => {
    loadCourseDetail();
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // 별점 선택 컴포넌트
  const StarRating = ({ rating, onRatingChange, size = 24, interactive = true }) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onRatingChange && onRatingChange(star)}
            disabled={!interactive}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={size}
              color={star <= rating ? "#FFD700" : "#ccc"}
              style={styles.starIcon}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleSubmitReview = async () => {
    if (newReview.rating === 0) {
      Alert.alert("알림", "별점을 선택해주세요.");
      return;
    }

    if (!newReview.comment.trim()) {
      Alert.alert("알림", "리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      setSubmittingReview(true);
      await addCourseReview({
        courseId,
        userId: "currentUser", // TODO: 실제 유저 ID로 교체
        userName: "사용자", // TODO: 실제 유저 이름으로 교체
        rating: newReview.rating,
        comment: newReview.comment,
      });

      Alert.alert("성공", "리뷰가 등록되었습니다!");
      setReviewModalVisible(false);
      setNewReview({ rating: 0, comment: "" });
      loadReviews();
      loadCourseDetail(); // 평균 별점 업데이트를 위해
    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("오류", "리뷰 등록에 실패했습니다.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      "리뷰 삭제",
      "이 리뷰를 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCourseReview(reviewId, courseId);
              Alert.alert("성공", "리뷰가 삭제되었습니다.");
              loadReviews();
              loadCourseDetail();
            } catch (error) {
              console.error("Error deleting review:", error);
              Alert.alert("오류", "리뷰 삭제에 실패했습니다.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

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
        <ActivityIndicator size="large" color="#71D9A1" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>

      
    <LinearGradient
          colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
          locations={[0, 0.16, 1]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

   
    <SafeAreaView style={[styles.container, { backgroundColor: "transparent" }]}>
      <StatusBar barStyle="dark-content" />

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>코스 상세</Text>
          <View style={styles.headerActions}>
            {/* 내 코스일 때만 수정/삭제 버튼 표시 */}
            {course.createdBy === CURRENT_USER_ID ? (
              <>
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
              </>
            ) : (
              <View style={styles.headerActionButton} />
            )}
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
                  pinColor="#71D9A1"
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
                    strokeColor="#71D9A1"
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                ) : (
                  <Polyline
                    coordinates={[course.startLocation, course.endLocation]}
                    strokeColor="#71D9A1"
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
                <Ionicons name="navigate" size={24} color="#71D9A1" />
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
                  <Ionicons name="play-circle" size={20} color="#71D9A1" />
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

            {/* 리뷰 섹션 - hideReviews가 true이면 숨김 */}
            {!hideReviews && (
              <View style={styles.reviewsContainer}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.sectionTitle}>리뷰</Text>
                  <TouchableOpacity
                    style={styles.addReviewButton}
                    onPress={() => setReviewModalVisible(true)}
                  >
                    <Ionicons name="create-outline" size={20} color="#71D9A1" />
                    <Text style={styles.addReviewButtonText}>리뷰 작성</Text>
                  </TouchableOpacity>
                </View>

                {/* 평균 별점 표시 */}
                {course.reviewCount > 0 && (
                  <View style={styles.averageRatingContainer}>
                    <View style={styles.averageRatingStars}>
                      <StarRating rating={Math.round(course.averageRating || 0)} interactive={false} size={20} />
                    </View>
                    <Text style={styles.averageRatingText}>
                      {(course.averageRating || 0).toFixed(1)}
                    </Text>
                    <Text style={styles.reviewCountText}>
                      ({course.reviewCount}개의 리뷰)
                    </Text>
                  </View>
                )}

                {/* 리뷰 목록 */}
                {reviews.length === 0 ? (
                  <View style={styles.emptyReviewContainer}>
                    <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyReviewText}>
                      아직 리뷰가 없습니다.{"\n"}첫 번째 리뷰를 작성해보세요!
                    </Text>
                  </View>
                ) : (
                  reviews.map((review) => (
                    <View key={review.id} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewUserInfo}>
                          <View style={styles.reviewAvatar}>
                            <Ionicons name="person" size={16} color="#fff" />
                          </View>
                          <Text style={styles.reviewUserName}>{review.userName}</Text>
                        </View>
                        {/* 본인 리뷰만 삭제 가능 */}
                        {review.userId === CURRENT_USER_ID && (
                          <TouchableOpacity
                            onPress={() => handleDeleteReview(review.id)}
                            style={styles.deleteReviewButton}
                          >
                            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={styles.reviewRating}>
                        <StarRating rating={review.rating} interactive={false} size={16} />
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                        </Text>
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
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

        {/* 리뷰 작성 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={reviewModalVisible}
          onRequestClose={() => setReviewModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>리뷰 작성</Text>
                    <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                      <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>별점 *</Text>
                    <View style={styles.ratingInputContainer}>
                      <StarRating
                        rating={newReview.rating}
                        onRatingChange={(rating) =>
                          setNewReview((prev) => ({ ...prev, rating }))
                        }
                        size={32}
                        interactive={true}
                      />
                      <Text style={styles.ratingText}>
                        {newReview.rating > 0 ? `${newReview.rating}점` : "별점을 선택하세요"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>리뷰 내용 *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="이 코스에 대한 리뷰를 작성해주세요"
                      value={newReview.comment}
                      onChangeText={(text) =>
                        setNewReview((prev) => ({ ...prev, comment: text }))
                      }
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setReviewModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handleSubmitReview}
                      disabled={submittingReview}
                    >
                      {submittingReview ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>등록</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
