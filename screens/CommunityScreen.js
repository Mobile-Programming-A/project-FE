import React from "react";
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
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#D4E9D7" },
      }}
    >
      <Stack.Screen name="CommunityMain" component={CommunityMain} />
      <Stack.Screen name="TrendingShoes" component={TrendingShoes} />
      <Stack.Screen
        name="TrendingShoesDetails"
        component={TrendingShoesDetails}
      />
      <Stack.Screen
        name="RunningCourseRecommend"
        component={RunningCourseRecommend}
      />
      <Stack.Screen
        name="RunningCourseDetail"
        component={RunningCourseDetail}
      />
      <Stack.Screen name="TrendingCourses" component={TrendingCourses} />
    </Stack.Navigator>
  );
}
