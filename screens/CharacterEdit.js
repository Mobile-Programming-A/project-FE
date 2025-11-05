import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import TabScreenLayout from '../components/TabScreenLayout';
import { Ionicons } from '@expo/vector-icons';

export default function CharacterEditScreen() {
    const router = useRouter();
    const [selectedCharacter, setSelectedCharacter] = useState(null);

    const characters = [
        {
            id: 1,
            name: 'Budding Runner',
            image: require('../assets/hairband_manki.png'),
            level: 1,
            description: '초보 러너'
        },
        {
            id: 2,
            name: 'Experined Runner',
            image: require('../assets/medal_manki.png'),
            level: 10,
            description: '숙련된 러너'
        },
        {
            id: 3,
            name: 'Finisher Master',
            image: require('../assets/cap_manki.png'),
            level: 20,
            description: '완주 마스터'
        },
        {
            id: 4,
            name: 'Master Runner',
            image: require('../assets/sunglass_manki.png'),
            level: 30,
            description: '마스터 러너'
        }
    ];

    return (
        <TabScreenLayout>
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
                        onPress={() => router.push('/(tabs)/Character-custom')}
                    >
                        <Text style={styles.saveText}>저장</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {/* 캐릭터 프리뷰 */}
                    <View style={styles.previewContainer}>
                        <Image
                            source={selectedCharacter ? selectedCharacter.image : characters[0].image}
                            style={styles.characterImage}
                        />
                    </View>

                    {/* 캐릭터 선택 그리드 */}
                    <View style={styles.characterGridContainer}>
                        <ScrollView 
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                        >
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
                                                <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
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
        </TabScreenLayout>
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
        paddingVertical: 40,
        paddingTop: 20
    },
    characterImage: {
        width: 200,
        height: 200,
        resizeMode: 'contain'
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
        borderColor: '#4CAF50',
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
        backgroundColor: '#4CAF50',
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
    }
});