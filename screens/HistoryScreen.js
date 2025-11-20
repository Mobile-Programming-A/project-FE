import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
    const router = useRouter();
    const [records, setRecords] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('주간'); // 오늘, 주간, 월간, 연간
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [{ data: [0] }]
    });

    // 화면이 포커스될 때마다 기록 불러오기
    useFocusEffect(
        useCallback(() => {
            loadRecords();
        }, [])
    );

    // 기록 불러오기
    const loadRecords = async () => {
        try {
            const recordsJson = await AsyncStorage.getItem('runningRecords');
            if (recordsJson) {
                const loadedRecords = JSON.parse(recordsJson);
                setRecords(loadedRecords);
                updateChartData(loadedRecords, selectedPeriod);
            }
        } catch (error) {
            console.error('기록 불러오기 실패:', error);
        }
    };

    // 차트 데이터 업데이트 (평균 페이스 계산)
    const updateChartData = (records, period) => {
        if (records.length === 0) {
            setChartData({
                labels: ['데이터 없음'],
                datasets: [{ data: [0] }]
            });
            return;
        }

        let labels = [];
        let data = [];
        let countData = []; // 각 기간별 기록 개수

        switch (period) {
            case '오늘':
                // 오늘의 시간대별 평균 페이스
                const today = new Date();
                const todayRecords = records.filter(r => {
                    const recordDate = new Date(r.date);
                    return recordDate.toDateString() === today.toDateString();
                });

                labels = ['아침', '점심', '저녁', '밤'];
                data = [0, 0, 0, 0];
                countData = [0, 0, 0, 0];

                todayRecords.forEach(record => {
                    const hour = new Date(record.date).getHours();
                    let index = -1;
                    if (hour >= 6 && hour < 12) index = 0;
                    else if (hour >= 12 && hour < 18) index = 1;
                    else if (hour >= 18 && hour < 22) index = 2;
                    else index = 3;

                    if (index !== -1 && record.pace && isFinite(record.pace)) {
                        data[index] += record.pace;
                        countData[index]++;
                    }
                });

                // 평균 계산
                data = data.map((sum, i) => countData[i] > 0 ? sum / countData[i] : 0);
                break;

            case '주간':
                // 주간 데이터 (최근 7일 평균 페이스)
                const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return d;
                });

                labels = last7Days.map(d => weekDays[d.getDay()]);
                data = new Array(7).fill(0);
                countData = new Array(7).fill(0);

                records.forEach(record => {
                    const recordDate = new Date(record.date);
                    const dayIndex = last7Days.findIndex(d =>
                        d.toDateString() === recordDate.toDateString()
                    );
                    if (dayIndex !== -1 && record.pace && isFinite(record.pace)) {
                        data[dayIndex] += record.pace;
                        countData[dayIndex]++;
                    }
                });

                // 평균 계산
                data = data.map((sum, i) => countData[i] > 0 ? sum / countData[i] : 0);
                break;

            case '월간':
                // 월간 데이터 (최근 4주 평균 페이스)
                labels = ['1주', '2주', '3주', '4주'];
                data = [0, 0, 0, 0];
                countData = [0, 0, 0, 0];

                const now = new Date();
                records.forEach(record => {
                    const recordDate = new Date(record.date);
                    const daysDiff = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));

                    let weekIndex = -1;
                    if (daysDiff < 7) weekIndex = 3;
                    else if (daysDiff < 14) weekIndex = 2;
                    else if (daysDiff < 21) weekIndex = 1;
                    else if (daysDiff < 28) weekIndex = 0;

                    if (weekIndex !== -1 && record.pace && isFinite(record.pace)) {
                        data[weekIndex] += record.pace;
                        countData[weekIndex]++;
                    }
                });

                // 평균 계산
                data = data.map((sum, i) => countData[i] > 0 ? sum / countData[i] : 0);
                break;

            case '연간':
                // 연간 데이터 (최근 6개월 평균 페이스)
                const months = ['1월', '2월', '3월', '4월', '5월', '6월',
                    '7월', '8월', '9월', '10월', '11월', '12월'];
                const currentMonth = new Date().getMonth();

                labels = Array.from({ length: 6 }, (_, i) => {
                    const monthIndex = (currentMonth - 5 + i + 12) % 12;
                    return months[monthIndex];
                });

                data = new Array(6).fill(0);
                countData = new Array(6).fill(0);

                records.forEach(record => {
                    const recordDate = new Date(record.date);
                    const monthsDiff = (new Date().getFullYear() - recordDate.getFullYear()) * 12
                        + (new Date().getMonth() - recordDate.getMonth());

                    if (monthsDiff >= 0 && monthsDiff < 6 && record.pace && isFinite(record.pace)) {
                        const index = 5 - monthsDiff;
                        data[index] += record.pace;
                        countData[index]++;
                    }
                });

                // 평균 계산
                data = data.map((sum, i) => countData[i] > 0 ? sum / countData[i] : 0);
                break;
        }

        // 페이스를 분:초 형식으로 변환하지 않고 그대로 사용 (초 단위)
        // 차트에서는 초 단위로 표시하되, 최소값이 0이 되도록 조정
        const roundedData = data.map(value => Math.round(value * 10) / 10);

        setChartData({
            labels,
            datasets: [{ data: roundedData.length > 0 ? roundedData : [0] }]
        });
    };

    // 기간 선택
    const handlePeriodSelect = (period) => {
        setSelectedPeriod(period);
        updateChartData(records, period);
    };

    // 시간 포맷
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
            `"${item.id}" 기록을 삭제하시겠습니까?`,
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
                            // 해당 기록을 제외한 나머지 기록들만 필터링
                            const updatedRecords = records.filter(record => record.id !== item.id);

                            // AsyncStorage에 업데이트된 기록 저장
                            await AsyncStorage.setItem('runningRecords', JSON.stringify(updatedRecords));

                            // 상태 업데이트
                            setRecords(updatedRecords);
                            updateChartData(updatedRecords, selectedPeriod);

                            Alert.alert('삭제 완료', '기록이 삭제되었습니다.');
                        } catch (error) {
                            console.error('삭제 실패:', error);
                            Alert.alert('오류', '기록 삭제에 실패했습니다.');
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
                            strokeColor="#7FD89A"
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
                        <Ionicons name="walk" size={14} color="#7FD89A" />
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

    // 페이스를 분:초 형식으로 변환 (차트 표시용)
    const formatPaceForChart = (seconds) => {
        if (!seconds || !isFinite(seconds) || seconds === 0) return "0'00\"";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}'${secs.toString().padStart(2, '0')}"`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* 헤더 */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/(tabs)/main')}
                >
                    <Ionicons name="chevron-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>러닝 기록</Text>
                <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.content} 
                showsVerticalScrollIndicator={false}
            >
                {/* 기간 선택 버튼 */}
                <View style={styles.periodSelector}>
                    {['오늘', '주간', '월간', '연간'].map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.periodButton,
                                selectedPeriod === period && styles.periodButtonActive
                            ]}
                            onPress={() => handlePeriodSelect(period)}
                        >
                            <Text style={[
                                styles.periodButtonText,
                                selectedPeriod === period && styles.periodButtonTextActive
                            ]}>
                                {period}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 차트 */}
                <View style={styles.chartContainer}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>평균 페이스</Text>
                        {chartData.datasets[0].data.length > 0 &&
                            chartData.datasets[0].data.some(d => d > 0) && (
                                <Text style={styles.chartSubtitle}>
                                    {formatPaceForChart(
                                        chartData.datasets[0].data
                                            .filter(d => d > 0)
                                            .reduce((a, b) => a + b, 0) /
                                        chartData.datasets[0].data.filter(d => d > 0).length
                                    )}
                                </Text>
                            )}
                    </View>
                    <View style={styles.chartWrapper}>
                        <LineChart
                            data={chartData}
                            width={width - 48}
                            height={240}
                            chartConfig={{
                                backgroundColor: '#FFFFFF',
                                backgroundGradientFrom: '#FFFFFF',
                                backgroundGradientTo: '#FFFFFF',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(127, 216, 154, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(107, 107, 107, ${opacity})`,
                                strokeWidth: 3,
                                barPercentage: 0.7,
                                useShadowColorFromDataset: false,
                                propsForDots: {
                                    r: '6',
                                    strokeWidth: '2',
                                    stroke: '#7FD89A',
                                    fill: '#FFFFFF',
                                },
                                propsForBackgroundLines: {
                                    strokeDasharray: '',
                                    stroke: '#E8E8E8',
                                    strokeWidth: 1,
                                },
                                propsForLabels: {
                                    fontSize: 11,
                                    fontWeight: '500',
                                },
                                formatYLabel: (value) => {
                                    const numValue = parseFloat(value);
                                    if (isNaN(numValue)) return '';
                                    return formatPaceForChart(numValue);
                                },
                            }}
                            style={styles.chart}
                            bezier
                            withInnerLines={true}
                            withOuterLines={true}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                            withDots={true}
                            withShadow={false}
                            fromZero={true}
                            segments={4}
                        />
                    </View>
                </View>

                {/* 기록 목록 */}
                <View style={styles.recordsSection}>
                    <View style={styles.recordsHeader}>
                        <Text style={styles.recordsTitle}>최근 달리기</Text>
                        <TouchableOpacity
                            onPress={() => {
                                router.push('/all-records');
                            }}
                        >
                            <Text style={styles.recordsSubtitle}>모든 보기</Text>
                        </TouchableOpacity>
                    </View>

                    {records.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="fitness-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyText}>아직 러닝 기록이 없습니다</Text>
                            <Text style={styles.emptySubtext}>첫 러닝을 시작해보세요!</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={records.slice(0, 3)}
                            renderItem={renderRecordItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            contentContainerStyle={styles.recordsList}
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D4E9D7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#D4E9D7',
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
        padding: 4,
    },
    content: {
        flex: 1,
    },
    periodSelector: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#D4E9D7',
        gap: 8,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#7FD89A',
    },
    periodButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#666',
    },
    periodButtonTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    chartContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    chartSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7FD89A',
    },
    chartWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#FAFAFA',
        paddingTop: 10,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    recordsSection: {
        backgroundColor: '#D4E9D7',
        marginTop: 16,
        padding: 16,
        paddingBottom: 40,
    },
    recordsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    recordsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    recordsSubtitle: {
        fontSize: 14,
        color: '#7FD89A',
    },
    recordsList: {
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