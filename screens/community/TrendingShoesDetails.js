import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "./styles/TrendingShoesDetails.styles";
import {
  getShoeById,
  deleteShoe,
  toggleShoeLike,
} from "../../services/shoesService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TrendingShoesDetails({ navigation, route }) {
  const { shoeId } = route.params;
  const [shoe, setShoe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  const loadShoeDetails = async () => {
    try {
      setLoading(true);
      const shoeData = await getShoeById(shoeId);
      if (shoeData) {
        setShoe(shoeData);
        // 좋아요 상태 불러오기
        const liked = await AsyncStorage.getItem(`liked_${shoeId}`);
        setIsLiked(liked === "true");
      } else {
        Alert.alert("오류", "신발 정보를 찾을 수 없습니다.");
        navigation.goBack();
      }
    } catch (error) {
      console.error("신발 상세 정보 로드 실패:", error);
      Alert.alert("오류", "신발 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShoeDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoeId]);

  const handleDelete = () => {
    Alert.alert("삭제 확인", "정말로 이 신발 정보를 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const success = await deleteShoe(shoeId);
          if (success) {
            Alert.alert("성공", "신발 정보가 삭제되었습니다.");
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;

      // Firestore 좋아요 수 업데이트
      const success = await toggleShoeLike(shoeId, newLikedState);

      if (success) {
        // 로컬 상태 업데이트
        setIsLiked(newLikedState);

        // AsyncStorage에 좋아요 상태 저장
        await AsyncStorage.setItem(`liked_${shoeId}`, newLikedState.toString());

        // UI 즉시 반영을 위한 shoe 상태 업데이트
        setShoe((prevShoe) => ({
          ...prevShoe,
          likes: (prevShoe.likes || 0) + (newLikedState ? 1 : -1),
        }));
      }
    } catch (error) {
      console.error("좋아요 처리 중 오류:", error);
      Alert.alert("오류", "좋아요 처리에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7AC943" />
            <Text style={styles.loadingText}>신발 정보를 불러오는 중...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!shoe) {
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
          <Text style={styles.headerTitle}>러닝화 상세</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* 신발 이미지 */}
          <View style={styles.imageSection}>
            {shoe.imageUrl ? (
              <Image
                source={{ uri: shoe.imageUrl }}
                style={styles.shoeImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>👟</Text>
              </View>
            )}

            {/* 좋아요 버튼 */}
            <TouchableOpacity
              style={styles.likeButton}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? "#FF6B6B" : "#fff"}
              />
            </TouchableOpacity>
          </View>

          {/* 신발 정보 섹션 */}
          <View style={styles.infoSection}>
            {/* 브랜드 태그 */}
            <View style={styles.brandContainer}>
              <Text style={styles.brandBadge}>{shoe.brand}</Text>
            </View>

            {/* 모델명 */}
            <Text style={styles.modelName}>{shoe.model}</Text>

            {/* 평점 및 좋아요 */}
            <View style={styles.statsContainer}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {shoe.rating?.toFixed(1) || "0.0"}
                </Text>
              </View>

              {shoe.likes !== undefined && (
                <View style={styles.likesContainer}>
                  <Ionicons name="heart" size={18} color="#FF6B6B" />
                  <Text style={styles.likesText}>{shoe.likes} 좋아요</Text>
                </View>
              )}
            </View>

            {/* 가격 */}
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>가격</Text>
              <Text style={styles.priceValue}>
                ₩{shoe.price?.toLocaleString()}
              </Text>
            </View>

            {/* 태그 */}
            {shoe.tag && shoe.tag.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.sectionTitle}>태그</Text>
                <View style={styles.tagsContainer}>
                  {shoe.tag.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 설명 */}
            {shoe.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>제품 설명</Text>
                <Text style={styles.descriptionText}>{shoe.description}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
