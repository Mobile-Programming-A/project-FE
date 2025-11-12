// screens/MainScreen.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
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
import { characters, getCharacterById, getSelectedCharacterOrDefault, defaultCharacter } from '../data/characters';

const { width } = Dimensions.get('window');

export default function ExerciseScreen() {
    const router = useRouter();
    const [totalDistance, setTotalDistance] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [lastRunDate, setLastRunDate] = useState(null);
    const [lastRunPath, setLastRunPath] = useState(null); // 최근 러닝 경로
    const [selectedCharacter, setSelectedCharacter] = useState(null);

    // 화면이 포커스될 때마다 기록 및 캐릭터 불러오기
    useFocusEffect(
        useCallback(() => {
            loadRecords();
            loadSelectedCharacter();
        }, [])
    );

    // 저장된 캐릭터 불러오기
    const loadSelectedCharacter = async () => {
        try {
            const savedCharacterId = await AsyncStorage.getItem('selectedCharacterId');
            if (savedCharacterId) {
                const character = getCharacterById(savedCharacterId);
                setSelectedCharacter(character || characters[0]);
            } else {
                setSelectedCharacter(characters[0]); // 기본값
            }
        } catch (error) {
            console.error('캐릭터 불러오기 실패:', error);
            setSelectedCharacter(characters[0]); // 기본값
        }
    };

    // 기록 불러오기
    const loadRecords = async () => {
        try {
            const recordsJson = await AsyncStorage.getItem('runningRecords');
            if (recordsJson) {
                const records = JSON.parse(recordsJson);

                if (records.length > 0) {
                    // 전체 거리와 시간 합계 계산
                    const distance = records.reduce((sum, record) => sum + record.distance, 0);
                    const time = records.reduce((sum, record) => sum + record.time, 0);

                    setTotalDistance(distance);
                    setTotalTime(time);

                    // 가장 최근 기록의 날짜 및 경로
                    const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date));
                    const lastRecord = sortedRecords[0];
                    setLastRunDate(lastRecord.date);

                    // 경로 좌표가 있으면 저장
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

    // 시간 포맷팅 (초 -> 분:초)
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
            return {
                latitude: 37.5665,
                longitude: 126.9780,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            };
        }

        let minLat = coordinates[0].latitude;
        let maxLat = coordinates[0].latitude;
        let minLng = coordinates[0].longitude;
        let maxLng = coordinates[0].longitude;

        // 모든 좌표를 확인하여 최소/최대값 찾기
        coordinates.forEach(coord => {
            minLat = Math.min(minLat, coord.latitude);
            maxLat = Math.max(maxLat, coord.latitude);
            minLng = Math.min(minLng, coord.longitude);
            maxLng = Math.max(maxLng, coord.longitude);
        });

        // 중심점 계산
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        // Delta 계산 (약간의 여백 추가)
        const latDelta = (maxLat - minLat) * 2.5;
        const lngDelta = (maxLng - minLng) * 2.5;

        // 최소 delta 값 보장 (너무 확대되는 것 방지)
        const minDelta = 0.003;

        return {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(latDelta, minDelta),
            longitudeDelta: Math.max(lngDelta, minDelta),
        };
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
                            onPress={() => router.push('/Character-custom')}
                        >
                            <Image
                                source={require('../assets/images/avatar1.png')}
                                style={styles.profileImage}
                            />
                            <Text style={styles.profileName}>{selectedCharacter ? selectedCharacter.name : defaultCharacter.name}</Text>
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

                    {/* Map Section */}
                    <View style={styles.mapContainer}>
                        <View style={styles.mapPlaceholder}>
                            {lastRunPath && lastRunPath.length > 1 ? (
                                // 실제 러닝 경로 표시
                                <MapView
                                    style={styles.mapView}
                                    provider={PROVIDER_GOOGLE}
                                    initialRegion={getRegionForCoordinates(lastRunPath)}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                    pitchEnabled={false}
                                    rotateEnabled={false}
                                    pointerEvents="none"
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
                                </MapView>
                            ) : (
                                // 기록이 없을 때 placeholder
                                <>
                                    <View style={styles.emptyMapContainer}>
                                        <Ionicons name="map-outline" size={48} color="#CCC" />
                                        <Text style={styles.emptyMapText}>러닝 기록이 없습니다</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Map Date Label */}
                        <Text style={styles.mapDate}>
                            {lastRunDate ? formatDate(lastRunDate) : '기록이 없습니다'}
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
                            <View style={styles.avatarItem}>
                                <Text style={styles.avatarEmoji}>👤</Text>
                            </View>
                            <View style={styles.avatarItem}>
                                <Text style={styles.avatarEmoji}>🥭</Text>
                            </View>
                            <View style={styles.moreButton}>
                                <Text style={styles.moreText}>•••</Text>
                            </View>
                        </TouchableOpacity>
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
        paddingBottom: 120, // 하단 여백 (네비게이션 바 고려)
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
    characterPlaceholder: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    characterEmoji: {
        fontSize: 100,
    },
    mapContainer: {
        marginHorizontal: 20,
        marginTop: 10,
        position: 'relative',
    },
    mapPlaceholder: {
        height: 200,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    mapView: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    emptyMapContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    emptyMapText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    mapImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    mapOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    mapText: {
        fontSize: 16,
        color: '#999',
    },
    mapMarker: {
        position: 'absolute',
        width: 40,
        height: 40,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4A90E2',
        top: 60,
        left: 50,
    },
    markerEmoji: {
        fontSize: 24,
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
    character: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
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
});