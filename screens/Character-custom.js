import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image, Modal, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { characters, getCharacterById, defaultCharacter, profileImages, getProfileImageById } from '../data/characters';
import { db, auth } from '../services/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { getRunningRecords } from '../services/runningRecordsService';


export default function CharacterCustomScreen() {
    const router = useRouter();
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [selectedProfileImage, setSelectedProfileImage] = useState(null);
    
    // 경험치 데이터 (Firebase에서 불러올 예정)
    const [level, setLevel] = useState(5);
    const [currentExp, setCurrentExp] = useState(195);
    const [maxExp, setMaxExp] = useState(300);
    const expPercentage = Math.round((currentExp / maxExp) * 100);

    // 뱃지 획득 상태
    const [badgeFirstStep, setBadgeFirstStep] = useState(false);
    const [badge2, setBadge2] = useState(false);
    const [badge3, setBadge3] = useState(false);
    const [badge4, setBadge4] = useState(false);

    // 미션 완료 상태
    const [mission1, setMission1] = useState(false);
    const [mission2, setMission2] = useState(false);

    // 미션 진척도 상태
    const [mission1Progress, setMission1Progress] = useState({ current: 0, total: 2 }); // 2km
    const [mission2Progress, setMission2Progress] = useState({ current: 0, total: 1 }); // 1분

    // 뱃지 획득 모달 상태
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [badgeInfo, setBadgeInfo] = useState({ icon: 'leaf', color: '#FFB74D', name: '첫 걸음' });
    const [scaleAnim] = useState(new Animated.Value(0));
    const [rotateAnim] = useState(new Animated.Value(0));

    // 뱃지 설명 모달 상태
    const [showBadgeDescModal, setShowBadgeDescModal] = useState(false);
    const [selectedBadgeDesc, setSelectedBadgeDesc] = useState(null);

    // 뱃지 정보 정의
    const badgeDescriptions = {
        badge_first_step: {
            icon: 'leaf',
            color: '#FFB74D',
            name: '첫 걸음',
            description: '캐릭터 커스텀 화면에 처음 방문했습니다!'
        },
        badge_2: {
            icon: 'trophy',
            color: '#71D9A1',
            name: '레벨 10 달성',
            description: '레벨 10을 달성했습니다! 계속 달려보세요!'
        },
        badge_3: {
            icon: 'checkmark',
            color: '#64B5F6',
            name: '미션 마스터',
            description: '특별한 미션을 완료했습니다!'
        },
        badge_4: {
            icon: 'heart',
            color: '#E57373',
            name: '친구 3명',
            description: '친구 3명 이상을 만들었습니다!'
        }
    };

    // 화면이 포커스될 때마다 선택된 캐릭터와 프로필 불러오기
    useFocusEffect(
        React.useCallback(() => {
            loadUserDataFromFirebase();
            checkMissionProgress();
            checkAndAwardFirstVisitBadge();
            checkAndAwardLevel10Badge();
            checkAndAwardFriends3Badge();
        }, [])
    );

    // Firebase에서 사용자 데이터 불러오기
    const loadUserDataFromFirebase = async () => {
        try {
            const userEmail = await AsyncStorage.getItem('userEmail') || 'hong@example.com';
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                console.log('Firebase에서 불러온 데이터:', userData);

                // 프로필 이미지 설정
                if (userData.avatar) {
                    const avatarId = userData.avatar.replace('avatar', '');
                    const profileImage = getProfileImageById(avatarId);
                    setSelectedProfileImage(profileImage || profileImages[0]);
                    await AsyncStorage.setItem('selectedProfileImageId', avatarId);
                }

                // 캐릭터 설정
                if (userData.characterId) {
                    const character = getCharacterById(userData.characterId.toString());
                    setSelectedCharacter(character || characters[0]);
                    await AsyncStorage.setItem('selectedCharacterId', userData.characterId.toString());
                }

                // 레벨 및 경험치 설정
                if (userData.level !== undefined) {
                    setLevel(userData.level);
                }
                if (userData.currentExp !== undefined) {
                    setCurrentExp(userData.currentExp);
                }
                if (userData.maxExp !== undefined) {
                    setMaxExp(userData.maxExp);
                }

                // 뱃지 획득 상태 설정
                if (userData.badge_first_step !== undefined) {
                    setBadgeFirstStep(userData.badge_first_step);
                }
                if (userData.badge_2 !== undefined) {
                    setBadge2(userData.badge_2);
                }
                if (userData.badge_3 !== undefined) {
                    setBadge3(userData.badge_3);
                }
                if (userData.badge_4 !== undefined) {
                    setBadge4(userData.badge_4);
                }

                // 미션 완료 상태 설정
                if (userData.mission_1 !== undefined) {
                    setMission1(userData.mission_1);
                }
                if (userData.mission_2 !== undefined) {
                    setMission2(userData.mission_2);
                }
            } else {
                console.log('사용자 데이터를 찾을 수 없습니다.');
                // 기본값 설정
                setSelectedCharacter(characters[0]);
                setSelectedProfileImage(profileImages[0]);
            }
        } catch (error) {
            console.error('Firebase 데이터 불러오기 실패:', error);
            // 기본값 설정
            setSelectedCharacter(characters[0]);
            setSelectedProfileImage(profileImages[0]);
        }
    };

    // 미션 진척도 체크 함수
    const checkMissionProgress = async () => {
        try {
            const records = await getRunningRecords();
            
            // 기록이 없을 경우 처리
            if (!records || records.length === 0) {
                console.log('러닝 기록이 없습니다. 러닝을 시작해보세요!');
                setMission1Progress({ current: 0, total: 2 });
                setMission2Progress({ current: 0, total: 10 });
                setMission1(false);
                setMission2(false);
                return;
            }
            
            // 2km 미션 체크 - 최고 기록 찾기
            let maxDistance = 0;
            let maxTime = 0;
            
            records.forEach(record => {
                if (record.distance > maxDistance) {
                    maxDistance = record.distance;
                }
                if (record.time > maxTime) {
                    maxTime = record.time;
                }
            });

            // 2km 미션 진척도 (2km 넘으면 루프)
            const distance2kmProgress = maxDistance % 2; // 2km마다 0으로 리셋
            setMission1Progress({ current: distance2kmProgress, total: 2 });
            
            // 1분(60초) 미션 진척도 (1분 넘으면 루프)
            const time1minProgress = (maxTime / 60) % 1; // 1분마다 0으로 리셋
            setMission2Progress({ current: time1minProgress, total: 1 });

            // 미션 완료 여부는 Firebase의 미션 상태로 판단 (반복 가능)
            // UI 표시용으로만 사용, 실제 완료는 저장 시 체크
            setMission1(maxDistance >= 2.0);
            setMission2(maxTime >= 60);
            
        } catch (error) {
            console.error('미션 진척도 확인 실패:', error);
            // 에러 발생 시 기본값 설정
            setMission1Progress({ current: 0, total: 2 });
            setMission2Progress({ current: 0, total: 1 });
            setMission1(false);
            setMission2(false);
        }
    };

    // 첫 방문 뱃지 지급 함수
    const checkAndAwardFirstVisitBadge = async () => {
        try {
            const userEmail = await AsyncStorage.getItem('userEmail') || 'hong@example.com';
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();

                // badge_first_step이 false이거나 없으면 true로 업데이트
                if (!userData.badge_first_step) {
                    const userDocRef = doc(db, 'users', userDoc.id);
                    await updateDoc(userDocRef, {
                        badge_first_step: true
                    });
                    
                    console.log('🎉 첫 방문 뱃지 획득!');
                    setBadgeFirstStep(true);
                    
                    // 뱃지 획득 모달 표시
                    showBadgeAcquisition('leaf', '#FFB74D', '첫 걸음');
                }
            }
        } catch (error) {
            console.error('첫 방문 뱃지 지급 실패:', error);
        }
    };

    // 레벨 10 달성 뱃지 지급 함수
    const checkAndAwardLevel10Badge = async () => {
        try {
            const userEmail = await AsyncStorage.getItem('userEmail') || 'hong@example.com';
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();

                // 레벨이 10 이상이고 badge_2가 false이거나 없으면 true로 업데이트
                if (userData.level >= 10 && !userData.badge_2) {
                    const userDocRef = doc(db, 'users', userDoc.id);
                    await updateDoc(userDocRef, {
                        badge_2: true
                    });
                    
                    console.log('🏆 레벨 10 달성 뱃지 획득!');
                    setBadge2(true);
                    
                    // 뱃지 획득 모달 표시
                    showBadgeAcquisition('trophy', '#71D9A1', '레벨 10 달성');
                }
            }
        } catch (error) {
            console.error('레벨 10 뱃지 지급 실패:', error);
        }
    };

    // 친구 3명 이상 뱃지 지급 함수
    const checkAndAwardFriends3Badge = async () => {
        try {
            const userEmail = await AsyncStorage.getItem('userEmail') || 'hong@example.com';
            
            // 먼저 users 컬렉션에서 현재 사용자의 badge_4 상태 확인
            const usersRef = collection(db, 'users');
            const userQuery = query(usersRef, where('email', '==', userEmail));
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0];
                const userData = userDoc.data();

                // 이미 뱃지를 받았다면 체크하지 않음
                if (userData.badge_4) {
                    return;
                }

                // friends 컬렉션에서 친구 수 확인
                const friendsRef = collection(db, 'friends');
                const friendsSnapshot = await getDocs(friendsRef);
                const friendsCount = friendsSnapshot.size;

                console.log('👥 현재 친구 수:', friendsCount);

                // 친구가 3명 이상이고 badge_4가 false이거나 없으면 true로 업데이트
                if (friendsCount >= 3 && !userData.badge_4) {
                    const userDocRef = doc(db, 'users', userDoc.id);
                    await updateDoc(userDocRef, {
                        badge_4: true
                    });
                    
                    console.log('❤️ 친구 3명 이상 뱃지 획득!');
                    setBadge4(true);
                    
                    // 뱃지 획득 모달 표시
                    showBadgeAcquisition('heart', '#E57373', '친구 3명 달성');
                }
            }
        } catch (error) {
            console.error('친구 3명 뱃지 지급 실패:', error);
        }
    };

    // 뱃지 획득 모달 표시 함수
    const showBadgeAcquisition = (iconName, color, badgeName) => {
        setBadgeInfo({ icon: iconName, color: color, name: badgeName });
        setShowBadgeModal(true);

        // 애니메이션 시작
        scaleAnim.setValue(0);
        rotateAnim.setValue(0);

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();

        // 3초 후 자동으로 닫기
        setTimeout(() => {
            closeBadgeModal();
        }, 3000);
    };

    // 뱃지 모달 닫기
    const closeBadgeModal = () => {
        Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowBadgeModal(false);
        });
    };

    // 뱃지 클릭 시 설명 표시
    const handleBadgePress = (badgeKey, isAcquired) => {
        if (isAcquired) {
            setSelectedBadgeDesc(badgeDescriptions[badgeKey]);
            setShowBadgeDescModal(true);
        }
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });
    
    return (
    <LinearGradient
        colors={['#B8E6F0', '#C8EDD4', '#D4E9D7']}
        style={{ flex: 1 }}
    >
        
        <SafeAreaView style={styles.container}>

                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.push('/(tabs)/main')}
                    >
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{selectedCharacter ? selectedCharacter.name : defaultCharacter.name}</Text>
                    <Image
                        source={selectedProfileImage ? selectedProfileImage.image : profileImages[0].image}
                        style={styles.profileIcon}
                    />
                </View>

                {/* 캐릭터 프리뷰 */}
                <View style={styles.previewContainer}>
                    <TouchableOpacity 
                        style={styles.editLabel}
                        onPress={() => router.push('/(tabs)/CharacterEdit')}
                    >
                        <Text style={styles.editLabelText}>편집</Text>
                    </TouchableOpacity>
                    <View style={styles.characterImageContainer}>
                        <View style={styles.characterContainer}>
                            <Image
                                source={selectedCharacter ? selectedCharacter.image : defaultCharacter.image}
                                style={styles.character}
                            />
                        </View>
                    </View>
                </View>

                {/* 커스터마이징 옵션 */}
                <View style={styles.customOptions}>
                    {/* 캐릭터 정보 카드 */}
                    <View style={styles.characterInfoCard}>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeText}>LV.{level}</Text>
                        </View>
                        <Text style={styles.characterName}>{selectedCharacter ? selectedCharacter.name : defaultCharacter.name}</Text>
                        <View style={styles.levelBarContainer}>
                            <Text style={styles.expText}>{currentExp} / {maxExp} EXP</Text>
                            <View style={styles.levelBarBackground}>
                                <View style={[styles.levelBarFill, { width: `${expPercentage}%` }]} />
                            </View>
                        </View>
                    </View>

                    {/* 다음 레벨까지의 미션 */}
                    <Text style={styles.sectionTitle}>다음 레벨까지의 미션</Text>
                    <View style={styles.missionList}>
                        {/* 2km 미션 */}
                        <View style={styles.missionItem}>
                            <Ionicons name="fitness" size={20} color="#71D9A1" />
                            <View style={styles.missionContent}>
                                <View style={styles.missionHeader}>
                                    <Text style={styles.missionText}>2km 달리기 완주</Text>
                                    {mission1 ? (
                                        <Ionicons name="checkmark-circle" size={20} color="#71D9A1" />
                                    ) : (
                                        <Ionicons name="ellipse-outline" size={20} color="#CCCCCC" />
                                    )}
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBar}>
                                        <View 
                                            style={[
                                                styles.progressBarFill, 
                                                { width: `${(mission1Progress.current / mission1Progress.total) * 100}%` }
                                            ]} 
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {mission1Progress.current.toFixed(2)}km / {mission1Progress.total}km
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* 1분 미션 */}
                        <View style={styles.missionItem}>
                            <Ionicons name="time" size={20} color="#71D9A1" />
                            <View style={styles.missionContent}>
                                <View style={styles.missionHeader}>
                                    <Text style={styles.missionText}>1분 달리기 완주</Text>
                                    {mission2 ? (
                                        <Ionicons name="checkmark-circle" size={20} color="#71D9A1" />
                                    ) : (
                                        <Ionicons name="ellipse-outline" size={20} color="#CCCCCC" />
                                    )}
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBar}>
                                        <View 
                                            style={[
                                                styles.progressBarFill, 
                                                { width: `${(mission2Progress.current / mission2Progress.total) * 100}%` }
                                            ]} 
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {mission2Progress.current.toFixed(1)}분 / {mission2Progress.total}분
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* 획득한 뱃지 */}
                    <Text style={styles.sectionTitle}>획득한 뱃지</Text>
                    <View style={styles.badgeContainer}>
                        <View style={styles.badgeGrid}>
                            {/* 뱃지 1: leaf (badge_first_step) */}
                            <TouchableOpacity 
                                style={styles.badgeWrapper}
                                onPress={() => handleBadgePress('badge_first_step', badgeFirstStep)}
                                disabled={!badgeFirstStep}
                            >
                                <View style={[styles.badge, { backgroundColor: badgeFirstStep ? '#FFB74D' : '#CCCCCC' }]}>
                                    <Ionicons name="leaf" size={24} color="#FFF" />
                                </View>
                                {!badgeFirstStep && <Text style={styles.lockedText}>미획득</Text>}
                            </TouchableOpacity>

                            {/* 뱃지 2: trophy (badge_2) */}
                            <TouchableOpacity 
                                style={styles.badgeWrapper}
                                onPress={() => handleBadgePress('badge_2', badge2)}
                                disabled={!badge2}
                            >
                                <View style={[styles.badge, { backgroundColor: badge2 ? '#71D9A1' : '#CCCCCC' }]}>
                                    <Ionicons name="trophy" size={24} color="#FFF" />
                                </View>
                                {!badge2 && <Text style={styles.lockedText}>미획득</Text>}
                            </TouchableOpacity>

                            {/* 뱃지 3: checkmark (badge_3) */}
                            <TouchableOpacity 
                                style={styles.badgeWrapper}
                                onPress={() => handleBadgePress('badge_3', badge3)}
                                disabled={!badge3}
                            >
                                <View style={[styles.badge, { backgroundColor: badge3 ? '#64B5F6' : '#CCCCCC' }]}>
                                    <Ionicons name="checkmark" size={24} color="#FFF" />
                                </View>
                                {!badge3 && <Text style={styles.lockedText}>미획득</Text>}
                            </TouchableOpacity>

                            {/* 뱃지 4: heart (badge_4) */}
                            <TouchableOpacity 
                                style={styles.badgeWrapper}
                                onPress={() => handleBadgePress('badge_4', badge4)}
                                disabled={!badge4}
                            >
                                <View style={[styles.badge, { backgroundColor: badge4 ? '#E57373' : '#CCCCCC' }]}>
                                    <Ionicons name="heart" size={24} color="#FFF" />
                                </View>
                                {!badge4 && <Text style={styles.lockedText}>미획득</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* 뱃지 획득 모달 */}
                <Modal
                    visible={showBadgeModal}
                    transparent={true}
                    animationType="none"
                    onRequestClose={closeBadgeModal}
                >
                    <View style={styles.badgeModalOverlay}>
                        <Animated.View 
                            style={[
                                styles.badgeModalContent,
                                {
                                    transform: [
                                        { scale: scaleAnim },
                                        { rotate: spin }
                                    ]
                                }
                            ]}
                        >
                            <View style={[styles.badgeModalIcon, { backgroundColor: badgeInfo.color }]}>
                                <Ionicons name={badgeInfo.icon} size={60} color="#FFF" />
                            </View>
                        </Animated.View>
                        
                        <Animated.View style={[styles.badgeModalText, { opacity: scaleAnim }]}>
                            <Text style={styles.badgeModalTitle}>🎉 뱃지 획득! 🎉</Text>
                            <Text style={styles.badgeModalName}>{badgeInfo.name}</Text>
                        </Animated.View>
                    </View>
                </Modal>

                {/* 뱃지 설명 모달 */}
                <Modal
                    visible={showBadgeDescModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowBadgeDescModal(false)}
                >
                    <TouchableOpacity 
                        style={styles.badgeDescModalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowBadgeDescModal(false)}
                    >
                        <View style={styles.badgeDescModalContent}>
                            {selectedBadgeDesc && (
                                <>
                                    <View style={[styles.badgeDescIcon, { backgroundColor: selectedBadgeDesc.color }]}>
                                        <Ionicons name={selectedBadgeDesc.icon} size={50} color="#FFF" />
                                    </View>
                                    <Text style={styles.badgeDescTitle}>{selectedBadgeDesc.name}</Text>
                                    <Text style={styles.badgeDescText}>{selectedBadgeDesc.description}</Text>
                                    <TouchableOpacity 
                                        style={styles.badgeDescCloseButton}
                                        onPress={() => setShowBadgeDescModal(false)}
                                    >
                                        <Text style={styles.badgeDescCloseButtonText}>확인</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)'
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    placeholder: {
        width: 40,
        height: 40
    },
    profileIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF'
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center'
    },
    previewContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        position: 'relative'
    },
    editLabel: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        zIndex: 1
    },
    editLabelText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600'
    },
    character: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
    },
    characterImageContainer: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center'
    },
    characterPlaceholder: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    customOptions: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20
    },
    characterInfoCard: {
        backgroundColor: '#FFF9C4',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 25,
        position: 'relative'
    },
    levelBadge: {
        backgroundColor: '#FFB74D',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 10
    },
    levelBadgeText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600'
    },
    characterName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 5
    },
    levelBarContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 5
    },
    expText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500'
    },
    levelBarBackground: {
        width: '80%',
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden'
    },
    levelBarFill: {
        height: '100%',
        backgroundColor: '#FFB74D',
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15
    },
    missionList: {
        marginBottom: 25
    },
    missionItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F8F8F8',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        gap: 12
    },
    missionItemIncomplete: {
        backgroundColor: '#F5F5F5',
        opacity: 0.7
    },
    missionContent: {
        flex: 1
    },
    missionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    missionText: {
        fontSize: 15,
        color: '#000000',
        fontWeight: '500'
    },
    missionTextIncomplete: {
        color: '#000000',
        textDecorationLine: 'none'
    },
    progressBarContainer: {
        width: '100%'
    },
    progressBar: {
        height: 10,
        backgroundColor: '#E8F5E9',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#C8E6C9'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 5
    },
    progressText: {
        fontSize: 11,
        color: '#666',
        textAlign: 'right'
    },
    badgeContainer: {
        position: 'relative'
    },
    badgeGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10
    },
    badgeWrapper: {
        alignItems: 'center'
    },
    badge: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    lockedText: {
        fontSize: 10,
        color: '#999',
        marginTop: 5,
        fontWeight: '500'
    },
    closeButton: {
        position: 'absolute',
        top: -15,
        right: -15,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
    },
    badgeModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    badgeModalContent: {
        marginBottom: 30
    },
    badgeModalIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
    },
    badgeModalText: {
        alignItems: 'center'
    },
    badgeModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    badgeModalName: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3
    },
    // 뱃지 설명 모달 스타일
    badgeDescModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    badgeDescModalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
    },
    badgeDescIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4
    },
    badgeDescTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center'
    },
    badgeDescText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24
    },
    badgeDescCloseButton: {
        backgroundColor: '#71D9A1',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3
    },
    badgeDescCloseButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF'
    }
});
