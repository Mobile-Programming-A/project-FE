import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    
    // Google 인증 요청 - iOS와 웹 클라이언트 ID 설정

    const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: "656771928173-okuhoa8ugjk5h1hc9ln2hoig94j0.apps.googleusercontent.com",
  iosClientId: "656771928173-okuhoa8ugjk5h1hc9ln2hoig94j0.apps.googleusercontent.com",
  webClientId: "656771928173-3tdf4229ete02t5rkvvt7gmubcoh8e2.apps.googleusercontent.com",
  redirectUri: "https://auth.expo.io/@seojung024/RunningApp",
  scopes: ["profile", "email"],
});


    // 인증 응답 처리
    useEffect(() => {
        console.log('🔍 OAuth Response:', JSON.stringify(response, null, 2));

        if (response?.type === 'success') {
            console.log('✅ 로그인 성공!');
            const { authentication } = response;
            handleGoogleLoginSuccess(authentication);
        } else if (response?.type === 'error') {
            console.error('❌ 로그인 오류:', response.error);
            Alert.alert('로그인 실패', `구글 로그인 중 오류가 발생했습니다.\n${response.error?.message || ''}`);
            setIsLoading(false);
        } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
            console.log('⚠️ 로그인 취소됨');
            setIsLoading(false);
        }
    }, [response]);

    // 구글 로그인 성공 처리
    const handleGoogleLoginSuccess = async (authentication) => {
        try {
            // 사용자 정보 가져오기
            const userInfoResponse = await fetch(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                {
                    headers: { Authorization: `Bearer ${authentication.accessToken}` },
                }
            );

            const userInfo = await userInfoResponse.json();
            console.log('사용자 정보:', userInfo);

            // 로그인 성공 - 메인 화면으로 이동
            Alert.alert(
                '로그인 성공',
                `환영합니다, ${userInfo.name}님!`,
                [
                    {
                        text: '확인',
                        onPress: () => router.replace('/(tabs)/main')
                    }
                ]
            );
        } catch (error) {
            console.error('사용자 정보 가져오기 실패:', error);
            Alert.alert('오류', '사용자 정보를 가져오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 구글 로그인 버튼 클릭
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await promptAsync();
        } catch (error) {
            console.error('구글 로그인 오류:', error);
            Alert.alert('오류', '구글 로그인을 시작할 수 없습니다.');
            setIsLoading(false);
        }
    };

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
                {/* 구글 로그인 버튼 */}
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                    disabled={!request || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#4285F4" />
                    ) : (
                        <>
                            <Ionicons name="logo-google" size={24} color="#4285F4" />
                            <Text style={styles.googleButtonText}>Google로 로그인</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* 또는 구분선 */}
                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>또는</Text>
                    <View style={styles.divider} />
                </View>

                {/* 시작하기 버튼 */}
                <TouchableOpacity
                    style={styles.kakaoButton}
                    onPress={handleStartPress}
                >
                    <Text style={styles.kakaoButtonText}>로그인 없이 시작하기</Text>
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
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        width: '100%',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    googleButtonText: {
        color: '#3C1E1E',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#CCCCCC',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#666666',
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