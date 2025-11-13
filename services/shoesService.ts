import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { Shoes } from "../types/shoes";
import { Alert } from "react-native";
import { db } from "./config";

// 전체 신발 목록 불러오기
export const getAllShoes = async (): Promise<Shoes[]> => {
  try {
    const snapshot = await getDocs(collection(db, "shoes"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Shoes[];
  } catch (error) {
    console.error("신발 목록 불러오기 중 오류가 발생했습니다 🥲: ", error);
    return [];
  }
};

// 러닝화 추가하기
export const addShoes = async (shoes: Shoes) => {
  try {
    const docRef = await addDoc(collection(db, "shoes"), {
      ...shoes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("신발이 등록되었습니다! ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    Alert.alert("신발 추가 중 오류가 발생했습니다 🥲");
    console.error("신발 추가 중 오류가 발생했습니다 🥲: ", error);
    throw error;
  }
};

// 특정 러닝화 정보 가져오기
export const getShoeById = async (shoeId: string): Promise<Shoes | null> => {
  try {
    const docRef = doc(db, "shoes", shoeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as unknown as Shoes;
    } else {
      console.log("해당 ID의 신발을 찾을 수 없습니다.");
      return null;
    }
  } catch (error) {
    console.error("신발 정보 불러오기 중 오류가 발생했습니다 🥲: ", error);
    return null;
  }
};

// 러닝화 삭제하기
export const deleteShoe = async (shoeId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, "shoes", shoeId);
    await deleteDoc(docRef);
    console.log("신발이 삭제되었습니다! ID:", shoeId);
    return true;
  } catch (error) {
    Alert.alert("신발 삭제 중 오류가 발생했습니다 🥲");
    console.error("신발 삭제 중 오류가 발생했습니다 🥲: ", error);
    return false;
  }
};

// 러닝화 좋아요 토글 (증가/감소)
export const toggleShoeLike = async (
  shoeId: string,
  isLiked: boolean
): Promise<boolean> => {
  try {
    const docRef = doc(db, "shoes", shoeId);
    await updateDoc(docRef, {
      likes: increment(isLiked ? 1 : -1),
      updatedAt: new Date(),
    });
    console.log(
      `신발 좋아요가 ${isLiked ? "추가" : "제거"}되었습니다! ID:`,
      shoeId
    );
    return true;
  } catch (error) {
    console.error("좋아요 업데이트 중 오류가 발생했습니다 🥲: ", error);
    return false;
  }
};

// 러닝화 정보 수정하기
// 특정 러닝화 정보 가져오기
