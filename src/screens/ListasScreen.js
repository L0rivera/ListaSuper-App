import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cargarListas, guardarListas } from '../storage/storage';

export default function ListasScreen({ navigation }) {
  const [listas, setListas] = useState([]);
  const [nombreNueva, setNombreNueva] = useState('');

  useFocusEffect(
    useCallback(() => {
      const cargar = async () => {
        const listasGuardadas = await cargarListas();
        setListas(listasGuardadas);
      };
      cargar();
    }, [])
  );

  const agregarLista = () => {
    if (!nombreNueva.trim()) return;
    const nueva = {
      id: Date.now().toString(),
      nombre: nombreNueva.trim(),
      productos: [],
    };
    const nuevasListas = [...listas, nueva];
    setListas(nuevasListas);
    guardarListas(nuevasListas);
    setNombreNueva('');
  };

  const eliminarLista = (id) => {
    Alert.alert('Eliminar lista', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => {
          const nuevas = listas.filter(l => l.id !== id);
          setListas(nuevas);
          guardarListas(nuevas);
        }
      },
    ]);
  };

  // Calcular stats de cada lista
  const getStats = (productos) => {
    const total = productos.length;
    const comprados = productos.filter(p => p.comprado).length;
    const totalPesos = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
    const progreso = total === 0 ? 0 : comprados / total;
    return { total, comprados, totalPesos, progreso };
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🛒</Text>
      <Text style={styles.emptyTitulo}>No tienes listas aún</Text>
      <Text style={styles.emptySubtitulo}>
        Crea tu primera lista arriba{'\n'}y empieza a planear tu compra
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Input nueva lista */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nueva lista (ej. Semana del 7...)"
          value={nombreNueva}
          onChangeText={setNombreNueva}
          onSubmitEditing={agregarLista}
        />
        <TouchableOpacity style={styles.btnAgregar} onPress={agregarLista}>
          <Text style={styles.btnTexto}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listas}
        keyExtractor={item => item.id}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={listas.length === 0 && { flex: 1 }}
        renderItem={({ item }) => {
          const { total, comprados, totalPesos, progreso } = getStats(item.productos);
          const terminada = total > 0 && comprados === total;

          return (
            <TouchableOpacity
              style={[styles.tarjeta, terminada && styles.tarjetaTerminada]}
              onPress={() => navigation.navigate('DetalleLista', {
                listaId: item.id,
                nombre: item.nombre,
              })}
              onLongPress={() => eliminarLista(item.id)}
              activeOpacity={0.8}
            >
              {/* Encabezado */}
              <View style={styles.tarjetaHeader}>
                <Text style={styles.nombreLista} numberOfLines={1}>
                  {terminada ? '✅ ' : '🛒 '}{item.nombre}
                </Text>
                <Text style={styles.totalPesos}>
                  ${totalPesos.toFixed(2)}
                </Text>
              </View>

              {/* Contador */}
              <Text style={styles.contador}>
                {total === 0
                  ? 'Sin productos aún'
                  : `${comprados} de ${total} producto${total !== 1 ? 's' : ''} comprado${comprados !== 1 ? 's' : ''}`}
              </Text>

              {/* Barra de progreso */}
              {total > 0 && (
                <View style={styles.barraFondo}>
                  <View style={[
                    styles.barraRelleno,
                    { width: `${progreso * 100}%` },
                    terminada && styles.barraTerminada
                  ]} />
                </View>
              )}

              <Text style={styles.hint}>Mantén presionado para eliminar</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  // Input
  inputRow:         { flexDirection: 'row', marginBottom: 16, gap: 8 },
  input:            { flex: 1, backgroundColor: '#fff', borderRadius: 10,
                      paddingHorizontal: 14, paddingVertical: 10,
                      borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  btnAgregar:       { backgroundColor: '#4CAF50', borderRadius: 10,
                      width: 48, alignItems: 'center', justifyContent: 'center' },
  btnTexto:         { color: '#fff', fontSize: 28, lineHeight: 32 },
  // Tarjeta
  tarjeta:          { backgroundColor: '#fff', borderRadius: 14, padding: 16,
                      marginBottom: 12, elevation: 2,
                      shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
  tarjetaTerminada: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  tarjetaHeader:    { flexDirection: 'row', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 4 },
  nombreLista:      { fontSize: 17, fontWeight: '700', color: '#222', flex: 1 },
  totalPesos:       { fontSize: 17, fontWeight: '700', color: '#4CAF50', marginLeft: 8 },
  contador:         { fontSize: 13, color: '#888', marginBottom: 10 },
  // Barra de progreso
  barraFondo:       { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 8 },
  barraRelleno:     { height: 6, backgroundColor: '#4CAF50', borderRadius: 3 },
  barraTerminada:   { backgroundColor: '#2E7D32' },
  hint:             { fontSize: 10, color: '#ccc', textAlign: 'right' },
  // Empty state
  emptyContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center',
                      paddingBottom: 60 },
  emptyEmoji:       { fontSize: 64, marginBottom: 16 },
  emptyTitulo:      { fontSize: 20, fontWeight: '700', color: '#555', marginBottom: 8 },
  emptySubtitulo:   { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },
});