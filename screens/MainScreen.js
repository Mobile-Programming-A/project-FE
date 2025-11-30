// screens/MainScreen.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import MapSection from '../components/MapSection';
import TabScreenLayout from '../components/TabScreenLayout';
import { characters, defaultCharacter, getCharacterById, getProfileImageById, profileImages } from '../data/characters';
import { auth, db } from '../services/config';
import { getRunningRecords, migrateRecordsToFirestore } from '../services/runningRecordsService';

const { width } = Dimensions.get('window');

// 러닝 격려 메시지 배열
const encouragingMessages = [
    '오늘도 달려볼까요? ',
    '한 걸음씩 나아가요! ',
    '함께 달려요! 화이팅! ',
    '오늘의 목표를 달성해봐요! ',
    '러닝으로 건강해져요! ',
    '시작이 반이에요! 가볍게 달려봐요! ',
    '오늘도 멋진 하루를 만들어요! ',
    '작은 발걸음이 큰 변화를 만들어요! ',
    '지금 시작하면 후회 없을 거예요! ',
    '러닝으로 에너지를 충전해요! ',
    '오늘도 최선을 다해봐요! ',
    '함께 달리면 더 즐거워요! ',
];

export default function MainScreen() {
    const router = useRouter();
    const [totalDistance, setTotalDistance] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [lastRunDate, setLastRunDate] = useState(null);
    const [lastRunPath, setLastRunPath] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [selectedProfileImage, setSelectedProfileImage] = useState(null);
    const [userName, setUserName] = useState('');
    const [encouragingMessage, setEncouragingMessage] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 친구 목록 상태
    const [friends, setFriends] = useState([]);

    // 내 현재 위치
    const [myLocation, setMyLocation] = useState(null);

    // 격려 메시지 랜덤 선택
    const getRandomMessage = () => {
        const randomIndex = Math.floor(Math.random() * encouragingMessages.length);
        return encouragingMessages[randomIndex];
    };

    // 인증 상태 확인
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsLoggedIn(!!user);
            if (!user) {
                // 로그아웃 상태일 때 기록 초기화
                setTotalDistance(0);
                setTotalTime(0);
                setLastRunDate(null);
                setLastRunPath(null);
                setUserName('');
            }
        });
        return () => unsubscribe();
    }, []);

    // 화면이 포커스될 때마다 기록 및 캐릭터 불러오기, 격려 메시지 변경
    useFocusEffect(
        useCallback(() => {
            if (isLoggedIn) {
                loadRecords();
                loadSelectedCharacter();
                loadSelectedProfileImage();
                loadUserName();
                setEncouragingMessage(getRandomMessage());
                loadMyLocation();
            }
        }, [isLoggedIn])
    );

    // 친구 목록 실시간 동기화
    useFocusEffect(
        useCallback(() => {
            const friendsRef = collection(db, 'friends');

            const unsubscribe = onSnapshot(
                friendsRef,
                (querySnapshot) => {
                    const data = querySnapshot.docs.map((doc) => {
                        const f = doc.data();
                        return {
                            id: doc.id,
                            name: f.name || '이름 없음',
                            avatar: f.avatar?.trim() || 'avatar1',
                            status: f.status || '',
                            stats: {
                                step: f['stats.step'] ?? f.stats?.step ?? 0,
                                cal: f['stats.cal'] ?? f.stats?.cal ?? 0,
                                dist: f['stats.dist'] ?? f.stats?.dist ?? 0,
                            },
                            lat: f.latitude ?? 37.58,
                            lng: f.longitude ?? 127.1,
                        };
                    });

                    setFriends(data);
                },
                (error) => {
                    console.error('친구 목록 불러오기 실패:', error);
                }
            );

            return () => unsubscribe();
        }, [])
    );

    // 내 위치 불러오기
    const loadMyLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setMyLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            }
        } catch (error) {
            console.error('위치 불러오기 실패:', error);
        }
    };

    // 저장된 캐릭터 불러오기
    const loadSelectedCharacter = async () => {
        try {
            // AsyncStorage에서 먼저 확인
            const savedCharacterId = await AsyncStorage.getItem('selectedCharacterId');
            if (savedCharacterId) {
                const character = getCharacterById(savedCharacterId);
                setSelectedCharacter(character || characters[0]);
            } else {
                setSelectedCharacter(characters[0]);
            }
        } catch (error) {
            console.error('캐릭터 불러오기 실패:', error);
            setSelectedCharacter(characters[0]);
        }
    };

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

                // Firebase의 avatar 정보로 업데이트
                if (userData.avatar) {
                    const avatarId = userData.avatar.replace('avatar', '');
                    const profileImage = getProfileImageById(avatarId);
                    if (profileImage) {
                        setSelectedProfileImage(profileImage);
                        await AsyncStorage.setItem('selectedProfileImageId', avatarId);
                    }
                }

                // Firebase의 캐릭터 정보로 업데이트
                if (userData.characterId) {
                    const character = getCharacterById(userData.characterId);
                    if (character) {
                        setSelectedCharacter(character);
                        await AsyncStorage.setItem('selectedCharacterId', userData.characterId.toString());
                    }
                }
            }
        } catch (error) {
            console.error('프로필 사진 불러오기 실패:', error);
            setSelectedProfileImage(profileImages[0]);
        }
    };

    // 사용자 이름 불러오기
    const loadUserName = async () => {
        try {
            // Firebase Authentication에서 현재 사용자 정보 가져오기
            const { auth } = await import('../services/config');
            const currentUser = auth.currentUser;
            
            if (currentUser) {
                // Firestore에서 사용자 정보 가져오기
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', currentUser.email));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    if (userData.name) {
                        setUserName(userData.name);
                    } else {
                        // 이름이 없으면 이메일에서 추출
                        setUserName(currentUser.email?.split('@')[0] || '사용자');
                    }
                } else {
                    // Firestore에 사용자 정보가 없으면 이메일에서 추출
                    setUserName(currentUser.email?.split('@')[0] || '사용자');
                }
            }
        } catch (error) {
            console.error('사용자 이름 불러오기 실패:', error);
            setUserName('사용자');
        }
    };

    // 기록 불러오기
    const loadRecords = async () => {
        try {
            // 초기화
            setTotalDistance(0);
            setTotalTime(0);
            setLastRunDate(null);
            setLastRunPath(null);

            // 마이그레이션: 기존 AsyncStorage 데이터가 있으면 Firestore로 이전 (한 번만 실행)
            try {
                const migrationDone = await AsyncStorage.getItem('migrationToFirestoreDone');
                if (!migrationDone) {
                    const existingRecordsJson = await AsyncStorage.getItem('runningRecords');
                    if (existingRecordsJson) {
                        const existingRecords = JSON.parse(existingRecordsJson);
                        if (existingRecords.length > 0) {
                            await migrateRecordsToFirestore(existingRecords);
                        }
                    }
                    // 마이그레이션 완료 표시
                    await AsyncStorage.setItem('migrationToFirestoreDone', 'true');
                }
            } catch (migrationError) {
                console.error('마이그레이션 중 오류:', migrationError);
            }

            // Firestore에서 기록 불러오기
            const records = await getRunningRecords();

            if (records.length > 0) {
                const distance = records.reduce((sum, record) => sum + (record.distance || 0), 0);
                const time = records.reduce((sum, record) => sum + (record.time || 0), 0);

                setTotalDistance(distance);
                setTotalTime(time);

                const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date));
                const lastRecord = sortedRecords[0];
                setLastRunDate(lastRecord.date);

                if (lastRecord.pathCoords && lastRecord.pathCoords.length > 0) {
                    setLastRunPath(lastRecord.pathCoords);
                } else {
                    setLastRunPath(null);
                }
            }
        } catch (error) {
            console.error('기록 불러오기 실패:', error);
            // 에러 발생 시에도 초기화
            setTotalDistance(0);
            setTotalTime(0);
            setLastRunDate(null);
            setLastRunPath(null);
        }
    };

    // 로그아웃 처리
    const handleLogout = async () => {
        Alert.alert(
            '로그아웃',
            '정말 로그아웃하시겠습니까?',
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '로그아웃',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            // AsyncStorage 초기화 (선택사항)
                            await AsyncStorage.removeItem('userEmail');
                            // 기록 초기화
                            setTotalDistance(0);
                            setTotalTime(0);
                            setLastRunDate(null);
                            setLastRunPath(null);
                            setUserName('');
                            // MainScreen에 그대로 유지 (로그아웃 상태로 표시)
                        } catch (error) {
                            console.error('로그아웃 실패:', error);
                            Alert.alert('오류', '로그아웃에 실패했습니다.');
                        }
                    }
                }
            ]
        );
    };

    // 로그인 화면으로 이동
    const handleLogin = () => {
        router.replace('/');
    };

    // 시간 포맷팅
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}시간 ${mins}분 ${secs}초`;
        }
        return `${mins}분 ${secs}초`;
    };

    return (
        <TabScreenLayout>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header with Profile */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.profileContainer}
                            onPress={() => {
                                if (isLoggedIn) {
                                    router.push('/(tabs)/Character-custom');
                                } else {
                                    handleLogin();
                                }
                            }}
                        >
                            <Image
                                source={selectedProfileImage ? selectedProfileImage.image : profileImages[0].image}
                                style={styles.profileImage}
                            />
                            <Text style={styles.profileName}>
                                {isLoggedIn 
                                    ? (userName || (selectedCharacter ? selectedCharacter.name : defaultCharacter.name))
                                    : '로그인이 필요합니다'
                                }
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

                    {/* 3D Character Area */}
                    <View style={styles.characterContainer}>
                        {/* 말풍선 */}
                        <View style={styles.speechBubbleContainer}>
                            <View style={styles.speechBubble}>
                                <Text style={styles.speechBubbleText}>
                                    {encouragingMessage || '오늘도 달려볼까요? 💪'}
                                </Text>
                            </View>
                            <View style={styles.speechBubbleTail} />
                        </View>
                        <Image
                            source={selectedCharacter ? selectedCharacter.image : defaultCharacter.image}
                            style={styles.character}
                        />
                    </View>

                    {/* Map Section with Friends Preview */}
                    {isLoggedIn && (
                        <View style={styles.mapOuterContainer}>
                            <MapSection
                                lastRunPath={lastRunPath}
                                myLocation={myLocation}
                                friends={friends}
                                lastRunDate={lastRunDate}
                                onPressFriends={() => router.push('/(tabs)/friends')}
                            />
                        </View>
                    )}

                    {/* Stats Card */}
                    {isLoggedIn ? (
                        <TouchableOpacity
                            style={styles.statsCard}
                            onPress={() => router.push('/(tabs)/history')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.statsHeader}>
                                <Text style={styles.statsTitle}>나의 기록</Text>
                                <Text style={styles.detailButton}>최근 달리기</Text>
                            </View>
                            <Text style={styles.statsValue}>
                                {totalDistance > 0
                                    ? `${totalDistance.toFixed(2)}km | ${formatTime(totalTime)}`
                                    : '아직 기록이 없습니다'}
                            </Text>
                            {totalDistance > 0 && (
                                <Text style={styles.statsSubtext}>
                                    총 누적 거리 및 시간
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.statsCard}
                            onPress={handleLogin}
                            activeOpacity={0.7}
                        >
                            <View style={styles.statsHeader}>
                                <Text style={styles.statsTitle}>나의 기록</Text>
                                <Text style={styles.detailButton}>로그인 필요</Text>
                            </View>
                            <Text style={styles.statsValue}>
                                로그인 후 기록을 확인하세요
                            </Text>
                            <Text style={styles.statsSubtext}>
                                로그인하면 러닝 기록을 저장하고 확인할 수 있습니다
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </SafeAreaView >
        </TabScreenLayout >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D4E9D7',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 5,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        marginRight: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        gap: 6,
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E8F5E9',
        gap: 6,
    },
    loginButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#7FD89A',
    },

    characterContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        position: 'relative',
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
    },
    character: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    mapOuterContainer: {
        marginHorizontal: 20,
        marginTop: 10,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    statsCard: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    detailButton: {
        fontSize: 14,
        color: '#999',
    },
    statsValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    statsSubtext: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
});