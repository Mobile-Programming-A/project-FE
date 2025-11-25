// screens/MainScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import React, { useCallback, useState, useEffect } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import MapSection from "../components/MapSection";
import TabScreenLayout from "../components/TabScreenLayout";
import {
  characters,
  defaultCharacter,
  getCharacterById,
  getProfileImageById,
  profileImages,
} from "../data/characters";
import { db } from "../services/config";

const { width, height } = Dimensions.get("window");

const encouragingMessages = [
  "오늘도 달려볼까요? ",
  "한 걸음씩 나아가요! ",
  "함께 달려요! 화이팅! ",
  "오늘의 목표를 달성해봐요! ",
  "러닝으로 건강해져요! ",
  "시작이 반이에요! 가볍게 달려봐요! ",
  "오늘도 멋진 하루를 만들어요! ",
  "작은 발걸음이 큰 변화를 만들어요! ",
  "지금 시작하면 후회 없을 거예요! ",
  "러닝으로 에너지를 충전해요! ",
  "오늘도 최선을 다해봐요! ",
  "함께 달리면 더 즐거워요! ",
];

// 풀잎
const GrassVector = ({ left, bottom, rotation = 0, scale = 1 }) => (
  <View
    style={[
      styles.grassVector,
      {
        left,
        bottom,
        transform: [{ rotate: `${rotation}deg` }, { scale }],
      },
    ]}
  >
    <Svg width="22" height="22" viewBox="0 0 25 25">
      <Path
        d="M 10 25 Q 8 18 5 10 Q 4 8 5 7 Q 6 6 7 8 Q 10 15 12 22"
        fill="#8BAF4C"
        opacity={0.5}
      />
      <Path
        d="M 15 25 Q 14 16 12 8 Q 11.5 5 13 4 Q 14.5 3 15 6 Q 17 14 16 22"
        fill="#9BC25C"
        opacity={0.6}
      />
      <Path
        d="M 20 25 Q 22 18 25 10 Q 26 8 25 7 Q 24 6 23 8 Q 20 15 18 22"
        fill="#7A9E3B"
        opacity={0.5}
      />
    </Svg>
  </View>
);

export default function MainScreen() {
  const router = useRouter();

  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [lastRunDate, setLastRunDate] = useState(null);
  const [lastRunPath, setLastRunPath] = useState(null);

  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);

  const [encouragingMessage, setEncouragingMessage] = useState("");

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const [myLocation, setMyLocation] = useState(null);

  // ✔ 메시지는 앱 처음 로드될 때만 설정
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
    setEncouragingMessage(encouragingMessages[randomIndex]);
  }, []);

  // ✔ MainScreen 포커스 시 필요 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadRecords();
      loadSelectedCharacter();
      loadSelectedProfileImage();
      loadMyLocation();
    }, [])
  );

  // ✔ selectedFriend는 "진짜 화면 이동했을 때만" 초기화
  useFocusEffect(
    useCallback(() => {
      if (router.canGoBack()) {
        setSelectedFriend(null);
      }
    }, [router])
  );

  // ----------------------------------
  // 🔥 친구 목록 실시간 동기화 (리팩토링)
  // ----------------------------------
  useFocusEffect(
    useCallback(() => {
      const friendsRef = collection(db, "friends");
      const q = query(friendsRef, orderBy("isFavorite", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const data = querySnapshot.docs.map((docItem) => {
            const f = docItem.data() || {};

            // ✔ stats 완전 통합 정제
            const stats = {
              step: Number(f?.stats?.step ?? f["stats.step"] ?? 0),
              cal: Number(f?.stats?.cal ?? f["stats.cal"] ?? 0),
              dist: Number(f?.stats?.dist ?? f["stats.dist"] ?? 0),
            };

            // ✔ route 정제해서 전달
            const cleanedRoute = Array.isArray(f.route)
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
              lat: f.latitude ?? 37.58,
              lng: f.longitude ?? 127.01,
              route: cleanedRoute,
              createdAt: f.createdAt ?? null,
            };
          });

          // ✔ boolean 정렬 보장 (true 항상 위)
          data.sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));

          setFriends(data);
        },
        (error) => {
          console.error("❌ 친구 목록 불러오기 실패:", error);
          setFriends([]);
        }
      );

      return () => unsubscribe();
    }, [])
  );

  // ----------------------------------
  // 🔥 위치 불러오기 (중복 permission 요청 방지)
  // ----------------------------------
  const loadMyLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      let finalStatus = status;

      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        finalStatus = req.status;
      }

      if (finalStatus === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setMyLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error("위치 불러오기 실패:", error);
    }
  };

  // ----------------------------------
  // 캐릭터 & 프로필 불러오기
  // ----------------------------------
  const loadSelectedCharacter = async () => {
    try {
      const savedId = await AsyncStorage.getItem("selectedCharacterId");
      const character = savedId ? getCharacterById(savedId) : characters[0];
      setSelectedCharacter(character || characters[0]);
    } catch (e) {
      setSelectedCharacter(characters[0]);
    }
  };

  const loadSelectedProfileImage = async () => {
    try {
      const savedId = await AsyncStorage.getItem("selectedProfileImageId");
      const profile = savedId ? getProfileImageById(savedId) : profileImages[0];
      setSelectedProfileImage(profile || profileImages[0]);

      const userEmail = (await AsyncStorage.getItem("userEmail")) || "hong@example.com";

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", userEmail));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userData = snap.docs[0].data();

        if (userData.avatar) {
          const avatarId = userData.avatar.replace("avatar", "");
          const profileImage = getProfileImageById(avatarId);
          if (profileImage) {
            setSelectedProfileImage(profileImage);
            await AsyncStorage.setItem("selectedProfileImageId", avatarId);
          }
        }

        if (userData.characterId) {
          const c = getCharacterById(userData.characterId);
          if (c) {
            setSelectedCharacter(c);
            await AsyncStorage.setItem("selectedCharacterId", userData.characterId.toString());
          }
        }
      }
    } catch (error) {
      console.error("프로필 사진 불러오기 실패:", error);
      setSelectedProfileImage(profileImages[0]);
    }
  };

  // ----------------------------------
  // 달리기 기록 불러오기
  // ----------------------------------
  const loadRecords = async () => {
    try {
      const json = await AsyncStorage.getItem("runningRecords");
      if (!json) return;

      const records = JSON.parse(json);
      if (records.length < 1) return;

      const distance = records.reduce((sum, r) => sum + r.distance, 0);
      const time = records.reduce((sum, r) => sum + r.time, 0);

      setTotalDistance(distance);
      setTotalTime(time);

      const lastRecord = [...records].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )[0];

      setLastRunDate(lastRecord.date);

      setLastRunPath(lastRecord.pathCoords?.length > 0 ? lastRecord.pathCoords : null);
    } catch (error) {
      console.error("기록 불러오기 실패:", error);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}시간 ${m}분 ${s}초` : `${m}분 ${s}초`;
  };

  // 친구 화면 이동
  const handlePressFriends = () => {
    router.push("/friends");
  };

  // ----------------------------------
  // ---- UI 렌더링 ----
  // ----------------------------------
  return (
    <TabScreenLayout>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <LinearGradient
          colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
          locations={[0, 0.3, 1]}
          style={styles.backgroundGradient}
        />

        <View style={styles.ellipseBackground} />

        {/* 풀잎 랜덤 배치 */}
        <GrassVector left={30} bottom={height * 0.6} rotation={-15} scale={1.2} />
        <GrassVector left={80} bottom={height * 0.58} rotation={5} scale={0.9} />
        <GrassVector left={140} bottom={height * 0.6} rotation={5} scale={0.9} />
        <GrassVector left={width - 100} bottom={height * 0.58} rotation={10} scale={1.1} />
        <GrassVector left={width - 50} bottom={height * 0.59} rotation={-8} scale={0.95} />
        <GrassVector left={4} bottom={height * 0.48} rotation={12} scale={1.0} />
        <GrassVector left={width - 138} bottom={height * 0.62} rotation={-12} scale={1.15} />
        <GrassVector left={120} bottom={height * 0.52} rotation={8} scale={0.85} />
        <GrassVector left={width / 2 - 40} bottom={height * 0.54} rotation={-5} scale={1.05} />

        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 프로필 헤더 */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.profileContainer}
                onPress={() => router.push("/Character-custom")}
              >
                <Image
                  source={
                    selectedProfileImage
                      ? selectedProfileImage.image
                      : profileImages[0].image
                  }
                  style={styles.profileImage}
                />
                <Text style={styles.profileName}>
                  {selectedCharacter?.name ?? defaultCharacter.name}
                </Text>
              </TouchableOpacity>

              <View style={styles.chatBubble} />
            </View>

            {/* 캐릭터 + 말풍선 */}
            <View style={styles.characterContainer}>
              <View style={styles.speechBubbleContainer}>
                <View style={styles.speechBubble}>
                  <Text style={styles.speechBubbleText}>
                    {encouragingMessage || "오늘도 달려볼까요? 💪"}
                  </Text>
                </View>
                <View style={styles.speechBubbleTail} />
              </View>

              <Image
                source={selectedCharacter?.image || defaultCharacter.image}
                style={styles.character}
              />
            </View>

            {/* 지도 영역 */}
            <View style={styles.mapOuterContainer}>
              <MapSection
                lastRunPath={lastRunPath}
                myLocation={myLocation}
                friends={friends}
                lastRunDate={lastRunDate}
                selectedFriend={selectedFriend}
                onPressFriends={handlePressFriends}
                onSelectFriend={setSelectedFriend}
              />
            </View>

            {/* 나의 최근 기록 카드 */}
            <TouchableOpacity
              style={styles.statsCard}
              onPress={() => router.push("/history")}
              activeOpacity={0.7}
            >
              <View style={styles.statsHeader}>
                <Text style={styles.statsTitle}>나의 기록</Text>
                <Text style={styles.detailButton}>최근 달리기</Text>
              </View>

              <Text style={styles.statsValue}>
                {totalDistance > 0
                  ? `${totalDistance.toFixed(2)}km | ${formatTime(totalTime)}`
                  : "아직 기록이 없습니다"}
              </Text>

              {totalDistance > 0 && (
                <Text style={styles.statsSubtext}>총 누적 거리 및 시간</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </TabScreenLayout>
  );
}

// ----------------------------------
// 스타일
// ----------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  ellipseBackground: {
    position: "absolute",
    bottom: -height * 0.1,
    left: -width * 0.45,
    right: -width * 0.45,
    height: height * 0.77,
    backgroundColor: "#C2D88B",
    borderRadius: width * 2,
  },
  grassVector: {
    position: "absolute",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    marginRight: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  characterContainer: {
    alignItems: "center",
    paddingVertical: 20,
    position: "relative",
  },
  speechBubbleContainer: {
    position: "relative",
    marginBottom: 15,
    alignItems: "center",
  },
  speechBubble: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: width * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speechBubbleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  speechBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFF",
    marginTop: -1,
    
  },
  character: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  mapOuterContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    
    
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  detailButton: {
    fontSize: 14,
    color: "#999",
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  statsSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
});
