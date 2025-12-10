// components/MapSection.js
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

const { width } = Dimensions.get("window");
const ROUTE_COLOR = "#71D9A1";

const avatarImages = {
  avatar1: require("../assets/images/avatar1.png"),
  avatar2: require("../assets/images/avatar2.png"),
  avatar3: require("../assets/images/avatar3.png"),
  avatar4: require("../assets/images/avatar4.png"),
  avatar5: require("../assets/images/avatar5.png"),
};

/* --------------------------------------------------
 * 유틸 함수
 * -------------------------------------------------- */

const normalizePoint = (p) => {
  if (!p || typeof p !== "object") return null;
  const lat = p.lat ?? p.latitude;
  const lng = p.lng ?? p.longitude;
  if (lat == null || lng == null) return null;

  const latitude = typeof lat === "string" ? parseFloat(lat) : lat;
  const longitude = typeof lng === "string" ? parseFloat(lng) : lng;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
};

// 거리 계산
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Douglas–Peucker 단순화
const getPerpendicularDistance = (p, start, end) => {
  const x0 = p.longitude;
  const y0 = p.latitude;
  const x1 = start.longitude;
  const y1 = start.latitude;
  const x2 = end.longitude;
  const y2 = end.latitude;

  if (x1 === x2 && y1 === y2) {
    return Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2) * 111320;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((x0 - projX) ** 2 + (y0 - projY) ** 2) * 111320;
};

const douglasPeucker = (pts, epsilon) => {
  if (!pts || pts.length <= 2) return pts;

  let maxDist = 0;
  let index = 0;
  const end = pts.length - 1;

  for (let i = 1; i < end; i++) {
    const d = getPerpendicularDistance(pts[i], pts[0], pts[end]);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }

  if (maxDist > epsilon) {
    const res1 = douglasPeucker(pts.slice(0, index + 1), epsilon);
    const res2 = douglasPeucker(pts.slice(index, end + 1), epsilon);
    return [...res1.slice(0, -1), ...res2];
  }
  return [pts[0], pts[end]];
};

const simplifyRoute = (coords, tolerance = 8) => {
  if (!coords || coords.length <= 2) return coords;
  return douglasPeucker(coords, tolerance);
};
// 날짜 포맷
const formatDate = (d) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${
    week[date.getDay()]
  }요일`;
};

// region 계산
const getRegionFromCoords = (coords = []) => {
  if (!coords.length) {
    return {
      latitude: 37.56,
      longitude: 126.97,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
  }

  let minLat = coords[0].latitude;
  let maxLat = coords[0].latitude;
  let minLng = coords[0].longitude;
  let maxLng = coords[0].longitude;

  coords.forEach((c) => {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  });

  // 마커 간 거리
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;

  // 🔥 여기서 "적당한 확대" 보정
  const basePadding = 0.01; // 기본 여유
  const dynamicPadding = Math.max(latDiff, lngDiff) * 0.6;

  const latitudeDelta = Math.max(latDiff + basePadding + dynamicPadding, 0.02);
  const longitudeDelta = Math.max(lngDiff + basePadding + dynamicPadding, 0.02);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
};


// OSRM API
async function calculateOSRMRoute(start, waypoints, end) {
  if (!start || !end) return [start, ...waypoints, end].filter(Boolean);

  const all = [start, ...waypoints, end];
  const coords = all.map((p) => `${p.longitude},${p.latitude}`).join(";");

  const url = `https://router.project-osrm.org/route/v1/walking/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok") {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
    }
  } catch (e) {
    console.log("OSRM Error:", e);
  }

  return all;
}

// 부드러운 애니메이션
const animateRegion = (mapRef, region, duration = 650) => {
  if (!mapRef?.current) return;

  Animated.timing(new Animated.Value(0), {
    toValue: 1,
    duration,
    useNativeDriver: false,
  }).start();

  mapRef.current.animateToRegion(region, duration);
};

/* --------------------------------------------------
 * Main Component
 * -------------------------------------------------- */

export default function MapSection({
  myLocation,
  friends,
  lastRunDate,
  selectedFriend,
  onSelectFriend,
  onPressFriends,
}) {
  const mapRef = useRef(null);

  const [displayRoute, setDisplayRoute] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [initialFitDone, setInitialFitDone] = useState(false);
  const [routeCache, setRouteCache] = useState({});

  const safeFriends = Array.isArray(friends) ? friends : [];

  // 친구 좌표만 (전체 보기 용)
  const allFriendCoords = safeFriends
    .filter((f) => f.lat != null && f.lng != null)
    .map((f) => ({
      latitude: typeof f.lat === "string" ? parseFloat(f.lat) : f.lat,
      longitude: typeof f.lng === "string" ? parseFloat(f.lng) : f.lng,
    }));

  // displayRoute → 우선 표시 / 아니면 전체
  const allCoords = useMemo(() => {
    if (displayRoute.length > 0) return displayRoute;

    const c = [...allFriendCoords];
    if (myLocation) c.push(myLocation);
    return c;
  }, [displayRoute, allFriendCoords, myLocation]);

  // 전체 화면용(친구만)
  const fullRegion = useMemo(
    () => getRegionFromCoords(allFriendCoords),
    [allFriendCoords]
  );

  const region = useMemo(() => getRegionFromCoords(allCoords), [allCoords]);

  /* --------------------------------------------------
   * 초기 전체 보기 (친구만) + 부드러운 애니메이션
   * -------------------------------------------------- */
  useEffect(() => {
    if (!mapReady) return;
    if (initialFitDone) return;
    if (!allFriendCoords.length) return;

    animateRegion(mapRef, fullRegion, 450);

    setTimeout(() => {
      setInitialFitDone(true);
    }, 470);
  }, [mapReady, initialFitDone, fullRegion]);

  /* --------------------------------------------------
   * 친구 클릭
   * -------------------------------------------------- */
  const handleFriendPress = useCallback(
    async (friend) => {
      if (!friend || !initialFitDone) return;

      // 다시 클릭 → 친구 전체 보기 (내 위치 포함 X)
      if (selectedFriend?.id === friend.id) {
        onSelectFriend?.(null);
        setDisplayRoute([]);
        animateRegion(mapRef, fullRegion, 650);
        return;
      }

      // 새 친구 선택
      onSelectFriend?.(friend);
      setDisplayRoute([]);

      animateRegion(
        mapRef,
        {
          latitude: friend.lat,
          longitude: friend.lng,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        650
      );

      // 캐시 확인
      if (routeCache[friend.id]) {
        setDisplayRoute(routeCache[friend.id]);
        return;
      }

      const raw = Array.isArray(friend.route) ? friend.route : [];
      const cleaned = raw.map(normalizePoint).filter(Boolean);
      if (cleaned.length < 2) return;

      setRouteLoading(true);

      try {
        const start = cleaned[0];
        const end = cleaned[cleaned.length - 1];
        const waypoints = cleaned.slice(1, -1);

        const fixed = await calculateOSRMRoute(start, waypoints, end);
        const simplified = simplifyRoute(fixed);

        setDisplayRoute(simplified);

        setRouteCache((prev) => ({
          ...prev,
          [friend.id]: simplified,
        }));
      } catch {
        const fallback = simplifyRoute(cleaned);
        setDisplayRoute(fallback);
      }

      setRouteLoading(false);
    },
    [initialFitDone, selectedFriend, fullRegion, routeCache]
  );

  /* --------------------------------------------------
   * UI
   * -------------------------------------------------- */
  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapBox}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.mapView}
          initialRegion={fullRegion}
          scrollEnabled
          zoomEnabled
          onMapReady={() => setMapReady(true)}
        >
          {/* 경로 */}
          {displayRoute.length > 1 && (
            <Polyline
              coordinates={displayRoute}
              strokeWidth={6}
              strokeColor={"#71D9A1"} 
              strokeColors={["#71D9A1"]}
              lineCap="round"
              lineJoin="round"
              zIndex={999}
            />
          )}

          {/* 친구 마커 */}
          {safeFriends.map((f) =>
            f.lat != null && f.lng != null ? (
              <Marker
                key={`friend-${f.id}`}
                coordinate={{
                  latitude: f.lat,
                  longitude: f.lng,
                }}
                onPress={() => handleFriendPress(f)}
                zIndex={200}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={[
                      styles.markerLabel,
                      selectedFriend?.id === f.id && styles.markerLabelSelected,
                    ]}
                  >
                    {f.name}
                  </Text>

                  <View style={styles.friendMarker}>
                    <Image
                      source={avatarImages[f.avatar] ?? avatarImages.avatar1}
                      style={styles.friendMarkerImage}
                    />
                  </View>
                </View>
              </Marker>
            ) : null
          )}
        </MapView>
      </View>

      <Text style={styles.mapDate}>{formatDate(lastRunDate || new Date())}</Text>

      {/* 오른쪽 친구 버튼 */}
      <TouchableOpacity style={styles.avatarList} onPress={onPressFriends}>
        <View style={styles.avatarBadge}>
          <Text style={styles.badgeText}>친구</Text>
        </View>

        {safeFriends.slice(0, 2).map((f) => (
          <View key={f.id} style={styles.avatarItem}>
            <Image
              source={avatarImages[f.avatar] ?? avatarImages.avatar1}
              style={styles.avatarItemImage}
            />
          </View>
        ))}

        <View style={styles.moreButton}>
          <Text style={styles.moreText}>•••</Text>
        </View>
      </TouchableOpacity>

      {routeLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>경로 계산 중...</Text>
        </View>

        
      )}
    </View>
  );
}

/* --------------------------------------------------
 * 스타일
 * -------------------------------------------------- */

const styles = StyleSheet.create({
  mapContainer: { flex: 1, position: "relative" },

  mapBox: {
    height: width * 0.55,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
  },

  mapView: {
    width: "100%",
    height: "100%",
  },

  markerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  markerLabelSelected: {
    backgroundColor: ROUTE_COLOR,
    color: "#fff",
    fontWeight: "700",
  },

  friendMarker: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 5,
    borderWidth: 2,
    borderColor: ROUTE_COLOR,

    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4.5,

    elevation: 0,
  },

  friendMarkerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  mapDate: {
    textAlign: "center",
    marginTop: 8,
    color: "#777",
    fontSize: 13,
  },

  avatarList: {
    position: "absolute",
    right: 8,
    top: 15,
    backgroundColor: "#707070",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
    zIndex: 50,
  },

  avatarBadge: {
    backgroundColor: "#585858",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
  },

  avatarItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  avatarItemImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  moreButton: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  moreText: {
    fontSize: 18,
    color: "#666",
  },

  loadingOverlay: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },

  loadingText: {
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
  },
});
