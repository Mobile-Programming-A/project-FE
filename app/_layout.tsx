import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import SplashScreen from '../screens/SplashScreen';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 앱 초기화 로직 (폰트 로딩, 데이터 로딩 등)
    setTimeout(() => {
      setIsReady(true);
    }, 2000); // 2초 후 스플래시 화면 종료
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}