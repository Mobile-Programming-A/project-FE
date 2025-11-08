import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import TabScreenLayout from '../components/TabScreenLayout';
import { Ionicons } from '@expo/vector-icons';

export default function CharacterCustomScreen() {
    const router = useRouter();
    
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
                    <Text style={styles.title}>망키</Text>
                    <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => router.push('/(tabs)/CharacterEdit')}
                    >
                        <Text style={styles.editButtonText}>편집</Text>
                    </TouchableOpacity>
                </View>

                {/* 캐릭터 프리뷰 */}
                <View style={styles.previewContainer}>
                    <Image
                        source={require('../assets/mangkee_character.png')}
                        style={styles.characterImage}
                    />
                    <View style={styles.levelInfo}>
                        <Text style={styles.levelText}>레벨 14</Text>
                        <Text style={styles.expText}>650 / 1000 EXP</Text>
                        <View style={styles.expBarContainer}>
                            <View style={styles.expBarBackground}>
                                <View style={[styles.expBarFill, { width: '65%' }]} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* 커스터마이징 옵션 */}
                <View style={styles.customOptions}>
                    <Text style={styles.sectionTitle}>다음 캐릭터까지의 미션</Text>
                    <View style={styles.missionList}>
                        {/* 미션 아이템들 */}
                        <View style={styles.missionItem}>
                            <View style={styles.missionIcon}>
                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.missionInfo}>
                                <Text style={styles.missionTitle}>2km 달리기 완주</Text>
                                <View style={[styles.progressBar, { width: '100%' }]} />
                            </View>
                        </View>

                        <View style={styles.missionItem}>
                            <View style={styles.missionIcon}>
                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                            </View>
                            <View style={styles.missionInfo}>
                                <Text style={styles.missionTitle}>친구 3명과 함께 달리기</Text>
                                <View style={[styles.progressBar, { width: '100%' }]} />
                            </View>
                        </View>

                        <View style={styles.missionItem}>
                            <View style={styles.missionIcon}>
                                <Ionicons name="checkmark-circle-outline" size={24} color="#999" />
                            </View>
                            <View style={styles.missionInfo}>
                                <Text style={styles.missionTitle}>특정한 젤리</Text>
                                <View style={[styles.progressBar, { width: '30%' }]} />
                            </View>
                        </View>
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
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#4CAF50',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    editButtonText: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600'
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
        paddingVertical: 30
    },
    characterImage: {
        width: 200,
        height: 200,
        resizeMode: 'contain'
    },
    levelInfo: {
        marginTop: 15,
        padding: 15,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 20,
        minWidth: 200,
        alignItems: 'center'
    },
    levelText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '700',
        marginBottom: 5
    },
    expText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        marginBottom: 8
    },
    expBarContainer: {
        width: '100%',
        alignItems: 'center'
    },
    expBarBackground: {
        width: '100%',
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden'
    },
    expBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4
    },
    customOptions: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20
    },
    missionList: {
        gap: 15
    },
    missionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 12,
        gap: 15
    },
    missionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    missionInfo: {
        flex: 1
    },
    missionTitle: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8
    },
    progressBar: {
        height: 4,
        backgroundColor: '#4CAF50',
        borderRadius: 2
    }
});
