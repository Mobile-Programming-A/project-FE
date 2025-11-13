import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CommunityMain from './community/CommunityMain';
import TrendingShoes from './community/TrendingShoes';
import RunningCourseRecommend from './community/RunningCourseRecommend';
import firebaseTest from './community/firebaseTest';

const Stack = createStackNavigator();

export default function CommunityScreen() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#D4E9D7' },
            }}
        >
            <Stack.Screen name="CommunityMain" component={CommunityMain} />
            <Stack.Screen name="TrendingShoes" component={TrendingShoes} />
            <Stack.Screen name="RunningCourseRecommend" component={RunningCourseRecommend} />
            <Stack.Screen name="firebaseTest" component={firebaseTest} />
 import { db } from       </Stack.Navigator>
    );
}