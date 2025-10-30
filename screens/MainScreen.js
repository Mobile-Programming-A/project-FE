// screens/MainScreen.js
import React from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TabScreenLayout from '../components/TabScreenLayout';

const { width } = Dimensions.get('window');

export default function ExerciseScreen() {
    return (
        <TabScreenLayout>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header with Profile */}
                    <View style={styles.header}>
                        <View style={styles.profileContainer}>
                            <Image
                                source={{ uri: 'https://via.placeholder.com/40' }}
                                style={styles.profileImage}
                            />
                            <Text style={styles.profileName}>망키</Text>
                        </View>
                        <View style={styles.chatBubble} />
                    </View>

                    {/* 3D Character Area */}
                    <View style={styles.characterContainer}>
                        <Image
                            source={require('../assets/mangkee_character.png')}
                            style={styles.character}
                        />
                    </View>

                    {/* Map Section */}
                    <View style={styles.mapContainer}>
                        <View style={styles.mapPlaceholder}>
                            {/* 정적 지도 이미지 */}
                            <Image
                                source={{
                                    uri: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/126.9780,37.5665,12,0/400x200?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
                                }}
                                style={styles.mapImage}
                                resizeMode="cover"
                                defaultSource={require('../assets/mangkee_character.png')}
                            />
                            <View style={styles.mapOverlay} />
                            <View style={styles.mapMarker}>
                                <Text style={styles.markerEmoji}>👤</Text>
                            </View>
                            <View style={[styles.mapMarker, { top: 80, left: 100 }]}>
                                <Text style={styles.markerEmoji}>👤</Text>
                            </View>
                        </View>

                        {/* Map Date Label */}
                        <Text style={styles.mapDate}>10 월 3일 금요일</Text>

                        {/* Avatar List on Side */}
                        <View style={styles.avatarList}>
                            <View style={styles.avatarBadge}>
                                <Text style={styles.badgeText}>∞3구+</Text>
                            </View>
                            <View style={styles.avatarItem}>
                                <Text style={styles.avatarEmoji}>👤</Text>
                            </View>
                            <View style={styles.avatarItem}>
                                <Text style={styles.avatarEmoji}>🥭</Text>
                            </View>
                            <TouchableOpacity style={styles.moreButton}>
                                <Text style={styles.moreText}>•••</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Card */}
                    <View style={styles.statsCard}>
                        <View style={styles.statsHeader}>
                            <Text style={styles.statsTitle}>나의 기록</Text>
                            <TouchableOpacity>
                                <Text style={styles.detailButton}>최근 달력기</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.statsValue}>5.2km | 30분 12초</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </TabScreenLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D4E9D7',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120, // 하단 여백 (네비게이션 바 고려)
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 5,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        marginRight: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    chatBubble: {
        width: 60,
        height: 35,
        backgroundColor: '#FFF',
        borderRadius: 18,
    },
    characterContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    characterPlaceholder: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    characterEmoji: {
        fontSize: 100,
    },
    mapContainer: {
        marginHorizontal: 20,
        marginTop: 10,
        position: 'relative',
    },
    mapPlaceholder: {
        height: 200,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    mapImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    mapOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    mapText: {
        fontSize: 16,
        color: '#999',
    },
    mapMarker: {
        position: 'absolute',
        width: 40,
        height: 40,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4A90E2',
        top: 60,
        left: 50,
    },
    markerEmoji: {
        fontSize: 24,
    },
    mapDate: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginTop: 8,
    },
    avatarList: {
        position: 'absolute',
        right: 10,
        top: 10,
        backgroundColor: '#666',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    avatarBadge: {
        backgroundColor: '#8B4789',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    avatarItem: {
        width: 40,
        height: 40,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarEmoji: {
        fontSize: 24,
    },
    moreButton: {
        width: 40,
        height: 40,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreText: {
        fontSize: 18,
        color: '#666',
    },
    statsCard: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    detailButton: {
        fontSize: 14,
        color: '#999',
    },
    statsValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    character: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
});