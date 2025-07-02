// DebugServerConnection.js
// Composant de debug pour tester la connexion avec le serveur RAVE
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';

export default function DebugServerConnection() {
  const [serverUrl, setServerUrl] = useState('http://192.168.1.100:5000');
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  // Ajouter un résultat de test
  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, time: new Date().toLocaleTimeString() }]);
  };

  // Nettoyer les résultats
  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Connexion basique
  const testConnection = async () => {
    try {
      addResult('Connexion', null, 'Test en cours...');
      const response = await fetch(serverUrl, { 
        method: 'GET',
        headers: { 'Accept': 'text/plain' }
      });
      const text = await response.text();
      
      if (text.includes('Connexion success')) {
        addResult('Connexion', true, `✅ Serveur accessible : ${text}`);
        return true;
      } else {
        addResult('Connexion', false, `❌ Réponse invalide : ${text}`);
        return false;
      }
    } catch (error) {
      addResult('Connexion', false, `❌ Erreur : ${error.message}`);
      return false;
    }
  };

  // Test 2: Récupération des modèles
  const testGetModels = async () => {
    try {
      addResult('Modèles', null, 'Récupération...');
      const response = await fetch(`${serverUrl}/getmodels`);
      const models = await response.json();
      
      if (Array.isArray(models)) {
        addResult('Modèles', true, `✅ ${models.length} modèles : ${models.join(', ')}`);
        return models;
      } else {
        addResult('Modèles', false, '❌ Format invalide');
        return [];
      }
    } catch (error) {
      addResult('Modèles', false, `❌ Erreur : ${error.message}`);
      return [];
    }
  };

  // Test 3: Sélection d'un modèle
  const testSelectModel = async (modelName) => {
    try {
      addResult('Sélection', null, `Sélection de ${modelName}...`);
      const response = await fetch(`${serverUrl}/selectModel/${modelName}`);
      const result = await response.json();
      
      if (result.status === 'ok') {
        addResult('Sélection', true, `✅ ${modelName} sélectionné`);
        return true;
      } else {
        addResult('Sélection', false, `❌ Erreur sélection`);
        return false;
      }
    } catch (error) {
      addResult('Sélection', false, `❌ Erreur : ${error.message}`);
      return false;
    }
  };

  // Test 4: Info serveur
  const testServerInfo = async () => {
    try {
      addResult('Info', null, 'Récupération infos...');
      const response = await fetch(`${serverUrl}/info`);
      const info = await response.json();
      
      addResult('Info', true, `✅ Version: ${info.version || 'N/A'}`);
      addResult('Info', true, `✅ Modèle actuel: ${info.selected_model || 'N/A'}`);
      addResult('Info', true, `✅ Script process: ${info.process_script_exists ? 'Présent' : 'Absent'}`);
      
      if (info.available_models && info.available_models.length > 0) {
        addResult('Info', true, `✅ Modèles trouvés: ${info.available_models.join(', ')}`);
      } else {
        addResult('Info', false, '⚠️ Aucun modèle trouvé (mode démo)');
      }
      
      return true;
    } catch (error) {
      addResult('Info', false, `❌ Erreur : ${error.message}`);
      return false;
    }
  };

  // Test 5: Upload factice
  const testUpload = async () => {
    try {
      addResult('Upload', null, 'Test upload...');
      
      const formData = new FormData();
      // Créer un blob factice
      formData.append('audio', {
        uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQgAAAAAAAAAAAA=',
        name: 'test.wav',
        type: 'audio/wav'
      });

      const response = await fetch(`${serverUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        addResult('Upload', true, `✅ Upload accepté : ${result.msg || 'OK'}`);
        return true;
      } else {
        const error = await response.text();
        addResult('Upload', false, `❌ Erreur ${response.status} : ${error}`);
        return false;
      }
    } catch (error) {
      addResult('Upload', false, `❌ Erreur : ${error.message}`);
      return false;
    }
  };

  // Lancer tous les tests
  const runAllTests = async () => {
    setTesting(true);
    clearResults();
    
    addResult('Début', true, `🚀 Tests sur ${serverUrl}`);
    
    // Test 1: Connexion
    const connected = await testConnection();
    if (!connected) {
      addResult('Fin', false, '❌ Connexion impossible - Tests arrêtés');
      setTesting(false);
      return;
    }
    
    // Test 2: Modèles
    const models = await testGetModels();
    
    // Test 3: Sélection
    if (models.length > 0) {
      await testSelectModel(models[0]);
    }
    
    // Test 4: Info
    await testServerInfo();
    
    // Test 5: Upload
    await testUpload();
    
    addResult('Fin', true, '✅ Tests terminés');
    setTesting(false);
  };

  // Suggestions d'IP
  const suggestIPs = () => {
    Alert.alert(
      "Suggestions d'IP",
      "Essayez ces adresses selon votre configuration :\n\n" +
      "• Android émulateur : http://10.0.2.2:5000\n" +
      "• iOS simulateur : http://localhost:5000\n" +
      "• Appareil physique : http://[IP_DE_VOTRE_PC]:5000\n\n" +
      "Pour trouver votre IP :\n" +
      "Windows : ipconfig\n" +
      "Mac/Linux : ifconfig",
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Debug Serveur RAVE</Text>
      
      {/* Configuration URL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>URL du serveur</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://192.168.1.100:5000"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={styles.helpButton} onPress={suggestIPs}>
          <Text style={styles.helpText}>💡 Suggestions d'IP</Text>
        </Pressable>
      </View>

      {/* Boutons de test */}
      <View style={styles.buttonRow}>
        <Pressable 
          style={[styles.button, testing && styles.buttonDisabled]} 
          onPress={runAllTests}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🚀 Lancer tous les tests</Text>
          )}
        </Pressable>
        
        <Pressable 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>🗑️ Effacer</Text>
        </Pressable>
      </View>

      {/* Tests individuels */}
      <View style={styles.individualTests}>
        <Text style={styles.sectionTitle}>Tests individuels</Text>
        <View style={styles.testButtonsGrid}>
          <Pressable 
            style={[styles.smallButton, testing && styles.buttonDisabled]} 
            onPress={testConnection}
            disabled={testing}
          >
            <Text style={styles.smallButtonText}>Connexion</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.smallButton, testing && styles.buttonDisabled]} 
            onPress={testGetModels}
            disabled={testing}
          >
            <Text style={styles.smallButtonText}>Modèles</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.smallButton, testing && styles.buttonDisabled]} 
            onPress={testServerInfo}
            disabled={testing}
          >
            <Text style={styles.smallButtonText}>Info</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.smallButton, testing && styles.buttonDisabled]} 
            onPress={testUpload}
            disabled={testing}
          >
            <Text style={styles.smallButtonText}>Upload</Text>
          </Pressable>
        </View>
      </View>

      {/* Résultats */}
      <View style={styles.results}>
        <Text style={styles.sectionTitle}>Résultats des tests</Text>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>Aucun test lancé</Text>
        ) : (
          testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.resultTime}>{result.time}</Text>
              <Text style={[
                styles.resultText,
                result.success === true && styles.resultSuccess,
                result.success === false && styles.resultError
              ]}>
                [{result.test}] {result.message}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>📝 Instructions</Text>
        <Text style={styles.instructionText}>
          1. Lancez votre serveur Python : python server.py{'\n'}
          2. Entrez l'URL du serveur (IP:PORT){'\n'}
          3. Lancez les tests{'\n'}
          4. Si "Connexion" échoue, vérifiez IP et pare-feu{'\n'}
          5. Si "Upload" échoue, vérifiez le nom du champ (doit être "audio")
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#0ff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#555',
  },
  helpButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  helpText: {
    color: '#0ff',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#0088cc',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#666',
    flex: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  individualTests: {
    marginBottom: 20,
  },
  testButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  smallButton: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  results: {
    backgroundColor: '#0a0a0a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    minHeight: 200,
  },
  noResults: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  resultItem: {
    marginBottom: 8,
  },
  resultTime: {
    color: '#666',
    fontSize: 10,
  },
  resultText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  resultSuccess: {
    color: '#0f0',
  },
  resultError: {
    color: '#f00',
  },
  instructions: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  instructionTitle: {
    color: '#0ff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
  },
});