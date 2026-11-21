import { Stack } from 'expo-router';
import AccionesHeader from '../src/components/AccionesHeader';

export default function RootLayout() {
  return <Stack screenOptions={{ headerRight: () => <AccionesHeader /> }} />;
}
