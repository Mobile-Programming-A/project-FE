import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";

import { useRouter } from "expo-router";
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";


export default function FriendsScreen() {
    const router = useRouter();
    const mapRef = useRef(null); // 지도 ref
    const [modalVisible, setModalVisible] = useState(false);
    const [friendId, setFriendId] = useState("");

    // 친구 데이터 (임시!!! 수정예정입니다!)
    const friends = [
        {
            id: "1",
            name: "송이",
            status: "최근 달리기: 30분 전",
            stats: { step: "4,200", cal: "180kcal", dist: "3.2km" },
            image: require("../assets/images/avatar1.png"),
            coordinate: { latitude: 37.5665, longitude: 126.978 },
        },
        {
            id: "2",
            name: "키위",
            status: "최근 달리기: 10분 전",
            stats: { step: "5,100", cal: "210kcal", dist: "3.9km" },
            image: require("../assets/images/avatar2.png"),
            coordinate: { latitude: 37.5651, longitude: 126.98955 },
        },
        {
            id: "3",
            name: "망고",
            status: "최근 달리기: 1시간 전",
            stats: { step: "3,700", cal: "160kcal", dist: "2.5km" },
            image: require("../assets/images/avatar3.png"),
            coordinate: { latitude: 37.5678, longitude: 126.982 },
        },
        {
            id: "4",
            name: "레몬",
            status: "최근 달리기: 5분 전",
            stats: { step: "6,000", cal: "240kcal", dist: "4.2km" },
            image: require("../assets/images/avatar4.png"),
            coordinate: { latitude: 37.5645, longitude: 126.9755 },
        },
        {
            id: "5",
            name: "체리",
            status: "최근 달리기: 2시간 전",
            stats: { step: "1,200", cal: "60kcal", dist: "0.8km" },
            image: require("../assets/images/avatar5.png"),
            coordinate: { latitude: 37.5635, longitude: 126.981 },
        },
    ];

    const [selectedFriend, setSelectedFriend] = useState(friends[0]);

    // 친구 클릭 시 지도 이동
    const handleSelectFriend = (friend) => {
        setSelectedFriend(friend);
        if (mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    ...friend.coordinate,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                },
                1000
            );
        }
    };

    // 친구 요청 처리
    const handleFriendRequest = () => {
        if (friendId.trim() === "") {
            Alert.alert("알림", "친구 ID를 입력해주세요.");
            return;
        }
        console.log("친구 요청:", friendId);
        Alert.alert("요청 완료", `${friendId}님에게 친구 요청을 보냈어요.`);
        setFriendId("");
        setModalVisible(false);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#EBFFE5" }}>
            <StatusBar barStyle="dark-content" />

            {/* 상단 헤더 */}
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingTop: 20,
                }}
            >
                <TouchableOpacity onPress={() => router.replace("/main")}>
                    <Ionicons name="chevron-back" size={26} color="#1C1C1C" />
                </TouchableOpacity>

                <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1C1C1C" }}>
                    친구
                </Text>

                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Ionicons name="search" size={26} color="#1C1C1C" />
                </TouchableOpacity>
            </View>

            {/* 지도 */}
            <MapView
                ref={mapRef}
                style={{
                    position: "absolute",
                    top: 105,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
                initialRegion={{
                    latitude: 37.5665,
                    longitude: 126.978,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
            >
                <Marker
                    coordinate={selectedFriend.coordinate}
                    title={selectedFriend.name}
                    description={selectedFriend.status}
                >
                    <Image
                        source={selectedFriend.image}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                    />
                </Marker>
            </MapView>


            <LinearGradient
                colors={[
                    "rgba(235,255,229,0)",
                    "rgba(255,255,255,0.2)",
                    "rgba(255,255,255,0.5)",
                    "rgba(255,255,255,0.85)",
                    "rgba(255,255,255,1)"
                ]}
                locations={[0, 0.3, 0.55, 0.8, 1]}
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 350,
                }}
            />


            <View
                style={{
                    position: "absolute",
                    bottom: 132,
                    left: 20,
                    right: 20,
                    backgroundColor: "#fff",
                    borderRadius: 24,
                    paddingVertical: 18, 
                    paddingHorizontal: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 6,
                }}
            >
                {/* 프로필 */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                        source={selectedFriend.image}
                        style={{
                            width: 55,
                            height: 55,
                            borderRadius: 28,
                            marginRight: 12,
                        }}
                    />
                    <View>
                        <Text style={{ fontSize: 18, fontWeight: "700" }}>
                            {selectedFriend.name}
                        </Text>
                        <Text style={{ color: "#666", fontSize: 13, marginTop: 3 }}>
                            {selectedFriend.status}
                        </Text>
                    </View>
                </View>

                {/* 통계 */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-around",
                        marginTop: 14,
                    }}
                >
                    <View style={{ alignItems: "center" }}>
                        <Ionicons name="walk-outline" size={22} color="#7AC943" />
                        <Text style={{ fontWeight: "700", marginTop: 4, fontSize: 14 }}>
                            {selectedFriend.stats.step}
                        </Text>
                        <Text style={{ color: "#777", fontSize: 11 }}>걸음 수</Text>
                    </View>

                    <View style={{ alignItems: "center" }}>
                        <Ionicons name="flame-outline" size={22} color="#FF8C00" />
                        <Text style={{ fontWeight: "700", marginTop: 4, fontSize: 14 }}>
                            {selectedFriend.stats.cal}
                        </Text>
                        <Text style={{ color: "#777", fontSize: 11 }}>칼로리</Text>
                    </View>

                    <View style={{ alignItems: "center" }}>
                        <Ionicons name="map-outline" size={22} color="#3F72AF" />
                        <Text style={{ fontWeight: "700", marginTop: 4, fontSize: 14 }}>
                            {selectedFriend.stats.dist}
                        </Text>
                        <Text style={{ color: "#777", fontSize: 11 }}>거리</Text>
                    </View>
                </View>

                {/* 응원 버튼 */}
                <TouchableOpacity
                    onPress={() =>
                        Alert.alert("응원 완료", `${selectedFriend.name}님에게 응원 보냈어요 💛`)
                    }
                    style={{
                        marginTop: 16,
                        backgroundColor: "#FFD34E",
                        borderRadius: 10,
                        alignItems: "center",
                        paddingVertical: 8,
                    }}
                >
                    <Text style={{ fontWeight: "700", color: "#1C1C1C" }}>응원하기 💛</Text>
                </TouchableOpacity>
            </View>

            {/* 하단 친구 리스트 */}
            <View style={{ position: "absolute", bottom: 30, width: "100%" }}>
                <FlatList
                    data={friends}
                    horizontal
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        justifyContent: "center",
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => handleSelectFriend(item)}
                            style={{ alignItems: "center", marginHorizontal: 8 }}
                        >
                            <Image
                                source={item.image}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 30,
                                    borderWidth: selectedFriend.id === item.id ? 3 : 0,
                                    borderColor:
                                        selectedFriend.id === item.id ? "#FFD34E" : "transparent",
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: selectedFriend.id === item.id ? "#000" : "#666",
                                    marginTop: 6,
                                    fontWeight: selectedFriend.id === item.id ? "600" : "400",
                                }}
                            >
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* 친구 요청  */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <KeyboardAvoidingView
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 24,
                    }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    {/* 배경 클릭 시 닫힘 */}
                    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                        <View
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                        />
                    </TouchableWithoutFeedback>


                    <View
                        style={{
                            backgroundColor: "rgba(34, 34, 34, 0.9)",
                            borderRadius: 16,
                            width: "90%",
                            padding: 24,
                        }}
                    >
                        <Text
                            style={{
                                color: "#fff",
                                fontSize: 18,
                                fontWeight: "bold",
                                marginBottom: 12,
                                textAlign: "center",
                            }}
                        >
                            친구 요청 보내기
                        </Text>

                        <TextInput
                            placeholder="친구 ID 입력"
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={friendId}
                            onChangeText={setFriendId}
                            style={{
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.3)",
                                borderRadius: 10,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                color: "#C7C7C7",
                                marginBottom: 16,
                            }}
                        />

                        <TouchableOpacity
                            onPress={handleFriendRequest}
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: 10,
                                paddingVertical: 10,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ fontWeight: "600", color: "#1C1C1C" }}>요청</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </SafeAreaView>
    );
}
