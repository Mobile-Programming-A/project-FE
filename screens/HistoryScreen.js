import { StyleSheet, Text, View } from 'react-native';
import TabScreenLayout from '../components/TabScreenLayout';

export default function HistoryScreen() {
    return (
        <TabScreenLayout>
            <View style={styles.container}>
                <Text style={styles.text}>기록 화면</Text>
            </View>
        </TabScreenLayout>
    );
}
// (스타일 코드는 MainScreen과 동일하게 추가)
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D4E9D7' },
    text: { fontSize: 20 },
});