import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { characters, getCharacterById, defaultCharacter, profileImages, getProfileImageById } from '../data/characters';
import { db } from '../services/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

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



    // 화면이 포커스될 때마다 선택된 캐릭터와 프로필 불러오기
    useFocusEffect(
        React.useCallback(() => {
            loadUserDataFromFirebase();
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
    
    return (
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
                        <View style={[styles.missionItem, !mission1 && styles.missionItemIncomplete]}>
                            <Ionicons name="fitness" size={20} color={mission1 ? "#4CAF50" : "#CCCCCC"} />
                            <Text style={[styles.missionText, !mission1 && styles.missionTextIncomplete]}>2km 달리기 완주</Text>
                            {mission1 ? (
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            ) : (
                                <Ionicons name="ellipse-outline" size={20} color="#CCCCCC" />
                            )}
                        </View>

                        <View style={[styles.missionItem, !mission2 && styles.missionItemIncomplete]}>
                            <Ionicons name="time" size={20} color={mission2 ? "#4CAF50" : "#CCCCCC"} />
                            <Text style={[styles.missionText, !mission2 && styles.missionTextIncomplete]}>10분 달리기</Text>
                            {mission2 ? (
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            ) : (
                                <Ionicons name="ellipse-outline" size={20} color="#CCCCCC" />
                            )}
                        </View>
                    </View>

                    {/* 획득한 뱃지 */}
                    <Text style={styles.sectionTitle}>획득한 뱃지</Text>
                    <View style={styles.badgeContainer}>
                        <View style={styles.badgeGrid}>
                            {/* 뱃지 1: leaf (badge_first_step) */}
                            <View style={styles.badgeWrapper}>
                                <View style={[styles.badge, { backgroundColor: badgeFirstStep ? '#FFB74D' : '#CCCCCC' }]}>
                                    <Ionicons name="leaf" size={24} color="#FFF" />
                                </View>
                                {!badgeFirstStep && <Text style={styles.lockedText}>미획득</Text>}
                            </View>

                            {/* 뱃지 2: trophy (badge_2) */}
                            <View style={styles.badgeWrapper}>
                                <View style={[styles.badge, { backgroundColor: badge2 ? '#81C784' : '#CCCCCC' }]}>
                                    <Ionicons name="trophy" size={24} color="#FFF" />
                                </View>
                                {!badge2 && <Text style={styles.lockedText}>미획득</Text>}
                            </View>

                            {/* 뱃지 3: checkmark (badge_3) */}
                            <View style={styles.badgeWrapper}>
                                <View style={[styles.badge, { backgroundColor: badge3 ? '#64B5F6' : '#CCCCCC' }]}>
                                    <Ionicons name="checkmark" size={24} color="#FFF" />
                                </View>
                                {!badge3 && <Text style={styles.lockedText}>미획득</Text>}
                            </View>

                            {/* 뱃지 4: heart (badge_4) */}
                            <View style={styles.badgeWrapper}>
                                <View style={[styles.badge, { backgroundColor: badge4 ? '#E57373' : '#CCCCCC' }]}>
                                    <Ionicons name="heart" size={24} color="#FFF" />
                                </View>
                                {!badge4 && <Text style={styles.lockedText}>미획득</Text>}
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D4E9D7'
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
        alignItems: 'center',
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
    missionText: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        fontWeight: '500'
    },
    missionTextIncomplete: {
        color: '#999',
        textDecorationLine: 'none'
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
    }
});
