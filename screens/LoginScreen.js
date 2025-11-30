import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { defaultCharacter } from '../data/characters';
import { auth } from '../services/config';

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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // 이메일/비밀번호 로그인
    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const user = userCredential.user;

            // 사용자 이메일을 AsyncStorage에 저장
            await AsyncStorage.setItem('userEmail', user.email || email.trim());

            // Firestore에 사용자 정보가 없으면 생성
            const { doc, setDoc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../services/config');

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // 새 사용자 정보 생성
                await setDoc(userDocRef, {
                    email: user.email,
                    name: user.displayName || user.email?.split('@')[0] || '사용자',
                    avatar: 'avatar1',
                    characterId: 1,
                    level: 1,
                    currentExp: 0,
                    maxExp: 100,
                    createdAt: new Date().toISOString(),
                });
            }

            Alert.alert(
                '로그인 성공',
                `환영합니다, ${user.email}님!`,
                [
                    {
                        text: '확인',
                        onPress: () => router.replace('/(tabs)/main')
                    }
                ]
            );
        } catch (error) {
            console.error('로그인 오류:', error);
            let errorMessage = '로그인에 실패했습니다.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = '등록되지 않은 이메일입니다.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = '비밀번호가 올바르지 않습니다.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '올바른 이메일 형식이 아닙니다.';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
            }

            Alert.alert('로그인 실패', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // 회원가입 화면으로 이동
    const handleSignUp = () => {
        router.push('/signup');
    };

    const handleStartPress = () => {
        router.replace('/(tabs)/main');
    };

    return (
        <View style={styles.container}>
            {/* 배경-그라데이션 */}
            <LinearGradient
                colors={['#B8E6F0', '#C8EDD4', '#D4E9D7']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.ellipseBackground} />

            {/* 잔디 벡터 배치 */}
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
                {/* 이메일 입력 */}
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="이메일"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                </View>

                {/* 비밀번호 입력 */}
                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="비밀번호"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color="#999"
                        />
                    </TouchableOpacity>
                </View>

                {/* 로그인 버튼 */}
                <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.loginButtonText}>로그인</Text>
                    )}
                </TouchableOpacity>

                {/* 회원가입 링크 */}
                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>계정이 없으신가요? </Text>
                    <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
                        <Text style={styles.signupLink}>회원가입</Text>
                    </TouchableOpacity>
                </View>

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
        flex: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        zIndex: 2,
    },
    character: {
        width: width * 0.5,
        height: width * 0.5,
        resizeMode: 'contain',
        marginBottom: 15,
    },
    subtitle: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
    },
    bottomContainer: {
        flex: 1.5,
        paddingHorizontal: 30,
        paddingTop: 20,
        alignItems: 'center',
        zIndex: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        width: '100%',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    eyeIcon: {
        padding: 5,
    },
    loginButton: {
        backgroundColor: '#7FD89A',
        borderRadius: 30,
        width: '100%',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    signupContainer: {
        flexDirection: 'row',
        marginTop: 20,
        alignItems: 'center',
    },
    signupText: {
        fontSize: 14,
        color: '#666',
    },
    signupLink: {
        fontSize: 14,
        color: '#7FD89A',
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
        backgroundColor: '#ddd',
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
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    kakaoButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '700',
    },
});
