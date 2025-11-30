import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { characters, getCharacterById, profileImages, getProfileImageById } from '../data/characters';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/config';

export default function CharacterEditScreen() {
    const router = useRouter();
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [selectedProfileImage, setSelectedProfileImage] = useState(null);
    const [editMode, setEditMode] = useState('character'); // 'character' or 'profile'

    // 컴포넌트 마운트 시 저장된 캐릭터 불러오기
    useEffect(() => {
        loadSelectedCharacter();
        loadSelectedProfileImage();
    }, []);

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
                        <Image
                            source={editMode === 'character' 
                                ? (selectedCharacter ? selectedCharacter.image : characters[0].image)
                                : (selectedProfileImage ? selectedProfileImage.image : profileImages[0].image)
                            }
                            style={styles.characterImage}
                        />
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
                                    {characters.map((character) => (
                                        <TouchableOpacity 
                                            key={character.id}
                                            style={[
                                                styles.characterCard,
                                                selectedCharacter?.id === character.id && styles.selectedCard
                                            ]}
                                            onPress={() => setSelectedCharacter(character)}
                                        >
                                            <Image
                                                source={character.image}
                                                style={styles.gridCharacterImage}
                                            />
                                            <View style={styles.cardOverlay}>
                                                <Text style={styles.cardTitle}>{character.name}</Text>
                                                <View style={styles.levelBadge}>
                                                    <Text style={styles.levelText}>Lv.{character.level}</Text>
                                                </View>
                                            </View>
                                            {selectedCharacter?.id === character.id && (
                                                <View style={styles.checkMark}>
                                                    <Ionicons name="checkmark-circle" size={30} color="#71D9A1" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
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
                                            onPress={() => setSelectedProfileImage(profile)}
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
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        overflow: 'hidden',
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
        resizeMode: 'contain',
        borderRadius: 100
    },
    profileName: {
        position: 'absolute',
        bottom: 10,
        fontSize: 12,
        fontWeight: '600',
        color: '#333'
    }
});