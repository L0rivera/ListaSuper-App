import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ListasScreen from './src/screens/ListasScreen';
import DetalleListaScreen from './src/screens/DetalleListaScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#4CAF50' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Listas"
          component={ListasScreen}
          options={{ title: '🛒 Mis Listas' }}
        />
        <Stack.Screen
          name="DetalleLista"
          component={DetalleListaScreen}
          options={({ route }) => ({ title: route.params?.nombre || 'Lista' })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}