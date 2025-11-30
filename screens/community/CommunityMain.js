import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import styles from "./styles/CommunityMain.styles";

export default function CommunityMain({ navigation }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Expo Router를 사용하여 뒤로 가기
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/main");
              }
            }}
          >
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>커뮤니티</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 메뉴 리스트 */}
        <View style={styles.menuContainer}>
          {/* 지금 뜨는 러닝코스 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("TrendingCourses")}
          >
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: "#FFE5E5" }]}>
                <Ionicons name="flag" size={24} color="#FF6B6B" />
              </View>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>지금 뜨는 러닝코스</Text>
              <Text style={styles.menuSubtitle}>랭킹 보러가기</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          {/* 러닝 코스 추천하고 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("RunningCourseRecommend")}
          >
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: "#FFE7CC" }]}>
                <Ionicons name="people" size={24} color="#FF9933" />
              </View>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>나의 러닝코스</Text>
              <Text style={styles.menuSubtitle}>내가 등록한 러닝코스 목록</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          {/* 지금 뜨는 러닝화 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("TrendingShoes")}
          >
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: "#FFF4E5" }]}>
                <Ionicons name="flame" size={24} color="#FF8C42" />
              </View>
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>지금 뜨는 러닝화</Text>
              <Text style={styles.menuSubtitle}>랭킹 보러가기</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
