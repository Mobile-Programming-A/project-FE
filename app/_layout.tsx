import { Stack, useRouter, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/config';
import SplashScreen from '../screens/SplashScreen';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Firebase 인증 상태 확인
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    // 앱 초기화 로직 (폰트 로딩, 데이터 로딩 등)
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000); // 2초 후 스플래시 화면 종료

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Android 뒤로 가기 버튼 처리
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('=== BackHandler 호출됨 ===');
      console.log('현재 pathname:', pathname);
      console.log('router.canGoBack():', router.canGoBack());
      
      // 현재 경로 확인
      const isMainScreen = pathname === '/(tabs)/main' || pathname === '/main';
      const isLoginScreen = pathname === '/' || pathname === '/index';
      const isTabScreen = pathname?.startsWith('/(tabs)/');
      
      console.log('isMainScreen:', isMainScreen);
      console.log('isLoginScreen:', isLoginScreen);
      console.log('isTabScreen:', isTabScreen);
      
      // 메인 화면이나 로그인 화면에서는 앱 종료 방지
      if (isMainScreen || isLoginScreen) {
        console.log('메인/로그인 화면 - 앱 종료 방지');
        // 앱 종료 대신 아무 동작도 하지 않음
        return true; // 이벤트 소비 (앱 종료 방지)
      }
      
      // 탭 화면에서 뒤로 가기 시 메인으로 이동
      if (isTabScreen && !isMainScreen) {
        console.log('탭 화면에서 뒤로 가기 - 메인 화면으로 이동');
        router.replace('/(tabs)/main');
        return true; // 이벤트 소비
      }
      
      // 다른 모든 화면에서 뒤로 가기 시도
      // router.canGoBack()이 false여도 일단 시도
      try {
        if (router.canGoBack()) {
          console.log('router.back() 호출');
          router.back();
        } else {
          console.log('router.canGoBack() = false, 메인 화면으로 이동');
          // 네비게이션 스택이 비어있으면 메인 화면으로 이동
          router.replace('/(tabs)/main');
        }
      } catch (error) {
        console.log('에러 발생:', error);
        // 에러 발생 시 메인 화면으로 이동
        router.replace('/(tabs)/main');
      }
      
      console.log('이벤트 소비 (앱 종료 방지)');
      // 항상 이벤트 소비 (앱 종료 방지)
      return true;
    });

    return () => backHandler.remove();
  }, [pathname, router]);

  // 초기화 중이거나 인증 상태 확인 중이면 스플래시 화면 표시
  if (!isReady || isAuthenticated === null) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="all-records" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}