import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BatteryFull, ChevronRight } from 'lucide-react-native';
import PilasScreen from './PilasScreen';

// Sección Casa: contenedor de submódulos del hogar (de momento, solo Pilas).
const MODULOS = [
  { key: 'pilas', label: 'Pilas', desc: 'Dónde están puestas las pilas recargables', Icon: BatteryFull },
];

export default function CasaScreen() {
  const [modulo, setModulo] = useState(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {modulo === 'pilas' ? (
        <PilasScreen onBack={() => setModulo(null)} />
      ) : (
        <View style={{ padding: 12 }}>
          <Text style={styles.title}>Casa</Text>
          {MODULOS.map(m => (
            <TouchableOpacity key={m.key} style={styles.card} onPress={() => setModulo(m.key)}>
              <View style={styles.icon}><m.Icon size={22} color="#5B3A8C" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{m.label}</Text>
                <Text style={styles.cardDesc}>{m.desc}</Text>
              </View>
              <ChevronRight size={18} color="#AEAEB2" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },
  title: { fontSize: 22, fontWeight: '700', color: '#1D1D1F', marginBottom: 14, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ECE4F7', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1D1D1F' },
  cardDesc: { fontSize: 12, color: '#6E6E73', marginTop: 2 },
});
