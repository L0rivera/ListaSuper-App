import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, ScrollView
} from 'react-native';
import { cargarListas, guardarListas } from '../storage/storage';
import { CATEGORIAS } from '../constants/categorias';

export default function DetalleListaScreen({ route }) {
  const { listaId } = route.params;

  const [productos, setProductos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Campos del formulario
  const [nombre, setNombre]       = useState('');
  const [precio, setPrecio]       = useState('');
  const [cantidad, setCantidad]   = useState('1');
  const [categoriaId, setCategoriaId] = useState('8');

  // Cargar productos de esta lista
  useEffect(() => {
    const cargar = async () => {
      const listas = await cargarListas();
      const lista = listas.find(l => l.id === listaId);
      if (lista) setProductos(lista.productos);
    };
    cargar();
  }, []);

  // Guardar productos cada vez que cambian
  useEffect(() => {
    const guardar = async () => {
      const listas = await cargarListas();
      const actualizadas = listas.map(l =>
        l.id === listaId ? { ...l, productos } : l
      );
      await guardarListas(actualizadas);
    };
    guardar();
  }, [productos]);

  const agregarProducto = () => {
    if (!nombre.trim()) return;
    const nuevo = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      precio: parseFloat(precio) || 0,
      cantidad: parseInt(cantidad) || 1,
      categoriaId,
      comprado: false,
    };
    setProductos([...productos, nuevo]);
    // Limpiar formulario
    setNombre('');
    setPrecio('');
    setCantidad('1');
    setCategoriaId('8');
    setModalVisible(false);
  };

  const toggleComprado = (id) => {
    setProductos(productos.map(p =>
      p.id === id ? { ...p, comprado: !p.comprado } : p
    ));
  };

  const eliminarProducto = (id) => {
    Alert.alert('Eliminar producto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive',
        onPress: () => setProductos(productos.filter(p => p.id !== id)) },
    ]);
  };

  // Calcular presupuesto
  const totalGeneral  = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const totalComprado = productos
    .filter(p => p.comprado)
    .reduce((s, p) => s + p.precio * p.cantidad, 0);

  const getCategoria = (id) =>
    CATEGORIAS.find(c => c.id === id) || CATEGORIAS[7];

  return (
    <View style={styles.container}>

      {/* Resumen de presupuesto */}
      <View style={styles.presupuesto}>
        <View style={styles.presupuestoItem}>
          <Text style={styles.presupuestoLabel}>Total</Text>
          <Text style={styles.presupuestoValor}>${totalGeneral.toFixed(2)}</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.presupuestoItem}>
          <Text style={styles.presupuestoLabel}>Comprado</Text>
          <Text style={[styles.presupuestoValor, { color: '#4CAF50' }]}>
            ${totalComprado.toFixed(2)}
          </Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.presupuestoItem}>
          <Text style={styles.presupuestoLabel}>Restante</Text>
          <Text style={[styles.presupuestoValor, { color: '#f44336' }]}>
            ${(totalGeneral - totalComprado).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Lista de productos */}
      <FlatList
        data={productos}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.vacio}>Sin productos. ¡Agrega el primero!</Text>
        }
        renderItem={({ item }) => {
          const cat = getCategoria(item.categoriaId);
          return (
            <TouchableOpacity
              style={[styles.tarjeta, item.comprado && styles.tarjetaComprada]}
              onPress={() => toggleComprado(item.id)}
              onLongPress={() => eliminarProducto(item.id)}
            >
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <View style={styles.info}>
                <Text style={[styles.nombreProducto, item.comprado && styles.tachado]}>
                  {item.nombre}
                </Text>
                <Text style={styles.subtext}>
                  {cat.nombre} · x{item.cantidad}
                </Text>
              </View>
              <View style={styles.precioBox}>
                <Text style={styles.precio}>
                  ${(item.precio * item.cantidad).toFixed(2)}
                </Text>
                {item.comprado && <Text style={styles.check}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabTexto}>+</Text>
      </TouchableOpacity>

      {/* Modal para agregar producto */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Nuevo Producto</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del producto"
              value={nombre}
              onChangeText={setNombre}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Precio"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { width: 70, marginLeft: 8 }]}
                placeholder="Cant."
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="number-pad"
              />
            </View>

            {/* Selector de categoría */}
            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}>
              {CATEGORIAS.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    categoriaId === cat.id && styles.catChipActivo
                  ]}
                  onPress={() => setCategoriaId(cat.id)}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[
                    styles.catNombre,
                    categoriaId === cat.id && { color: '#fff' }
                  ]}>
                    {cat.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#eee', flex: 1 }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#555', fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#4CAF50', flex: 1, marginLeft: 8 }]}
                onPress={agregarProducto}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  // Presupuesto
  presupuesto:     { flexDirection: 'row', backgroundColor: '#fff', margin: 16,
                     borderRadius: 12, padding: 16, elevation: 2,
                     shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  presupuestoItem: { flex: 1, alignItems: 'center' },
  presupuestoLabel:{ fontSize: 12, color: '#999', marginBottom: 4 },
  presupuestoValor:{ fontSize: 18, fontWeight: '700', color: '#222' },
  separador:       { width: 1, backgroundColor: '#eee' },
  // Tarjetas
  tarjeta:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                     marginHorizontal: 16, marginBottom: 8, borderRadius: 12,
                     padding: 12, elevation: 1 },
  tarjetaComprada: { opacity: 0.5 },
  emoji:           { fontSize: 28, marginRight: 12 },
  info:            { flex: 1 },
  nombreProducto:  { fontSize: 16, fontWeight: '600', color: '#222' },
  tachado:         { textDecorationLine: 'line-through', color: '#aaa' },
  subtext:         { fontSize: 12, color: '#999', marginTop: 2 },
  precioBox:       { alignItems: 'flex-end' },
  precio:          { fontSize: 15, fontWeight: '700', color: '#333' },
  check:           { color: '#4CAF50', fontWeight: '700', fontSize: 16 },
  vacio:           { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 16 },
  // FAB
  fab:             { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#4CAF50',
                     width: 56, height: 56, borderRadius: 28,
                     alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabTexto:        { color: '#fff', fontSize: 32, lineHeight: 36 },
  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
                     justifyContent: 'flex-end' },
  modalContent:    { backgroundColor: '#fff', borderTopLeftRadius: 20,
                     borderTopRightRadius: 20, padding: 24 },
  modalTitulo:     { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#222' },
  input:           { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12,
                     fontSize: 16, marginBottom: 12 },
  row:             { flexDirection: 'row' },
  label:           { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  catChip:         { alignItems: 'center', backgroundColor: '#f0f0f0',
                     borderRadius: 10, padding: 8, marginRight: 8, minWidth: 70 },
  catChipActivo:   { backgroundColor: '#4CAF50' },
  catEmoji:        { fontSize: 20 },
  catNombre:       { fontSize: 10, color: '#555', marginTop: 2, textAlign: 'center' },
  btn:             { padding: 14, borderRadius: 10, alignItems: 'center' },
});