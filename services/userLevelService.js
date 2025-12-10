// userLevelService.js
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "./config";

/**
 * 미션 완료 시 경험치 추가 및 레벨업 처리
 * @param {string} userId - 사용자 ID
 * @param {number} expAmount - 추가할 경험치 (기본값: 50)
 * @returns {Object} - { success, leveledUp, newLevel, currentExp, maxExp }
 */
export const addExperience = async (userId, expAmount = 50) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    const userData = userDoc.data();
    const currentLevel = userData.level || 1;
    const currentExp = userData.currentExp || 0;
    const maxExp = userData.maxExp || 100;

    // 새로운 경험치 계산
    let newExp = currentExp + expAmount;
    let newLevel = currentLevel;
    let leveledUp = false;

    // 레벨업 체크 (여러 레벨을 한번에 올릴 수 있음)
    while (newExp >= maxExp) {
      newExp -= maxExp;
      newLevel += 1;
      leveledUp = true;
    }

    // Firestore 업데이트
    const updateData = {
      currentExp: newExp,
      level: newLevel,
    };

    await updateDoc(userRef, updateData);

    return {
      success: true,
      leveledUp,
      newLevel,
      currentExp: newExp,
      maxExp,
      expGained: expAmount,
    };
  } catch (error) {
    console.error("경험치 추가 중 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 사용자의 현재 레벨 정보 조회
 * @param {string} userId - 사용자 ID
 * @returns {Object} - { level, currentExp, maxExp, expPercentage }
 */
export const getUserLevelInfo = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    const userData = userDoc.data();
    const level = userData.level || 1;
    const currentExp = userData.currentExp || 0;
    const maxExp = userData.maxExp || 100;
    const expPercentage = (currentExp / maxExp) * 100;

    return {
      success: true,
      level,
      currentExp,
      maxExp,
      expPercentage,
    };
  } catch (error) {
    console.error("레벨 정보 조회 중 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 레벨에 따른 최대 경험치 계산 (선택적 - 레벨별로 필요 경험치를 다르게 하고 싶을 때)
 * @param {number} level - 현재 레벨
 * @returns {number} - 해당 레벨의 최대 경험치
 */
export const calculateMaxExp = (level) => {
  // 예시: 레벨당 100씩 증가 (레벨 1: 100, 레벨 2: 200, ...)
  return 100 * level;
};

/**
 * 레벨업 시 maxExp 업데이트 (레벨별로 다른 경험치가 필요한 경우)
 * @param {string} userId - 사용자 ID
 * @param {number} newLevel - 새로운 레벨
 */
export const updateMaxExp = async (userId, newLevel) => {
  try {
    const userRef = doc(db, "users", userId);
    const newMaxExp = calculateMaxExp(newLevel);

    await updateDoc(userRef, {
      maxExp: newMaxExp,
    });

    return { success: true, newMaxExp };
  } catch (error) {
    console.error("maxExp 업데이트 중 오류:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 미션 완료 처리 (경험치 추가 + 알림 + 미션 초기화)
 * @param {string} userId - 사용자 ID
 * @param {string} missionName - 미션 이름
 * @param {number} expReward - 경험치 보상 (기본값: 50)
 * @param {string} missionField - Firebase 필드 이름 (mission_1, mission_2 등)
 * @returns {Object} - 결과 정보
 */
export const completeMission = async (userId, missionName, expReward = 50, missionField = null) => {
  try {
    // 먼저 미션이 이미 완료되었는지 확인
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("사용자를 찾을 수 없습니다.");
    }

    const userData = userDoc.data();
    
    // 미션 필드가 제공된 경우, 이미 완료된 미션인지 확인
    if (missionField && userData[missionField] === true) {
      return {
        success: false,
        alreadyCompleted: true,
        message: "이미 완료된 미션입니다.",
      };
    }

    // 경험치 추가
    const result = await addExperience(userId, expReward);

    if (!result.success) {
      throw new Error(result.error);
    }

    // 미션 완료 후 다시 false로 초기화 (다음에 다시 깰 수 있도록)
    if (missionField) {
      await updateDoc(userRef, {
        [missionField]: false
      });
    }

    return {
      success: true,
      message: result.leveledUp
        ? `🎉 미션 완료! 레벨 ${result.newLevel}로 레벨업!`
        : `✅ 미션 완료! +${expReward} EXP`,
      ...result,
      missionName,
    };
  } catch (error) {
    console.error("미션 완료 처리 중 오류:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  addExperience,
  getUserLevelInfo,
  calculateMaxExp,
  updateMaxExp,
  completeMission,
};
