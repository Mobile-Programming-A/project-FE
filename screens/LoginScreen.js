import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import { useRouter } from 'expo-router';
import { defaultCharacter } from '../data/characters';
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


// 잔디 벡터 컴포넌트 추가
const GrassVector = ({ left, bottom, rotation = 0, scale = 1 }) => (
    <View
        style={[
            styles.grassVector,
            {
                left,
                bottom,
                transform: [
                    { rotate: `${rotation}deg` },
                    { scale }
                ]
            }
        ]}
    >
        <Svg width="25" height="25" viewBox="0 0 25 25">
            <Path
                d="M 10 25 Q 8 18 5 10 Q 4 8 5 7 Q 6 6 7 8 Q 10 15 12 22"
                fill="#8BAF4C"
                opacity={0.5}
            />
            <Path
                d="M 15 25 Q 14 16 12 8 Q 11.5 5 13 4 Q 14.5 3 15 6 Q 17 14 16 22"
                fill="#9BC25C"
                opacity={0.6}
            />
            <Path
                d="M 20 25 Q 22 18 25 10 Q 26 8 25 7 Q 24 6 23 8 Q 20 15 18 22"
                fill="#7A9E3B"
                opacity={0.5}
            />
        </Svg>
    </View>
);

export default function LoginScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: "656771928173-okuhoa8ugjk5h1hc9ln2hoig94j0.apps.googleusercontent.com",
        iosClientId: "656771928173-okuhoa8ugjk5h1hc9ln2hoig94j0.apps.googleusercontent.com",
        webClientId: "656771928173-3tdf4229ete02t5rkvvt7gmubcoh8e2.apps.googleusercontent.com",
        redirectUri: "https://auth.expo.io/@seojung024/RunningApp",
        scopes: ["profile", "email"],
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            handleGoogleLoginSuccess(authentication);
        } else if (response?.type === 'error') {
            Alert.alert('로그인 실패', response.error?.message || '');
            setIsLoading(false);
        } else if (response?.type === 'dismiss') {
            setIsLoading(false);
        }
    }, [response]);

    const handleGoogleLoginSuccess = async (authentication) => {
        try {
            const userInfoResponse = await fetch(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                {
                    headers: { Authorization: `Bearer ${authentication.accessToken}` },
                }
            );

            const userInfo = await userInfoResponse.json();

            Alert.alert(
                '로그인 성공',
                `환영합니다, ${userInfo.name}님!`,
                [{ text: '확인', onPress: () => router.replace('/(tabs)/main') }]
            );
        } catch (error) {
            Alert.alert('오류', '사용자 정보를 가져오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await promptAsync();
    };

    const handleStartPress = () => {
        router.replace('/(tabs)/main');
    };

    return (
        <View style={styles.container}>

            {/*  배경-그라데이션 */}
            <LinearGradient
                colors={['#B8E6F0', '#C8EDD4', '#D4E9D7']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            
            <View style={styles.ellipseBackground} />

            {/*  잔디 벡터 배치 */}
            <GrassVector left={30} bottom={height * 0.32} rotation={-15} scale={1.1} />
            <GrassVector left={10} bottom={height * 0.38} rotation={7} scale={1.09} />
            <GrassVector left={90} bottom={height * 0.50} rotation={5} scale={0.9} />
            <GrassVector left={width - 120} bottom={height * 0.41} rotation={10} scale={1.0} />
            <GrassVector left={width - 60} bottom={height * 0.39} rotation={-8} scale={0.95} />
            <GrassVector left={width / 2 - 40} bottom={height * 0.43} rotation={-5} scale={1.05} />

            {/* 상단 캐릭터 영역 */}
            <View style={styles.topContainer}>
                <Image
                    source={defaultCharacter.image}
                    style={styles.character}
                />
                <Text style={styles.subtitle}>망키와 함께 달려보세요!</Text>
            </View>

            {/* 버튼 영역 */}
            <View style={styles.bottomContainer}>
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

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>또는</Text>
                    <View style={styles.divider} />
                </View>

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


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    ellipseBackground: {
        position: 'absolute',
        bottom: -height * 0.1,
        left: -width * 0.33,
        right: -width * 0.33,
        height: height * 0.68,
        backgroundColor: '#C2D88B',
        borderRadius: width * 2,
    },
    grassVector: {
        position: 'absolute',
        opacity: 0.95,
    },
    topContainer: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        zIndex: 2,
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
        color: '#333',
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
        backgroundColor: '#ffffffff',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#666',
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
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
});
