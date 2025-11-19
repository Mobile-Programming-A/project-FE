// screens/MainScreen.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import React, { useCallback, useState } from 'react';
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
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import TabScreenLayout from '../components/TabScreenLayout';
import { characters, getCharacterById, getSelectedCharacterOrDefault, defaultCharacter, profileImages, getProfileImageById } from '../data/characters';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/config';

const { width } = Dimensions.get('window');

// 아바타 이미지 매핑
const avatarImages = {
    avatar1: require('../assets/images/avatar1.png'),
    avatar2: require('../assets/images/avatar2.png'),
    avatar3: require('../assets/images/avatar3.png'),
    avatar4: require('../assets/images/avatar4.png'),
    avatar5: require('../assets/images/avatar5.png'),
};

export default function ExerciseScreen() {
    const router = useRouter();
    const [totalDistance, setTotalDistance] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [lastRunDate, setLastRunDate] = useState(null);
    const [lastRunPath, setLastRunPath] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [selectedProfileImage, setSelectedProfileImage] = useState(null);
    
    // 친구 목록 상태
    const [friends, setFriends] = useState([]);
    const [selectedFriendPreview, setSelectedFriendPreview] = useState(null);
    
    // 내 현재 위치
    const [myLocation, setMyLocation] = useState(null);

    // 화면이 포커스될 때마다 기록 및 캐릭터 불러오기
    useFocusEffect(
        useCallback(() => {
            loadRecords();
            loadSelectedCharacter();
            loadSelectedProfileImage();
            loadMyLocation();
        }, [])
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

    // 두 지점 간의 거리 계산 (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // 가까운 친구 3명 찾기
    const getNearbyFriends = () => {
        if (!myLocation || friends.length === 0) return [];

        const friendsWithDistance = friends.map(friend => ({
            ...friend,
            distance: calculateDistance(
                myLocation.latitude,
                myLocation.longitude,
                friend.lat,
                friend.lng
            )
        }));

        // 거리순 정렬 후 3명만 반환
        return friendsWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
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

    // 기록 불러오기
    const loadRecords = async () => {
        try {
            const recordsJson = await AsyncStorage.getItem('runningRecords');
            if (recordsJson) {
                const records = JSON.parse(recordsJson);

                if (records.length > 0) {
                    const distance = records.reduce((sum, record) => sum + record.distance, 0);
                    const time = records.reduce((sum, record) => sum + record.time, 0);

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
            }
        } catch (error) {
            console.error('기록 불러오기 실패:', error);
        }
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

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekDay = weekDays[date.getDay()];
        return `${month}월 ${day}일 ${weekDay}요일`;
    };

    // 경로 좌표에 맞는 지도 영역 계산
    const getRegionForCoordinates = (coordinates) => {
        if (!coordinates || coordinates.length === 0) {
            // 친구들이 있으면 친구들 기준으로
            if (nearbyFriends.length > 0) {
                return getRegionForFriends(nearbyFriends);
            }
            // 내 위치가 있으면 내 위치 기준으로
            if (myLocation) {
                return {
                    latitude: myLocation.latitude,
                    longitude: myLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
            }
            // 기본 위치(한성대)
        return {
                latitude: 37.5665,
                longitude: 126.9780,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        let minLat = coordinates[0].latitude;
        let maxLat = coordinates[0].latitude;
        let minLng = coordinates[0].longitude;
        let maxLng = coordinates[0].longitude;

        coordinates.forEach(coord => {
            minLat = Math.min(minLat, coord.latitude);
            maxLat = Math.max(maxLat, coord.latitude);
            minLng = Math.min(minLng, coord.longitude);
            maxLng = Math.max(maxLng, coord.longitude);
        });

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latDelta = (maxLat - minLat) * 2.5;
        const lngDelta = (maxLng - minLng) * 2.5;
        const minDelta = 0.003;

        return {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(latDelta, minDelta),
            longitudeDelta: Math.max(lngDelta, minDelta),
        };
    };

    // 친구들 위치 기준으로 지도 영역 계산
    const getRegionForFriends = (friendsList) => {
        if (!friendsList || friendsList.length === 0) {
            if (myLocation) {
                return {
                    latitude: myLocation.latitude,
                    longitude: myLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
            }
            return {
                latitude: 37.5665,
                longitude: 126.9780,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        // 내 위치도 포함해서 계산
        const allLocations = [...friendsList];
        if (myLocation) {
            allLocations.push({ lat: myLocation.latitude, lng: myLocation.longitude });
        }

        let minLat = allLocations[0].lat;
        let maxLat = allLocations[0].lat;
        let minLng = allLocations[0].lng;
        let maxLng = allLocations[0].lng;

        allLocations.forEach(loc => {
            minLat = Math.min(minLat, loc.lat);
            maxLat = Math.max(maxLat, loc.lat);
            minLng = Math.min(minLng, loc.lng);
            maxLng = Math.max(maxLng, loc.lng);
        });

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        
        // 약간의 여백 추가
        const latDelta = Math.max((maxLat - minLat) * 1.5, 0.005);
        const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.005);

        return {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
        };
    };

    // 친구 마커 클릭 핸들러
    const handleFriendMarkerPress = (friend) => {
        // 같은 친구를 다시 누르면 정보창 닫기
        if (selectedFriendPreview?.id === friend.id) {
            setSelectedFriendPreview(null);
        } else {
            setSelectedFriendPreview(friend);
        }
    };

    // 가까운 친구들 가져오기
    const nearbyFriends = getNearbyFriends();

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
                            onPress={() => router.push('/Character-custom')}
                        >
                            <Image
                                source={selectedProfileImage ? selectedProfileImage.image : profileImages[0].image}
                                style={styles.profileImage}
                            />
                            <Text style={styles.profileName}>
                                {selectedCharacter ? selectedCharacter.name : defaultCharacter.name}
                            </Text>
                        </TouchableOpacity>
                        <View style={styles.chatBubble} />
                    </View>

                    {/* 3D Character Area */}
                    <View style={styles.characterContainer}>
                        <Image
                            source={selectedCharacter ? selectedCharacter.image : defaultCharacter.image}
                            style={styles.character}
                        />
                    </View>

                    {/* Map Section with Friends Preview - 흰색 박스로 감싸기 */}
                    <View style={styles.mapOuterContainer}>
                        <View style={styles.mapContainer}>
                            <View style={styles.mapPlaceholder}>
                                {lastRunPath && lastRunPath.length > 1 ? (
                                    <MapView
                                        style={styles.mapView}
                                        provider={PROVIDER_GOOGLE}
                                        initialRegion={getRegionForCoordinates(lastRunPath)}
                                        scrollEnabled={true}
                                        zoomEnabled={true}
                                        pitchEnabled={true}
                                        rotateEnabled={true}
                                    >
                                        {/* 러닝 경로 */}
                                        <Polyline
                                            coordinates={lastRunPath}
                                            strokeColor="#7FD89A"
                                            strokeWidth={5}
                                        />

                                        {/* 시작 마커 */}
                                        <Marker
                                            coordinate={lastRunPath[0]}
                                            anchor={{ x: 0.5, y: 0.5 }}
                                        >
                                            <View style={styles.startMarker}>
                                                <Ionicons name="play-circle" size={20} color="#4CAF50" />
                                            </View>
                                        </Marker>

                                        {/* 끝 마커 */}
                                        <Marker
                                            coordinate={lastRunPath[lastRunPath.length - 1]}
                                            anchor={{ x: 0.5, y: 0.5 }}
                                        >
                                            <View style={styles.endMarker}>
                                                <Ionicons name="flag" size={20} color="#FF5252" />
                                            </View>
                                        </Marker>

                                        {/* 친구 마커들 - 가까운 친구 3명만 표시 */}
                                        {nearbyFriends.map((friend) => (
                                            <Marker
                                                key={friend.id}
                                                coordinate={{
                                                    latitude: friend.lat,
                                                    longitude: friend.lng,
                                                }}
                                                onPress={() => handleFriendMarkerPress(friend)}
                                            >
                                                <View style={styles.friendMarker}>
                                                    <Image
                                                        source={avatarImages[friend.avatar]}
                                                        style={styles.friendMarkerImage}
                                                    />
                                                </View>
                                            </Marker>
                                        ))}
                                    </MapView>
                                ) : (
                                    <MapView
                                        style={styles.mapView}
                                        provider={PROVIDER_GOOGLE}
                                        region={getRegionForFriends(nearbyFriends)}
                                        scrollEnabled={true}
                                        zoomEnabled={true}
                                        pitchEnabled={true}
                                        rotateEnabled={true}
                                    >
                                        {/* 친구 마커들 - 가까운 친구 3명만 표시 */}
                                        {nearbyFriends.map((friend) => (
                                            <Marker
                                                key={friend.id}
                                                coordinate={{
                                                    latitude: friend.lat,
                                                    longitude: friend.lng,
                                                }}
                                                onPress={() => handleFriendMarkerPress(friend)}
                                            >
                                                <View style={styles.friendMarker}>
                                                    <Image
                                                        source={avatarImages[friend.avatar]}
                                                        style={styles.friendMarkerImage}
                                                    />
                                                </View>
                                            </Marker>
                                        ))}
                                    </MapView>
                                )}

                                {/* 친구 미리보기 카드 */}
                                {selectedFriendPreview && (
                                    <View style={styles.friendPreviewCard}>
                                        <TouchableOpacity
                                            style={styles.friendPreviewClose}
                                            onPress={() => setSelectedFriendPreview(null)}
                                        >
                                            <Ionicons name="close" size={16} color="#666" />
                                        </TouchableOpacity>
                                        
                                        <View style={styles.friendPreviewContent}>
                                            <Image
                                                source={avatarImages[selectedFriendPreview.avatar]}
                                                style={styles.friendPreviewAvatar}
                                            />
                                            <View style={styles.friendPreviewInfo}>
                                                <Text style={styles.friendPreviewName}>
                                                    {selectedFriendPreview.name}
                                                </Text>
                                                <Text style={styles.friendPreviewStatus}>
                                                    {selectedFriendPreview.status || '활동 중'}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.friendPreviewStats}>
                                            <View style={styles.friendPreviewStat}>
                                                <Ionicons name="walk-outline" size={14} color="#7AC943" />
                                                <Text style={styles.friendPreviewStatText}>
                                                    {selectedFriendPreview.stats.step}
                                                </Text>
                                            </View>
                                            <View style={styles.friendPreviewStat}>
                                                <Ionicons name="flame-outline" size={14} color="#FF8C00" />
                                                <Text style={styles.friendPreviewStatText}>
                                                    {selectedFriendPreview.stats.cal}
                                                </Text>
                                            </View>
                                            <View style={styles.friendPreviewStat}>
                                                <Ionicons name="map-outline" size={14} color="#3F72AF" />
                                                <Text style={styles.friendPreviewStatText}>
                                                    {selectedFriendPreview.stats.dist}km
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Map Date Label */}
                            <Text style={styles.mapDate}>
                                {lastRunDate ? formatDate(lastRunDate) : formatDate(new Date().toISOString())}
                            </Text>

                            {/* Avatar List on Side */}
                            <TouchableOpacity
                                style={styles.avatarList}
                                onPress={() => router.push('/(tabs)/friends')}
                                activeOpacity={0.7}
                            >
                                <View style={styles.avatarBadge}>
                                    <Text style={styles.badgeText}>친구</Text>
                                </View>
                                {friends.slice(0, 2).map((friend) => (
                                    <View key={friend.id} style={styles.avatarItem}>
                                        <Image
                                            source={avatarImages[friend.avatar]}
                                            style={styles.avatarItemImage}
                                        />
                                    </View>
                                ))}
                                {friends.length === 0 && (
                                    <>
                                        <View style={styles.avatarItem}>
                                            <Text style={styles.avatarEmoji}>👤</Text>
                                        </View>
                                        <View style={styles.avatarItem}>
                                            <Text style={styles.avatarEmoji}>🥭</Text>
                                        </View>
                                    </>
                                )}
                                <View style={styles.moreButton}>
                                    <Text style={styles.moreText}>•••</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Card */}
                    <TouchableOpacity
                        style={styles.statsCard}
                        onPress={() => router.push('/history')}
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
                </ScrollView>
            </SafeAreaView>
        </TabScreenLayout>
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
    chatBubble: {
        width: 60,
        height: 35,
        backgroundColor: '#FFF',
        borderRadius: 18,
    },
    characterContainer: {
        alignItems: 'center',
        paddingVertical: 20,
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
    mapContainer: {
        position: 'relative',
    },
    mapPlaceholder: {
        height: 200,
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    mapView: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    startMarker: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    endMarker: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    friendMarker: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#7AC943',
    },
    friendMarkerImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    friendPreviewCard: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    friendPreviewClose: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
    },
    friendPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    friendPreviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    friendPreviewInfo: {
        flex: 1,
    },
    friendPreviewName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    friendPreviewStatus: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    friendPreviewStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    friendPreviewStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    friendPreviewStatText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#333',
    },
    mapDate: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
    avatarList: {
        position: 'absolute',
        right: 10,
        top: 10,
        backgroundColor: '#666',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    avatarBadge: {
        backgroundColor: '#8B4789',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    avatarItem: {
        width: 40,
        height: 40,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarItemImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarEmoji: {
        fontSize: 24,
    },
    moreButton: {
        width: 40,
        height: 40,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreText: {
        fontSize: 18,
        color: '#666',
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