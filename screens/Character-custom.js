import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import TabScreenLayout from '../components/TabScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { characters, getCharacterById, defaultCharacter } from '../data/characters';

export default function CharacterCustomScreen() {
    const router = useRouter();
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    
    // 경험치 데이터
    const currentExp = 195;
    const maxExp = 300;
    const expPercentage = Math.round((currentExp / maxExp) * 100);



    // 화면이 포커스될 때마다 선택된 캐릭터 불러오기
    useFocusEffect(
        React.useCallback(() => {
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
    
    return (
        <TabScreenLayout>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.push('/(tabs)/main')}
                    >
                        <Ionicons name="chevron-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{selectedCharacter ? selectedCharacter.name : defaultCharacter.name}</Text>
                    <View style={styles.placeholder} />
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
                            <Text style={styles.levelBadgeText}>LV.5</Text>
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
                        <View style={styles.missionItem}>
                            <Ionicons name="fitness" size={20} color="#4CAF50" />
                            <Text style={styles.missionText}>2km 달리기 완주</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        </View>

                        <View style={styles.missionItem}>
                            <Ionicons name="time" size={20} color="#4CAF50" />
                            <Text style={styles.missionText}>10분 달리기</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        </View>
                    </View>

                    {/* 획득한 뱃지 */}
                    <Text style={styles.sectionTitle}>획득한 뱃지</Text>
                    <View style={styles.badgeContainer}>
                        <View style={styles.badgeGrid}>
                            <View style={[styles.badge, { backgroundColor: '#FFB74D' }]}>
                                <Ionicons name="leaf" size={24} color="#FFF" />
                            </View>
                            <View style={[styles.badge, { backgroundColor: '#81C784' }]}>
                                <Ionicons name="trophy" size={24} color="#FFF" />
                            </View>
                            <View style={[styles.badge, { backgroundColor: '#64B5F6' }]}>
                                <Ionicons name="checkmark" size={24} color="#FFF" />
                            </View>
                            <View style={[styles.badge, { backgroundColor: '#E57373' }]}>
                                <Ionicons name="heart" size={24} color="#FFF" />
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeButton}>
                            <Ionicons name="close" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </TabScreenLayout>
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
    missionText: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        fontWeight: '500'
    },
    badgeContainer: {
        position: 'relative'
    },
    badgeGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10
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
