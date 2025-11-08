import React, { useState } from "react";
import TabScreenLayout from "@/components/TabScreenLayout";
import { Ionicons } from "@expo/vector-icons";
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Button,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { addShoes, getAllShoes } from "../../services/shoesService";

export default function App({ navigation }) {
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newShoe, setNewShoe] = useState({
    brand: "",
    model: "",
    price: "",
    imageUrl: "",
    description: "",
    rating: "",
    likes: "0",
  });

  const handleGetAllShoes = async () => {
    const shoes = await getAllShoes();
    setData(shoes);
  };

  const handleAddShoe = async () => {
    // 필수 필드 검증
    if (!newShoe.brand || !newShoe.model || !newShoe.price || !newShoe.rating) {
      Alert.alert("오류", "브랜드, 모델명, 가격, 평점은 필수 입력 항목입니다.");
      return;
    }

    try {
      const shoeData = {
        brand: newShoe.brand,
        model: newShoe.model,
        price: parseFloat(newShoe.price),
        imageUrl: newShoe.imageUrl || "",
        description: newShoe.description || "",
        rating: parseFloat(newShoe.rating),
        likes: parseInt(newShoe.likes) || 0,
      };

      await addShoes(shoeData);
      Alert.alert("성공", "신발이 등록되었습니다!");

      // 입력 필드 초기화
      setNewShoe({
        brand: "",
        model: "",
        price: "",
        imageUrl: "",
        description: "",
        rating: "",
        likes: "0",
      });

      setModalVisible(false);
      handleGetAllShoes(); // 목록 새로고침
    } catch (error) {
      Alert.alert("오류", "신발 등록에 실패했습니다.");
      console.error(error);
    }
  };

  const updateField = (field, value) => {
    setNewShoe((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <TabScreenLayout>
      <StatusBar barStyle="dark-content" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          firebase 데이터 삽입/불러오기 테스트 화면
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Firebase 테스트</Text>

        <Button title="신발 추가하기" onPress={() => setModalVisible(true)} />

        <View style={styles.spacing} />

        <Button title="신발 목록 불러오기" onPress={handleGetAllShoes} />

        <View style={styles.dataContainer}>
          {data.map((item) => (
            <View key={item.id} style={styles.dataItem}>
              <Text>이름: {item.model}</Text>
              <Text>브랜드: {item.brand}</Text>
            </View>
          ))}
        </View>

        {/* 신발 등록 모달 */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>신발 등록</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>브랜드 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: Nike, Adidas"
                    value={newShoe.brand}
                    onChangeText={(text) => updateField("brand", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>모델명 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: Air Max 270"
                    value={newShoe.model}
                    onChangeText={(text) => updateField("model", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>가격 *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 150000"
                    keyboardType="numeric"
                    value={newShoe.price}
                    onChangeText={(text) => updateField("price", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>평점 (0-5) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="예: 4.5"
                    keyboardType="decimal-pad"
                    value={newShoe.rating}
                    onChangeText={(text) => updateField("rating", text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>설명</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="신발에 대한 설명을 입력하세요"
                    multiline
                    numberOfLines={4}
                    value={newShoe.description}
                    onChangeText={(text) => updateField("description", text)}
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleAddShoe}
                  >
                    <Text style={styles.submitButtonText}>등록</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D4E9D7",
  },
  header: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  spacing: {
    height: 10,
  },
  dataContainer: {
    marginTop: 20,
  },
  dataItem: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    marginBottom: 10,
    borderRadius: 5,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
