import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import Svg, { Path } from "react-native-svg";

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
import { defaultCharacter } from '../data/characters';
import { auth } from '../services/config';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);


        // 풀잎 벡터
    const GrassVector = ({ left, bottom, rotation = 0, scale = 1 }) => (
    <View
        style={[
        styles.grassVector,
        {
            left,
            bottom,
            transform: [{ rotate: `${rotation}deg` }, { scale }],
        },
        ]}
    >
        <Svg width="23" height="23" viewBox="0 0 25 25">
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
            const { collection, doc, setDoc, getDoc } = await import('firebase/firestore');
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

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
                locations={[0, 0.3, 1]}
                style={StyleSheet.absoluteFillObject}
                />

            <View style={styles.ellipseBackground} />
             {/* 풀잎 랜덤 배치 */}
                <GrassVector left={30} bottom={height * 0.6} rotation={-15} scale={1.2} />
                <GrassVector left={80} bottom={height * 0.58} rotation={5} scale={0.9} />
                <GrassVector left={140} bottom={height * 0.6} rotation={5} scale={0.9} />
                <GrassVector left={width - 100} bottom={height * 0.58} rotation={10} scale={1.1} />
                <GrassVector left={width - 50} bottom={height * 0.59} rotation={-8} scale={0.95} />
                <GrassVector left={4} bottom={height * 0.48} rotation={12} scale={1.0} />
                <GrassVector left={width - 138} bottom={height * 0.62} rotation={-12} scale={1.15} />
                <GrassVector left={120} bottom={height * 0.52} rotation={8} scale={0.85} />
                <GrassVector left={width / 2} bottom={height * 0.54} rotation={-5} scale={1.05} />
                <GrassVector left={width - 30} bottom={height * 0.50} rotation={-5} scale={1.05} />

            <View style={styles.topContainer}>

           
            <View style={styles.speechBubbleContainer}>
                <View style={styles.speechBubble}>
                    <Text style={styles.speechBubbleText}>
                        망키와 함께 달려보세요!
                    </Text>
                </View>
                <View style={styles.speechBubbleTail} />
            </View>

            <Image
                source={defaultCharacter.image}
                style={styles.character}
            />

        </View>






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
        left: -width * 0.3,
        right: -width * 0.3,
        height: height * 0.7,
        backgroundColor: '#C2D88B',
        borderRadius: width * 1.5,
    },
    topContainer: {
        flex: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        zIndex: 1,
    },
    character: {
        width: width * 0.5,
        height: width * 0.5,
        resizeMode: 'contain',
        marginTop: 15,  
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
        fontWeight: '700',
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
        color: '#888', 
        fontWeight: '600',
    },
    speechBubbleContainer: {
        alignItems: 'center',
        marginTop: 55, 
        marginBottom: -10,
    },



    speechBubble: {
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 15,
        maxWidth: width * 0.6,
            shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },


    speechBubbleText: {
        fontSize: 14,
        color: '#333',
    },

    speechBubbleTail: {
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#fff',
        marginTop: -2,
    },
    backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    },

    ellipseBackground: {
    position: "absolute",
    bottom: -height * 0.1,
    left: -width * 0.45,
    right: -width * 0.45,
    height: height * 0.77,
    backgroundColor: "#C2D88B",
    borderRadius: width * 2,
    },

    grassVector: {
    position: "absolute",
    },


    });
