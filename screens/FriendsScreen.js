import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Animated, Easing } from "react-native";

import { 
  addDoc, 
  collection, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
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
  const [searchQuery, setSearchQuery] = useState("");

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null); 
  const [loading, setLoading] = useState(true);
  

  // Marker 이미지 갱신을 위한 state
  const [refreshMarker, setRefreshMarker] = useState(false);

  // 내 위치로 지도 이동
  const moveToMyPosition = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          800
        );
      }
    } catch (error) {
      console.log("내 위치 이동 실패:", error);
    }
  };

  
  useEffect(() => {
    const requestLocationPermission = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        moveToMyPosition(); 
      }
    };
    requestLocationPermission();
  }, []);


  useEffect(() => {
    if (selectedFriend) {
      setRefreshMarker(true);
      
      
      const timer = setTimeout(() => {
        setRefreshMarker(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [selectedFriend]);

  // 실시간 친구 목록 동기화 (onSnapshot 사용)
  useEffect(() => {
    setLoading(true);
    
    // orderBy를 제거하고 단순 collection만 사용 (createdAt 필드가 없는 문서도 가져오기)
    const friendsRef = collection(db, "friends");
    
    const unsubscribe = onSnapshot(
      friendsRef,
      (querySnapshot) => {
        console.log("📦 Firestore에서 가져온 문서 수:", querySnapshot.docs.length);
        
        const data = querySnapshot.docs.map((doc) => {
          const f = doc.data();
          console.log("친구 데이터:", doc.id, f); // 디버깅용
          
          return {
            id: doc.id,
            name: f.name || "이름 없음",
            avatar: f.avatar?.trim() || "avatar1",
            status: f.status || "",
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
        

        // createdAt이 있는 친구는 최신순, 없는 친구는 이름순으로 정렬
        data.sort((a, b) => {
           
           if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
           return 0;
          
        });

        console.log("✅ 최종 친구 목록:", data.length, "명");
        
       
        setFriends(data);
        setLoading(false);
        setRefreshMarker(true);
        setTimeout(() => setRefreshMarker(false), 100);
      },
      (error) => {
        console.error("❌ Firestore 실시간 동기화 실패:", error);
        console.error("에러 상세:", error.code, error.message);
        setLoading(false);
        Alert.alert("오류", `친구 목록을 불러오는 중 문제가 발생했습니다.\n${error.message}`);
      }
    );

    // cleanup: 컴포넌트 언마운트 시 구독 해제
    return () => unsubscribe();
  }, []);

  // 친구 검색 기능 (메모이제이션)
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    
    return friends.filter((friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery]);

  // 친구 선택/해제 
  const handleSelectFriend = useCallback((friend) => {
    
    if (selectedFriend?.id === friend.id) {
       setSelectedFriend(null); 
       moveToMyPosition();      
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
  }, [selectedFriend]);


  const handleFriendRequest = async () => {
    if (friendId.trim() === "") {
      Alert.alert("알림", "친구 ID를 입력해주세요.");
      return;
    }

    try {
      // 현재 위치 가져오기 (권한이 있을 경우)
      let latitude = 37.58;
      let longitude = 126.982;

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
      } catch (locError) {
        console.log("위치 가져오기 실패, 기본값 사용:", locError);
      }

      // 겹침 방지: 약간의 랜덤 오프셋 추가 (약 50-200m 반경)
      const randomOffset = () => (Math.random() - 0.5) * 0.003; // 약 ±150m
      latitude += randomOffset();
      longitude += randomOffset();

      await addDoc(collection(db, "friends"), {
        name: friendId,
        avatar: "avatar1",
        status: "새 친구! 아직 활동 없음",
        stats: { step: 0, cal: 0, dist: 0 },
        latitude: latitude,
        longitude: longitude,
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

  // 친구 삭제
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
                moveToMyPosition();
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

      {/*  검색창  */}
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

      {/* 로딩 표시 */}
      {loading ? (
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
            initialRegion={{
              latitude: 37.58,
              longitude: 126.982,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            followsUserLocation={!selectedFriend} // 친구 선택 안됐을 때만 내 위치 따라감
          >
            {/* 선택된 친구가 있을 때만 경로 표시 */}
            {selectedFriend?.route?.length > 1 && (
              <Polyline
                coordinates={selectedFriend.route.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
                strokeColor="#007AFF"
                strokeWidth={6}
              />
            )}

            {/* 친구 마커  */}
           {selectedFriend && (
              <Marker
                key={selectedFriend.id}
                coordinate={{ latitude: selectedFriend.lat, longitude: selectedFriend.lng }}
                tracksViewChanges={refreshMarker}
              >
                <View style={{ alignItems: "center" }}>
                  <View style={{ backgroundColor: "#fff", borderRadius: 28, padding: 4, elevation: 3 }}>
                    <Image
                      source={avatarImages[selectedFriend.avatar] || avatarImages.avatar1}
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                      fadeDuration={0}
                    />
                  </View>
                  <View
                    style={{
                      width: 0, height: 0,
                      borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10,
                      borderLeftColor: "transparent", borderRightColor: "transparent",
                      borderTopColor: "#fff", marginTop: -2,
                    }}
                  />
                </View>
              </Marker>
            )}
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
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Image
                    source={avatarImages[selectedFriend.avatar]}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      marginRight: 15,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: "700" }}>
                      {selectedFriend.name}
                    </Text>
                    <Text style={{ color: "#666", marginTop: 5 }}>
                      {selectedFriend.status}
                    </Text>
                  </View>
                </View>

                
                <TouchableOpacity
                  onPress={() => handleDeleteFriend(selectedFriend.id, selectedFriend.name)}
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

          {/* 친구가 없을 때 안내 메시지 */}
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
              <Text style={{ fontSize: 16, color: "#666", marginTop: 12, textAlign: "center" }}>
                {searchQuery ? "검색 결과가 없습니다" : "아직 친구가 없습니다"}
              </Text>
              {!searchQuery && (
                <Text style={{ fontSize: 14, color: "#999", marginTop: 6, textAlign: "center" }}>
                  우측 상단의 + 버튼을 눌러 친구를 추가해보세요
                </Text>
              )}
            </View>
          )}

          {/* 친구 리스트 */}
          <View style={{ position: "absolute", bottom: 30, width: "100%" }}>
            <FlatList
              data={filteredFriends}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectFriend(item)} // 여기서 선택하면 selectedFriend가 업데이트되고 마커가 뜸
                  style={{ alignItems: "center", marginHorizontal: 8 }}
                >
                  <Image
                    source={avatarImages[item.avatar]}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: selectedFriend?.id === item.id ? 3 : 0,
                      borderColor: selectedFriend?.id === item.id ? "#FFD34E" : "transparent",
                    }}
                  />
                  <Text style={{ fontSize: 13, color: selectedFriend?.id === item.id ? "#000" : "#666", marginTop: 6, fontWeight: selectedFriend?.id === item.id ? "600" : "400" }}>
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