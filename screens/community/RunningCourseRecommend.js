import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TabScreenLayout from '../../components/TabScreenLayout';

export default function RunningCourseRecommend({ navigation }) {
    // 샘플 프로필 이미지 (나중에 가능하다면 유저들로 대체 예정))
    const profiles = [
        { id: 1, emoji: '😊' },
        { id: 2, emoji: '🦁' },
        { id: 3, emoji: '🐶' },
        { id: 4, emoji: '🐱' },
    ];

    // 샘플 러닝 코스 데이터
    const courses = [
        {
            id: 1,
            name: '다산로 36길',
            date: '10/09 화',
            time: '6:32 ~ 8:10',
            calories: '328kcal',
            distance: '8.41km',
            steps: '30,270',
        },
        {
            id: 2,
            name: '퇴계로 2길 84',
            date: '10/09 화',
            time: '6:32 ~ 8:10',
            calories: '328kcal',
            distance: '8.41km',
            steps: '30,270',
        },
    ];

    return (
        <TabScreenLayout>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />

                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>러닝 코스 추천</Text>
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-horizontal" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 방금 추가된 러닝코스 섹션 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>방금 추가된 러닝코스</Text>

                        {/* 프로필 아이콘들 */}
                        <View style={styles.profileContainer}>
                            {profiles.map((profile) => (
                                <View key={profile.id} style={styles.profileItem}>
                                    <View style={styles.profileCircle}>
                                        <Text style={styles.profileEmoji}>{profile.emoji}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 러닝 코스 등록 섹션 */}
                    <TouchableOpacity style={styles.registerCard}>
                        <View style={styles.registerContent}>
                            <Text style={styles.registerTitle}>러닝 코스 등록 {'>'}</Text>
                            <Text style={styles.registerSubtitle}>
                                ㅇㅇ님만의 러닝 코스가 있다면 알려주세요
                            </Text>
                        </View>
                        <View style={styles.registerIconContainer}>
                            <View style={styles.registerIconCircle}>
                                <Ionicons name="add" size={28} color="#7AC943" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* 러닝 코스 등록 내역 섹션 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>러닝 코스 등록 내역 {'>'}</Text>
                        <Text style={styles.sectionSubtitle}>
                            지금까지 등록했던 러닝 코스들이에요
                        </Text>

                        {/* 코스 리스트 */}
                        <View style={styles.courseList}>
                            {courses.map((course) => (
                                <TouchableOpacity key={course.id} style={styles.courseCard}>
                                    {/* 지도 영역 */}
                                    <View style={styles.mapContainer}>
                                        <View style={styles.mapPlaceholder}>
                                            <Ionicons name="location" size={40} color="#7AC943" />
                                        </View>
                                    </View>

                                    {/* 코스 정보 */}
                                    <View style={styles.courseInfo}>
                                        <Text style={styles.courseName}>{course.name}</Text>
                                        <Text style={styles.courseDate}>
                                            {course.date} | {course.time}
                                        </Text>
                                        <View style={styles.courseStats}>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statValue}>
                                                    {course.calories}
                                                </Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statValue}>
                                                    {course.distance}
                                                </Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statValue}>
                                                    {course.steps}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 6,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#999',
        marginBottom: 16,
    },
    profileContainer: {
        flexDirection: 'row',
        marginTop: 12,
    },
    profileItem: {
        marginRight: 12,
    },
    profileCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#E8F5E0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profileEmoji: {
        fontSize: 28,
    },
    registerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    registerContent: {
        flex: 1,
    },
    registerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    registerSubtitle: {
        fontSize: 13,
        color: '#999',
    },
    registerIconContainer: {
        marginLeft: 12,
    },
    registerIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E8F5E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    courseList: {
        marginTop: 8,
    },
    courseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    mapContainer: {
        width: '100%',
        height: 140,
        backgroundColor: '#F5F5F5',
    },
    mapPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E8F5E0',
    },
    courseInfo: {
        padding: 16,
    },
    courseName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    courseDate: {
        fontSize: 13,
        color: '#777',
        marginBottom: 12,
    },
    courseStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7AC943',
    },
});