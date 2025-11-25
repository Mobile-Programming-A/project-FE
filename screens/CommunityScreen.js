import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createStackNavigator } from "@react-navigation/stack";

import CommunityMain from "./community/CommunityMain";
import TrendingShoes from "./community/TrendingShoes";
import TrendingShoesDetails from "./community/TrendingShoesDetails";
import RunningCourseRecommend from "./community/RunningCourseRecommend";
import RunningCourseDetail from "./community/RunningCourseDetail";
import TrendingCourses from "./community/TrendingCourses";

const Stack = createStackNavigator();
export default function CommunityScreen() {
  return (
    <View style={{ flex: 1 }}>
      
      <LinearGradient
        colors={["#B8E6F0", "#C8EDD4", "#D4E9D7"]}
        locations={[0.04, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="CommunityMain" component={CommunityMain} />
        <Stack.Screen name="TrendingShoes" component={TrendingShoes} />
        <Stack.Screen name="TrendingShoesDetails" component={TrendingShoesDetails} />
        <Stack.Screen name="RunningCourseRecommend" component={RunningCourseRecommend} />
        <Stack.Screen name="RunningCourseDetail" component={RunningCourseDetail} />
        <Stack.Screen name="TrendingCourses" component={TrendingCourses} />
      </Stack.Navigator>
    </View>
  );
}
