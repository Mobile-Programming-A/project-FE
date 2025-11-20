import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
  where,
} from "firebase/firestore";
import { db } from "./config";
import { RunningCourse, NewRunningCourseInput } from "../types/runningCourse";

const COLLECTION_NAME = "runningCourses";

/**
 * 모든 러닝 코스 가져오기
 */
export const getAllCourses = async (): Promise<RunningCourse[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const courses: RunningCourse[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      courses.push({
        id: doc.id,
        name: data.name,
        distance: data.distance,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        waypoints: data.waypoints || [],
        routeCoordinates: data.routeCoordinates || [],
        description: data.description,
        isNew: data.isNew,
        likes: data.likes || 0,
        createdBy: data.createdBy || "",
        averageRating: data.averageRating || 0,
        reviewCount: data.reviewCount || 0,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : data.createdAt,
      });
    });

    return courses;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

/**
 * 특정 러닝 코스 가져오기
 */
export const getCourseById = async (
  courseId: string
): Promise<RunningCourse> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, courseId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        distance: data.distance,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        waypoints: data.waypoints || [],
        routeCoordinates: data.routeCoordinates || [],
        description: data.description,
        isNew: data.isNew,
        likes: data.likes || 0,
        createdBy: data.createdBy || "",
        averageRating: data.averageRating || 0,
        reviewCount: data.reviewCount || 0,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : data.createdAt,
      };
    } else {
      throw new Error("Course not found");
    }
  } catch (error) {
    console.error("Error fetching course:", error);
    throw error;
  }
};

/**
 * 새 러닝 코스 추가
 */
export const addCourse = async (
  courseData: NewRunningCourseInput & { createdBy?: string }
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: courseData.name,
      distance: courseData.distance,
      startLocation: courseData.startLocation,
      endLocation: courseData.endLocation,
      waypoints: courseData.waypoints || [],
      routeCoordinates: courseData.routeCoordinates || [],
      description: courseData.description || "",
      createdAt: serverTimestamp(),
      isNew: true, // 새로 추가된 코스 표시
      likes: 0, // 초기 좋아요 수
      createdBy: courseData.createdBy || "", // 작성자 ID
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding course:", error);
    throw error;
  }
};

/**
 * 러닝 코스 삭제
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, courseId));
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
};

/**
 * 러닝 코스 수정
 */
export const updateCourse = async (
  courseId: string,
  courseData: Partial<NewRunningCourseInput>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, courseId);
    await updateDoc(docRef, {
      ...courseData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
};

/**
 * 러닝 코스 좋아요 토글
 */
export const toggleCourseLike = async (
  courseId: string,
  isLiked: boolean
): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, courseId);
    await updateDoc(docRef, {
      likes: increment(isLiked ? 1 : -1),
    });
    return true;
  } catch (error) {
    console.error("Error toggling course like:", error);
    return false;
  }
};

/**
 * 최근 추가된 코스 가져오기 (isNew가 true인 것들)
 */
export const getNewCourses = async (
  limit: number = 10
): Promise<RunningCourse[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const courses: RunningCourse[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isNew) {
        courses.push({
          id: doc.id,
          name: data.name,
          distance: data.distance,
          startLocation: data.startLocation,
          endLocation: data.endLocation,
          waypoints: data.waypoints || [],
          routeCoordinates: data.routeCoordinates || [],
          description: data.description,
          isNew: data.isNew,
          likes: data.likes || 0,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toMillis()
              : data.createdAt,
        });
      }
    });

    return courses.slice(0, limit);
  } catch (error) {
    console.error("Error fetching new courses:", error);
    throw error;
  }
};

// 리뷰 관련 타입
export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface NewReviewInput {
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}

const REVIEWS_COLLECTION = "courseReviews";

/**
 * 코스 리뷰 가져오기
 */
export const getCourseReviews = async (courseId: string): Promise<CourseReview[]> => {
  try {
    // where만 사용하고 클라이언트에서 정렬 (복합 인덱스 불필요)
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("courseId", "==", courseId)
    );
    const querySnapshot = await getDocs(q);

    const reviews: CourseReview[] = [];
    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      reviews.push({
        id: docSnapshot.id,
        courseId: data.courseId,
        userId: data.userId,
        userName: data.userName,
        rating: data.rating,
        comment: data.comment,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toMillis()
            : data.createdAt,
      });
    });

    // 클라이언트에서 최신순 정렬
    reviews.sort((a, b) => b.createdAt - a.createdAt);

    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw error;
  }
};

/**
 * 리뷰 추가
 */
export const addCourseReview = async (reviewData: NewReviewInput): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      courseId: reviewData.courseId,
      userId: reviewData.userId,
      userName: reviewData.userName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: serverTimestamp(),
    });

    // 코스의 평균 별점 업데이트
    await updateCourseAverageRating(reviewData.courseId);

    return docRef.id;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

/**
 * 리뷰 삭제
 */
export const deleteCourseReview = async (reviewId: string, courseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));

    // 코스의 평균 별점 업데이트
    await updateCourseAverageRating(courseId);
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

/**
 * 코스 평균 별점 업데이트
 */
const updateCourseAverageRating = async (courseId: string): Promise<void> => {
  try {
    const reviews = await getCourseReviews(courseId);

    if (reviews.length === 0) {
      await updateDoc(doc(db, COLLECTION_NAME, courseId), {
        averageRating: 0,
        reviewCount: 0,
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await updateDoc(doc(db, COLLECTION_NAME, courseId), {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error("Error updating average rating:", error);
    throw error;
  }
};
