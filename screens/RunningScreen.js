import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { saveRunningRecord, migrateRecordsToFirestore } from '../services/runningRecordsService';
import { completeMission } from '../services/userLevelService';
import { auth } from '../services/config';
import {
    Alert,
    Dimensions,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function RunningScreen() {
  const router = useRouter();
  // 러닝 상태: 'ready', 'running', 'paused', 'completed'
  const [runningState, setRunningState] = useState('ready');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // 지도 및 위치
  const [currentLocation, setCurrentLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const mapRef = useRef(null);

  // 러닝 데이터
  const [distance, setDistance] = useState(0); // km
  const [pace, setPace] = useState(0); // 초/km
  const [time, setTime] = useState(0); // 초
  const [pathCoords, setPathCoords] = useState([]);
  const [lastLocation, setLastLocation] = useState(null);
  const [calories, setCalories] = useState(0);

  // 위치 구독
  const locationSubscription = useRef(null);

  // 위치 권한 요청 및 초기 위치 가져오기
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', 'GPS 위치 권한이 필요합니다.');
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(coords);
        setRegion({
          ...coords,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        setLastLocation(coords);
      } catch (error) {
        console.error('위치 가져오기 실패:', error);
        Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
      }
    })();
  }, []);

  // 러닝 시작 시 위치 추적 시작
  useEffect(() => {
    if (runningState === 'running') {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [runningState]);

  // 위치 추적 시작
  const startLocationTracking = async () => {
    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // 1초마다 업데이트
          distanceInterval: 5, // 5미터 이동 시 업데이트
        },
        (location) => {
          const newCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setCurrentLocation(newCoords);

          // 경로에 추가
          setPathCoords(prev => [...prev, newCoords]);

          // 거리 계산
          if (lastLocation) {
            const dist = calculateDistance(
              lastLocation.latitude,
              lastLocation.longitude,
              newCoords.latitude,
              newCoords.longitude
            );
            setDistance(prev => prev + dist);
          }

          setLastLocation(newCoords);

          // 지도 중심 이동
          if (mapRef.current) {
            mapRef.current.animateCamera({
              center: newCoords,
              zoom: 17,
            });
          }
        }
      );
    } catch (error) {
      console.error('위치 추적 시작 실패:', error);
    }
  };

  // 위치 추적 중지
  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  // 두 지점 간 거리 계산 (Haversine formula) - km 단위
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value) => {
    return (value * Math.PI) / 180;
  };

  // 타이머 및 칼로리 계산
  useEffect(() => {
    let interval;
    if (runningState === 'running') {
      interval = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 1;
          // 페이스 계산 (초/km) - 최소 거리 0.01km 이상일 때만 계산
          if (distance >= 0.01) {
            const calculatedPace = newTime / distance;
            // 합리적인 페이스 범위: 3분/km ~ 20분/km (180초 ~ 1200초)
            setPace(Math.min(Math.max(calculatedPace, 180), 1200));
          } else {
            setPace(0);
          }

          // 칼로리 계산 (간단한 공식: 70kg 기준, 거리 * 70)
          setCalories(Math.round(distance * 70));

          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [runningState, distance]);

  // 시간 포맷 (00:00)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 페이스 포맷 (0'00")
  const formatPace = (secondsPerKm) => {
    if (secondsPerKm === 0 || !isFinite(secondsPerKm)) return "0'00\"";
    const mins = Math.floor(secondsPerKm / 60);
    const secs = Math.floor(secondsPerKm % 60);
    return `${mins}'${secs.toString().padStart(2, '0')}"`;
  };

  const handleStart = () => {
    setRunningState('running');
    // 경로 초기화
    if (currentLocation) {
      setPathCoords([currentLocation]);
    }
  };

  const handlePause = () => {
    setRunningState('paused');
  };

  const handleResume = () => {
    setRunningState('running');
  };

  const handleStop = () => {
    setRunningState('completed');
    setShowCompletionModal(true);
  };

  // 기록 버튼: 현재 러닝을 저장하고 종료
  const handleRecord = () => {
    if (distance < 0.01) {
      Alert.alert('알림', '기록할 거리가 너무 짧습니다. 최소 0.01km 이상 달려주세요.');
      return;
    }
    
    Alert.alert(
      '기록 저장',
      '현재 러닝을 저장하고 종료하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '저장',
          onPress: async () => {
            // 러닝 중지
            setRunningState('completed');
            // 바로 저장
            await handleSave();
          }
        }
      ]
    );
  };

  // 러닝 기록 저장
  const handleSave = async () => {
    try {
      const startCoords = pathCoords[0] || currentLocation;

      // 시작 위치의 주소 가져오기 (역지오코딩)
      let locationName = `RRC-${new Date().getTime()}`;
      if (startCoords) {
        try {
          const addressResults = await Location.reverseGeocodeAsync({
            latitude: startCoords.latitude,
            longitude: startCoords.longitude,
          });

          if (addressResults && addressResults.length > 0) {
            const address = addressResults[0];
            // 도로명, 거리명, 구역 등을 조합하여 이름 생성
            locationName = address.street || address.name || address.district || address.city || locationName;
          }
        } catch (geoError) {
          console.error('주소 가져오기 실패:', geoError);
          // 주소를 가져오지 못해도 기본 ID로 저장
        }
      }

      // 새 기록 객체 생성
      // id는 Firestore가 자동 생성하므로 저장하지 않음
      // locationName은 별도 필드로 저장
      const newRecord = {
        locationName: locationName, // id 대신 locationName으로 저장
        date: new Date().toISOString(),
        time: time,
        distance: distance,
        pace: pace,
        calories: calories,
        pathCoords: pathCoords,
        startLocation: startCoords,
      };

      // Firestore에 저장
      await saveRunningRecord(newRecord);

      // 마이그레이션: 기존 AsyncStorage 데이터가 있으면 Firestore로 이전 (한 번만 실행)
      // HistoryScreen에서 이미 처리하므로 여기서는 플래그 확인만
      try {
        const migrationDone = await AsyncStorage.getItem('migrationToFirestoreDone');
        if (!migrationDone) {
          const existingRecordsJson = await AsyncStorage.getItem('runningRecords');
          if (existingRecordsJson) {
            const existingRecords = JSON.parse(existingRecordsJson);
            if (existingRecords.length > 0) {
              await migrateRecordsToFirestore(existingRecords);
              // 마이그레이션 완료 후 AsyncStorage 정리 (중복 복원 방지)
              await AsyncStorage.removeItem('runningRecords');
              // 마이그레이션 완료 표시
              await AsyncStorage.setItem('migrationToFirestoreDone', 'true');
            } else {
              // 기록이 없어도 마이그레이션 완료 표시
              await AsyncStorage.setItem('migrationToFirestoreDone', 'true');
            }
          } else {
            // AsyncStorage에 기록이 없어도 마이그레이션 완료 표시
            await AsyncStorage.setItem('migrationToFirestoreDone', 'true');
          }
        }
      } catch (migrationError) {
        console.error('마이그레이션 중 오류:', migrationError);
        // 마이그레이션 실패해도 새 기록은 저장되었으므로 계속 진행
      }

      // 미션 체크 및 경험치 지급
      const completedMissions = [];
      let totalExpGained = 0;
      let finalResult = null;

      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          // 2km 달리기 미션 체크
          if (distance >= 2.0) {
            const result = await completeMission(userId, '2km 달리기 완주', 50, 'mission_1');
            if (result.success && !result.alreadyCompleted) {
              completedMissions.push('2km 달리기 완주');
              totalExpGained += 50;
              finalResult = result;
            }
          }

          // 1분 달리기 미션 체크
          if (time >= 60) {
            const result = await completeMission(userId, '1분 달리기 완주', 50, 'mission_2');
            if (result.success && !result.alreadyCompleted) {
              completedMissions.push('1분 달리기 완주');
              totalExpGained += 50;
              finalResult = result; // 마지막 결과 저장 (레벨업 정보)
            }
          }
        }
      } catch (missionError) {
        console.error('미션 완료 처리 중 오류:', missionError);
        // 미션 실패해도 기록 저장은 완료되었으므로 계속 진행
      }

      setShowCompletionModal(false);

      // 미션 완료 여부에 따라 다른 메시지 표시
      if (completedMissions.length > 0 && finalResult) {
        const missionList = completedMissions.map(m => `• ${m}`).join('\n');
        Alert.alert(
          finalResult.leveledUp ? '🎉 레벨업!' : '✅ 미션 완료!',
          `러닝 기록이 저장되었습니다!\n\n완료한 미션:\n${missionList}\n\n획득 경험치: +${totalExpGained} EXP\n현재 레벨: ${finalResult.newLevel}\n경험치: ${finalResult.currentExp}/${finalResult.maxExp}`,
          [
            {
              text: '확인',
              onPress: () => {
                // 초기화
                setTime(0);
                setDistance(0);
                setPace(0);
                setCalories(0);
                setPathCoords([]);
                setRunningState('ready');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          '저장 완료',
          '러닝 기록이 저장되었습니다!',
          [
            {
              text: '확인',
              onPress: () => {
                // 초기화
                setTime(0);
                setDistance(0);
                setPace(0);
                setCalories(0);
                setPathCoords([]);
                setRunningState('ready');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('저장 실패:', error);
      Alert.alert('오류', '기록 저장에 실패했습니다.');
    }
  };

  const centerOnUser = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  };

  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({ zoom: 18 }, { duration: 300 });
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({ zoom: 14 }, { duration: 300 });
    }
  };

  return (
      <LinearGradient
          colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
          locations={[0, 0.16, 1]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>러닝</Text>
            <Text style={styles.headerSubtitle}>
              {new Date().toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Ionicons name="time-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 구글 지도 */}
        <View style={styles.mapContainer}>
          {currentLocation ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              showsUserLocation={true}
              showsMyLocationButton={false}
              followsUserLocation={runningState === 'running'}
              showsCompass={false}
              showsScale={false}
              toolbarEnabled={false}
            >
              {/* 러닝 경로 표시 - 그림자 효과를 위한 배경 레이어 */}
              {pathCoords.length > 1 && (
                <>
                  <Polyline
                    coordinates={pathCoords}
                    strokeColor="rgba(0, 0, 0, 0.2)"
                    strokeWidth={8}
                    lineCap="round"
                    lineJoin="round"
                  />
                  
                  {/* 러닝 경로 - 메인 레이어 */}
                  <Polyline
                    coordinates={pathCoords}
                    strokeColor="#71D9A1"
                    strokeWidth={6}
                    lineCap="round"
                    lineJoin="round"
                  />
                </>
              )}

              {/* 시작점 마커 */}
              {pathCoords.length > 0 && (
                <Marker
                  coordinate={pathCoords[0]}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.startMarker}>
                    <View style={styles.startMarkerInner}>
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </Marker>
              )}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>지도 로딩 중...</Text>
            </View>
          )}

          {/* 지도 컨트롤 버튼들 */}
          <View style={styles.mapControls}>
            <TouchableOpacity style={styles.mapControlButton} onPress={zoomIn}>
              <Ionicons name="add" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapControlButton} onPress={zoomOut}>
              <Ionicons name="remove" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapControlButton} onPress={centerOnUser}>
              <Ionicons name="locate" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 러닝 정보 카드 */}
        <View style={styles.infoCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>거리</Text>
              <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>페이스</Text>
              <Text style={styles.statValue}>{formatPace(pace)} /km</Text>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <Text style={styles.timeLabel}>시간</Text>
            <Text style={styles.timeValue}>{formatTime(time)}</Text>
          </View>

          {/* 진행 바 */}
          {runningState !== 'ready' && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((distance / 5) * 100, 100)}%` }
                ]}
              />
            </View>
          )}

          {/* 컨트롤 버튼들 */}
          <View style={styles.controlButtons}>
            {runningState === 'ready' && (
              <>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={handleStart}
                >
                  <Ionicons name="play" size={32} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.startText}>시작 버튼을 눌러 러닝을 시작하세요</Text>
              </>
            )}

            {(runningState === 'running' || runningState === 'paused') && (
              <View style={styles.runningControls}>
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={handleStop}
                >
                  <View style={styles.stopIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={runningState === 'running' ? handlePause : handleResume}
                >
                  <Ionicons
                    name={runningState === 'running' ? 'pause' : 'play'}
                    size={32}
                    color="#FFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.bookmarkButton}
                  onPress={handleRecord}
                >
                  <Ionicons name="bookmark" size={28} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.runningStatusText}>
                  {runningState === 'running' ? '러닝 중' : '일시정지'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 완료 모달 */}
        <Modal
          visible={showCompletionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCompletionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIcon}>
                <Ionicons 
                  name={distance < 0.01 ? "close-circle" : "flag"} 
                  size={40} 
                  color={distance < 0.01 ? "#DC6B6B" : "#6B7FFF"} 
                />
              </View>

              <Text style={styles.modalTitle}>
                {distance < 0.01 ? "러닝 기록 없음" : "러닝 완료!"}
              </Text>

              {distance < 0.01 ? (
                <View style={styles.modalWarningContainer}>
                  <Text style={styles.modalWarningText}>
                    기록할 거리가 너무 짧습니다.{'\n'}
                    최소 0.01km 이상 달려야 기록이 저장됩니다.
                  </Text>
                </View>
              ) : (
                <View style={styles.modalStats}>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>거리</Text>
                    <Text style={styles.modalStatValue}>{distance.toFixed(2)} km</Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>시간</Text>
                    <Text style={styles.modalStatValue}>{formatTime(time)}</Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>페이스</Text>
                    <Text style={styles.modalStatValue}>
                      {pace > 0 ? `${formatPace(pace)} /km` : '-'}
                    </Text>
                  </View>
                  <View style={styles.modalStatRow}>
                    <Text style={styles.modalStatLabel}>칼로리</Text>
                    <Text style={styles.modalStatValue}>{calories} kcal</Text>
                  </View>
                </View>
              )}

              <View style={styles.modalButtonContainer}>
                {distance < 0.01 ? (
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.cancelButton]}
                    onPress={() => {
                      setShowCompletionModal(false);
                      setRunningState('ready');
                      // 초기화
                      setTime(0);
                      setDistance(0);
                      setPace(0);
                      setCalories(0);
                      setPathCoords([]);
                    }}
                  >
                    <Text style={styles.confirmButtonText}>확인</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.confirmButton, styles.cancelButton]}
                      onPress={() => {
                        setShowCompletionModal(false);
                        setRunningState('ready');
                        // 초기화
                        setTime(0);
                        setDistance(0);
                        setPace(0);
                        setCalories(0);
                        setPathCoords([]);
                      }}
                    >
                      <Text style={[styles.confirmButtonText, styles.cancelButtonText]}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleSave}
                    >
                      <Text style={styles.confirmButtonText}>저장하기</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      </LinearGradient>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 24,     
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  menuButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
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
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 20,
    gap: 8,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#71D9A1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  startMarkerInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
  },
  controlButtons: {
    alignItems: 'center',
  },
  startButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#71D9A1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#71D9A1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startText: {
    fontSize: 14,
    color: '#666',
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DC6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  pauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6B7FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  runningStatusText: {
    position: 'absolute',
    bottom: -30,
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
  },
  modalStats: {
    width: '100%',
    marginBottom: 24,
  },
  modalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalStatLabel: {
    fontSize: 16,
    color: '#666',
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalWarningContainer: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  modalWarningText: {
    fontSize: 14,
    color: '#DC6B6B',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#6B7FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#666',
  },
});