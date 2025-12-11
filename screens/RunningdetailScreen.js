import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import TabScreenLayout from '../components/TabScreenLayout';
import { db } from '../services/config';

const { width, height } = Dimensions.get('window');

export default function RunningDetailScreen({ route }) {
    const router = useRouter();
    const { record } = route.params;
    const [userName, setUserName] = useState('사용자');

    // 사용자 이름 불러오기
    useEffect(() => {
        loadUserName();
    }, []);

    const loadUserName = async () => {
        try {
            const userEmail = await AsyncStorage.getItem('userEmail') || 'hong@example.com';
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                if (userData.name) {
                    setUserName(userData.name);
                }
            }
        } catch (error) {
            console.error('사용자 이름 불러오기 실패:', error);
        }
    };

    // 시간 포맷
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m ${secs}s`;
    };

    // 페이스 포맷
    const formatPace = (secondsPerKm) => {
        if (secondsPerKm === 0 || !isFinite(secondsPerKm)) return "0'00\"";
        const mins = Math.floor(secondsPerKm / 60);
        const secs = Math.floor(secondsPerKm % 60);
        return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };

    // 날짜 포맷
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // 시간대 포맷
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 지도 영역 계산
    const getMapRegion = () => {
        if (!record.pathCoords || record.pathCoords.length === 0) {
            return {
                latitude: 37.5665,
                longitude: 126.9780,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }

        // 경로의 중심점과 범위 계산
        const lats = record.pathCoords.map(coord => coord.latitude);
        const lngs = record.pathCoords.map(coord => coord.longitude);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const deltaLat = (maxLat - minLat) * 1.5 || 0.01;
        const deltaLng = (maxLng - minLng) * 1.5 || 0.01;

        return {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(deltaLat, 0.01),
            longitudeDelta: Math.max(deltaLng, 0.01),
        };
    };

    return (
        <TabScreenLayout>
            <LinearGradient
                    colors={['#B8E6F0', '#C8EDD4', '#D4E9D7']}
                    style={{ flex: 1 }}
                >
                    <SafeAreaView style={styles.container}>
                        <StatusBar barStyle="dark-content" />

                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>러닝 기록</Text>
                    <View style={styles.menuButton} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* 기록 ID 및 날짜 */}
                    <View style={styles.titleSection}>
                        <Text style={styles.recordId}>{record.locationName || record.id}</Text>
                        <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                    </View>

                    {/* 지도 */}
                    <View style={styles.mapContainer}>
                        {record.pathCoords && record.pathCoords.length > 0 ? (
                            <MapView
                                style={styles.map}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={getMapRegion()}
                                scrollEnabled={true}
                                zoomEnabled={true}
                                pitchEnabled={false}
                                rotateEnabled={false}
                            >
                                {/* 러닝 경로 */}
                                <Polyline
                                    coordinates={record.pathCoords}
                                    strokeColor="#71D9A1"
                                    strokeColors={["#71D9A1"]}
                                    strokeWidth={6}
                                    geodesic={false}
                                />


                                {/* 시작점 마커 */}
                                <Marker
                                    coordinate={record.pathCoords[0]}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View style={styles.startMarker}>
                                        <Text style={styles.markerText}>S</Text>
                                    </View>
                                </Marker>

                                {/* 종료점 마커 */}
                                <Marker
                                    coordinate={record.pathCoords[record.pathCoords.length - 1]}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View style={styles.endMarker}>
                                        <Text style={styles.markerText}>E</Text>
                                    </View>
                                </Marker>
                            </MapView>
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <Text style={styles.mapPlaceholderText}>경로 데이터 없음</Text>
                            </View>
                        )}
                    </View>

                    {/* 메인 거리 카드 */}
                    <View style={styles.mainStatCard}>
                        <View style={styles.mainStatIcon}>
                            <Ionicons name="navigate" size={32} color="#71D9A1" />
                        </View>
                        <Text style={styles.mainStatLabel}>{userName}님의 세부 기록</Text>
                        <Text style={styles.mainStatValue}>{record.distance.toFixed(2)}km</Text>
                        <Text style={styles.mainStatSubtext}>
                            {formatDateTime(record.date)} • {formatTime(record.time)}
                        </Text>
                    </View>

                    {/* 상세 통계 그리드 */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>운동 시간</Text>
                            <Text style={styles.statValue}>{formatTime(record.time)}</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>총 칼로리량</Text>
                            <Text style={styles.statValue}>{record.calories || 0}kcal</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>평균 페이스</Text>
                            <Text style={styles.statValue}>{formatPace(record.pace)}/km</Text>
                        </View>
                    </View>

                    {/* 추가 정보 카드 */}
                    <View style={styles.infoCards}>
                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <Ionicons name="walk-outline" size={20} color="#71D9A1" />
                                <Text style={styles.infoCardTitle}>거리</Text>
                            </View>
                            <Text style={styles.infoCardValue}>{record.distance.toFixed(2)}km</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <Ionicons name="flame-outline" size={20} color="#FF8C00" />
                                <Text style={styles.infoCardTitle}>칼로리</Text>
                            </View>
                            <Text style={styles.infoCardValue}>{record.calories || 0}kcal</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <Ionicons name="speedometer-outline" size={20} color="#6B7FFF" />
                                <Text style={styles.infoCardTitle}>평균 페이스</Text>
                            </View>
                            <Text style={styles.infoCardValue}>{formatPace(record.pace)}/km</Text>
                        </View>
                    </View>

                    {/* 공유 버튼 */}
                    <TouchableOpacity style={styles.shareButton}>
                        <Ionicons name="share-social-outline" size={20} color="#999" />
                        <Text style={styles.shareButtonText}>러닝 기록 공유하기</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            </SafeAreaView>
            </LinearGradient>
        </TabScreenLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        fontWeight: '600',
        color: '#333',
    },
    menuButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    titleSection: {
        
        padding: 20,
        alignItems: 'center',
    },
    recordId: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    recordDate: {
        fontSize: 14,
        color: '#999',
    },
    mapContainer: {
        height: 250,
        backgroundColor: '#71D9A1',
        marginTop: 8,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapPlaceholderText: {
        fontSize: 16,
        color: '#999',
    },
    startMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#71D9A1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    endMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    markerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
    },
    mainStatCard: {
        
        marginTop: 8,
        padding: 24,
        alignItems: 'center',
    },
    mainStatIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F0F9F4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    mainStatLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    mainStatValue: {
        fontSize: 40,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    mainStatSubtext: {
        fontSize: 13,
        color: '#666',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        marginTop: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    infoCards: {
        paddingHorizontal: 16,
        marginTop: 8,
        gap: 8,
    },
    infoCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoCardTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    infoCardValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    shareButton: {
        backgroundColor: '#D4E9D7',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
    },
    bottomPadding: {
        height: 32,
    },
});