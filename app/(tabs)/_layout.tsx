// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // 기본 탭 바 숨기기
      }}
    >
      {/* 여기에 정의된 4개만 탭으로 보입니다. */}
      <Tabs.Screen name="main" options={{ title: '메인' }} />
      <Tabs.Screen name="running" options={{ title: '러닝' }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티' }} />
      <Tabs.Screen name="friends" options={{ title: '친구' }} />
      <Tabs.Screen 
        name="Character-custom" 
        options={{ 
          title: '캐릭터 커스텀',
          href: null // 탭 바에서 숨김
        }} 
      />
      </Tabs>
  );
}