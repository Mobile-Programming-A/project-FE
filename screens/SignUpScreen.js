import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { defaultCharacter } from '../data/characters';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../services/config';
import { doc, setDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 회원가입 처리
    const handleSignUp = async () => {
        // 입력 검증
        if (!name.trim()) {
            Alert.alert('입력 오류', '이름을 입력해주세요.');
            return;
        }

        if (!email.trim()) {
            Alert.alert('입력 오류', '이메일을 입력해주세요.');
            return;
        }

        if (!password.trim()) {
            Alert.alert('입력 오류', '비밀번호를 입력해주세요.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('입력 오류', '비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);
        try {
            // Firebase Authentication으로 사용자 생성
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );
            const user = userCredential.user;

            // 사용자 프로필 업데이트 (이름)
            await updateProfile(user, {
                displayName: name.trim(),
            });

            // 사용자 이메일을 AsyncStorage에 저장
            await AsyncStorage.setItem('userEmail', user.email || email.trim());

            // Firestore에 사용자 정보 저장
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                name: name.trim(),
                avatar: 'avatar1',
                characterId: 1,
                level: 1,
                currentExp: 0,
                maxExp: 100,
                badge_first_step: false,
                badge_2: false,
                badge_3: false,
                createdAt: new Date().toISOString(),
            });

            Alert.alert(
                '회원가입 성공',
                `${name.trim()}님, 환영합니다!`,
                [
                    {
                        text: '확인',
                        onPress: () => router.replace('/(tabs)/main')
                    }
                ]
            );
        } catch (error) {
            console.error('회원가입 오류:', error);
            let errorMessage = '회원가입에 실패했습니다.';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = '이미 사용 중인 이메일입니다.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = '올바른 이메일 형식이 아닙니다.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = '비밀번호가 너무 약합니다.';
            }

            Alert.alert('회원가입 실패', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#D4F7C5', '#F0FDEF']}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.ellipseBackground} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.topContainer}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Image
                        source={defaultCharacter.image}
                        style={styles.character}
                    />
                    <Text style={styles.title}>회원가입</Text>
                    <Text style={styles.subtitle}>망키와 함께 달려보세요!</Text>
                </View>

                <View style={styles.bottomContainer}>
                    {/* 이름 입력 */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="이름"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            editable={!isLoading}
                        />
                    </View>

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
                            placeholder="비밀번호 (최소 6자)"
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

                    {/* 비밀번호 확인 입력 */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="비밀번호 확인"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Ionicons
                                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color="#999"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* 회원가입 버튼 */}
                    <TouchableOpacity
                        style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                        onPress={handleSignUp}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.signupButtonText}>회원가입</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        zIndex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 10,
    },
    character: {
        width: width * 0.5,
        height: width * 0.5,
        resizeMode: 'contain',
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        color: '#333',
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    bottomContainer: {
        paddingHorizontal: 30,
        paddingTop: 30,
        paddingBottom: 40,
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
    signupButton: {
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
    signupButtonDisabled: {
        opacity: 0.6,
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

