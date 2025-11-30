import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "./styles/TrendingShoes.styles";
import {
  getAllShoes,
  toggleShoeLike,
  addShoes,
} from "../../services/shoesService";
import { pickAndUploadImage } from "../../services/imageUploadService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

const BRANDS = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "New Balance",
  "Asics",
  "Under Armour",
  "Vans",
  "Converse",
  "Jordan",
  "기타",
];

const GENDERS = ["여성", "남성", "공용"];
const SHOE_TYPES = ["로드", "트레일", "트랙"];

export default function TrendingShoes({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredShoes, setFilteredShoes] = useState([]);
  const [likedShoes, setLikedShoes] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState("rating"); // 정렬 기준 - 기본값: 별점순
  const [showSortDropdown, setShowSortDropdown] = useState(false); // 정렬 드롭다운 표시 여부
  const [newShoe, setNewShoe] = useState({
    brand: "",
    customBrand: "",
    model: "",
    price: "",
    imageUrl: "",
    description: "",
    rating: 0,
    likes: "0",
    gender: "", // 성별: 여성/남성/공용
    type: "", // 종류: 로드/트레일/트랙
  });
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showLikedOnly, setShowLikedOnly] = useState(false); // 찜한 목록만 보기

  // Firestore에서 신발 데이터 불러오기
  useEffect(() => {
    loadShoes();
    loadLikedShoes();
  }, []);

  // 화면 포커스 시 좋아요 상태 새로고침
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadLikedShoes();
      loadShoes(); // 좋아요 수도 새로고침
    });

    return unsubscribe;
  }, [navigation]);

  // 검색어 변경 시 필터링
  useEffect(() => {
    let filtered = shoes;

    // 찜한 목록 필터링
    if (showLikedOnly) {
      filtered = filtered.filter((shoe) => likedShoes[shoe.id]);
    }

    // 검색 필터링
    if (searchText.trim() !== "") {
      filtered = filtered.filter(
        (shoe) =>
          shoe.brand?.toLowerCase().includes(searchText.toLowerCase()) ||
          shoe.model?.toLowerCase().includes(searchText.toLowerCase()) ||
          shoe.description?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 정렬
    const sorted = [...filtered];
    switch (sortBy) {
      case "priceHigh":
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "priceLow":
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "rating":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "likes":
        sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        // 기본 정렬 (등록 순서)
        break;
    }

    setFilteredShoes(sorted);
  }, [searchText, shoes, sortBy, showLikedOnly, likedShoes]);

  const loadShoes = async () => {
    try {
      setLoading(true);
      const shoesData = await getAllShoes();
      setShoes(shoesData);
      setFilteredShoes(shoesData);
    } catch (error) {
      console.error("신발 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLikedShoes = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const likedKeys = keys.filter((key) => key.startsWith("liked_"));
      const likedItems = await AsyncStorage.multiGet(likedKeys);

      const likedMap = {};
      likedItems.forEach(([key, value]) => {
        const shoeId = key.replace("liked_", "");
        likedMap[shoeId] = value === "true";
      });

      setLikedShoes(likedMap);
    } catch (error) {
      console.error("좋아요 상태 로드 실패:", error);
    }
  };

  const handleToggleLike = async (shoeId, event) => {
    // 이벤트 전파 중지 (카드 클릭 이벤트와 분리)
    event.stopPropagation();

    try {
      const currentLikedState = likedShoes[shoeId] || false;
      const newLikedState = !currentLikedState;

      // Firestore 업데이트
      const success = await toggleShoeLike(shoeId, newLikedState);

      if (success) {
        // 로컬 좋아요 상태 업데이트
        setLikedShoes((prev) => ({
          ...prev,
          [shoeId]: newLikedState,
        }));

        // AsyncStorage 업데이트
        if (newLikedState) {
          await AsyncStorage.setItem(`liked_${shoeId}`, "true");
        } else {
          await AsyncStorage.removeItem(`liked_${shoeId}`);
        }

        // 신발 목록의 좋아요 수 즉시 반영
        setShoes((prevShoes) =>
          prevShoes.map((shoe) =>
            shoe.id === shoeId
              ? {
                  ...shoe,
                  likes: (shoe.likes || 0) + (newLikedState ? 1 : -1),
                }
              : shoe
          )
        );
      }
    } catch (error) {
      console.error("좋아요 토글 실패:", error);
    }
  };

  // 갤러리에서 이미지 선택 및 업로드
  const handlePickImage = async () => {
    try {
      setUploadingImage(true);
      const imageUrl = await pickAndUploadImage("shoes");

      if (imageUrl) {
        setNewShoe((prev) => ({ ...prev, imageUrl }));
        Alert.alert("성공", "이미지가 업로드되었습니다!");
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      Alert.alert("오류", "이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddShoe = async () => {
    // 브랜드 검증 (기타 선택 시 직접 입력 필요)
    const finalBrand =
      newShoe.brand === "기타" ? newShoe.customBrand : newShoe.brand;

    // 필수 필드 검증
    if (
      !finalBrand ||
      !newShoe.model ||
      !newShoe.price ||
      newShoe.rating === 0 ||
      !newShoe.gender ||
      !newShoe.type
    ) {
      Alert.alert(
        "오류",
        "브랜드, 모델명, 가격, 평점, 성별, 종류는 필수 입력 항목입니다."
      );
      return;
    }

    try {
      const shoeData = {
        brand: finalBrand,
        model: newShoe.model,
        price: parseFloat(newShoe.price),
        imageUrl: newShoe.imageUrl || "",
        description: newShoe.description || "",
        rating: newShoe.rating,
        likes: parseInt(newShoe.likes) || 0,
        gender: newShoe.gender,
        type: newShoe.type,
      };

      await addShoes(shoeData);
      Alert.alert("성공", "신발이 등록되었습니다!");

      // 입력 필드 초기화
      setNewShoe({
        brand: "",
        customBrand: "",
        model: "",
        price: "",
        imageUrl: "",
        description: "",
        rating: 0,
        likes: "0",
        gender: "",
        type: "",
      });

      setModalVisible(false);
      loadShoes(); // 목록 새로고침
    } catch (error) {
      Alert.alert("오류", "신발 등록에 실패했습니다.");
      console.error(error);
    }
  };

  const updateField = (field, value) => {
    setNewShoe((prev) => ({ ...prev, [field]: value }));
  };

  const selectBrand = (brand) => {
    setNewShoe((prev) => ({ ...prev, brand, customBrand: "" }));
    setShowBrandPicker(false);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => updateField("rating", i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= newShoe.rating ? "star" : "star-outline"}
            size={25}
            color={i <= newShoe.rating ? "#FFD700" : "#ddd"}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={{ flex: 1 }}>
       <LinearGradient
      colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
      style={StyleSheet.absoluteFillObject}
    />

    {/* SafeAreaView는 배경 투명으로 */}
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
          <Text style={styles.headerTitle}>지금 뜨는 러닝화</Text>
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
            placeholder="검색어를 입력하세요"
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

        {/* 신발 추가 버튼 & 찜 필터 & 정렬 드롭다운 */}
        <View style={styles.sortContainer}>
          {/* 왼쪽 버튼 그룹 */}
          <View style={styles.leftButtonGroup}>
            {/* 신발 추가 버튼 */}
            <TouchableOpacity
              style={styles.addShoeButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={23} color="#fff" />
            </TouchableOpacity>

            {/* 찜 필터 버튼 */}
            <TouchableOpacity
              style={[
                styles.likeFilterButton,
                !showLikedOnly && styles.likeFilterButtonActive,
              ]}
              onPress={() => setShowLikedOnly(!showLikedOnly)}
            >
              <Ionicons
                name={showLikedOnly ? "heart" : "heart-outline"}
                size={20}
                color={!showLikedOnly ? "#fff" : "#FF6B6B"}
              />
            </TouchableOpacity>
          </View>

          {/* 정렬 드롭다운 - 오른쪽 */}
          <TouchableOpacity
            style={styles.sortSelector}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
          >
            <Text style={styles.sortSelectorText}>
              {sortBy === "none"
                ? "없음"
                : sortBy === "priceHigh"
                ? "높은 가격순"
                : sortBy === "priceLow"
                ? "낮은 가격순"
                : sortBy === "rating"
                ? "평점순"
                : "좋아요순"}
            </Text>
            <Ionicons
              name={showSortDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>

          {showSortDropdown && (
            <View style={styles.sortDropdown}>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "none" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("none");
                  setShowSortDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === "none" && styles.sortOptionTextActive,
                  ]}
                >
                  없음
                </Text>
                {sortBy === "none" && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "priceHigh" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("priceHigh");
                  setShowSortDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === "priceHigh" && styles.sortOptionTextActive,
                  ]}
                >
                  높은 가격순
                </Text>
                {sortBy === "priceHigh" && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "priceLow" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("priceLow");
                  setShowSortDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === "priceLow" && styles.sortOptionTextActive,
                  ]}
                >
                  낮은 가격순
                </Text>
                {sortBy === "priceLow" && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "rating" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("rating");
                  setShowSortDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === "rating" && styles.sortOptionTextActive,
                  ]}
                >
                  평점순
                </Text>
                {sortBy === "rating" && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "likes" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("likes");
                  setShowSortDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === "likes" && styles.sortOptionTextActive,
                  ]}
                >
                  좋아요순
                </Text>
                {sortBy === "likes" && (
                  <Ionicons name="checkmark" size={20} color="#2196F3" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 러닝화 그리드 */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#71D9A1" />
              <Text style={styles.loadingText}>신발 정보를 불러오는 중...</Text>
            </View>
          ) : filteredShoes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText ? "검색 결과가 없습니다" : "등록된 신발이 없습니다"}
              </Text>
              <TouchableOpacity
                style={styles.addShoeButton}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.addShoeButtonText}>신발 등록하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.shoesGrid}>
              {filteredShoes.map((shoe, index) => (
                <TouchableOpacity
                  key={shoe.id || index}
                  style={styles.shoeCard}
                  onPress={() =>
                    navigation.navigate("TrendingShoesDetails", {
                      shoeId: shoe.id,
                    })
                  }
                  activeOpacity={0.7}
                >
                  {/* 러닝화 이미지 */}
                  <View style={styles.shoeImageContainer}>
                    {shoe.imageUrl ? (
                      <Image
                        source={{ uri: shoe.imageUrl }}
                        style={styles.shoeImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.shoeImagePlaceholder}>
                        <Text style={styles.shoeImageText}>👟</Text>
                      </View>
                    )}
                    {/* 좋아요 수 표시 (좌측 상단) */}
                    {shoe.likes !== undefined && shoe.likes > 0 && (
                      <View style={styles.likesCountContainer}>
                        <Ionicons name="heart" size={14} color="#FF6B6B" />
                        <Text style={styles.likesCountText}>{shoe.likes}</Text>
                      </View>
                    )}
                    {/* 찜 버튼 (우측 하단) - 항상 표시 */}
                    <TouchableOpacity
                      style={styles.likedBadge}
                      onPress={(e) => handleToggleLike(shoe.id, e)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={likedShoes[shoe.id] ? "heart" : "heart-outline"}
                        size={20}
                        color="#FF6B6B"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* 러닝화 정보 */}
                  <View style={styles.shoeInfo}>
                    {/* 브랜드 */}
                    <View style={styles.tagContainer}>
                      <Text style={styles.tagBadge}>{shoe.brand}</Text>
                    </View>

                    {/* 모델명 */}
                    <Text style={styles.shoeName} numberOfLines={1}>
                      {shoe.model}
                    </Text>

                    {/* 가격 */}
                    <Text style={styles.shoePrice}>
                      ₩{shoe.price?.toLocaleString()}
                    </Text>

                    {/* 평점 */}
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>
                        {shoe.rating?.toFixed(1) || "0.0"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* 신발 등록 모달 */}
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
                  <Text style={styles.modalTitle}>신발 등록</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>브랜드 *</Text>
                  <TouchableOpacity
                    style={styles.brandSelector}
                    onPress={() => setShowBrandPicker(!showBrandPicker)}
                  >
                    <Text
                      style={[
                        styles.brandSelectorText,
                        !newShoe.brand && styles.brandPlaceholder,
                      ]}
                    >
                      {newShoe.brand || "브랜드를 선택하세요"}
                    </Text>
                    <Ionicons
                      name={showBrandPicker ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {/* 브랜드 선택 드롭다운 */}
                  {showBrandPicker && (
                    <View style={styles.brandPickerContainer}>
                      <ScrollView
                        style={styles.brandPicker}
                        nestedScrollEnabled={true}
                      >
                        {BRANDS.map((brand) => (
                          <TouchableOpacity
                            key={brand}
                            style={styles.brandOption}
                            onPress={() => selectBrand(brand)}
                          >
                            <Text style={styles.brandOptionText}>{brand}</Text>
                            {newShoe.brand === brand && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color="#71D9A1"
                              />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* 기타 선택 시 직접 입력 */}
                  {newShoe.brand === "기타" && (
                    <TextInput
                      style={[styles.input, styles.customBrandInput]}
                      placeholder="브랜드명을 입력하세요"
                      value={newShoe.customBrand}
                      onChangeText={(text) => updateField("customBrand", text)}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>모델명 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: Air Max 270"
                    value={newShoe.model}
                    onChangeText={(text) => updateField("model", text)}
                  />
                </View>

                {/* 성별과 종류 드롭다운 (1:1 비율) */}
                <View style={styles.inputRow}>
                  {/* 성별 선택 */}
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>성별 *</Text>
                    <TouchableOpacity
                      style={styles.brandSelector}
                      onPress={() => setShowGenderPicker(!showGenderPicker)}
                    >
                      <Text
                        style={[
                          styles.brandSelectorText,
                          !newShoe.gender && styles.brandPlaceholder,
                        ]}
                      >
                        {newShoe.gender || "선택"}
                      </Text>
                      <Ionicons
                        name={showGenderPicker ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>

                    {/* 성별 선택 드롭다운 */}
                    {showGenderPicker && (
                      <View style={styles.brandPickerContainer}>
                        <View style={styles.brandPicker}>
                          {GENDERS.map((gender) => (
                            <TouchableOpacity
                              key={gender}
                              style={styles.brandOption}
                              onPress={() => {
                                setNewShoe((prev) => ({ ...prev, gender }));
                                setShowGenderPicker(false);
                              }}
                            >
                              <Text style={styles.brandOptionText}>
                                {gender}
                              </Text>
                              {newShoe.gender === gender && (
                                <Ionicons
                                  name="checkmark"
                                  size={20}
                                  color="#71D9A1"
                                />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* 러닝화 종류 선택 */}
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>종류 *</Text>
                    <TouchableOpacity
                      style={styles.brandSelector}
                      onPress={() => setShowTypePicker(!showTypePicker)}
                    >
                      <Text
                        style={[
                          styles.brandSelectorText,
                          !newShoe.type && styles.brandPlaceholder,
                        ]}
                      >
                        {newShoe.type || "선택"}
                      </Text>
                      <Ionicons
                        name={showTypePicker ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>

                    {/* 종류 선택 드롭다운 */}
                    {showTypePicker && (
                      <View style={styles.brandPickerContainer}>
                        <View style={styles.brandPicker}>
                          {SHOE_TYPES.map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={styles.brandOption}
                              onPress={() => {
                                setNewShoe((prev) => ({ ...prev, type }));
                                setShowTypePicker(false);
                              }}
                            >
                              <Text style={styles.brandOptionText}>{type}</Text>
                              {newShoe.type === type && (
                                <Ionicons
                                  name="checkmark"
                                  size={20}
                                  color="#71D9A1"
                                />
                              )}
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>가격 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 150000"
                    keyboardType="numeric"
                    value={newShoe.price}
                    onChangeText={(text) => updateField("price", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>평점 *</Text>
                  <View style={styles.starsContainer}>{renderStars()}</View>
                  <Text style={styles.ratingValue}>
                    {newShoe.rating > 0
                      ? `${newShoe.rating}.0 / 5.0`
                      : "별을 선택하세요"}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>이미지</Text>
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={handlePickImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#71D9A1" />
                    ) : (
                      <>
                        <Ionicons name="image" size={24} color="#71D9A1" />
                        <Text style={styles.imagePickerText}>
                          {newShoe.imageUrl ? "이미지 변경" : "갤러리에서 선택"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {newShoe.imageUrl && (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: newShoe.imageUrl }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => updateField("imageUrl", "")}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#FF6B6B"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>설명</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="신발에 대한 설명을 입력하세요"
                    multiline
                    numberOfLines={4}
                    value={newShoe.description}
                    onChangeText={(text) => updateField("description", text)}
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
                    onPress={handleAddShoe}
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
