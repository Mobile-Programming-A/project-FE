// MissionCompleteExample.js - 미션 완료 시 사용 예제
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { completeMission } from '../services/userLevelService';
import LevelProgressBar from '../components/LevelProgressBar';

const MissionCompleteExample = ({ userId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 미션 완료 처리 함수
  const handleMissionComplete = async (missionName = "달리기 완료", expReward = 50) => {
    if (isProcessing) return;

    setIsProcessing(true);
    
    try {
      const result = await completeMission(userId, missionName, expReward);

      if (result.success) {
        if (result.leveledUp) {
          // 레벨업 시 모달 표시
          setLevelUpData(result);
          setShowLevelUpModal(true);
        } else {
          // 일반 경험치 획득 알림
          Alert.alert(
            '미션 완료! 🎉',
            `${missionName}\n+${expReward} EXP 획득!`,
            [{ text: '확인' }]
          );
        }
        
        // 경험치 바 새로고침
        setRefreshKey(prev => prev + 1);
      } else {
        Alert.alert('오류', result.error || '미션 완료 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('미션 완료 오류:', error);
      Alert.alert('오류', '미션 완료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeLevelUpModal = () => {
    setShowLevelUpModal(false);
    setLevelUpData(null);
  };

  return (
    <View style={styles.container}>
      {/* 레벨 진행 바 */}
      <LevelProgressBar 
        key={refreshKey} 
        userId={userId} 
      />

      {/* 미션 완료 버튼 예제 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={() => handleMissionComplete("3km 달리기 완료", 50)}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? '처리중...' : '미션 완료 (+50 EXP)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isProcessing && styles.buttonDisabled]}
          onPress={() => handleMissionComplete("친구와 함께 달리기", 100)}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>
            보너스 미션 (+100 EXP)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 레벨업 모달 */}
      <Modal
        visible={showLevelUpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeLevelUpModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 레벨업! 🎉</Text>
            {levelUpData && (
              <>
                <Text style={styles.modalLevel}>Level {levelUpData.newLevel}</Text>
                <Text style={styles.modalMessage}>
                  축하합니다!{'\n'}
                  레벨 {levelUpData.newLevel}에 도달했습니다!
                </Text>
                <Text style={styles.modalExp}>
                  현재 경험치: {levelUpData.currentExp} / {levelUpData.maxExp}
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closeLevelUpModal}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: '#2196F3',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalLevel: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  modalExp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MissionCompleteExample;
