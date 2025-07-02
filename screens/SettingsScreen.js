import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  setServerConfig,
  setConnectionStatus,
  setConnectionError,
  setAvailableModels,
  selectServer,
} from '../store/serverSlice';
import { testServerConnection, getModels, validateServerParams } from '../api/api';

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const server = useSelector(selectServer);
  
  const [ip, setIp] = useState(server.ip || '192.168.1.100');
  const [port, setPort] = useState(server.port || '5000');
  const [testing, setTesting] = useState(false);
  const [lastTestResult, setLastTestResult] = useState(null);

  // Auto-test when component mounts if server is configured
  useEffect(() => {
    if (server.ip && server.port && !server.isConnected) {
      testConnection();
    }
  }, []);

  const testConnection = async () => {
    console.log('🔍 Test de connexion...');
    
    // Validation des paramètres
    const validation = validateServerParams(ip, port);
    if (!validation.valid) {
      Alert.alert("⚠️ Paramètres invalides", validation.error);
      return;
    }

    setTesting(true);
    dispatch(setConnectionError(null));
    
    try {
      // Test de connexion
      const result = await testServerConnection(ip, port);
      
      if (result.success) {
        console.log('✅ Connexion réussie');
        dispatch(setConnectionStatus(true));
        setLastTestResult({
          success: true,
          message: 'Connexion réussie !',
          timestamp: new Date().toLocaleTimeString(),
        });
        
        // Essayer de récupérer les modèles
        try {
          const models = await getModels(ip, port);
          dispatch(setAvailableModels(models));
          console.log('✅ Modèles récupérés:', models);
        } catch (modelError) {
          console.log('⚠️ Impossible de récupérer les modèles, utilisation des modèles par défaut');
        }
        
        Alert.alert("✅ Connexion réussie", "Le serveur RAVE est accessible !");
        
      } else {
        console.error('❌ Connexion échouée:', result.error);
        dispatch(setConnectionError(result.error));
        setLastTestResult({
          success: false,
          message: result.error,
          timestamp: new Date().toLocaleTimeString(),
        });
        Alert.alert("❌ Connexion échouée", result.error);
      }
      
    } catch (error) {
      console.error('❌ Erreur test connexion:', error);
      const errorMessage = error.message || 'Erreur inconnue';
      dispatch(setConnectionError(errorMessage));
      setLastTestResult({
        success: false,
        message: errorMessage,
        timestamp: new Date().toLocaleTimeString(),
      });
      Alert.alert("❌ Erreur", errorMessage);
    } finally {
      setTesting(false);
    }
  };

  const saveConfiguration = () => {
    console.log('💾 Sauvegarde configuration serveur...');
    
    // Validation
    const validation = validateServerParams(ip, port);
    if (!validation.valid) {
      Alert.alert("⚠️ Configuration invalide", validation.error);
      return;
    }

    // Sauvegarder dans Redux
    dispatch(setServerConfig({ ip: ip.trim(), port: port.trim() }));
    
    Alert.alert(
      "✅ Configuration sauvegardée",
      "Les paramètres du serveur ont été mis à jour. Testez la connexion pour vérifier.",
      [
        { text: "OK", style: "default" },
        { text: "Tester maintenant", onPress: testConnection, style: "default" }
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      "🔄 Réinitialiser",
      "Voulez-vous réinitialiser aux valeurs par défaut ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Réinitialiser", 
          onPress: () => {
            setIp('192.168.1.100');
            setPort('5000');
            dispatch(setServerConfig({ ip: '192.168.1.100', port: '5000' }));
          },
          style: "destructive"
        }
      ]
    );
  };

  const getStatusColor = () => {
    if (testing) return '#FF9800';
    if (server.isConnected) return '#4CAF50';
    if (server.connectionError) return '#F44336';
    return '#9E9E9E';
  };

  const getStatusText = () => {
    if (testing) return 'Test en cours...';
    if (server.isConnected) return 'Connecté';
    if (server.connectionError) return 'Erreur de connexion';
    return 'Non testé';
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1a1a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="settings" size={32} color="#7F5AF0" />
          <Text style={styles.title}>Paramètres Serveur</Text>
          <Text style={styles.subtitle}>Configuration RAVE</Text>
        </View>

        {/* Statut de connexion */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusTitle}>État de la connexion</Text>
          </View>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {lastTestResult && (
            <Text style={styles.lastTestText}>
              Dernier test: {lastTestResult.timestamp} - {lastTestResult.message}
            </Text>
          )}
          {server.lastConnection && (
            <Text style={styles.lastConnectionText}>
              Dernière connexion: {new Date(server.lastConnection).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Configuration IP */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>🌐 Adresse IP du serveur</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="globe" size={20} color="#7F5AF0" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={ip}
              onChangeText={setIp}
              placeholder="192.168.1.100"
              placeholderTextColor="#888"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.helpText}>
            Adresse IP de l'ordinateur où tourne le serveur Python
          </Text>
        </View>

        {/* Configuration Port */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>🔌 Port du serveur</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="radio" size={20} color="#7F5AF0" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={port}
              onChangeText={setPort}
              placeholder="5000"
              placeholderTextColor="#888"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.helpText}>
            Port sur lequel le serveur Flask écoute (généralement 5000)
          </Text>
        </View>

        {/* Modèles disponibles */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>🧠 Modèles disponibles</Text>
          <View style={styles.modelsContainer}>
            {server.models.map((model, index) => (
              <View key={index} style={styles.modelChip}>
                <Text style={styles.modelText}>{model}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, testing && styles.actionButtonDisabled]}
            onPress={testConnection}
            disabled={testing}
          >
            <LinearGradient
              colors={testing ? ['#666', '#444'] : ['#FF6B35', '#F7931E']}
              style={styles.buttonGradient}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="wifi" size={20} color="white" />
              )}
              <Text style={styles.buttonText}>
                {testing ? 'Test...' : 'Tester Connexion'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={saveConfiguration}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.buttonGradient}
            >
              <Ionicons name="save" size={20} color="white" />
              <Text style={styles.buttonText}>Sauvegarder</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={resetToDefaults}
          >
            <LinearGradient
              colors={['#9E9E9E', '#757575']}
              style={styles.buttonGradient}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.buttonText}>Réinitialiser</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>📋 Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Lancez le serveur Python RAVE sur votre ordinateur{'\n'}
            2. Trouvez l'adresse IP de votre ordinateur (ipconfig/ifconfig){'\n'}
            3. Entrez cette IP et le port (généralement 5000){'\n'}
            4. Testez la connexion{'\n'}
            5. Sauvegardez la configuration{'\n'}
            6. Vous pouvez maintenant utiliser le transfert de timbre !
          </Text>
        </View>

        {/* Debug info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 Informations de debug</Text>
          <Text style={styles.debugText}>IP: {server.ip || 'Non définie'}</Text>
          <Text style={styles.debugText}>Port: {server.port || 'Non défini'}</Text>
          <Text style={styles.debugText}>
            URL complète: {server.ip && server.port ? `http://${server.ip}:${server.port}` : 'Non configurée'}
          </Text>
          <Text style={styles.debugText}>
            Connecté: {server.isConnected ? 'Oui' : 'Non'}
          </Text>
          {server.connectionError && (
            <Text style={styles.debugError}>Erreur: {server.connectionError}</Text>
          )}
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F5AF0',
  },
  statusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(127, 90, 240, 0.3)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  lastTestText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 5,
  },
  lastConnectionText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  configSection: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(127, 90, 240, 0.3)',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 15,
  },
  helpText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 5,
  },
  modelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modelChip: {
    backgroundColor: 'rgba(127, 90, 240, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
  },
  modelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    margin: 20,
  },
  actionButton: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  instructionsContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  instructionsText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  debugContainer: {
    margin: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999999',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  debugError: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 5,
    fontFamily: 'monospace',
  },
});