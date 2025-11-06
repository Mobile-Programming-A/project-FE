import { createStackNavigator } from '@react-navigation/stack';
import RunningScreen from '../../screens/RunningScreen';
import HistoryScreen from '../../screens/HistoryScreen';
import RunningDetailScreen from '../../screens/RunningdetailScreen';

const Stack = createStackNavigator();

export default function RunningPage() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="RunningMain" component={RunningScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="RunningDetail" component={RunningDetailScreen} />
        </Stack.Navigator>
    );
}