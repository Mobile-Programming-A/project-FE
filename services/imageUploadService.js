import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

/**
 * 갤러리에서 이미지 선택
 */
export const pickImageFromGallery = async () => {
  try {
    // 갤러리 접근 권한 요청
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
      return null;
    }

    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error("Error picking image:", error);
    throw error;
  }
};

/**
 * 이미지를 Firebase Storage에 업로드
 */
export const uploadImageToStorage = async (imageUri, folder = "shoes") => {
  try {
    console.log("Starting upload for:", imageUri);

    // URI에서 blob 생성
    const response = await fetch(imageUri);
    const blob = await response.blob();

    console.log("Blob created, size:", blob.size, "type:", blob.type);

    // 파일명 생성 (타임스탬프 사용)
    const filename = `${folder}/${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.jpg`;

    console.log("Uploading to:", filename);

    const storageRef = ref(storage, filename);

    // 메타데이터 추가
    const metadata = {
      contentType: "image/jpeg",
    };

    // 업로드
    console.log("Starting uploadBytes...");
    const snapshot = await uploadBytes(storageRef, blob, metadata);
    console.log("Upload successful:", snapshot);

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef);
    console.log("Download URL:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw error;
  }
};

/**
 * 갤러리에서 이미지 선택 후 업로드
 */
export const pickAndUploadImage = async (folder = "shoes") => {
  try {
    const imageUri = await pickImageFromGallery();

    if (!imageUri) {
      return null;
    }

    const downloadURL = await uploadImageToStorage(imageUri, folder);
    return downloadURL;
  } catch (error) {
    console.error("Error in pickAndUploadImage:", error);
    throw error;
  }
};
