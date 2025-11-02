import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
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
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/friends')}
      >
        <View style={[styles.navIcon, isActive('friends') && styles.activeNavIcon]}>
          <Text style={styles.navEmoji}>😊</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/history')}
      >
        <View style={[styles.navIcon, isActive('history') && styles.activeNavIcon]}>
          <Text style={styles.navEmoji}>📅</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/community')}
      >
        <View style={[styles.navIcon, isActive('community') && styles.activeNavIcon]}>
          <Text style={styles.navEmoji}>👤</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/running')}
      >
        <View style={[styles.navIcon, styles.exerciseButton, isActive('running') && styles.activeExerciseButton]}>
          <Text style={styles.exerciseIcon}>🏃</Text>
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
    backgroundColor: '#6A6A6A',
  },
  navEmoji: {
    fontSize: 28,
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
  exerciseIcon: {
    fontSize: 32,
  },
});
