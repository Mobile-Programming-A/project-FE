# 🥭 망GO (ManGo) - GPS 기반 러닝 애플리케이션

<div align="center">
  <h3>🏃 러닝에 필요한 모든 것, 하나의 앱으로</h3>
  <p>GPS 기반 러닝 기록, 캐릭터 육성, 커뮤니티를 통합한 <b>올인원 러닝 플랫폼</b></p>
</div>

<br/>

## 🎯 프로젝트 소개

**망GO**는 GPS 기반의 올인원 러닝 애플리케이션입니다. 단순히 러닝 기록만 추적하는 것이 아니라, 러닝에 필요한 모든 활동을 하나의 앱에서 해결할 수 있도록 설계되었습니다.

| 기존 러닝 앱의 한계 | 망GO의 해결책 |
|:---|:---|
| 러닝 기록은 A앱, 러닝화 정보는 B앱, 코스 추천은 C앱 | 모든 기능을 **하나의 앱**에 통합 |
| 단순 기록만으로는 러닝 습관 유지가 어려움 | **캐릭터 육성**으로 지속적인 동기부여 |
| 러너들끼리 정보를 나눌 공간 부족 | **러닝화 공유, 코스 추천** 커뮤니티 제공 |

<br/>


## 📦 설치 및 실행

### 🔐 환경 변수 설정 (.env)

이 프로젝트는 **Firebase**를 사용하므로 실행 전에 환경 변수 설정이 필요합니다.

1. 프로젝트 루트 경로에 있는 `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
   
### 필수 요구사항
- Node.js (v14 이상)
- npm
- Expo Go (모바일 앱)

### 설치 방법
```bash
# 저장소 클론
git clone https://github.com/Mobile-Programming-A/project-FE.git
cd project-FE

# 의존성 설치
npm install

# 개발 서버 실행
npx expo start

# 모바일 앱에서 실행
# 안드로이드: Expo Go 앱에서 QR 스캔
# iOS: 카메라로 QR 스캔
```

<br/>

## 👥 팀 구성

| <img src="https://avatars.githubusercontent.com/u/160497134?v=4" alt="김민서님 프로필 사진" width="150"> | <img src="https://avatars.githubusercontent.com/u/217433354?v=4" alt="임창수님 프로필 사진" width="150"> | <img src="https://avatars.githubusercontent.com/u/115949608?v=4" alt="최서정님 프로필 사진" width="150"> | <img src="https://avatars.githubusercontent.com/u/69253558?v=4" alt="민찬혁님 프로필 사진" width="150"> |
|:---:|:---:|:---:|:---:|
| [김민서](https://github.com/minseeeeo) | [임창수](https://github.com/mangokiwi02) | [최서정](https://github.com/hs-2171215-choiseojung) | [민찬혁](https://github.com/hs-2171245-chanhyukmin) |

<br/>


## ✨ 주요 기능

### 🏃 GPS 기반 러닝 기록
- 실시간 위치 추적 및 경로 기록
- 거리, 시간, 페이스, 칼로리 자동 계산
- 지도 위에 러닝 경로 시각화

### 📊 러닝 기록 관리
- 모든 러닝 기록 조회 및 관리
- 주간/월간/연간 통계 차트

### 👥 커뮤니티 
**1. 지금 뜨는 러닝화- 러닝화 등록 및 공유**
- 브랜드, 모델명, 가격, 평점 정보
- 좋아요(찜) 및 정렬/검색 기능

**2. 러닝 코스 추천**
- 시작점, 경유지, 종료점 지정하여 코스 등록
- OSRM API를 활용한 실제 도보 경로 계산
- 코스 리뷰 및 좋아요 기능

### 👫 친구 기능
- 친구 추가 및 관리
- 친구의 위치와 최근 러닝 경로 확인

### 🐒 캐릭터 육성 
- "망키(Mangkii)" 캐릭터 커스터마이징
- 레벨별 캐릭터 해금 시스템
- 러닝 활동을 통한 경험치 획득

<br/>

## 🛠 기술 스택

| Frontend | Backend | API |
|:---:|:---:|:---:|
| ![React Native](https://img.shields.io/badge/-React%20Native-61DAFB?style=flat&logo=react&logoColor=black) | ![Firebase](https://img.shields.io/badge/-Firebase-FFCA28?style=flat&logo=firebase&logoColor=black) | ![Google Maps](https://img.shields.io/badge/-Google%20Maps-4285F4?style=flat&logo=googlemaps&logoColor=white) |
| ![Expo](https://img.shields.io/badge/-Expo-000020?style=flat&logo=expo&logoColor=white) | ![Firestore](https://img.shields.io/badge/-Firestore-F57C00?style=flat&logo=firebase&logoColor=white) | ![OSRM](https://img.shields.io/badge/-OSRM-7D7D7D?style=flat&logo=openstreetmap&logoColor=white) |
| ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) | ![Firebase Auth](https://img.shields.io/badge/-Firebase%20Auth-DD2C00?style=flat&logo=firebase&logoColor=white) | |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) | ![Firebase Storage](https://img.shields.io/badge/-Firebase%20Storage-FFA000?style=flat&logo=firebase&logoColor=white) | |

#### 지원 플랫폼

| 플랫폼 | 최소 버전 |
|:---:|:---|
| ![Android](https://img.shields.io/badge/-Android-3DDC84?style=flat&logo=android&logoColor=white) | 10.0 이상 |
| ![iOS](https://img.shields.io/badge/-iOS-000000?style=flat&logo=apple&logoColor=white) | 15.0 이상 |

<br/>

## 📁 프로젝트 구조
```
project-FE/
├── app/                      # expo-router 기반 라우팅
│   ├── _layout.tsx           # 루트 레이아웃
│   └── (tabs)/               # 탭 네비게이션 그룹
│       ├── _layout.tsx
│       ├── main.tsx
│       ├── running.tsx
│       ├── history.tsx
│       ├── community.tsx
│       └── friends.tsx
├── screens/                  # 화면 컴포넌트
│   ├── MainScreen.js
│   ├── RunningScreen.js
│   ├── HistoryScreen.js
│   ├── FriendsScreen.js
│   ├── LoginScreen.js
│   └── community/            # 커뮤니티 관련 화면
│       ├── CommunityMain.js
│       ├── TrendingShoes.js
│       ├── TrendingCourses.js
│       └── ...
├── components/               # 재사용 컴포넌트
├── services/                 # Firebase 서비스 로직
│   ├── config.js
│   ├── shoesService.ts
│   ├── runningCourseService.ts
│   └── runningRecordsService.js
├── data/                     # 정적 데이터
│   └── characters.js
└── types/                    # TypeScript 타입 정의
```

<br/>

---

<div align="center">
  <p>Made with ❤️ by Team Mangkii</p>
  <p>© 2025 ManGo Running Application. All rights reserved.</p>
</div>
