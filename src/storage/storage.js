import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE_LISTAS = 'listas_supermercado';

export const cargarListas = async () => {
  try {
    const datos = await AsyncStorage.getItem(CLAVE_LISTAS);
    return datos ? JSON.parse(datos) : [];
  } catch (e) {
    console.error('Error al cargar listas:', e);
    return [];
  }
};

export const guardarListas = async (listas) => {
  try {
    await AsyncStorage.setItem(CLAVE_LISTAS, JSON.stringify(listas));
  } catch (e) {
    console.error('Error al guardar listas:', e);
  }
};