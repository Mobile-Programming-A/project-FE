import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import TabScreenLayout from '../../components/TabScreenLayout';
import { Ionicons } from '@expo/vector-icons';
import CharacterCustomScreen from '../../screens/Character-custom';

export default function CharacterCustomPage() {
    return <CharacterCustomScreen />;
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
    headerRight: {
        width: 40
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
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20
    },
    levelText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500'
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