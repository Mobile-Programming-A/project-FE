// screens/MainScreen.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    collection,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Easing,
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
import { auth, db } from "../services/config";
import { getRunningRecords } from "../services/runningRecordsService";

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
    const [userName, setUserName] = useState('홍길동');

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [currentAnimationStyle, setCurrentAnimationStyle] = useState(0);
  const [isWinking, setIsWinking] = useState(false);
  const [isSurprised, setIsSurprised] = useState(false);
  const [isBasicWinking, setIsBasicWinking] = useState(false);
  const [isCapWinking, setIsCapWinking] = useState(false);

  // 애니메이션 관련 ref
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const tapScaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(1)).current;

  // ✔ 메시지는 앱 처음 로드될 때만 설정
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
    setEncouragingMessage(encouragingMessages[randomIndex]);
  }, []);

  // 인증 상태 확인
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (!user) {
        // 로그아웃 상태일 때 기록 초기화
        setTotalDistance(0);
        setTotalTime(0);
        setLastRunDate(null);
        setLastRunPath(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 🎭 캐릭터 애니메이션 (4가지 스타일)
  useEffect(() => {
    // 애니메이션 초기화
    bounceAnim.setValue(0);
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);

    let animations = [];

    // 스타일 0: 부드러운 호흡 (기본)
    if (currentAnimationStyle === 0) {
      const breathingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const wiggleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      animations.push(breathingAnimation, wiggleAnimation);
    }

    // 스타일 1: 신나는 바운스
    else if (currentAnimationStyle === 1) {
      const bounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -15,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ])
      );

      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ])
      );

      animations.push(bounceAnimation, scaleAnimation);
    }

    // 스타일 2: 느긋한 펄스
    else if (currentAnimationStyle === 2) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const slowBounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

      animations.push(pulseAnimation, slowBounce);
    }

    // 스타일 3: 활발한 움직임
    else if (currentAnimationStyle === 3) {
      const energeticBounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const energeticWiggle = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1.5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1.5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      const quickPulse = Animated.loop(
        Animated.sequence([
          Animated.delay(3000),
          Animated.timing(scaleAnim, {
            toValue: 1.12,
            duration: 150,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 250,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animations.push(energeticBounce, energeticWiggle, quickPulse);
    }

    // 모든 애니메이션 시작
    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [currentAnimationStyle, bounceAnim, scaleAnim, rotateAnim]);

  // 👁️ 겨울 러너 캐릭터 윙크 효과 (랜덤)
  useEffect(() => {
    // 겨울 러너 캐릭터(id: 4)일 때만 윙크
    if (selectedCharacter?.id !== 4) return;

    const winkRandomly = () => {
      // 5~15초 사이 랜덤 간격으로 윙크
      const randomDelay = Math.random() * 10000 + 5000;
      
      const timer = setTimeout(() => {
        setIsWinking(true);
        
        // 300ms 후 원래대로
        setTimeout(() => {
          setIsWinking(false);
          winkRandomly(); // 다음 윙크 예약
        }, 300);
      }, randomDelay);

      return timer;
    };

    const timer = winkRandomly();
    return () => clearTimeout(timer);
  }, [selectedCharacter]);

  // 😲 썬글라스 망키 놀란 표정 효과 (랜덤)
  useEffect(() => {
    // 썬글라스 망키(id: 2)일 때만 놀란 표정
    if (selectedCharacter?.id !== 2) return;

    const surpriseRandomly = () => {
      // 5~15초 사이 랜덤 간격으로 놀란 표정
      const randomDelay = Math.random() * 10000 + 5000;
      
      const timer = setTimeout(() => {
        setIsSurprised(true);
        
        // 400ms 후 원래대로
        setTimeout(() => {
          setIsSurprised(false);
          surpriseRandomly(); // 다음 놀란 표정 예약
        }, 400);
      }, randomDelay);

      return timer;
    };

    const timer = surpriseRandomly();
    return () => clearTimeout(timer);
  }, [selectedCharacter]);

  // 😉 기본 망키 윙크 효과 (랜덤)
  useEffect(() => {
    // 기본 망키(id: 1)일 때만 윙크
    if (selectedCharacter?.id !== 1) return;

    const basicWinkRandomly = () => {
      // 5~15초 사이 랜덤 간격으로 윙크
      const randomDelay = Math.random() * 10000 + 5000;
      
      const timer = setTimeout(() => {
        setIsBasicWinking(true);
        
        // 300ms 후 원래대로
        setTimeout(() => {
          setIsBasicWinking(false);
          basicWinkRandomly(); // 다음 윙크 예약
        }, 300);
      }, randomDelay);

      return timer;
    };

    const timer = basicWinkRandomly();
    return () => clearTimeout(timer);
  }, [selectedCharacter]);

  // 😉 모자 망키 윙크 효과 (랜덤)
  useEffect(() => {
    // 모자 망키(id: 3)일 때만 윙크
    if (selectedCharacter?.id !== 3) return;

    const capWinkRandomly = () => {
      // 5~15초 사이 랜덤 간격으로 윙크
      const randomDelay = Math.random() * 10000 + 5000;
      
      const timer = setTimeout(() => {
        setIsCapWinking(true);
        
        // 300ms 후 원래대로
        setTimeout(() => {
          setIsCapWinking(false);
          capWinkRandomly(); // 다음 윙크 예약
        }, 300);
      }, randomDelay);

      return timer;
    };

    const timer = capWinkRandomly();
    return () => clearTimeout(timer);
  }, [selectedCharacter]);

  // ✔ MainScreen 포커스 시 필요 데이터 로드 + 애니메이션 스타일 랜덤 선택
  useFocusEffect(
    useCallback(() => {
      loadRecords();
      loadSelectedCharacter();
      loadSelectedProfileImage();
      loadMyLocation();
      // 0~3 사이 랜덤 애니메이션 스타일 선택
      setCurrentAnimationStyle(Math.floor(Math.random() * 4));
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
/*
  const loadSelectedProfileImage = async () => {
    try {
      const savedId = await AsyncStorage.getItem("selectedProfileImageId");
      const profile = savedId ? getProfileImageById(savedId) : profileImages[0];
      setSelectedProfileImage(profile || profileImages[0]);

      const userEmail = (await AsyncStorage.getItem("userEmail")) || "hong@example.com";

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", userEmail));
      const snap = await getDocs(q);
      */
    // 저장된 프로필 사진 불러오기
    const loadSelectedProfileImage = async () => {
        try {
            // AsyncStorage에서 먼저 확인
            const savedProfileImageId = await AsyncStorage.getItem('selectedProfileImageId');
            if (savedProfileImageId) {
                const profileImage = getProfileImageById(savedProfileImageId);
                setSelectedProfileImage(profileImage || profileImages[0]);
            } else {
                setSelectedProfileImage(profileImages[0]);
            }


            // Firebase users 컬렉션에서도 확인하여 동기화
            const userEmail = await AsyncStorage.getItem('userEmail') || 'hong@example.com';
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();


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
        // Firebase의 사용자 이름 정보로 업데이트
        if (userData.name) {
            setUserName(userData.name);
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
      // Firestore에서 기록 불러오기
      const records = await getRunningRecords();
      
      if (!records || records.length < 1) {
        setTotalDistance(0);
        setTotalTime(0);
        setLastRunDate(null);
        setLastRunPath(null);
        return;
      }

      const distance = records.reduce((sum, r) => sum + (r.distance || 0), 0);
      const time = records.reduce((sum, r) => sum + (r.time || 0), 0);

      setTotalDistance(distance);
      setTotalTime(time);

      const lastRecord = [...records].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )[0];

      setLastRunDate(lastRecord.date);

      setLastRunPath(lastRecord.pathCoords?.length > 0 ? lastRecord.pathCoords : null);
    } catch (error) {
      console.error("기록 불러오기 실패:", error);
      // 에러 발생 시 기본값 설정
      setTotalDistance(0);
      setTotalTime(0);
      setLastRunDate(null);
      setLastRunPath(null);
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

  // 로그아웃 처리
  const handleLogout = async () => {
    Alert.alert(
      "로그아웃",
      "정말 로그아웃하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.removeItem("userEmail");
              // 기록 초기화
              setTotalDistance(0);
              setTotalTime(0);
              setLastRunDate(null);
              setLastRunPath(null);
            } catch (error) {
              console.error("로그아웃 실패:", error);
              Alert.alert("오류", "로그아웃에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  // 로그인 화면으로 이동
  const handleLogin = () => {
    router.replace("/");
  };

  // 🎯 캐릭터 클릭 상호작용
  const handleCharacterPress = () => {
    // 랜덤 응원 메시지 변경
    const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
    setEncouragingMessage(encouragingMessages[randomIndex]);

    // 방향 전환
    const newDirection = !isFacingRight;
    setIsFacingRight(newDirection);

    // 1. 점프 애니메이션
    Animated.sequence([
      Animated.timing(tapScaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(tapScaleAnim, {
        toValue: 1.15,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(tapScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. 좌우 흔들림 (신나는 느낌)
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. 좌우 반전 애니메이션 (빠른 회전)
    Animated.spring(flipAnim, {
      toValue: newDirection ? 1 : -1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
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
                onPress={() => {
                  if (isLoggedIn) {
                    router.push("/Character-custom");
                  } else {
                    handleLogin();
                  }
                }}
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
                  {isLoggedIn
                    ? userName || "사용자"
                    : "로그인이 필요합니다"}
                </Text>
              </TouchableOpacity>

              {isLoggedIn ? (
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color="#666" />
                  <Text style={styles.logoutButtonText}>로그아웃</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                >
                  <Ionicons name="log-in-outline" size={20} color="#7FD89A" />
                  <Text style={styles.loginButtonText}>로그인</Text>
                </TouchableOpacity>
              )}
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

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCharacterPress}
              >
                <Animated.View
                  style={[
                    styles.characterAnimationContainer,
                    {
                      transform: [
                        { translateY: bounceAnim },
                        { translateX: shakeAnim },
                        {
                          rotate: rotateAnim.interpolate({
                            inputRange: [-1, 1],
                            outputRange: ["-3deg", "3deg"],
                          }),
                        },
                        { 
                          scale: Animated.multiply(scaleAnim, tapScaleAnim)
                        },
                        { scaleX: flipAnim },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={
                      // 겨울 러너 캐릭터가 윙크 중이면 윙크 이미지 표시
                      selectedCharacter?.id === 4 && isWinking
                        ? require('../assets/character_image/winter_runner_mangkee_wink.png')
                        // 썬글라스 망키가 놀란 표정이면 놀란 이미지 표시
                        : selectedCharacter?.id === 2 && isSurprised
                        ? require('../assets/character_image/sunglass_mangkee_o.png')
                        // 기본 망키가 윙크 중이면 윙크 이미지 표시
                        : selectedCharacter?.id === 1 && isBasicWinking
                        ? require('../assets/character_image/mangkee_character_wink.png')
                        // 모자 망키가 윙크 중이면 윙크 이미지 표시
                        : selectedCharacter?.id === 3 && isCapWinking
                        ? require('../assets/character_image/cap_mangkee_wink.png')
                        : selectedCharacter?.image || defaultCharacter.image
                    }
                    style={styles.character}
                  />
                </Animated.View>
              </TouchableOpacity>
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    gap: 6,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    gap: 6,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7FD89A",
  },

  characterContainer: {
    alignItems: "center",
    paddingVertical: 20,
    position: "relative",
  },
  characterAnimationContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
    speechBubbleContainer: {
        position: 'relative',
        marginBottom: 15,
        alignItems: 'center',
    },
    speechBubble: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxWidth: width * 0.7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    speechBubbleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
    },
    speechBubbleTail: {
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FFF',
        marginTop: -1,
        position: 'relative',
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
