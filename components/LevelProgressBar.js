// LevelProgressBar.js - 레벨과 경험치 바를 표시하는 컴포넌트
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { getUserLevelInfo } from '../services/userLevelService';

const LevelProgressBar = ({ userId, onLevelInfoUpdate }) => {
  const [levelInfo, setLevelInfo] = useState({
    level: 1,
    currentExp: 0,
    maxExp: 100,
    expPercentage: 0,
  });
  const [animatedWidth] = useState(new Animated.Value(0));

  useEffect(() => {
    loadLevelInfo();
  }, [userId]);

  useEffect(() => {
    // 경험치 바 애니메이션
    Animated.timing(animatedWidth, {
      toValue: levelInfo.expPercentage,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [levelInfo.expPercentage]);

  const loadLevelInfo = async () => {
    if (!userId) return;

    const result = await getUserLevelInfo(userId);
    if (result.success) {
      setLevelInfo(result);
      if (onLevelInfoUpdate) {
        onLevelInfoUpdate(result);
      }
    }
  };

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Level {levelInfo.level}</Text>
        <Text style={styles.expText}>
          {levelInfo.currentExp} / {levelInfo.maxExp} EXP
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: widthInterpolate },
          ]}
        />
      </View>
      
      <Text style={styles.percentageText}>
        {levelInfo.expPercentage.toFixed(1)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginVertical: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  expText: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  percentageText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});

export default LevelProgressBar;
