import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { getRunningRecords, deleteRunningRecord, migrateRecordsToFirestore } from '../services/runningRecordsService';
import {
    Alert,
    Dimensions,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

export default function AllRecordsScreen() {
    const router = useRouter();
    const [records, setRecords] = useState([]);

    // 화면이 포커스될 때마다 기록 불러오기
    useFocusEffect(
        useCallback(() => {
            loadRecords();
        }, [])
    );

    // 기록 불러오기
    const loadRecords = async () => {
        try {
            // Firestore에서 기록 불러오기
            const loadedRecords = await getRunningRecords();
            setRecords(loadedRecords);

            // 마이그레이션: 기존 AsyncStorage 데이터가 있으면 Firestore로 이전 (한 번만 실행)
            try {
                const migrationDone = await AsyncStorage.getItem('migrationToFirestoreDone');
                if (!migrationDone) {
                    const existingRecordsJson = await AsyncStorage.getItem('runningRecords');
                    if (existingRecordsJson) {
                        const existingRecords = JSON.parse(existingRecordsJson);
                        if (existingRecords.length > 0) {
                            await migrateRecordsToFirestore(existingRecords);
                            // 마이그레이션 후 다시 불러오기
                            const updatedRecords = await getRunningRecords();
                            setRecords(updatedRecords);
                        }
                    }
                    // 마이그레이션 완료 표시
                    await AsyncStorage.setItem('migrationToFirestoreDone', 'true');
                }
            } catch (migrationError) {
                console.error('마이그레이션 중 오류:', migrationError);
            }
        } catch (error) {
            console.error('기록 불러오기 실패:', error);
        }
    };

    // 페이스 포맷
    const formatPace = (secondsPerKm) => {
        if (secondsPerKm === 0 || !isFinite(secondsPerKm)) return "0'00\"";
        const mins = Math.floor(secondsPerKm / 60);
        const secs = Math.floor(secondsPerKm % 60);
        return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };

    // 간단한 날짜 포맷 (10/09 화)
    const formatSimpleDate = (dateString) => {
        const date = new Date(dateString);
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekDay = weekDays[date.getDay()];
        return `${month}/${day.toString().padStart(2, '0')} ${weekDay}`;
    };

    // 시간 범위 포맷 (6:32 - 8:10)
    const formatTimeRange = (dateString, seconds) => {
        const startDate = new Date(dateString);
        const endDate = new Date(startDate.getTime() + seconds * 1000);

        const formatHourMin = (date) => {
            const hours = date.getHours();
            const mins = date.getMinutes();
            return `${hours}:${mins.toString().padStart(2, '0')}`;
        };

        return `${formatHourMin(startDate)} - ${formatHourMin(endDate)}`;
    };

    // 기록 삭제
    const handleDeleteRecord = (item) => {
        Alert.alert(
            '기록 삭제',
            `이 기록을 삭제하시겠습니까?`,
            [
                {
                    text: '취소',
                    style: 'cancel'
                },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // item 전체를 전달하여 날짜로도 매칭 가능하도록 함
                            await deleteRunningRecord(item.id, item);
                            // 약간의 지연 후 데이터 다시 불러오기 (Firestore 반영 시간)
                            await new Promise(resolve => setTimeout(resolve, 500));
                            // Firestore에서 다시 불러오기
                            await loadRecords();
                            Alert.alert('완료', '기록이 삭제되었습니다.');
                        } catch (error) {
                            console.error('삭제 실패:', error);
                            Alert.alert('오류', `기록 삭제에 실패했습니다: ${error.message}`);
                        }
                    }
                }
            ]
        );
    };

    // 리스트 아이템 렌더링
    const renderRecordItem = ({ item }) => (
        <TouchableOpacity
            style={styles.recordCard}
            onPress={() => {
                router.push({
                    pathname: '/runningdetail',
                    params: { record: JSON.stringify(item) }
                });
            }}
            onLongPress={() => handleDeleteRecord(item)}
        >
            {/* 왼쪽 지도 썸네일 */}
            <View style={styles.mapThumbnail}>
                {item.pathCoords && item.pathCoords.length > 1 ? (
                    <MapView
                        style={styles.thumbnailMap}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                            latitude: item.pathCoords[0].latitude,
                            longitude: item.pathCoords[0].longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                        pointerEvents="none"
                    >
                        <Polyline
                            coordinates={item.pathCoords}
                            strokeColor="#71D9A1"
                            strokeWidth={3}
                        />
                    </MapView>
                ) : (
                    <View style={styles.thumbnailPlaceholder}>
                        <Ionicons name="map-outline" size={24} color="#CCC" />
                    </View>
                )}
            </View>

            {/* 오른쪽 정보 */}
            <View style={styles.recordCardInfo}>
                <Text style={styles.recordCardTitle}>{item.id}</Text>
                <Text style={styles.recordCardDate}>
                    {formatSimpleDate(item.date)} | {formatTimeRange(item.date, item.time)}
                </Text>

                <View style={styles.recordCardStats}>
                    <View style={styles.recordCardStat}>
                        <Ionicons name="flame" size={14} color="#FF6B6B" />
                        <Text style={styles.recordCardStatText}>{item.calories || 0}kcal</Text>
                    </View>
                    <View style={styles.recordCardStat}>
                        <Ionicons name="walk" size={14} color="#71D9A1" />
                        <Text style={styles.recordCardStatText}>{item.distance.toFixed(2)}km</Text>
                    </View>
                    <View style={styles.recordCardStat}>
                        <Ionicons name="time" size={14} color="#6B7FFF" />
                        <Text style={styles.recordCardStatText}>{formatPace(item.pace)}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
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
                <Text style={styles.headerTitle}>모든 러닝 기록</Text>
                <View style={styles.menuButton} />
            </View>

            {records.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="fitness-outline" size={48} color="#CCC" />
                    <Text style={styles.emptyText}>아직 러닝 기록이 없습니다</Text>
                    <Text style={styles.emptySubtext}>첫 러닝을 시작해보세요!</Text>
                </View>
            ) : (
                <FlatList
                    data={records}
                    renderItem={renderRecordItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.recordsList}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        //backgroundColor: '#D4E9D7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        //backgroundColor: '#D4E9D7',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    menuButton: {
        width: 32,
    },
    recordsList: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
    },
    recordCard: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    mapThumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#E8F5E9',
        marginRight: 12,
    },
    thumbnailMap: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordCardInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    recordCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    recordCardDate: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    recordCardStats: {
        flexDirection: 'row',
        gap: 12,
    },
    recordCardStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    recordCardStatText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
});

