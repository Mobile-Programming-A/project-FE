import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { updateDoc } from "firebase/firestore";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/config";

const avatarImages = {
  avatar1: require("../assets/images/avatar1.png"),
  avatar2: require("../assets/images/avatar2.png"),
  avatar3: require("../assets/images/avatar3.png"),
  avatar4: require("../assets/images/avatar4.png"),
  avatar5: require("../assets/images/avatar5.png"),
};

export default function FriendsScreen() {
  const router = useRouter();
  const mapRef = useRef(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [friendId, setFriendId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [loading, setLoading] = useState(true);

  const [region, setRegion] = useState(null);

  // ⭐ 즐겨찾기 토글 (optimistic update)
  const handleToggleFavorite = async (friend) => {
    const newValue = !friend.isFavorite;

    // 1) 선택된 친구 로컬 업데이트
    setSelectedFriend((prev) =>
      prev && prev.id === friend.id ? { ...prev, isFavorite: newValue } : prev
    );

    // 2) 리스트 로컬 업데이트
    setFriends((prev) =>
      prev.map((f) =>
        f.id === friend.id ? { ...f, isFavorite: newValue } : f
      )
    );

    try {
      await updateDoc(doc(db, "friends", friend.id), {
        isFavorite: newValue,
      });
    } catch (e) {
      console.log("즐겨찾기 업데이트 실패:", e);
      Alert.alert("오류", "즐겨찾기 변경 중 문제가 발생했습니다.");

      // 실패 시 롤백
      setSelectedFriend((prev) =>
        prev && prev.id === friend.id ? { ...prev, isFavorite: friend.isFavorite } : prev
      );
      setFriends((prev) =>
        prev.map((f) =>
          f.id === friend.id ? { ...f, isFavorite: friend.isFavorite } : f
        )
      );
    }
  };

  // -----------------------------
  // 내 위치 불러오기
  // -----------------------------
  useEffect(() => {
    const initLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});

          setRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        } else {
          setRegion({
            latitude: 37.58,
            longitude: 127.01,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch (e) {
        console.log("초기 위치 설정 실패:", e);
        setRegion({
          latitude: 37.58,
          longitude: 127.01,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    };

    initLocation();
  }, []);

  // -----------------------------
  // 친구 목록 실시간 동기화
  // -----------------------------
  useEffect(() => {
    setLoading(true);

    const friendsRef = collection(db, "friends");

    const unsubscribe = onSnapshot(
      friendsRef,
      (querySnapshot) => {
        const data = querySnapshot.docs.map((docItem) => {
          const f = docItem.data();

          return {
            id: docItem.id,
            name: f.name || "이름 없음",
            avatar: f.avatar?.trim() || "avatar1",
            status: f.status || "",
            isFavorite: f.isFavorite ?? false,
            stats: {
              step: f["stats.step"] ?? f.stats?.step ?? 0,
              cal: f["stats.cal"] ?? f.stats?.cal ?? 0,
              dist: f["stats.dist"] ?? f.stats?.dist ?? 0,
            },
            lat: f.latitude ?? 37.58,
            lng: f.longitude ?? 127.1,
            route: f.route ?? [],
            createdAt: f.createdAt || null,
          };
        });

        // 안정적인 정렬 방식 (즐겨찾기 → createdAt)
        data.sort((a, b) => {
          if (a.isFavorite !== b.isFavorite) {
            return (b.isFavorite === true) - (a.isFavorite === true);
          }
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

        setFriends(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore 실시간 동기화 실패:", error);
        setLoading(false);
        Alert.alert("오류", `친구 목록을 불러오는 중 문제가 발생했습니다.\n${error.message}`);
      }
    );

    return () => unsubscribe();
  }, []);

  // -----------------------------
  // 검색 필터
  // -----------------------------
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    return friends.filter((friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  // -----------------------------
  // 선택된 친구가 friends에서 사라졌을 때 자동 해제
  // -----------------------------
  useEffect(() => {
    if (!selectedFriend) return;
    const exists = friends.some((f) => f.id === selectedFriend.id);
    if (!exists) setSelectedFriend(null);
  }, [friends, selectedFriend]);

  // 검색 결과에서도 없어지면 해제
  useEffect(() => {
    if (!selectedFriend) return;
    const exists = filteredFriends.some((f) => f.id === selectedFriend.id);
    if (!exists) setSelectedFriend(null);
  }, [filteredFriends, selectedFriend]);

  // -----------------------------
  // 친구 선택 → 지도 이동
  // -----------------------------
  const handleSelectFriend = useCallback(
    (friend) => {
      if (selectedFriend?.id === friend.id) {
        setSelectedFriend(null);
        if (mapRef.current && region) {
          mapRef.current.animateToRegion(region, 800);
        }
        return;
      }

      setSelectedFriend(friend);

      if (mapRef.current && friend.lat && friend.lng) {
        mapRef.current.animateToRegion(
          {
            latitude: friend.lat,
            longitude: friend.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          800
        );
      }
    },
    [selectedFriend, region]
  );

  // -----------------------------
  // 친구 추가
  // -----------------------------
  const handleFriendRequest = async () => {
    if (friendId.trim() === "") {
      Alert.alert("알림", "친구 ID를 입력해주세요.");
      return;
    }

    try {
      let latitude = region?.latitude ?? 37.58;
      let longitude = region?.longitude ?? 127.01;

      const randomOffset = () => (Math.random() - 0.5) * 0.003;
      latitude += randomOffset();
      longitude += randomOffset();

      await addDoc(collection(db, "friends"), {
        name: friendId,
        avatar: "avatar1",
        status: "새 친구! 아직 활동 없음",
        stats: { step: 0, cal: 0, dist: 0 },
        latitude,
        longitude,
        route: [],
        isFavorite: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert("추가 완료", `${friendId}님이 친구 목록에 추가되었습니다.`);
      setFriendId("");
      setModalVisible(false);
    } catch (error) {
      console.error("친구 추가 실패:", error);
      Alert.alert("오류", "친구 추가 중 문제가 발생했습니다.");
    }
  };

  // -----------------------------
  // 친구 삭제
  // -----------------------------
  const handleDeleteFriend = (friendId, friendName) => {
    Alert.alert(
      "친구 삭제",
      `${friendName}님을 친구 목록에서 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "friends", friendId));

              if (selectedFriend?.id === friendId) {
                setSelectedFriend(null);
              }

              Alert.alert("삭제 완료", `${friendName}님이 친구 목록에서 삭제되었습니다.`);
            } catch (error) {
              console.error("친구 삭제 실패:", error);
              Alert.alert("오류", "친구 삭제 중 문제가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EBFFE5" }}>
      <StatusBar barStyle="dark-content" />

      {/* 헤더 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.replace("/(tabs)/main")}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1C" />
        </TouchableOpacity>

        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1C1C1C" }}>
          친구
        </Text>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={26} color="#1C1C1C" />
        </TouchableOpacity>
      </View>

      {/* 검색창 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="친구 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 15,
              color: "#1C1C1C",
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* region 로딩 중 */}
      {region === null ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#7AC943" />
          <Text style={{ marginTop: 12, color: "#666" }}>내 위치 불러오는 중...</Text>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#7AC943" />
          <Text style={{ marginTop: 12, color: "#666" }}>친구 목록 불러오는 중...</Text>
        </View>
      ) : (
        <>
          {/* 지도 */}
          <MapView
            provider={PROVIDER_GOOGLE}
            ref={mapRef}
            style={{
              position: "absolute",
              top: 165,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            region={region}
            showsUserLocation={true}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
          >
            {selectedFriend?.route?.length > 1 && (
              <Polyline
                coordinates={selectedFriend.route.map((p) => ({
                  latitude: p.lat,
                  longitude: p.lng,
                }))}
                strokeColor="#007AFF"
                strokeWidth={6}
              />
            )}

            {/* 선택된 친구 마커 */}
            {selectedFriend &&
              filteredFriends.some((f) => f.id === selectedFriend.id) && (
                <Marker
                  key={`${selectedFriend.id}-${selectedFriend.avatar}`}
                  coordinate={{
                    latitude: selectedFriend.lat,
                    longitude: selectedFriend.lng,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <View
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 28,
                        padding: 4,
                        elevation: 3,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                      }}
                    >
                      <Image
                        source={avatarImages[selectedFriend.avatar]}
                        style={{ width: 44, height: 44, borderRadius: 22 }}
                      />
                    </View>
                    <View
                      style={{
                        width: 0,
                        height: 0,
                        borderLeftWidth: 6,
                        borderRightWidth: 6,
                        borderTopWidth: 10,
                        borderLeftColor: "transparent",
                        borderRightColor: "transparent",
                        borderTopColor: "#fff",
                        marginTop: -2,
                      }}
                    />
                  </View>
                </Marker>
              )}
          </MapView>

          {/* 자연스러운 하단 그라데이션 (11번 적용) */}
          <LinearGradient
            colors={[
              "rgba(235,255,229,0)",
              "rgba(235,255,229,0.15)",
              "rgba(255,255,255,0.55)",
              "rgba(255,255,255,1)",
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 380,
            }}
          />

          {/* 친구 상세 카드 (Bottom fixed / 옵션 B) */}
          {selectedFriend &&
            filteredFriends.some((f) => f.id === selectedFriend.id) && (
              <View
                style={{
                  position: "absolute",
                  bottom: 130,
                  left: 20,
                  right: 20,
                  backgroundColor: "#fff",
                  borderRadius: 24,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 6,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Image
                      source={avatarImages[selectedFriend.avatar]}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        marginRight: 15,
                      }}
                    />

                    {/* 이름 … 처리 (10번 적용) */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
                          style={{
                            fontSize: 20,
                            fontWeight: "700",
                            maxWidth: 140,
                          }}
                        >
                          {selectedFriend.name}
                        </Text>

                        {/* 즐찾 버튼 */}
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(selectedFriend)}
                          style={{ marginLeft: 4, padding: 4 }}
                        >
                          <Ionicons
                            name={
                              selectedFriend.isFavorite
                                ? "star"
                                : "star-outline"
                            }
                            size={20}
                            color={
                              selectedFriend.isFavorite ? "#FFD34E" : "#C4C4C4"
                            }
                          />
                        </TouchableOpacity>
                      </View>

                      <Text style={{ color: "#666", marginTop: 5 }}>
                        {selectedFriend.status ||
                          "아직 활동 데이터가 없어요"}
                      </Text>
                    </View>
                  </View>

                  {/* 삭제 */}
                  <TouchableOpacity
                    onPress={() =>
                      handleDeleteFriend(selectedFriend.id, selectedFriend.name)
                    }
                    style={{
                      backgroundColor: "#FFE5E5",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF4444" />
                  </TouchableOpacity>
                </View>

                {/* 통계 */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    marginTop: 18,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="walk-outline" size={22} color="#7AC943" />
                    <Text style={{ fontWeight: "700", marginTop: 6 }}>
                      {selectedFriend.stats?.step}
                    </Text>
                    <Text style={{ color: "#777", fontSize: 12 }}>걸음 수</Text>
                  </View>

                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="flame-outline" size={22} color="#FF8C00" />
                    <Text style={{ fontWeight: "700", marginTop: 6 }}>
                      {selectedFriend.stats?.cal} kcal
                    </Text>
                    <Text style={{ color: "#777", fontSize: 12 }}>칼로리</Text>
                  </View>

                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="map-outline" size={22} color="#3F72AF" />
                    <Text style={{ fontWeight: "700", marginTop: 6 }}>
                      {selectedFriend.stats?.dist} km
                    </Text>
                    <Text style={{ color: "#777", fontSize: 12 }}>거리</Text>
                  </View>
                </View>
              </View>
            )}

          {/* 검색 결과 없음 */}
          {filteredFriends.length === 0 && (
            <View
              style={{
                position: "absolute",
                bottom: 130,
                left: 20,
                right: 20,
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 30,
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 3 },
                elevation: 6,
              }}
            >
              <Ionicons name="people-outline" size={50} color="#ccc" />
              <Text
                style={{
                  fontSize: 16,
                  color: "#666",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                {searchQuery ? "검색 결과가 없습니다" : "아직 친구가 없습니다"}
              </Text>
            </View>
          )}

          {/* 친구 리스트 */}
          <View
            style={{
              position: "absolute",
              bottom: 30,
              width: "100%",
            }}
          >
            <FlatList
              data={filteredFriends}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              removeClippedSubviews
              initialNumToRender={8}
              windowSize={10}
              maxToRenderPerBatch={8}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectFriend(item)}
                  style={{ alignItems: "center", marginHorizontal: 8 }}
                >
                  <Image
                    source={avatarImages[item.avatar]}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth:
                        selectedFriend?.id === item.id ? 3 : 0,
                      borderColor:
                        selectedFriend?.id === item.id
                          ? "#FFD34E"
                          : "transparent",
                    }}
                  />

                  {/* 즐겨찾기 표시 */}
                  {item.isFavorite && (
                    <Ionicons
                      name="star"
                      size={16}
                      color="#FFD34E"
                      style={{ position: "absolute", top: -2, right: -2 }}
                    />
                  )}

                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      fontSize: 13,
                      maxWidth: 70,
                      color:
                        selectedFriend?.id === item.id ? "#000" : "#666",
                      marginTop: 6,
                      fontWeight:
                        selectedFriend?.id === item.id ? "600" : "400",
                      textAlign: "center",
                    }}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </>
      )}

      {/* 친구 추가 모달 */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </TouchableWithoutFeedback>

          <View
            style={{
              backgroundColor: "#222",
              borderRadius: 16,
              width: "85%",
              padding: 24,
              opacity: 0.85,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              친구 추가
            </Text>

            <TextInput
              placeholder="친구 ID 입력"
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={friendId}
              onChangeText={setFriendId}
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: "#C7C7C7",
                marginBottom: 16,
              }}
            />

            <TouchableOpacity
              onPress={handleFriendRequest}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "600", color: "#1C1C1C" }}>추가</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
