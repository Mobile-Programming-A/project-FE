import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

export default function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => pathname.includes(route);

  return (
    <View style={styles.bottomNav}>
      {/* 친구 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/friends')}
      >
        <View style={[styles.navIcon, isActive('friends') && styles.activeNavIcon]}>
          <Ionicons
            name="happy-outline"
            size={30}
            color={isActive('friends') ? '#C6C6C6' : '#C6C6C6'}
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
            name="calendar-outline"
            size={26}
            color={isActive('history') ? '#C6C6C6' : '#C6C6C6'}
          />
        </View>
      </TouchableOpacity>

      {/* 커뮤니티 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/community')}
      >
        <View style={[styles.navIcon, isActive('community') && styles.activeNavIcon]}>
          <Ionicons
            name="people-outline"
            size={28}
            color={isActive('community') ? '#C6C6C6' : '#C6C6C6'}
          />
        </View>
      </TouchableOpacity>

      {/* 운동 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/running')}
      >
        <View
          style={[
            styles.navIcon,
            styles.exerciseButton,
          ]}
        >
          <FontAwesome5
            name="running"
            size={28}
            color="#fff"
          />
        </View>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 90,
    backgroundColor: '#5A5A5A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 45,
    paddingHorizontal: 15,

    // 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
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
  exerciseButton: {
    backgroundColor: '#71D9A1',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});
