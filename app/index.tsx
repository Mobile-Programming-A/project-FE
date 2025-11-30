// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/config';
import LoginScreen from '../screens/LoginScreen';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // 인증 상태 확인
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // 이미 로그인된 경우 메인 화면으로 리다이렉트
                router.replace('/(tabs)/main');
            }
        });

        return () => unsubscribe();
    }, []);

    return <LoginScreen />;
}