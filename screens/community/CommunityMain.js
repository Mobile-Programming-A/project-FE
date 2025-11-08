import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TabScreenLayout from '../../components/TabScreenLayout';

export default function CommunityMain({ navigation }) {
    return (
        <TabScreenLayout>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />

                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => {
                            // Tab Navigator로 이동 (메인 화면으로)
                            navigation.navigate('main');
                        }}
                    >
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>커뮤니티</Text>
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-horizontal" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* 메뉴 리스트 */}
                <View style={styles.menuContainer}>
                    {/* 지금 뜨는 러닝코스 */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('firebaseTest')}
                    >
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FFE5E5' }]}>
                                <Ionicons name="flag" size={24} color="#FF6B6B" />
                            </View>
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>지금 뜨는 러닝코스</Text>
                            <Text style={styles.menuSubtitle}>랭킹 보러가기</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#999" />
                    </TouchableOpacity>

                    {/* 러닝 코스 추천하고 */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('RunningCourseRecommend')}
                    >
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FFE7CC' }]}>
                                <Ionicons name="people" size={24} color="#FF9933" />
                            </View>
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>러닝 코스 추천하고</Text>
                            <Text style={styles.menuSubtitle}>꾸미기 아이템 받기</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#999" />
                    </TouchableOpacity>

                    {/* 지금 뜨는 러닝화 */}
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('TrendingShoes')}
                    >
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FFF4E5' }]}>
                                <Ionicons name="flame" size={24} color="#FF8C42" />
                            </View>
                        </View>
                        <View style={styles.menuTextContainer}>
                            <Text style={styles.menuTitle}>지금 뜨는 러닝화</Text>
                            <Text style={styles.menuSubtitle}>랭킹 보러가기</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#999" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </TabScreenLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D4E9D7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    moreButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    menuContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        marginRight: 16,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#7AC943',
        fontWeight: '500',
    },
});