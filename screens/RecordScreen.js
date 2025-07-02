/* RecordScreen.js */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

/* ----------- CONSTANTES ----------- */
const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';

/* ============= COMPOSANT PRINCIPAL ============= */
export default function RecordScreen() {
  /* ----------- ÉTATS ----------- */
  const [recording,       setRecording]       = useState(null);   // instance Audio.Recording
  const [isRecording,     setIsRecording]     = useState(false);  // bool d’enregistrement
  const [recordings,      setRecordings]      = useState([]);     // [{ name, uri, duration }]
  const [currentSound,    setCurrentSound]    = useState(null);   // instance Audio.Sound
  const [playingUri,      setPlayingUri]      = useState(null);   // uri en lecture
  const [loading,         setLoading]         = useState(false);  // spinner liste
  const [nameModal,       setNameModal]       = useState(false);  // modal saisie nom (Android)
  const [tempName,        setTempName]        = useState('');     // valeur TextInput modal
  const [pendingRecord,   setPendingRecord]   = useState(null);   // { uri, durationMillis }

  /* ----------- CRÉER DOSSIER + CHARGER LISTE ----------- */
  useEffect(() => {
    (async () => {
      const dirInfo = await FileSystem.getInfoAsync(RECORDINGS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
      }
      await loadSavedRecordings();
    })();
  }, []);

  /* ======================================================
   *                 ENREGISTREMENT
   * ==================================================== */
  const startRecording = async () => {
    try {
      await stopPlayback(); // couper lecture en cours

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Impossible d’utiliser le micro');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      console.error('startRecording error:', err);
      Alert.alert('Erreur', err.message);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const { durationMillis } = await recording.createNewLoadedSoundAsync();
      setRecording(null);
      setIsRecording(false);

      /* ---------- Choisir un nom ---------- */
      if (Platform.OS === 'ios') {
        let fileName = '';
        await new Promise((resolve) => {
          Alert.prompt(
            'Nom du fichier',
            'Choisissez un nom pour votre enregistrement',
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve() },
              { text: 'OK',      onPress: (text) => { fileName = text.trim(); resolve(); } },
            ],
            'plain-text',
            '',
            'default'
          );
        });
        if (!fileName) { await FileSystem.deleteAsync(uri, { idempotent: true }); return; }

        await saveRecording(uri, durationMillis, fileName);
      } else {
        /* Android : on ouvre une petite modal custom */
        setTempName('');
        setPendingRecord({ uri, durationMillis });
        setNameModal(true);
      }
    } catch (err) {
      console.error('stopRecording error:', err);
      Alert.alert('Erreur', err.message);
    }
  };

  /* ----------- SAUVEGARDE FINALE (move + maj liste) ----------- */
  const saveRecording = async (srcUri, durationMillis, fileName) => {
    try {
      const ext       = srcUri.split('.').pop();          // garder l’extension d’origine
      const safeName  = fileName || `recording_${Date.now()}`;
      const destUri   = `${RECORDINGS_DIR}${safeName}.${ext}`;

      await FileSystem.moveAsync({ from: srcUri, to: destUri });

      const newEntry  = { name: safeName, uri: destUri, duration: durationMillis };
      const newList   = [newEntry, ...recordings];

      setRecordings(newList);
      await AsyncStorage.setItem('recordings', JSON.stringify(newList));
    } catch (err) {
      console.error('saveRecording error:', err);
      Alert.alert('Erreur', err.message);
    }
  };

  /* ======================================================
   *                 LECTURE
   * ==================================================== */
  const togglePlay = async (item) => {
    try {
      if (playingUri === item.uri) {
        if (currentSound) {
          const status = await currentSound.getStatusAsync();
          status.isPlaying
            ? await currentSound.pauseAsync()
            : await currentSound.playAsync();
        }
        return;
      }

      await stopPlayback();

      const { sound } = await Audio.Sound.createAsync(
        { uri: item.uri },
        { shouldPlay: true }
      );
      setCurrentSound(sound);
      setPlayingUri(item.uri);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) stopPlayback();
      });
    } catch (err) {
      console.error('togglePlay error:', err);
    }
  };

  const stopPlayback = async () => {
    try { if (currentSound) await currentSound.unloadAsync(); }
    catch (err) { console.error('stopPlayback error:', err); }
    finally {
      setCurrentSound(null);
      setPlayingUri(null);
    }
  };

  /* ======================================================
   *                 SUPPRESSION
   * ==================================================== */
  const deleteRecording = async (item) => {
    try {
      await stopPlayback();
      await FileSystem.deleteAsync(item.uri, { idempotent: true });
      const newList = recordings.filter((r) => r.uri !== item.uri);
      setRecordings(newList);
      await AsyncStorage.setItem('recordings', JSON.stringify(newList));
    } catch (err) {
      console.error('deleteRecording error:', err);
      Alert.alert('Erreur', err.message);
    }
  };

  /* ======================================================
   *                 CHARGER LISTE
   * ==================================================== */
  const loadSavedRecordings = async () => {
    setLoading(true);
    try {
      const json = await AsyncStorage.getItem('recordings');
      if (json) setRecordings(JSON.parse(json));
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
   *                 RENDER ITEM
   * ==================================================== */
  const renderItem = ({ item }) => {
    const playing = playingUri === item.uri;
    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity style={styles.playPauseButton} onPress={() => togglePlay(item)}>
          <Ionicons name={playing ? 'pause' : 'play'} size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDuration}>{(item.duration / 1000).toFixed(1)} s</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert(
              'Supprimer',
              `Supprimer « ${item.name} » ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Supprimer', style: 'destructive', onPress: () => deleteRecording(item) },
              ]
            )
          }
        >
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  /* ======================================================
   *                 UI PRINCIPALE
   * ==================================================== */
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0F23', '#1a1a2e', '#16213e']} style={styles.gradient}>
        <Text style={styles.title}>🎙️ Enregistreur</Text>

        {/* Bouton REC / STOP */}
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: isRecording ? '#D32F2F' : '#4CAF50' }]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={30} color="#fff" />
          <Text style={styles.recordButtonText}>{isRecording ? 'Stop' : 'Rec'}</Text>
        </TouchableOpacity>

        {/* Liste enregistrements */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Mes enregistrements</Text>
          {loading && <ActivityIndicator color="#00ffff" />}
          {!loading && (
            <FlatList
              data={recordings}
              keyExtractor={(item) => item.uri}
              renderItem={renderItem}
              ListEmptyComponent={<Text style={styles.emptyText}>Aucun enregistrement.</Text>}
            />
          )}
        </View>

        {/* ---------- MODAL NOM (Android) ---------- */}
        <Modal
          visible={nameModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setNameModal(false);
            if (pendingRecord) FileSystem.deleteAsync(pendingRecord.uri, { idempotent: true });
            setPendingRecord(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Nom de l’enregistrement</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="ex. guitare_essai"
                placeholderTextColor="#888"
                value={tempName}
                onChangeText={setTempName}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#777' }]}
                  onPress={() => {
                    setNameModal(false);
                    if (pendingRecord) FileSystem.deleteAsync(pendingRecord.uri, { idempotent: true });
                    setPendingRecord(null);
                  }}
                >
                  <Text style={styles.modalBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#4CAF50' }]}
                  onPress={async () => {
                    const name = tempName.trim() || `recording_${Date.now()}`;
                    await saveRecording(pendingRecord.uri, pendingRecord.durationMillis, name);
                    setNameModal(false);
                    setPendingRecord(null);
                    setTempName('');
                  }}
                >
                  <Text style={styles.modalBtnText}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

/* ----------------------- STYLES ----------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 25 },

  recordButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 30,
  },
  recordButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },

  listContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
  },
  listTitle: {
    color: '#00ffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: { color: '#ccc', textAlign: 'center', marginTop: 20 },

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 1,
  },
  playPauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0099cc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3860',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, marginHorizontal: 10 },
  itemName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  itemDuration: { color: '#aaa', fontSize: 12 },

  /* ----- MODAL ANDROID ----- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { color: '#fff', fontSize: 18, marginBottom: 15, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
});
