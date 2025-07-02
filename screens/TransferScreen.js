import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function TransferScreen({ navigation }) {
  const handleTransfer = () => {
    Alert.alert(
      "🚀 Transfert de Timbre", 
      "Utilisez l'onglet RAVE pour tester l'interface complète de transfert de timbre !",
      [
        { text: "OK", style: "default" },
        { text: "Aller à RAVE", onPress: () => navigation.navigate('RAVE'), style: "default" }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Ionicons name="flash" size={80} color="#FF3860" />
          <Text style={styles.title}>Transfert de Timbre</Text>
          <Text style={styles.description}>
            Transformez vos fichiers audio avec l'intelligence artificielle.{'\n\n'}
            L'interface complète de transfert de timbre est disponible dans l'onglet RAVE avec :
            {'\n'}• Sélection de fichiers audio
            {'\n'}• Choix de modèles IA
            {'\n'}• Transfert en temps réel
            {'\n'}• Écoute des résultats
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={handleTransfer}>
            <LinearGradient
              colors={['#FF3860', '#FF6B9D']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Tester l'interface</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.raveButton} 
            onPress={() => navigation.navigate('RAVE')}
          >
            <LinearGradient
              colors={['#00ffff', '#0099cc']}
              style={styles.buttonGradient}
            >
              <Ionicons name="radio" size={20} color="white" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>Interface RAVE Complète</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>🎯 Fonctionnalités disponibles :</Text>
            <Text style={styles.featuresText}>
              ✅ Interface futuriste{'\n'}
              ✅ Sélection de fichiers{'\n'}
              ✅ 5 modèles de transfert{'\n'}
              ✅ Simulation de traitement{'\n'}
              ✅ Lecture audio
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#B0B0FF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  button: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    width: '80%',
  },
  raveButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 30,
    width: '80%',
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#7F5AF0',
    width: '100%',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  featuresText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    textAlign: 'left',
  },
});