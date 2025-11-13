import * as Location from "expo-location";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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

import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../services/config";

// 아바타 이미지 매핑
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

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Marker 이미지 갱신을 위한 state
  const [refreshMarker, setRefreshMarker] = useState(true);

  // 최초 실행 시 위치 권한 요청 + 현재 위치 가져오기
useEffect(() => {
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log(" 위치 권한 거부됨");
      return;
    }

    // 현재 위치 가져오기
    const loc = await Location.getCurrentPositionAsync({});
    console.log("📍 내 위치:", loc.coords);

    // 지도 첫 위치 갱신
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600
      );
    }
  };

  requestLocationPermission();
}, []);

  // Firestore에서 친구 목록 불러오기
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "friends"));
        const data = querySnapshot.docs.map((doc) => {
          const f = doc.data();
          return {
            id: doc.id,
            name: f.name,
            avatar: f.avatar?.trim() || "avatar1",
            status: f.status || "",
            stats: {
              step: f["stats.step"] ?? f.stats?.step ?? 0,
              cal: f["stats.cal"] ?? f.stats?.cal ?? 0,
              dist: f["stats.dist"] ?? f.stats?.dist ?? 0,
            },
            lat: f.latitude ?? 37.5665,
            lng: f.longitude ?? 126.978,
            route: f.route ?? [],
          };
        });

        setFriends(data);

        // 이미지 리렌더링 방지 + 정상 표시 위해 잠시 true → false
        setRefreshMarker(true);
        setTimeout(() => setRefreshMarker(false), 300);

      } catch (error) {
        console.error(" Firestore 불러오기 실패:", error);
      }
    };

    fetchFriends();
  }, []);

  //  친구 선택 시 route 그리고 해당 위치로 이동
  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);

    if (mapRef.current && friend.lat && friend.lng) {
      mapRef.current.animateToRegion(
        {
          latitude: friend.lat,
          longitude: friend.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800
      );
    }
  };

  //  Firestore에 새 친구 추가
  const handleFriendRequest = async () => {
    if (friendId.trim() === "") {
      Alert.alert("알림", "친구 ID를 입력해주세요.");
      return;
    }

    try {
      await addDoc(collection(db, "friends"), {
        name: friendId,
        avatar: "avatar1",
        status: "새 친구! 아직 활동 없음",
        stats: { step: 0, cal: 0, dist: 0 },
        latitude: 37.5665,
        longitude: 126.978,
        route: [],
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#EBFFE5" }}>
      <StatusBar barStyle="dark-content" />

      {/* 상단 헤더 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.replace("/main")}>
          <Ionicons name="chevron-back" size={26} color="#1C1C1C" />
        </TouchableOpacity>

        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1C1C1C" }}>
          친구
        </Text>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={26} color="#1C1C1C" />
        </TouchableOpacity>
      </View>

      {/* 지도 */}
      <MapView
        provider={PROVIDER_GOOGLE}
        ref={mapRef}
        style={{
          position: "absolute",
          top: 105,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        initialRegion={{
          latitude: 37.5665,
          longitude: 126.978,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        followsUserLocation={true} 
      >

        {/* 선택된 친구 러닝 루트 */}
        {selectedFriend?.route?.length > 1 && (
          <Polyline
            coordinates={selectedFriend.route.map((p) => ({
              latitude: p.lat,
              longitude: p.lng,
            }))}
            strokeColor="#007AFF"
            strokeWidth={6}
            lineJoin="round"
            lineCap="round"
            geodesic={true}
          />
        )}

        {/* 🔹 친구 마커 */}
        {friends.map((friend) => (
          <Marker
            key={friend.id}
            coordinate={{ latitude: friend.lat, longitude: friend.lng }}
            tracksViewChanges={refreshMarker}
          >
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 28,
                  padding: 4,
                  shadowColor: "#000",
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }}
              >
                <Image
                  source={avatarImages[friend.avatar] || avatarImages.avatar1}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                  }}
                />
              </View>

              {/* 아래 꼬리 */}
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
        ))}
      </MapView>

      {/* 지도 하단 그라데이션 */}
      <LinearGradient
        colors={[
          "rgba(235,255,229,0)",
          "rgba(255,255,255,0.4)",
          "rgba(255,255,255,0.8)",
          "rgba(255,255,255,1)",
        ]}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 350,
        }}
      />

      {/* 선택된 친구 상세 카드 */}
      {selectedFriend && (
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
            <View>
              <Text style={{ fontSize: 20, fontWeight: "700" }}>
                {selectedFriend.name}
              </Text>
              <Text style={{ color: "#666", marginTop: 5 }}>
                {selectedFriend.status}
              </Text>
            </View>
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

      {/* 친구 리스트 */}
      <View style={{ position: "absolute", bottom: 30, width: "100%" }}>
        <FlatList
          data={friends}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            justifyContent: "center",
          }}
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

              <Text
                style={{
                  fontSize: 13,
                  color:
                    selectedFriend?.id === item.id ? "#000" : "#666",
                  marginTop: 6,
                  fontWeight:
                    selectedFriend?.id === item.id ? "600" : "400",
                }}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

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
              width: "80%",
              padding: 24,
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
