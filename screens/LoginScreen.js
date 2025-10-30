import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();

    const handleStartPress = () => {
        console.log('시작하기 버튼 클릭! 메인 화면으로 이동합니다.');
        router.replace('/(tabs)/main');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#D4F7C5', '#F0FDEF']}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.ellipseBackground} />

            <View style={styles.topContainer}>
                <Image
                    source={require('../assets/mangkee_character.png')}
                    style={styles.character}
                />
                <Text style={styles.subtitle}>망키와 함께 달려보세요!</Text>
            </View>

            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.kakaoButton}
                    onPress={handleStartPress}
                >
                    <Text style={styles.kakaoButtonText}>시작하기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ... (styles는 동일) ...
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    ellipseBackground: {
        position: 'absolute',
        bottom: -height * 0.1,
        left: -width * 0.3,
        right: -width * 0.3,
        height: height * 0.7,
        backgroundColor: '#C2D88B',
        borderRadius: width * 1.5,
    },
    topContainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        zIndex: 1,
    },
    character: {
        width: width * 0.6,
        height: width * 0.6,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
    },
    bottomContainer: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 40,
        alignItems: 'center',
        zIndex: 2,
    },
    kakaoButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        width: '100%',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    kakaoButtonText: {
        color: '#3C1E1E',
        fontSize: 16,
        fontWeight: '600',
    },
});