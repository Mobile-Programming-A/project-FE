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
  courseData: NewRunningCourseInput
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
