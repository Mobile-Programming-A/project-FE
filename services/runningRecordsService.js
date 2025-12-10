// services/runningRecordsService.js
import { collection, doc, addDoc, getDocs, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * 현재 로그인한 사용자의 UID 가져오기
 */
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('사용자가 로그인되어 있지 않습니다.');
  }
  return user.uid;
};

/**
 * 러닝 기록을 Firestore에 저장
 * @param {Object} recordData - 저장할 기록 데이터
 * @returns {Promise<string>} 저장된 문서 ID
 */
export const saveRunningRecord = async (recordData) => {
  try {
    const userId = getCurrentUserId();
    const recordsRef = collection(db, 'runningRecords', userId, 'records');
    
    const record = {
      ...recordData,
      createdAt: new Date().toISOString(),
      userId: userId, // 중복 저장 (쿼리 편의를 위해)
    };

    const docRef = await addDoc(recordsRef, record);
    console.log('러닝 기록 저장 완료:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('러닝 기록 저장 실패:', error);
    throw error;
  }
};

/**
 * 현재 사용자의 모든 러닝 기록 불러오기
 * @returns {Promise<Array>} 기록 배열
 */
export const getRunningRecords = async () => {
  try {
    const userId = getCurrentUserId();
    const recordsRef = collection(db, 'runningRecords', userId, 'records');
    const q = query(recordsRef, orderBy('date', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const records = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // doc.data()에 id 필드가 있어도 Firestore 문서 ID를 우선 사용
      records.push({
        ...data,
        id: doc.id, // Firestore 문서 ID로 덮어쓰기
      });
    });

    return records;
  } catch (error) {
    console.error('러닝 기록 불러오기 실패:', error);
    throw error;
  }
};

/**
 * 특정 기록 삭제
 * @param {string} recordId - 삭제할 기록 ID (Firestore 문서 ID 또는 기존 id 필드)
 * @param {Object} recordData - 선택적: 기록 데이터 (날짜 등으로 매칭하기 위해)
 */
export const deleteRunningRecord = async (recordId, recordData = null) => {
  try {
    const userId = getCurrentUserId();
    console.log('삭제 시도 - userId:', userId, 'recordId:', recordId);
    
    // 먼저 recordId로 직접 삭제 시도
    try {
      const recordRef = doc(db, 'runningRecords', userId, 'records', recordId);
      console.log('삭제할 문서 경로:', recordRef.path);
      await deleteDoc(recordRef);
      console.log('러닝 기록 삭제 완료 (직접 ID로):', recordId);
      return true;
    } catch (directError) {
      console.log('직접 ID로 삭제 실패, 날짜로 검색 시도...', directError.message);
      
      // 직접 삭제 실패 시, 날짜로 문서 찾아서 삭제
      if (recordData && recordData.date) {
        const recordsRef = collection(db, 'runningRecords', userId, 'records');
        const q = query(recordsRef, where('date', '==', recordData.date));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // 같은 날짜의 모든 문서 삭제 (보통 하나여야 함)
          const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          console.log('러닝 기록 삭제 완료 (날짜로 매칭):', recordData.date);
          return true;
        } else {
          throw new Error('해당 날짜의 기록을 찾을 수 없습니다.');
        }
      } else {
        // 모든 기록을 조회해서 id 필드로 매칭
        const recordsRef = collection(db, 'runningRecords', userId, 'records');
        const allRecords = await getDocs(recordsRef);
        
        let found = false;
        for (const docSnapshot of allRecords.docs) {
          const data = docSnapshot.data();
          // 기존 id 필드와 매칭
          if (data.id === recordId || docSnapshot.id === recordId) {
            await deleteDoc(docSnapshot.ref);
            console.log('러닝 기록 삭제 완료 (id 필드로 매칭):', recordId);
            found = true;
            break;
          }
        }
        
        if (!found) {
          throw new Error('삭제할 기록을 찾을 수 없습니다.');
        }
        return true;
      }
    }
  } catch (error) {
    console.error('러닝 기록 삭제 실패:', error);
    console.error('에러 코드:', error.code);
    console.error('에러 메시지:', error.message);
    throw error;
  }
};

/**
 * AsyncStorage에서 Firestore로 데이터 마이그레이션
 * @param {Array} asyncStorageRecords - AsyncStorage에서 가져온 기록 배열
 */
export const migrateRecordsToFirestore = async (asyncStorageRecords) => {
  try {
    if (!asyncStorageRecords || asyncStorageRecords.length === 0) {
      return;
    }

    const userId = getCurrentUserId();
    const recordsRef = collection(db, 'runningRecords', userId, 'records');
    
    // 기존 Firestore 기록 확인
    const existingRecords = await getRunningRecords();
    // 날짜와 시간, 거리를 조합하여 고유 키 생성 (더 정확한 중복 체크)
    const existingKeys = new Set(
      existingRecords.map(r => {
        const date = r.date || '';
        const time = r.time || 0;
        const distance = r.distance || 0;
        return `${date}_${time}_${distance.toFixed(2)}`;
      })
    );

    // 중복되지 않은 기록만 저장
    const recordsToMigrate = asyncStorageRecords.filter(record => {
      const date = record.date || '';
      const time = record.time || 0;
      const distance = record.distance || 0;
      const key = `${date}_${time}_${distance.toFixed(2)}`;
      return !existingKeys.has(key);
    });

    if (recordsToMigrate.length === 0) {
      console.log('마이그레이션할 기록이 없습니다.');
      return;
    }

    // 배치로 저장
    for (const record of recordsToMigrate) {
      await addDoc(recordsRef, {
        ...record,
        createdAt: new Date().toISOString(),
        userId: userId,
      });
    }

    console.log(`${recordsToMigrate.length}개의 기록이 Firestore로 마이그레이션되었습니다.`);
  } catch (error) {
    console.error('마이그레이션 실패:', error);
    throw error;
  }
};

