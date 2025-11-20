export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RunningCourse {
  id: string;
  name: string;
  distance: string;
  startLocation: Coordinate;
  endLocation: Coordinate;
  waypoints?: Coordinate[]; // 경유지들
  routeCoordinates?: Coordinate[]; // 실제 경로 좌표들
  description?: string;
  createdAt: number;
  userId?: string;
  isNew?: boolean; // 새로 추가된 코스 표시용
  likes?: number; // 좋아요 수
  createdBy?: string; // 작성자 ID
  averageRating?: number; // 평균 별점
  reviewCount?: number; // 리뷰 개수
}

export interface NewRunningCourseInput {
  name: string;
  distance: string;
  startLocation: Coordinate;
  endLocation: Coordinate;
  waypoints?: Coordinate[]; // 경유지들
  routeCoordinates?: Coordinate[]; // 실제 경로 좌표들
  description?: string;
}
