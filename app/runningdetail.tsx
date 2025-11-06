import { useLocalSearchParams } from 'expo-router';
import RunningDetailScreen from '../screens/RunningdetailScreen';

export default function RunningDetailPage() {
    const params = useLocalSearchParams();

    // record를 JSON으로 받아서 파싱
    const record = params.record ? JSON.parse(params.record as string) : null;

    return <RunningDetailScreen route={{ params: { record } }} />;
}
