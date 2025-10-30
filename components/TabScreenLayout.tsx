import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomTabBar from './CustomTabBar';

interface TabScreenLayoutProps {
  children: React.ReactNode;
}

export default function TabScreenLayout({ children }: TabScreenLayoutProps) {
  return (
    <View style={styles.container}>
      {children}
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
