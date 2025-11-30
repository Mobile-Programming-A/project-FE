// screens/FriendsScreen.js
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../services/config";


const DEFAULT_REGION = {
  latitude: 37.58,
  longitude: 127.01,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const avatarImages = {
  avatar1: require("../assets/images/avatar1.png"),
  avatar2: require("../assets/images/avatar2.png"),
  avatar3: require("../assets/images/avatar3.png"),
  avatar4: require("../assets/images/avatar4.png"),
  avatar5: require("../assets/images/avatar5.png"),
};


// OSRM 도보 경로 계산
async function calculateOSRMRoute(start, waypoints, end) {
  const allPoints = [start, ...waypoints, end];
  const coordinates = allPoints
    .map((p) => `${p.longitude},${p.latitude}`)
    .join(";");

  const url = `https://router.project-osrm.org/route/v1/walking/${coordinates}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === "Ok" && data.routes?.length > 0) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
    }
  } catch (e) {
    console.log("❌ OSRM Error:", e);
  }

  return allPoints;
}

const formatPace = (secondsPerKm) => {
  if (secondsPerKm === 0 || !isFinite(secondsPerKm)) return "0'00\"";
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}'${secs.toString().padStart(2, '0')}"`;
};

// Friend List Item 
const FriendListItem = React.memo(({ item, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={{ alignItems: "center", marginHorizontal: 8 }}
    >
      <Image
        source={avatarImages[item.avatar]}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          borderWidth: isSelected ? 3 : 0,
          borderColor: isSelected ? "#FFD34E" : "transparent",
        }}
      />

      {item.isFavorite && (
        <Ionicons
          name="star"
          size={16}
          color="#FFD34E"
          style={{ position: "absolute", top: -2, right: -2 }}
        />
      )}

      <View
        style={{
          backgroundColor: isSelected ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.25)",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          marginTop: 6,
        }}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontSize: 13,
            color: isSelected ? "#333" : "#fff",
            fontWeight: isSelected ? "600" : "500",
            maxWidth: 70,
            textAlign: "center",
          }}
        >
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
});


// 메인
export default function FriendsScreen() {
  const router = useRouter();
  const mapRef = useRef(null);

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [friendId, setFriendId] = useState("");

  const [displayRoute, setDisplayRoute] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const routeLoadingRef = useRef(false);


  // 내 위치 
  useEffect(() => {
    const loadLocation = async () => {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();

        if (status !== "granted") {
          const req = await Location.requestForegroundPermissionsAsync();
          status = req.status;
        }

        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          setRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        } else {
          setRegion(DEFAULT_REGION);
        }
      } catch (err) {
        console.log("❌ 위치 실패:", err);
        setRegion(DEFAULT_REGION);
      }
    };

    loadLocation();
  }, []);


  // Firestore 실시간 동기화 
  useEffect(() => {
    const friendsRef = collection(db, "friends");
    const q = query(friendsRef, orderBy("isFavorite", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((docItem) => {
          const f = docItem.data() || {};

          const stats = {
            step: Number(f?.stats?.step ?? f["stats.step"] ?? 0),
            cal: Number(f?.stats?.cal ?? f["stats.cal"] ?? 0),
            dist: Number(f?.stats?.dist ?? f["stats.dist"] ?? 0),
          };

          const route = Array.isArray(f.route)
            ? f.route.filter(
              (p) =>
                p &&
                (p.lat ?? p.latitude) &&
                (p.lng ?? p.longitude)
            )
            : [];

          return {
            id: docItem.id,
            name: f.name || "이름 없음",
            avatar: f.avatar || "avatar1",
            status: f.status || "",
            isFavorite: f.isFavorite ?? false,
            stats,
            lat: f.latitude ?? DEFAULT_REGION.latitude,
            lng: f.longitude ?? DEFAULT_REGION.longitude,
            route,
          };
        });


        data.sort((a, b) => {
          if (a.isFavorite === b.isFavorite) return 0;
          return a.isFavorite ? -1 : 1;
        });

        setFriends(data);
        setLoading(false);
      },
      (err) => {
        Alert.alert("오류", err.message);
      }
    );

    return () => unsub();
  }, []);


  const filteredFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return friends;

    return friends.filter((f) => f.name.toLowerCase().includes(q));
  }, [friends, searchQuery]);


  //  즐겨찾기 
  const handleToggleFavorite = async (friend) => {
    const newValue = !friend.isFavorite;


    setFriends((prev) =>
      prev.map((f) =>
        f.id === friend.id ? { ...f, isFavorite: newValue } : f
      )
    );

    setSelectedFriend((prev) =>
      prev?.id === friend.id ? { ...prev, isFavorite: newValue } : prev
    );


    try {
      await updateDoc(doc(db, "friends", friend.id), {
        isFavorite: newValue,
      });
    } catch (e) {
      console.log("❌ 즐겨찾기 업데이트 실패:", e);


      setFriends((prev) =>
        prev.map((f) =>
          f.id === friend.id ? { ...f, isFavorite: !newValue } : f
        )
      );

      setSelectedFriend((prev) =>
        prev?.id === friend.id
          ? { ...prev, isFavorite: !newValue }
          : prev
      );
    }
  };

  // 친구 선택 → 지도 이동 + OSRM 경로 계산
  const handleSelectFriend = useCallback(
    async (friend) => {
      if (selectedFriend?.id === friend.id) {
        setSelectedFriend(null);
        setDisplayRoute([]);
        mapRef.current?.animateToRegion(region, 600);
        return;
      }

      setSelectedFriend(friend);
      setDisplayRoute([]);

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: friend.lat,
            longitude: friend.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          700
        );
      }

      if (routeLoadingRef.current) return;
      routeLoadingRef.current = true;
      setRouteLoading(true);

      try {
        const cleaned = friend.route;
        if (cleaned.length < 2) return;

        const start = { latitude: cleaned[0].lat, longitude: cleaned[0].lng };
        const end = {
          latitude: cleaned[cleaned.length - 1].lat,
          longitude: cleaned[cleaned.length - 1].lng,
        };
        const waypoints = cleaned.slice(1, -1).map((p) => ({
          latitude: p.lat,
          longitude: p.lng,
        }));

        const osrm = await calculateOSRMRoute(start, waypoints, end);
        const simplified = osrm.filter((_, i) => i % 2 === 0);

        setDisplayRoute(simplified);
      } finally {
        setRouteLoading(false);
        routeLoadingRef.current = false;
      }
    },
    [selectedFriend, region]
  );

  // 친구 삭제
  const handleDeleteFriend = (id, name) => {
    Alert.alert("삭제", `${name}님을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "friends", id));
            if (selectedFriend?.id === id) {
              setSelectedFriend(null);
              setDisplayRoute([]);
            }
          } catch (e) {
            Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  // 친구 추가
  const handleAddFriend = async () => {
    if (!friendId.trim()) {
      Alert.alert("알림", "친구 ID를 입력해주세요.");
      return;
    }

    try {
      const baseLat = region?.latitude ?? DEFAULT_REGION.latitude;
      const baseLng = region?.longitude ?? DEFAULT_REGION.longitude;

      await addDoc(collection(db, "friends"), {
        name: friendId,
        avatar: "avatar1",
        status: "새 친구!",
        stats: { step: 0, cal: 0, dist: 0 },
        latitude: baseLat + (Math.random() - 0.5) * 0.003,
        longitude: baseLng + (Math.random() - 0.5) * 0.003,
        route: [],
        isFavorite: false,
        createdAt: serverTimestamp(),
      });

      setFriendId("");
      setModalVisible(false);
    } catch (e) {
      Alert.alert("오류", "추가 중 문제가 발생했습니다.");
    }
  };

  // 로딩 
  if (!region || loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <TouchableOpacity onPress={() => router.replace("/(tabs)/main")}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1C" />
        </TouchableOpacity>

        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1C1C1C" }}>
          친구
        </Text>

        <ActivityIndicator size="large" color="#71D9A1" />
        <Text style={{ marginTop: 12, color: "#666" }}>
          {loading ? "친구 불러오는 중..." : "내 위치 불러오는 중..."}
        </Text>
      </View>
    );
  }

  // 화면 UI
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
        style={{ ...StyleSheet.absoluteFillObject }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />

        {/* ---------------- Header ---------------- */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 16,
          }}
        >
          <TouchableOpacity onPress={() => router.replace("/main")}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#333" }}>
            친구
          </Text>

          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* ---------------- 검색창 ---------------- */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              ...(Platform.OS === "ios"
                ? {
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowOffset: { width: 0, height: 1 },
                  shadowRadius: 4,
                }
                : { elevation: 2 }),
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
                color: "#000",
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ---------------- 지도 ---------------- */}
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
        >
          {/* 경로 표시 */}
          {selectedFriend &&
            (displayRoute.length > 1 ||
              selectedFriend.route.length > 1) && (
              <Polyline
                coordinates={
                  displayRoute.length > 1
                    ? displayRoute
                    : selectedFriend.route.map((p) => ({
                      latitude: p.lat,
                      longitude: p.lng,
                    }))
                }
                strokeColor="#71D9A1"
                strokeColors={["#71D9A1"]}
                strokeWidth={6}
              />
            )}

          {/* 선택된 친구 마커 */}
          {selectedFriend &&
            filteredFriends.some((f) => f.id === selectedFriend.id) && (
              <Marker
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
                    }}
                  >
                    <Image
                      source={avatarImages[selectedFriend.avatar]}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                      }}
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

        {/* ---------------- 경로 로딩 ---------------- */}
        {routeLoading && (
          <View
            style={{
              position: "absolute",
              top: 210,
              left: 0,
              right: 0,
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <ActivityIndicator size="large" color="#71D9A1" />
            <Text style={{ marginTop: 6, color: "#666" }}>
              길 기반 경로 계산 중...
            </Text>
          </View>
        )}

        {/* ---------------- 선택된 친구 상세 카드 ---------------- */}
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
                elevation: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image
                    source={avatarImages[selectedFriend.avatar]}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      marginRight: 15,

                    }}
                  />

                  <View style={{ flexShrink: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 20,
                          fontWeight: "700",
                          maxWidth: 140,

                        }}
                      >
                        {selectedFriend.name}
                      </Text>

                      <TouchableOpacity
                        onPress={() => handleToggleFavorite(selectedFriend)}
                        style={{ marginLeft: 4 }}
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
                  <Ionicons name="walk-outline" size={22} color="#71D9A1" />
                  <Text style={{ fontWeight: "700", marginTop: 6 }}>
                    {selectedFriend.stats.step} km
                  </Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>거리</Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Ionicons name="flame-outline" size={22} color="#FF8C00" />
                  <Text style={{ fontWeight: "700", marginTop: 6 }}>
                    {selectedFriend.stats.cal} kcal
                  </Text>
                  <Text style={{ color: "#666", fontSize: 12 }}>칼로리</Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Ionicons name="speedometer-outline" size={22} color="#6B7FFF" />
                  <Text style={{ fontWeight: "700", marginTop: 6 }}>
                    {formatPace(selectedFriend.stats.dist)} /km
                  </Text>

                  <Text style={{ color: "#666", fontSize: 12 }}>평균 페이스</Text>
                </View>
              </View>
            </View>
          )}

        {/* ---------------- 검색 결과 없음 ---------------- */}
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
              elevation: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
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

        {/* ---------------- 친구 리스트 ---------------- */}
        <View style={{ position: "absolute", bottom: 30, width: "100%" }}>
          <FlatList
            data={filteredFriends}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            removeClippedSubviews
            initialNumToRender={8}
            windowSize={10}
            renderItem={({ item }) => (
              <FriendListItem
                item={item}
                isSelected={selectedFriend?.id === item.id}
                onPress={handleSelectFriend}


              />
            )}
          />
        </View>

        {/* ---------------- 친구 추가 모달 ---------------- */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <KeyboardAvoidingView
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 5,
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
                backgroundColor: "#333",
                borderRadius: 15,
                width: "80%",
                padding: 24,
                opacity: 0.88,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 14,
                  textAlign: "center",
                }}
              >
                친구 추가
              </Text>

              <TextInput
                placeholder="친구 ID 입력"
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: "#fff",
                  marginBottom: 16,
                }}
                value={friendId}
                onChangeText={setFriendId}
              />

              <TouchableOpacity
                onPress={handleAddFriend}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  paddingVertical: 10,
                  alignItems: "center",
                  width: "60%",
                  alignSelf: "center",

                }}
              >
                <Text style={{ fontWeight: "600", color: "#000" }}>
                  추가
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
