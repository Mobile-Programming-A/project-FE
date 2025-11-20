import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  // 현재 활성화된 탭 확인
  const isActive = (route: string) => {
    return pathname.includes(route);
  };

  return (
    <View style={styles.bottomNav}>
      {/* 메인 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/main')}
      >
        <View style={[styles.navIcon, isActive('main') && styles.activeNavIcon]}>
          <Ionicons 
            name={isActive('main') ? 'home' : 'home-outline'} 
            size={28} 
            color={isActive('main') ? '#FFFFFF' : '#CCCCCC'} 
          />
        </View>
      </TouchableOpacity>

      {/* 기록 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/history')}
      >
        <View style={[styles.navIcon, isActive('history') && styles.activeNavIcon]}>
          <Ionicons 
            name={isActive('history') ? 'time' : 'time-outline'} 
            size={28} 
            color={isActive('history') ? '#FFFFFF' : '#CCCCCC'} 
          />
        </View>
      </TouchableOpacity>

      {/* 친구 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/friends')}
      >
        <View style={[styles.navIcon, isActive('friends') && styles.activeNavIcon]}>
          <Ionicons 
            name={isActive('friends') ? 'people' : 'people-outline'} 
            size={28} 
            color={isActive('friends') ? '#FFFFFF' : '#CCCCCC'} 
          />
        </View>
      </TouchableOpacity>

      {/* 러닝 시작 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/running')}
      >
        <View style={[styles.navIcon, styles.exerciseButton, isActive('running') && styles.activeExerciseButton]}>
          <Ionicons 
            name={isActive('running') ? 'play-circle' : 'play-circle-outline'} 
            size={32} 
            color="#FFFFFF" 
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 90,
    backgroundColor: '#5A5A5A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 45,
    paddingHorizontal: 15,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7A7A7A',
  },
  activeNavIcon: {
    backgroundColor: '#7FD89A',
  },
  exerciseButton: {
    backgroundColor: '#7FD89A',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  activeExerciseButton: {
    backgroundColor: '#6BC785',
  },
});
