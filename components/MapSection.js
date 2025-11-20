// components/MapSection.js
import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";

import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// 아바타 이미지 매핑
const avatarImages = {
  avatar1: require("../assets/images/avatar1.png"),
  avatar2: require("../assets/images/avatar2.png"),
  avatar3: require("../assets/images/avatar3.png"),
  avatar4: require("../assets/images/avatar4.png"),
  avatar5: require("../assets/images/avatar5.png"),
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

// 가까운 친구 3명
const getNearbyFriends = (myLocation, friends) => {
  if (!myLocation || !friends || friends.length === 0) return [];

  const friendsWithDistance = friends.map((friend) => ({
    ...friend,
    distance: calculateDistance(
      myLocation.latitude,
      myLocation.longitude,
      friend.lat,
      friend.lng
    ),
  }));

  return friendsWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 3);
};

// 지역 계산
const getRegionFromCoords = (coords) => {
  if (!coords || coords.length === 0) {
    return {
      latitude: 37.5665,
      longitude: 126.978,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
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

  const padding = 0.0015;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + minLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat + padding, 0.003),
    longitudeDelta: Math.max(maxLng - minLng + padding, 0.003),
  };
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${month}월 ${day}일 ${weekDays[date.getDay()]}요일`;
};

export default function MapSection({
  lastRunPath,
  myLocation,
  friends,
  lastRunDate,
  onPressFriends,
}) {
  const [selectedFriendPreview, setSelectedFriendPreview] = useState(null);

  // 지도 ref
  const mapRef = useRef(null);

  // 프리뷰 카드 애니메이션
  const anim = useRef(new Animated.Value(0)).current;

  const nearbyFriends = useMemo(
    () => getNearbyFriends(myLocation, friends),
    [myLocation, friends]
  );

  const allCoords = useMemo(() => {
    const coords = [];

    if (lastRunPath?.length > 0) {
      lastRunPath.forEach((p) =>
        coords.push({ latitude: p.latitude, longitude: p.longitude })
      );
    }

    if (nearbyFriends.length > 0) {
      nearbyFriends.forEach((f) =>
        coords.push({ latitude: f.lat, longitude: f.lng })
      );
    }

    if (myLocation) {
      coords.push({
        latitude: myLocation.latitude,
        longitude: myLocation.longitude,
      });
    }

    return coords;
  }, [lastRunPath, nearbyFriends, myLocation]);

  const region = useMemo(() => getRegionFromCoords(allCoords), [allCoords]);

  // 마커 클릭
  const handleFriendMarkerPress = (friend) => {
    const same = selectedFriendPreview?.id === friend.id;

    if (same) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => setSelectedFriendPreview(null));
    } else {
      setSelectedFriendPreview(friend);

      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }

    mapRef.current?.animateToRegion(
      {
        latitude: friend.lat,
        longitude: friend.lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      },
      480
    );
  };

  const displayDate = formatDate(lastRunDate || new Date().toISOString());

  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapPlaceholder}>
        <MapView
          ref={mapRef}
          style={styles.mapView}
          provider={PROVIDER_GOOGLE}
          region={region}
        >
          {/* 러닝 경로 */}
          {lastRunPath?.length > 1 && (
            <>
              <Polyline
                coordinates={lastRunPath}
                strokeColor="#7FD89A"
                strokeWidth={5}
              />

              <Marker coordinate={lastRunPath[0]}>
                <View style={styles.startMarker}>
                  <Ionicons name="play-circle" size={20} color="#4CAF50" />
                </View>
              </Marker>

              <Marker coordinate={lastRunPath[lastRunPath.length - 1]}>
                <View style={styles.endMarker}>
                  <Ionicons name="flag" size={20} color="#FF5252" />
                </View>
              </Marker>
            </>
          )}

          {/* 친구 마커 */}
          {nearbyFriends.map((friend) => (
            <Marker
              key={friend.id}
              coordinate={{
                latitude: friend.lat,
                longitude: friend.lng,
              }}
              onPress={() => handleFriendMarkerPress(friend)}
            >
              {/* 바운스 제거 → 일반 View로 표시 */}
              <View style={styles.friendMarker}>
                <Image
                  source={avatarImages[friend.avatar]}
                  style={styles.friendMarkerImage}
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* 프리뷰 카드 */}
        {selectedFriendPreview && (
          <Animated.View
            style={[
              styles.friendPreviewCard,
              {
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* 닫기 버튼 (터치 영역 확대됨) */}
            <TouchableOpacity
              style={styles.friendPreviewCloseHitbox}
              onPress={() => {
                Animated.timing(anim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => setSelectedFriendPreview(null));
              }}
            >
              <Ionicons name="close" size={18} color="#555" />
            </TouchableOpacity>

            <View style={styles.friendPreviewContent}>
              <Image
                source={avatarImages[selectedFriendPreview.avatar]}
                style={styles.friendPreviewAvatar}
              />

              <View style={styles.friendPreviewInfo}>
                {/* 이름 … 처리 유지 */}
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.friendPreviewName}>
                  {selectedFriendPreview.name}
                </Text>

                <Text style={styles.friendPreviewStatus}>
                  {selectedFriendPreview.status || "활동 중"}
                </Text>
              </View>
            </View>

            <View style={styles.friendPreviewStats}>
              <View style={styles.friendPreviewStat}>
                <Ionicons name="walk-outline" size={14} color="#7AC943" />
                <Text style={styles.friendPreviewStatText}>
                  {selectedFriendPreview.stats.step}
                </Text>
              </View>
              <View style={styles.friendPreviewStat}>
                <Ionicons name="flame-outline" size={14} color="#FF8C00" />
                <Text style={styles.friendPreviewStatText}>
                  {selectedFriendPreview.stats.cal}
                </Text>
              </View>
              <View style={styles.friendPreviewStat}>
                <Ionicons name="map-outline" size={14} color="#3F72AF" />
                <Text style={styles.friendPreviewStatText}>
                  {selectedFriendPreview.stats.dist}km
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      {/* 날짜 */}
      <Text style={styles.mapDate}>{displayDate}</Text>

      {/* 오른쪽 친구 리스트 */}
      <TouchableOpacity
        style={styles.avatarList}
        onPress={onPressFriends}
        activeOpacity={0.7}
      >
        <View style={styles.avatarBadge}>
          <Text style={styles.badgeText}>친구</Text>
        </View>

        {friends.slice(0, 2).map((friend) => (
          <View key={friend.id} style={styles.avatarItem}>
            <Image
              source={avatarImages[friend.avatar]}
              style={styles.avatarItemImage}
            />
          </View>
        ))}

        {friends.length === 0 && (
          <>
            <View style={styles.avatarItem}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.avatarItem}>
              <Text style={styles.avatarEmoji}>🥭</Text>
            </View>
          </>
        )}

        <View style={styles.moreButton}>
          <Text style={styles.moreText}>•••</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    position: "relative",
  },
  mapPlaceholder: {
    height: width * 0.55,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    overflow: "hidden",
  },
  mapView: {
    width: "100%",
    height: "100%",
  },
  startMarker: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 3,
    elevation: 5,
  },
  endMarker: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 3,
    elevation: 5,
  },
  friendMarker: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 4,
    borderWidth: 2,
    borderColor: "#7AC943",
    elevation: 5,
  },
  friendMarkerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  friendPreviewCard: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    elevation: 5,
  },

  // 🔥 닫기 버튼 터치 영역 확장
  friendPreviewCloseHitbox: {
    position: "absolute",
    right: 6,
    top: 6,
    padding: 8,
    zIndex: 10,
  },

  friendPreviewContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  friendPreviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendPreviewInfo: {
    flex: 1,
  },

  // 이름 …
  friendPreviewName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    maxWidth: 160,
  },

  friendPreviewStatus: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  friendPreviewStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  friendPreviewStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendPreviewStatText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  mapDate: {
    textAlign: "center",
    marginTop: 8,
    color: "#999",
  },
  avatarList: {
    position: "absolute",
    right: 10,
    top: 17,
    backgroundColor: "#707070",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  avatarBadge: {
    backgroundColor: "#525252",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
  },
  avatarItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarItemImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  moreButton: {
    width: 40,
    height: 40,
    backgroundColor: "#FFF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    fontSize: 18,
    color: "#666",
  },
});
