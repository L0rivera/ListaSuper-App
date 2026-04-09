import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, ScrollView, SectionList
} from 'react-native';
import { cargarListas, guardarListas } from '../storage/storage';
import { CATEGORIAS } from '../constants/categorias';

export default function DetalleListaScreen({ route }) {
  const { listaId } = route.params;

  const [productos, setProductos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modoCompra, setModoCompra] = useState(false);
  const [ordenPorCategoria, setOrdenPorCategoria] = useState(false);

  // Campos del formulario
  const [nombre, setNombre]           = useState('');
  const [precio, setPrecio]           = useState('');
  const [cantidad, setCantidad]       = useState('1');
  const [categoriaId, setCategoriaId] = useState('8');

  useEffect(() => {
    const cargar = async () => {
      const listas = await cargarListas();
      const lista = listas.find(l => l.id === listaId);
      if (lista) setProductos(lista.productos);
    };
    cargar();
  }, []);

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
    setNombre(''); setPrecio(''); setCantidad('1'); setCategoriaId('8');
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

  // Presupuesto
  const totalGeneral  = productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const totalComprado = productos.filter(p => p.comprado)
                                 .reduce((s, p) => s + p.precio * p.cantidad, 0);
  const comprados     = productos.filter(p => p.comprado).length;
  const progreso      = productos.length === 0 ? 0 : comprados / productos.length;

  const getCategoria = (id) => CATEGORIAS.find(c => c.id === id) || CATEGORIAS[7];

  // Agrupar productos por categoría
  const getSecciones = () => {
    const productosFiltrados = modoCompra
      ? productos.filter(p => !p.comprado)
      : productos;

    if (!ordenPorCategoria) {
      return [{ title: null, data: productosFiltrados }];
    }

    const grupos = {};
    productosFiltrados.forEach(p => {
      const cat = getCategoria(p.categoriaId);
      if (!grupos[cat.id]) grupos[cat.id] = { title: cat, data: [] };
      grupos[cat.id].data.push(p);
    });

    // Ordenar secciones según el orden de CATEGORIAS
    return CATEGORIAS
      .filter(cat => grupos[cat.id])
      .map(cat => grupos[cat.id]);
  };

  const secciones = getSecciones();
  const sinProductos = productos.length === 0;
  const todoComprado = !sinProductos && comprados === productos.length;

  // Tarjeta de producto reutilizable
  const ProductoCard = ({ item }) => {
    const cat = getCategoria(item.categoriaId);
    return (
      <TouchableOpacity
        style={[styles.tarjeta, item.comprado && styles.tarjetaComprada]}
        onPress={() => toggleComprado(item.id)}
        onLongPress={() => eliminarProducto(item.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>{cat.emoji}</Text>
        <View style={styles.info}>
          <Text style={[styles.nombreProducto, item.comprado && styles.tachado]}>
            {item.nombre}
          </Text>
          <Text style={styles.subtext}>
            {cat.nombre} · x{item.cantidad}
            {item.precio > 0 ? ` · $${item.precio.toFixed(2)} c/u` : ''}
          </Text>
        </View>
        <View style={styles.precioBox}>
          {item.precio > 0 && (
            <Text style={[styles.precio, item.comprado && { color: '#4CAF50' }]}>
              ${(item.precio * item.cantidad).toFixed(2)}
            </Text>
          )}
          <Text style={[styles.check, { opacity: item.comprado ? 1 : 0 }]}>✓</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>

      {/* Barra de progreso + presupuesto */}
      <View style={styles.presupuesto}>
        <View style={styles.presupuestoFila}>
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

        {/* Barra de progreso */}
        {!sinProductos && (
          <View style={{ marginTop: 12 }}>
            <View style={styles.barraFondo}>
              <View style={[
                styles.barraRelleno,
                { width: `${progreso * 100}%` },
                todoComprado && { backgroundColor: '#2E7D32' }
              ]} />
            </View>
            <Text style={styles.progresoTexto}>
              {todoComprado
                ? '🎉 ¡Lista completada!'
                : `${comprados} de ${productos.length} productos comprados`}
            </Text>
          </View>
        )}
      </View>

      {/* Botones de vista */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, ordenPorCategoria && styles.toolBtnActivo]}
          onPress={() => setOrdenPorCategoria(!ordenPorCategoria)}
        >
          <Text style={[styles.toolBtnTexto, ordenPorCategoria && { color: '#fff' }]}>
            🗂️ Por categoría
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, modoCompra && styles.toolBtnActivo]}
          onPress={() => setModoCompra(!modoCompra)}
        >
          <Text style={[styles.toolBtnTexto, modoCompra && { color: '#fff' }]}>
            🛍️ Modo compra
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modo compra: banner */}
      {modoCompra && (
        <View style={styles.modoCompraBanner}>
          <Text style={styles.modoCompraTexto}>
            {productos.filter(p => !p.comprado).length === 0
              ? '🎉 ¡Todo comprado!'
              : `Quedan ${productos.filter(p => !p.comprado).length} producto(s) por comprar`}
          </Text>
        </View>
      )}

      {/* Lista de productos */}
      {sinProductos ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🥦</Text>
          <Text style={styles.emptyTitulo}>Lista vacía</Text>
          <Text style={styles.emptySubtitulo}>
            Toca el botón <Text style={{ color: '#4CAF50', fontWeight: '700' }}>+</Text> para
            agregar tu primer producto
          </Text>
        </View>
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderSectionHeader={({ section: { title } }) =>
            title ? (
              <View style={styles.seccionHeader}>
                <Text style={styles.seccionEmoji}>{title.emoji}</Text>
                <Text style={styles.seccionNombre}>{title.nombre}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => <ProductoCard item={item} />}
        />
      )}

      {/* Botón flotante */}
      {!modoCompra && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Text style={styles.fabTexto}>+</Text>
        </TouchableOpacity>
      )}

      {/* Modal agregar producto */}
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
                placeholder="Precio (opcional)"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, { width: 75, marginLeft: 8 }]}
                placeholder="Cant."
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="number-pad"
              />
            </View>

            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}>
              {CATEGORIAS.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, categoriaId === cat.id && styles.catChipActivo]}
                  onPress={() => setCategoriaId(cat.id)}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catNombre, categoriaId === cat.id && { color: '#fff' }]}>
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
  container:          { flex: 1, backgroundColor: '#f5f5f5' },
  // Presupuesto
  presupuesto:        { backgroundColor: '#fff', margin: 16, borderRadius: 14,
                        padding: 16, elevation: 2,
                        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  presupuestoFila:    { flexDirection: 'row' },
  presupuestoItem:    { flex: 1, alignItems: 'center' },
  presupuestoLabel:   { fontSize: 12, color: '#999', marginBottom: 4 },
  presupuestoValor:   { fontSize: 18, fontWeight: '700', color: '#222' },
  separador:          { width: 1, backgroundColor: '#eee' },
  barraFondo:         { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 4 },
  barraRelleno:       { height: 8, backgroundColor: '#4CAF50', borderRadius: 4 },
  progresoTexto:      { fontSize: 12, color: '#888', textAlign: 'right' },
  // Toolbar
  toolbar:            { flexDirection: 'row', paddingHorizontal: 16,
                        marginBottom: 8, gap: 8 },
  toolBtn:            { flex: 1, paddingVertical: 8, borderRadius: 10,
                        backgroundColor: '#fff', alignItems: 'center',
                        borderWidth: 1, borderColor: '#ddd' },
  toolBtnActivo:      { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  toolBtnTexto:       { fontSize: 13, fontWeight: '600', color: '#555' },
  // Modo compra banner
  modoCompraBanner:   { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#E8F5E9',
                        borderRadius: 10, padding: 10, alignItems: 'center' },
  modoCompraTexto:    { color: '#2E7D32', fontWeight: '600', fontSize: 14 },
  // Sección header
  seccionHeader:      { flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: 16, paddingVertical: 8,
                        backgroundColor: '#f5f5f5' },
  seccionEmoji:       { fontSize: 18, marginRight: 6 },
  seccionNombre:      { fontSize: 14, fontWeight: '700', color: '#555' },
  // Tarjeta
  tarjeta:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                        marginHorizontal: 16, marginBottom: 8, borderRadius: 12,
                        padding: 12, elevation: 1 },
  tarjetaComprada:    { opacity: 0.45 },
  emoji:              { fontSize: 26, marginRight: 12 },
  info:               { flex: 1 },
  nombreProducto:     { fontSize: 16, fontWeight: '600', color: '#222' },
  tachado:            { textDecorationLine: 'line-through', color: '#aaa' },
  subtext:            { fontSize: 12, color: '#999', marginTop: 2 },
  precioBox:          { alignItems: 'flex-end', minWidth: 50 },
  precio:             { fontSize: 15, fontWeight: '700', color: '#333' },
  check:              { color: '#4CAF50', fontWeight: '700', fontSize: 16, marginTop: 2 },
  // FAB
  fab:                { position: 'absolute', bottom: 24, right: 24,
                        backgroundColor: '#4CAF50', width: 56, height: 56,
                        borderRadius: 28, alignItems: 'center',
                        justifyContent: 'center', elevation: 6 },
  fabTexto:           { color: '#fff', fontSize: 32, lineHeight: 36 },
  // Modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
                        justifyContent: 'flex-end' },
  modalContent:       { backgroundColor: '#fff', borderTopLeftRadius: 20,
                        borderTopRightRadius: 20, padding: 24 },
  modalTitulo:        { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#222' },
  input:              { backgroundColor: '#f5f5f5', borderRadius: 10,
                        padding: 12, fontSize: 16, marginBottom: 12 },
  row:                { flexDirection: 'row' },
  label:              { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  catChip:            { alignItems: 'center', backgroundColor: '#f0f0f0',
                        borderRadius: 10, padding: 8, marginRight: 8, minWidth: 70 },
  catChipActivo:      { backgroundColor: '#4CAF50' },
  catEmoji:           { fontSize: 20 },
  catNombre:          { fontSize: 10, color: '#555', marginTop: 2, textAlign: 'center' },
  btn:                { padding: 14, borderRadius: 10, alignItems: 'center' },
  // Empty state
  emptyContainer:     { flex: 1, alignItems: 'center', justifyContent: 'center',
                        paddingBottom: 80 },
  emptyEmoji:         { fontSize: 64, marginBottom: 16 },
  emptyTitulo:        { fontSize: 20, fontWeight: '700', color: '#555', marginBottom: 8 },
  emptySubtitulo:     { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },
});