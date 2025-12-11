import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function CustomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => pathname.includes(route);

  return (
    <View style={styles.bottomNav}>
      {/* 친구 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/(tabs)/friends")}
      >
        <View
          style={[styles.navIcon, isActive("friends") && styles.activeNavIcon]}
        >
          <Ionicons
            name="happy-outline"
            size={25}
            color={isActive("friends") ? "#7FD89A" : "#999"}
          />
        </View>
      </TouchableOpacity>

      {/* 기록 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/(tabs)/history")}
      >
        <View
          style={[styles.navIcon, isActive("history") && styles.activeNavIcon]}
        >
          <Ionicons
            name="calendar-outline"
            size={22}
            color={isActive("history") ? "#7FD89A" : "#999"}
          />
        </View>
      </TouchableOpacity>

      {/* 커뮤니티 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/(tabs)/community")}
      >
        <View
          style={[
            styles.navIcon,
            isActive("community") && styles.activeNavIcon,
          ]}
        >
          <Ionicons
            name="people-outline"
            size={24}
            color={isActive("community") ? "#7FD89A" : "#999"}
          />
        </View>
      </TouchableOpacity>

      {/* 운동 */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => router.push("/(tabs)/running")}
      >
        <View style={[styles.navIcon, styles.exerciseButton]}>
          <FontAwesome5 name="running" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 62,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 31,
    paddingHorizontal: 8,

    // 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIcon: {
    width: 46,
    height: 46,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  activeNavIcon: {
    backgroundColor: "#E8F5E9",
  },
  exerciseButton: {
    backgroundColor: "#7FD89A",
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowColor: "#7FD89A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
