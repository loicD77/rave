/* HomeScreen.js */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ToastAndroid,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  /* ---------- ÉTATS POUR LA CONFIGURATION SERVEUR ---------- */
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');
  const [testing, setTesting] = useState(false);

  /* ---------- TESTER LA CONNEXION ---------- */
  const testConnection = async () => {
    if (!ipAddress || !port) {
      const msg = 'Renseignez IP et port avant de tester.';
      Platform.OS === 'android'
        ? ToastAndroid.show(msg, ToastAndroid.SHORT)
        : Alert.alert('Info', msg);
      return;
    }

    setTesting(true);
    const url = `http://${ipAddress}:${port}/`; // route racine du serveur Flask
    try {
      const res = await fetch(url);
      const txt = await res.text();
      const msg = res.ok
        ? `✅ Serveur OK : ${txt}`
        : `❌ Réponse ${res.status}`;
      Platform.OS === 'android'
        ? ToastAndroid.show(msg, ToastAndroid.SHORT)
        : Alert.alert('Résultat', msg);
    } catch (err) {
      const msg = `❌ Aucune connexion : ${err.message}`;
      Platform.OS === 'android'
        ? ToastAndroid.show(msg, ToastAndroid.LONG)
        : Alert.alert('Erreur', msg);
    } finally {
      setTesting(false);
    }
  };

  /* ---------- RENDU ---------- */
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🌌 RAVE TRANSFER</Text>
          <Text style={styles.subtitle}>Neural Audio Transformation</Text>
        </View>

        {/* -------- CONFIGURATION SERVEUR -------- */}
        <View style={styles.configContainer}>
          <Text style={styles.configLabel}>🔌 Adresse du serveur</Text>

          <TextInput
            placeholder="IP (ex : 192.168.0.15)"
            placeholderTextColor="#888"
            value={ipAddress}
            onChangeText={setIpAddress}
            keyboardType="numbers-and-punctuation"
            style={styles.input}
          />

          <TextInput
            placeholder="Port (ex : 5000)"
            placeholderTextColor="#888"
            value={port}
            onChangeText={setPort}
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={testConnection}
            disabled={testing}
            style={[
              styles.testButton,
              { backgroundColor: testing ? '#555' : '#0099cc' },
            ]}
          >
            <Text style={styles.testButtonText}>
              {testing ? 'Test en cours…' : 'Tester la connexion'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cards des fonctionnalités */}
        <View style={styles.cardsContainer}>
          {/* --- Transfert de timbre --- */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Transfer')}
          >
            <LinearGradient colors={['#FF3860', '#FF6B9D']} style={styles.cardGradient}>
              <Ionicons name="flash" size={40} color="white" />
              <Text style={styles.cardTitle}>Transfert de Timbre</Text>
              <Text style={styles.cardDescription}>
                Transformez vos sons avec l'IA
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* --- RAVE --- */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RAVE')}
          >
            <LinearGradient colors={['#00ffff', '#0099cc']} style={styles.cardGradient}>
              <Ionicons name="radio" size={40} color="white" />
              <Text style={styles.cardTitle}>RAVE</Text>
              <Text style={styles.cardDescription}>
                Interface avancée de transformation
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* --- Record --- */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Record')}
          >
            <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.cardGradient}>
              <Ionicons name="mic" size={40} color="white" />
              <Text style={styles.cardTitle}>Enregistrement</Text>
              <Text style={styles.cardDescription}>
                Enregistrez vos propres sons
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>🚀 Démarrage rapide</Text>
          <Text style={styles.instructionsText}>
            1. Allez dans l'onglet RAVE pour tester l'interface{'\n'}
            2. Sélectionnez un fichier audio{'\n'}
            3. Choisissez un modèle de transformation{'\n'}
            4. Lancez le transfert de timbre{'\n'}
            5. Écoutez le résultat transformé !
          </Text>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>📊 État de l'application</Text>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Interface RAVE:</Text>
            <Text style={styles.statusValue}>✅ Fonctionnelle</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Mode:</Text>
            <Text style={styles.statusValue}>🔬 Démonstration</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Serveur:</Text>
            <Text style={styles.statusValue}>⚠️ Non configuré</Text>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, minHeight: '100%' },

  /* Header */
  header: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: { fontSize: 18, color: '#B0B0FF', textAlign: 'center' },

  /* Configuration serveur */
  configContainer: { paddingHorizontal: 20, marginBottom: 30 },
  configLabel: { color: '#FFFFFF', fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    color: '#fff',
    padding: 10,
    marginBottom: 15,
  },
  testButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonText: { color: '#fff', fontWeight: 'bold' },

  /* Cards */
  cardsContainer: { paddingHorizontal: 20, marginBottom: 30 },
  card: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
  },
  cardGradient: { padding: 25, alignItems: 'center' },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },

  /* Instructions */
  instructionsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#7F5AF0',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  instructionsText: { color: '#B0B0FF', fontSize: 14, lineHeight: 20 },

  /* Status */
  statusContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: { color: '#CCCCCC', fontSize: 14 },
  statusValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
