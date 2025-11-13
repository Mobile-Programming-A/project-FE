import { addDoc, collection, getDocs } from "firebase/firestore";
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
    console.log("신발이 등록되었습니다!");
  } catch (error) {
    Alert.alert("신발 추가 중 오류가 발생했습니다 🥲");
    console.error("신발 추가 중 오류가 발생했습니다 🥲: ", error);
  }
};

// 러닝화 정보 수정하기
// 러닝화 정보 삭제하기
// 특정 러닝화 정보 가져오기
