import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TextInput,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TabScreenLayout from '../../components/TabScreenLayout';

export default function TrendingShoes({ navigation }) {
    const [searchText, setSearchText] = useState('');

    // 샘플 러닝화 데이터 (라우팅할떄 테스트 용으로 넣어둠! 추후 개선 예정..)
    const shoes = [
        {
            id: 1,
            name: '페가수스 플러스',
            category: '남녀공용',
            tag: '베스트셀러',
        },
        {
            id: 2,
            name: '페가수스 플러스',
            category: '남녀공용',
            tag: '베스트셀러',
        },
        {
            id: 3,
            name: '페가수스 플러스',
            category: '남녀공용',
            tag: '베스트셀러',
        },
        {
            id: 4,
            name: '페가수스 플러스',
            category: '남녀공용',
            tag: '베스트셀러',
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
                    <Text style={styles.headerTitle}>지금 뜨는 러닝화</Text>
                    <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="ellipsis-horizontal" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* 검색바 */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="검색어를 입력하세요"
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                {/* 러닝화 그리드 */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.shoesGrid}>
                        {shoes.map((shoe) => (
                            <View key={shoe.id} style={styles.shoeCard}>
                                {/* 러닝화 이미지 플레이스홀더 */}
                                <View style={styles.shoeImageContainer}>
                                    <View style={styles.shoeImagePlaceholder}>
                                        <Ionicons name="🟡" size={60} color="#E0E0E0" />
                                        <View style={styles.shoeImageOverlay}>
                                            {/* 실제로는 이미지가 들어갈 자리 */}
                                            <Text style={styles.shoeImageText}>👟</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* 러닝화 정보 */}
                                <View style={styles.shoeInfo}>
                                    <View style={styles.tagContainer}>
                                        <Text style={styles.tagBadge}>{shoe.tag}</Text>
                                    </View>
                                    <Text style={styles.shoeName}>{shoe.name}</Text>
                                    <Text style={styles.shoeCategory}>{shoe.category}</Text>
                                </View>
                            </View>
                        ))}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    shoesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    shoeCard: {
        width: '48%',
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
    shoeImageContainer: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F5F5F5',
    },
    shoeImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
    },
    shoeImageOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shoeImageText: {
        fontSize: 48,
    },
    shoeInfo: {
        padding: 12,
    },
    tagContainer: {
        marginBottom: 6,
    },
    tagBadge: {
        fontSize: 11,
        color: '#7AC943',
        fontWeight: '600',
        backgroundColor: '#E8F5E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    shoeName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    shoeCategory: {
        fontSize: 13,
        color: '#777',
    },
});