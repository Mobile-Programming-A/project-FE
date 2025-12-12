import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image, ScrollView, Alert, Animated, Easing, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { characters, getCharacterById, profileImages, getProfileImageById } from '../data/characters';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/config';

export default function CharacterEditScreen() {
    const router = useRouter();
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [selectedProfileImage, setSelectedProfileImage] = useState(null);
    const [editMode, setEditMode] = useState('character'); // 'character' or 'profile'
    const [userLevel, setUserLevel] = useState(1); // 사용자 레벨
    
    // 캐릭터 해금 모달 상태
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [unlockedCharacters, setUnlockedCharacters] = useState([]);
    const [currentUnlockIndex, setCurrentUnlockIndex] = useState(0);
    
    // 애니메이션 refs
    const jumpAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const unlockScaleAnim = useRef(new Animated.Value(0)).current;
    const unlockRotateAnim = useRef(new Animated.Value(0)).current;

    // 컴포넌트 마운트 시 저장된 캐릭터 불러오기
    useEffect(() => {
        loadSelectedCharacter();
        loadSelectedProfileImage();
    }, []);

    // 화면에 포커스될 때마다 레벨 체크 (화면 진입 시마다)
    useFocusEffect(
        React.useCallback(() => {
            checkUnlockedCharacters();
        }, [])
    );

    // 해금된 캐릭터 확인 및 모달 표시
    const checkUnlockedCharacters = async () => {
        try {
            const userEmail = await AsyncStorage.getItem('userEmail') || 'hong@example.com';
            console.log('로그인 이메일:', userEmail);
            
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                const level = userData.level || 1;
                console.log('사용자 레벨 불러오기 성공:', level);
                setUserLevel(level);

                // 이전에 확인한 레벨 가져오기
                const lastCheckedLevelStr = await AsyncStorage.getItem('lastCheckedLevel');
                const previousLevel = lastCheckedLevelStr ? parseInt(lastCheckedLevelStr) : 0;

                // 레벨이 올라간 경우에만 새로 해금된 캐릭터 표시
                if (level > previousLevel) {
                    // 새로 해금된 캐릭터 찾기
                    const newlyUnlocked = characters.filter(char => 
                        char.level > previousLevel && char.level <= level
                    );

                    if (newlyUnlocked.length > 0) {
                        console.log('새로 해금된 캐릭터:', newlyUnlocked.map(c => `${c.name} (Lv.${c.level})`));
                        console.log('총 해금 캐릭터 수:', newlyUnlocked.length);
                        setUnlockedCharacters(newlyUnlocked);
                        setCurrentUnlockIndex(0);
                        setTimeout(() => {
                            showUnlockAnimation();
                        }, 100);
                    }

                    // 현재 레벨 저장
                    await AsyncStorage.setItem('lastCheckedLevel', level.toString());
                } else if (level < previousLevel) {
                    // 레벨이 내려간 경우 현재 레벨로 업데이트 (해금 표시 안함)
                    console.log('레벨이 내려갔습니다:', previousLevel, '→', level);
                    await AsyncStorage.setItem('lastCheckedLevel', level.toString());
                } else {
                    console.log('ℹ레벨 변화 없음:', level);
                }
            } else {
                console.log('사용자를 찾을 수 없습니다. 기본 레벨 1로 설정');
                setUserLevel(1);
            }
        } catch (error) {
            console.error('레벨 불러오기 실패:', error);
            setUserLevel(1);
        }
    };

    // 저장된 캐릭터 불러오기
    const loadSelectedCharacter = async () => {
        try {
            const savedCharacterId = await AsyncStorage.getItem('selectedCharacterId');
            if (savedCharacterId) {
                const character = getCharacterById(savedCharacterId);
                if (character) {
                    setSelectedCharacter(character);
                }
            } else {
                // 기본값으로 첫 번째 캐릭터 설정
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
            const savedProfileImageId = await AsyncStorage.getItem('selectedProfileImageId');
            if (savedProfileImageId) {
                const profileImage = getProfileImageById(savedProfileImageId);
                if (profileImage) {
                    setSelectedProfileImage(profileImage);
                }
            } else {
                // 기본값으로 첫 번째 프로필 사진 설정
                setSelectedProfileImage(profileImages[0]);
            }
        } catch (error) {
            console.error('프로필 사진 불러오기 실패:', error);
            setSelectedProfileImage(profileImages[0]);
        }
    };

    // 해금 애니메이션 표시
    const showUnlockAnimation = () => {
        setShowUnlockModal(true);
        startUnlockAnimation();
    };

    const startUnlockAnimation = () => {
        // 애니메이션 시작
        unlockScaleAnim.setValue(0);
        unlockRotateAnim.setValue(0);

        Animated.parallel([
            Animated.spring(unlockScaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(unlockRotateAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    };

    // 다음 캐릭터로 이동
    const showNextUnlock = () => {
        if (currentUnlockIndex < unlockedCharacters.length - 1) {
            setCurrentUnlockIndex(prev => prev + 1);
        } else {
            closeUnlockModal();
        }
    };

    // 해금 모달 닫기
    const closeUnlockModal = () => {
        Animated.timing(unlockScaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowUnlockModal(false);
            setUnlockedCharacters([]);
            setCurrentUnlockIndex(0);
        });
    };

    const unlockSpin = unlockRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    // currentUnlockIndex 변경 시 애니메이션 재시작
    useEffect(() => {
        if (showUnlockModal && unlockedCharacters.length > 0) {
            console.log(`애니메이션 시작: ${currentUnlockIndex + 1} / ${unlockedCharacters.length} - ${unlockedCharacters[currentUnlockIndex]?.name}`);
            startUnlockAnimation();
            
            // 3초 후 다음 캐릭터
            const timer = setTimeout(() => {
                console.log(`타이머 실행: 현재 ${currentUnlockIndex}, 전체 ${unlockedCharacters.length}`);
                if (currentUnlockIndex < unlockedCharacters.length - 1) {
                    console.log('다음 캐릭터로 이동');
                    setCurrentUnlockIndex(prev => {
                        console.log(`인덱스 변경: ${prev} → ${prev + 1}`);
                        return prev + 1;
                    });
                } else {
                    console.log('마지막 캐릭터, 모달 닫기');
                    closeUnlockModal();
                }
            }, 3000);

            return () => {
                console.log('타이머 정리');
                clearTimeout(timer);
            };
        }
    }, [currentUnlockIndex, showUnlockModal, unlockedCharacters]);

    // 캐릭터 잠금 여부 확인
    const isCharacterLocked = (character) => {
        const locked = userLevel < character.level;
        console.log(`캐릭터 잠금 체크: ${character.name} (필요: Lv.${character.level}, 현재: Lv.${userLevel}) => ${locked ? '🔒 잠김' : '✅ 해제'}`);
        return locked;
    };

    // 캐릭터 선택 시 애니메이션 실행
    const handleCharacterSelect = (character) => {
        // 잠긴 캐릭터는 선택 불가
        if (isCharacterLocked(character)) {
            Alert.alert(
                '잠긴 캐릭터',
                `${character.name}는 레벨 ${character.level}부터 사용할 수 있습니다.\n(현재 레벨: ${userLevel})`,
                [{ text: '확인' }]
            );
            return;
        }

        setSelectedCharacter(character);
        
        // 점프 애니메이션
        Animated.sequence([
            Animated.parallel([
                Animated.timing(jumpAnim, {
                    toValue: -30,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(jumpAnim, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.bounce,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    };

    // 프로필 이미지 선택 시 애니메이션 실행
    const handleProfileSelect = (profile) => {
        setSelectedProfileImage(profile);
        
        // 점프 애니메이션
        Animated.sequence([
            Animated.parallel([
                Animated.timing(jumpAnim, {
                    toValue: -30,
                    duration: 200,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(jumpAnim, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.bounce,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    };

    // 저장 함수
    const saveSelectedCharacter = async () => {
        if (!selectedCharacter || !selectedProfileImage) {
            Alert.alert('알림', '캐릭터와 프로필 사진을 선택해주세요.');
            return;
        }

        try {
            // AsyncStorage에 저장
            await AsyncStorage.setItem('selectedCharacterId', selectedCharacter.id.toString());
            await AsyncStorage.setItem('selectedProfileImageId', selectedProfileImage.id.toString());
            
            // Firebase에 프로필 정보 저장
            // 이메일 정보 가져오기 (로그인 정보에서)
            const userEmail = await AsyncStorage.getItem('userEmail') || 'hong@example.com';
            
            // users 컬렉션에서 이메일로 사용자 찾기
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // 사용자 문서 찾음
                const userDoc = querySnapshot.docs[0];
                const userRef = doc(db, 'users', userDoc.id);
                
                // 프로필 정보 업데이트
                await setDoc(userRef, {
                    avatar: `avatar${selectedProfileImage.id}`,
                    characterId: selectedCharacter.id,
                    characterName: selectedCharacter.name
                }, { merge: true });
            } else {
                console.error('사용자를 찾을 수 없습니다.');
                Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
                return;
            }
            
            Alert.alert('성공', '캐릭터와 프로필이 저장되었습니다!', [
                {
                    text: '확인',
                    onPress: () => router.push('/(tabs)/Character-custom')
                }
            ]);
        } catch (error) {
            console.error('저장 실패:', error);
            Alert.alert('오류', '저장에 실패했습니다.');
        }
    };



    return (
        <SafeAreaView style={styles.container}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.push('/(tabs)/Character-custom')}
                    >
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>캐릭터 편집</Text>
                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={saveSelectedCharacter}
                    >
                        <Text style={styles.saveText}>저장</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {/* 캐릭터 프리뷰 */}
                    <View style={styles.previewContainer}>
                        <View style={styles.previewCircle}>
                            <Animated.View
                                style={{
                                    transform: [
                                        { translateY: jumpAnim },
                                        { scale: scaleAnim },
                                        { rotate: rotateAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '5deg']
                                        })}
                                    ],
                                }}
                            >
                                <Image
                                    source={editMode === 'character' 
                                        ? (selectedCharacter ? selectedCharacter.image : characters[0].image)
                                        : (selectedProfileImage ? selectedProfileImage.image : profileImages[0].image)
                                    }
                                    style={styles.characterImage}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    {/* 탭 전환 버튼 */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity 
                            style={[styles.tabButton, editMode === 'character' && styles.activeTab]}
                            onPress={() => setEditMode('character')}
                        >
                            <Text style={[styles.tabText, editMode === 'character' && styles.activeTabText]}>
                                캐릭터
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tabButton, editMode === 'profile' && styles.activeTab]}
                            onPress={() => setEditMode('profile')}
                        >
                            <Text style={[styles.tabText, editMode === 'profile' && styles.activeTabText]}>
                                프로필 사진
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* 선택 그리드 */}
                    <View style={styles.characterGridContainer}>
                        <ScrollView 
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                        >
                            {editMode === 'character' ? (
                                <View style={styles.characterGrid}>
                                    {characters.map((character) => {
                                        const isLocked = isCharacterLocked(character);
                                        return (
                                            <TouchableOpacity 
                                                key={character.id}
                                                style={[
                                                    styles.characterCard,
                                                    selectedCharacter?.id === character.id && styles.selectedCard,
                                                    isLocked && styles.lockedCard
                                                ]}
                                                onPress={() => handleCharacterSelect(character)}
                                                activeOpacity={isLocked ? 1 : 0.7}
                                            >
                                                <Image
                                                    source={character.image}
                                                    style={[
                                                        styles.gridCharacterImage,
                                                        isLocked && styles.lockedImage
                                                    ]}
                                                />
                                                {isLocked && (
                                                    <View style={styles.lockOverlay}>
                                                        <Ionicons name="lock-closed" size={40} color="#FFF" />
                                                        <Text style={styles.lockText}>Lv.{character.level}</Text>
                                                    </View>
                                                )}
                                                <View style={styles.cardOverlay}>
                                                    <Text style={[
                                                        styles.cardTitle,
                                                        isLocked && styles.lockedText
                                                    ]}>
                                                        {character.name}
                                                    </Text>
                                                    <View style={[
                                                        styles.levelBadge,
                                                        isLocked && styles.lockedBadge
                                                    ]}>
                                                        <Text style={styles.levelText}>Lv.{character.level}</Text>
                                                    </View>
                                                </View>
                                                {selectedCharacter?.id === character.id && !isLocked && (
                                                    <View style={styles.checkMark}>
                                                        <Ionicons name="checkmark-circle" size={30} color="#71D9A1" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={styles.profileGrid}>
                                    {profileImages.map((profile) => (
                                        <TouchableOpacity 
                                            key={profile.id}
                                            style={[
                                                styles.profileCard,
                                                selectedProfileImage?.id === profile.id && styles.selectedCard
                                            ]}
                                            onPress={() => handleProfileSelect(profile)}
                                        >
                                            <Image
                                                source={profile.image}
                                                style={styles.profileImage}
                                            />
                                            <Text style={styles.profileName}>{profile.name}</Text>
                                            {selectedProfileImage?.id === profile.id && (
                                                <View style={styles.checkMark}>
                                                    <Ionicons name="checkmark-circle" size={30} color="#71D9A1" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        {/* 닫기 버튼 */}
                        <TouchableOpacity 
                            style={styles.closeButton}
                            onPress={() => router.push('/(tabs)/Character-custom')}
                        >
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 캐릭터 해금 모달 */}
                {unlockedCharacters.length > 0 && (
                    <Modal
                        visible={showUnlockModal}
                        transparent={true}
                        animationType="none"
                        onRequestClose={closeUnlockModal}
                    >
                        <View style={styles.unlockModalOverlay}>
                            <Animated.View 
                                style={[
                                    styles.unlockModalContent,
                                    {
                                        transform: [
                                            { scale: unlockScaleAnim },
                                            { rotate: unlockSpin }
                                        ]
                                    }
                                ]}
                            >
                                <View style={styles.unlockCharacterCircle}>
                                    <Image
                                        source={unlockedCharacters[currentUnlockIndex]?.image}
                                        style={styles.unlockCharacterImage}
                                    />
                                </View>
                            </Animated.View>
                            
                            <Animated.View style={[styles.unlockModalText, { opacity: unlockScaleAnim }]}>
                                <Text style={styles.unlockModalTitle}>🎉 캐릭터 해금! 🎉</Text>
                                <Text style={styles.unlockCharacterName}>
                                    {unlockedCharacters[currentUnlockIndex]?.name}
                                </Text>
                                <Text style={styles.unlockDescription}>
                                    레벨 {unlockedCharacters[currentUnlockIndex]?.level} 달성으로 해금되었습니다!
                                </Text>
                                {unlockedCharacters.length > 1 && (
                                    <Text style={styles.unlockProgress}>
                                        {currentUnlockIndex + 1} / {unlockedCharacters.length}
                                    </Text>
                                )}
                            </Animated.View>

                            <View style={styles.unlockButtons}>
                                {currentUnlockIndex < unlockedCharacters.length - 1 ? (
                                    <TouchableOpacity 
                                        style={styles.nextButton}
                                        onPress={showNextUnlock}
                                    >
                                        <Text style={styles.nextButtonText}>다음</Text>
                                    </TouchableOpacity>
                                ) : null}
                                
                                <TouchableOpacity 
                                    style={styles.skipButton}
                                    onPress={closeUnlockModal}
                                >
                                    <Text style={styles.skipButtonText}>
                                        {currentUnlockIndex < unlockedCharacters.length - 1 ? '건너뛰기' : '닫기'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )}
            </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E8F5E9'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'transparent'
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center'
    },
    saveButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#FFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    saveText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '600'
    },
    content: {
        flex: 1
    },
    previewContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingTop: 10
    },
    previewCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5
    },
    characterImage: {
        width: 180,
        height: 180,
        resizeMode: 'contain'
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 25,
        padding: 4,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 22,
        alignItems: 'center'
    },
    activeTab: {
        backgroundColor: '#71D9A1'
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999'
    },
    activeTabText: {
        color: '#FFF'
    },
    characterGridContainer: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        paddingTop: 30,
        position: 'relative'
    },
    scrollView: {
        flex: 1
    },
    characterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 100
    },
    characterCard: {
        width: '47%',
        aspectRatio: 0.9,
        backgroundColor: '#B8E6D5',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 3,
        borderColor: 'transparent',
        marginBottom: 15
    },
    selectedCard: {
        borderColor: '#71D9A1',
        transform: [{ scale: 0.98 }]
    },
    gridCharacterImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingVertical: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#333',
        flex: 1
    },
    levelBadge: {
        backgroundColor: '#71D9A1',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10
    },
    levelText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFF'
    },
    checkMark: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#FFF',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3
    },
    lockedCard: {
        opacity: 0.6
    },
    lockedImage: {
        opacity: 0.3
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    lockText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8
    },
    lockedText: {
        color: '#999'
    },
    lockedBadge: {
        backgroundColor: '#999'
    },
    closeButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5
    },
    profileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 100
    },
    profileCard: {
        width: '47%',
        aspectRatio: 1,
        backgroundColor: 'transparent',
        borderRadius: 20,
        overflow: 'visible',
        position: 'relative',
        borderWidth: 3,
        borderColor: 'transparent',
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
    },
    profileImage: {
        width: '85%',
        height: '85%',
        resizeMode: 'cover',
        borderRadius: 1000
    },
    profileName: {
        position: 'absolute',
        bottom: 10,
        fontSize: 12,
        fontWeight: '600',
        color: '#333'
    },
    unlockModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    unlockModalContent: {
        marginBottom: 30
    },
    unlockCharacterCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#71D9A1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 5,
        borderColor: '#71D9A1'
    },
    unlockCharacterImage: {
        width: 150,
        height: 150,
        resizeMode: 'contain'
    },
    unlockModalText: {
        alignItems: 'center',
        paddingHorizontal: 40
    },
    unlockModalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    unlockCharacterName: {
        fontSize: 24,
        color: '#71D9A1',
        fontWeight: 'bold',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3
    },
    unlockDescription: {
        fontSize: 16,
        color: '#FFF',
        textAlign: 'center',
        opacity: 0.9,
        marginBottom: 8
    },
    unlockProgress: {
        fontSize: 14,
        color: '#71D9A1',
        fontWeight: 'bold',
        marginTop: 8
    },
    unlockButtons: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        gap: 12
    },
    nextButton: {
        backgroundColor: '#71D9A1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#71D9A1'
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600'
    },
    skipButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)'
    },
    skipButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600'
    }
});