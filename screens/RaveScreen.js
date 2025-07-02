// RaveScreen.js – v6.0 CORRIGÉE
//------------------------------------------------------------
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Platform,
  TouchableOpacity,
  ToastAndroid,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";

/* --- Paramètres réseau ----------------------------------- */
// ⚠️ IMPORTANT : Modifiez cette IP avec celle de votre ordinateur !
const SERVER_IP   = "192.168.8.107"; // Changez avec votre IP locale
const SERVER_PORT = "5000";
const SERVER_URL  = `http://${SERVER_IP}:${SERVER_PORT}`;

// Pour Android émulateur, utilisez :
// const SERVER_URL = "http://10.0.2.2:5000";

// Pour iOS simulateur, utilisez :
// const SERVER_URL = "http://localhost:5000";

/* --- Dimensions écran ------------------------------------ */
const { width } = Dimensions.get("window");

/* --- Utilitaire pour infos fichier ---------------------- */
async function getFileInfo(uri) {
  const name = uri.split("/").pop() || `clip_${Date.now()}.wav`;
   const ext  = name.split(".").pop().toLowerCase();
   let mime;
   if (ext === "wav")  mime = "audio/wav";
   else if (ext === "m4a") mime = "audio/x-m4a";
   else if (ext === "mp3") mime = "audio/mpeg";
   else if (ext === "ts")  mime = "video/mp2t";
   else                mime = "application/octet-stream";
  return { name, mime };
}

/* ========================================================= */
export default function RaveScreen() {
  /* ---------- États principaux --------------------------- */
  const [originalUri,      setOriginalUri]      = useState(null);
  const [originalName,     setOriginalName]     = useState("");
  const [transformedUri,   setTransformedUri]   = useState(null);
  const [selectedModel,    setSelectedModel]    = useState("");
  const [serverConnected,  setServerConnected]  = useState(false);
  const [availableModels,  setAvailableModels]  = useState([]);

  /* ---------- États réseau ------------------------------- */
  const [uploading,        setUploading]        = useState(false);
  const [downloading,      setDownloading]      = useState(false);
  const [uploadProgress,   setUploadProgress]   = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);

  /* ---------- États lecteur ------------------------------ */
  const [isPlaying,        setIsPlaying]        = useState(false);
  const [playbackPos,      setPlaybackPos]      = useState(0);
  const [duration,         setDuration]         = useState(0);
  const [volume,           setVolume]           = useState(1);
  const [rate,             setRate]             = useState(1);
  const [seeking,          setSeeking]          = useState(false);
  const [tempSeek,         setTempSeek]         = useState(0);

  /* ---------- Interface ---------------------------------- */
  const [progressW, setProgressW] = useState(width - 100);
  const [tab,       setTab]       = useState(0);

  /* ---------- Enregistrements ---------------------------- */
  const [recordings, setRecordings] = useState([]);

  /* ---------- Références --------------------------------- */
  const soundRef          = useRef(null);
  const updateIntervalRef = useRef(null);
  const pulseAnim         = useRef(new Animated.Value(1)).current;

  /* ---------- Assets locaux ------------------------------ */
  const localAssets = [
    { id: "piano",    name: "Piano",    icon: "🎹", file: require("../assets/piano.wav") },
    { id: "voix",     name: "Voix",     icon: "🎤", file: require("../assets/voix.wav") },
    { id: "chat",     name: "Chat",     icon: "🐱", file: require("../assets/chat.wav") },
    { id: "chien",    name: "Chien",    icon: "🐕", file: require("../assets/chien.wav") },
    { id: "dbk",      name: "Darbouka", icon: "🥁", file: require("../assets/darbouka.wav") },
  ];

  const publicSounds = [
    { name: "Piano fun bonus", icon: "🎹", url: "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3", d: "5:48s" },
  
  ];

  /* ---------- 0. Config audio et test serveur ------------ */
  useEffect(() => {
    const init = async () => {
      // Configuration audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Test connexion serveur
      await testServerConnection();
      
      // Récupérer les modèles
      await fetchModels();
    };
    init();
  }, []);

  /* ---------- Test connexion serveur --------------------- */
  const testServerConnection = async () => {
    try {
      console.log('🔍 Test connexion serveur:', SERVER_URL);
      const response = await fetch(SERVER_URL, { timeout: 5000 });
      const text = await response.text();
      
      if (text.includes("Connexion success")) {
        setServerConnected(true);
        console.log('✅ Serveur connecté');
        showToast("Serveur connecté ✅");
      } else {
        throw new Error("Réponse invalide");
      }
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      setServerConnected(false);
      Alert.alert(
        "⚠️ Serveur non disponible",
        `Impossible de se connecter au serveur.\n\nVérifiez :\n- Que le serveur est lancé\n- L'adresse IP (${SERVER_IP})\n- Le pare-feu`,
        [
          { text: "Réessayer", onPress: testServerConnection },
          { text: "OK" }
        ]
      );
    }
  };

  /* ---------- Récupérer les modèles du serveur ----------- */
 const fetchModels = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/getmodels`);
    const models = await response.json();
    setAvailableModels(models);
    console.log('📋 Modèles disponibles:', models);
    // ← Prérequis pour que le bouton s'active immédiatement :
    if (models.length > 0) {
      setSelectedModel(models[0]);
    }
  } catch (error) {
    console.error('❌ Erreur récupération modèles:', error);
    const fallback = ["Jazz", "Parole", "Darbouka", "Chats", "Chiens"];
    setAvailableModels(fallback);
    setSelectedModel(fallback[0]);
  }
};


  /* ---------- 1. Récupération enregistrements ------------ */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("recordings");
      if (saved) setRecordings(JSON.parse(saved));
    })();
  }, []);

  /* ---------- 2. Animation pulsation titre --------------- */
  useEffect(() => {
    const loop = () =>
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 2000, useNativeDriver: true }),
      ]).start(loop);
    loop();
  }, [pulseAnim]);

  /* ---------- 3. Suivi position Android ------------------ */
  useEffect(() => {
    if (Platform.OS === "android" && soundRef.current && isPlaying) {
      updateIntervalRef.current = setInterval(async () => {
        try {
          const st = await soundRef.current.getStatusAsync();
          if (st.isLoaded && !seeking) {
            setPlaybackPos(st.positionMillis || 0);
            setDuration(st.durationMillis || 0);
            if (st.didJustFinish) setIsPlaying(false);
          }
        } catch (e) {
          console.error('Erreur status:', e);
        }
      }, 100);
    } else if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    return () => {
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [isPlaying, seeking]);

  /* ---------- 4. Nettoyage unmount ----------------------- */
  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  /* ==========  UTILITAIRES  ============================== */
  const time = (ms) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  const diagnose = (e) => {
    if (e.message.includes("Network")) return "Problème réseau. Vérifiez la connexion.";
    if (e.message.includes("Failed to fetch")) return "Impossible de joindre le serveur";
    if (e.message.includes("unsupported")) return "Format audio non supporté";
    return e.message || "Erreur inconnue";
  };

  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("Info", msg);
    }
  };

  /* ==========  CHARGEMENT DE SONS  ======================= */
  const loadAsset = async (s) => {
    try {
      const a = Asset.fromModule(s.file);
      await a.downloadAsync();
      setOriginalUri(a.localUri || a.uri);
      setOriginalName(s.name);
      setTransformedUri(null);
      showToast(`✅ ${s.name} chargé`);
    } catch (e) {
      Alert.alert("Erreur", diagnose(e));
    }
  };

  const loadPublic = async (s) => {
    setOriginalUri(s.url);
    setOriginalName(s.name);
    setTransformedUri(null);
    showToast(`✅ ${s.name} chargé`);
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ 
      type: ["*/*"],
        copyToCacheDirectory: true 
      });
      if (!res.canceled && res.assets?.[0]) {
        const f = res.assets[0];
        setOriginalUri(f.uri);
        setOriginalName(f.name);
        setTransformedUri(null);
        showToast(`✅ ${f.name} sélectionné`);
      }
    } catch (e) {
      Alert.alert("Erreur", diagnose(e));
    }
  };

  /* ==========  LECTEUR  ================================== */
 const loadIntoPlayer = async (uri, label) => {
  try {
    // ========== Web ==========
    if (Platform.OS === "web") {
      const audio = new window.Audio(uri);
      audio.play();
      showToast(`🎧 ${label} (Web) en cours de lecture`);
      return;
    }
    // ========== Mobile ==========
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      {
        shouldPlay: false,
        progressUpdateIntervalMillis: 100,
        volume,
        rate,
      }
    );
    sound.setOnPlaybackStatusUpdate((st) => {
      if (st.isLoaded && !seeking) {
        setDuration(st.durationMillis || 0);
        setPlaybackPos(st.positionMillis || 0);
        setIsPlaying(st.isPlaying || false);
        if (st.didJustFinish) {
          setIsPlaying(false);
          setPlaybackPos(0);
        }
      }
    });
    soundRef.current = sound;
    showToast(`🎧 ${label} chargé dans le lecteur`);
  } catch (e) {
    Alert.alert("Erreur lecteur", diagnose(e));
  }
};


  const playPause = async () => {
    if (!soundRef.current) return Alert.alert("Aucun son", "Chargez d'abord un son dans le lecteur");
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        if (playbackPos >= duration - 100 && duration > 0) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
      }
    } catch (e) {
      Alert.alert("Erreur", diagnose(e));
    }
  };

  const stop = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.setPositionAsync(0);
    }
    setIsPlaying(false);
    setPlaybackPos(0);
  };

  const skip = async (sec) => {
    if (!soundRef.current || duration === 0) return;
    const pos = Math.max(0, Math.min(playbackPos + sec * 1000, duration));
    await soundRef.current.setPositionAsync(pos);
    setPlaybackPos(pos);
  };

  /* ==========  UPLOAD / DOWNLOAD CORRIGÉ ================= */
  // Remplacez la fonction sendToServer dans RaveScreen.js par celle-ci :


/* ==========  UPLOAD / DOWNLOAD CORRIGÉ ================= */
/* ==========  UPLOAD / DOWNLOAD CORRIGÉ ================= */
const sendToServer = async () => {
  if (!originalUri)     return Alert.alert("Erreur", "Aucun son sélectionné");
  if (!selectedModel)   return Alert.alert("Erreur", "Choisissez un modèle");
  if (!serverConnected) return Alert.alert("Erreur", "Serveur non connecté");

  try {
    // 1️⃣ Sélection du modèle
    await fetch(`${SERVER_URL}/selectModel/${selectedModel}`);

    // 2️⃣ Préparation du FormData
    setUploading(true);
    setUploadProgress(0);
    const { name, mime } = await getFileInfo(originalUri);
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const blob = await (await fetch(originalUri)).blob();
      formData.append("audio", blob, name);
    } else {
      formData.append("audio", { uri: originalUri.replace("file://",""), name, type: mime });
    }

    // 3️⃣ Envoi
    const uploadRes = await fetch(`${SERVER_URL}/upload`, {
      method: "POST",
      body: formData
    });
    if (!uploadRes.ok) throw new Error(await uploadRes.text());
    setUploading(false);

    // 4️⃣ Téléchargement du transformé
    setDownloading(true);
    let uri;
    if (Platform.OS === "web") {
      // Web : fetch + blob → objectURL
      const resp = await fetch(`${SERVER_URL}/download`);
      const blob = await resp.blob();
      uri = URL.createObjectURL(blob);
      setDownloadProgress(100);
    } else {
      // Mobile : expo-file-system
      const dest = FileSystem.documentDirectory + `transformed_${Date.now()}.wav`;
      const dl = await FileSystem.downloadAsync(
        `${SERVER_URL}/download`,
        dest,
        {
          downloadProgressCallback: p =>
            setDownloadProgress((p.totalBytesWritten / p.totalBytesExpectedToWrite) * 100)
        }
      );
      uri = dl.uri;
    }
    setDownloading(false);

    // 5️⃣ MàJ de l’état et alerte
    console.log("🏁 Téléchargement terminé, uri =", uri);
    setTransformedUri(uri);

    Alert.alert(
      "🎉 Transformation terminée !",
      `Modèle : ${selectedModel}`,
      [
        { text: "OK" },
        { text: "Écouter", onPress: () => loadIntoPlayer(uri, "TRANSFORMÉ") }
      ]
    );
  } catch (e) {
    console.error("❌ sendToServer error:", e);
    setUploading(false);
    setDownloading(false);
    setUploadProgress(0);
    setDownloadProgress(0);
    Alert.alert(
      "Erreur de transfert",
      e.message || "Erreur inconnue",
      [
        { text: "OK" },
        { text: "Réessayer", onPress: sendToServer }
      ]
    );
  }
};


  /* ==========  BARRE PROGRESSION  ======================== */
  const seekPress = async (e) => {
    if (!soundRef.current || duration === 0) return;
    const pct = Math.min(Math.max(e.nativeEvent.locationX / progressW, 0), 1);
    const pos = pct * duration;
    setSeeking(true);
    await soundRef.current.setPositionAsync(pos);
    setPlaybackPos(pos);
    setTimeout(() => setSeeking(false), 100);
  };

  const seekStart = (e) => {
    const pct = Math.min(Math.max(e.nativeEvent.locationX / progressW, 0), 1);
    setTempSeek(pct * duration);
    setSeeking(true);
  };

  const seekEnd = () => setSeeking(false);

  /* ==========  RENDER ONGLET  ============================ */
  const TabContent = () => {
    if (tab === 0)
      return (
        <View style={styles.tabContent}>
          <Text style={styles.tabDescription}>Assets locaux de l'application</Text>
          <View style={styles.soundGrid}>
            {localAssets.map((s) => (
              <Pressable
                key={s.id}
                style={[
                  styles.soundButton,
                  originalName === s.name && styles.soundButtonActive,
                ]}
                onPress={() => loadAsset(s)}
              >
                <Text style={styles.soundIcon}>{s.icon}</Text>
                <Text style={styles.soundText}>{s.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    if (tab === 1)
      return (
        <View style={styles.tabContent}>
          <Text style={styles.tabDescription}>Sons de démonstration en ligne</Text>
          <View style={styles.soundGrid}>
            {publicSounds.map((s) => (
              <Pressable
                key={s.name}
                style={[
                  styles.soundButton,
                  originalName === s.name && styles.soundButtonActive,
                ]}
                onPress={() => loadPublic(s)}
              >
                <Text style={styles.soundIcon}>{s.icon}</Text>
                <Text style={styles.soundText}>{s.name}</Text>
                <Text style={styles.soundDuration}>{s.d}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    if (tab === 2)
      return (
        <View style={styles.tabContent}>
          <Text style={styles.tabDescription}>Importer un fichier audio</Text>
          <Pressable style={styles.pickButton} onPress={pickFile}>
            <LinearGradient
              colors={["#00ffff", "#0099cc", "#006699"]}
              style={styles.buttonGradient}
            >
              <Ionicons name="folder-open" size={24} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.buttonText}>SÉLECTIONNER</Text>
            </LinearGradient>
          </Pressable>
          {!!originalName && tab === 2 && (
            <View style={styles.selectedFileInfo}>
              <Text style={styles.selectedFileText}>Fichier sélectionné :</Text>
              <Text style={styles.selectedFileName}>{originalName}</Text>
            </View>
          )}
        </View>
      );
    return (
      <View style={styles.tabContent}>
        <Text style={styles.tabDescription}>Mes enregistrements</Text>
        <View style={styles.soundGrid}>
          {recordings.map((r) => (
            <Pressable
              key={r.uri}
              style={[
                styles.soundButton,
                originalUri === r.uri && styles.soundButtonActive,
              ]}
              onPress={() => {
                setOriginalUri(r.uri);
                setOriginalName(r.name);
                setTransformedUri(null);
                showToast(`✅ ${r.name} sélectionné`);
              }}
            >
              <Ionicons name="musical-notes" size={24} color="#fff" />
              <Text style={styles.soundText}>{r.name}</Text>
            </Pressable>
          ))}
          {recordings.length === 0 && (
            <Text style={{ color: "#888", width: "100%", textAlign: "center" }}>
              Aucun enregistrement
            </Text>
          )}
        </View>
      </View>
    );
  };

  /* ==========  RENDER PRINCIPAL  ========================= */
  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a0a", "#16213e", "#0f3460"]} style={styles.background}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* ---------- Header ---------- */}
          <Animated.View style={[styles.header, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient colors={["#ff0080", "#8080ff"]} style={styles.headGradient}>
              <Text style={styles.headTitle}>⚡ RAVE</Text>
            </LinearGradient>
            <Text style={styles.headSub}>NEURAL TIMBRE TRANSFER</Text>
            <Text style={styles.headVer}>v6.0 | Serveur Flask</Text>
            {/* Indicateur de connexion */}
            <View style={styles.serverStatus}>
              <View style={[styles.statusDot, { backgroundColor: serverConnected ? '#0f0' : '#f00' }]} />
              <Text style={styles.statusText}>
                Serveur: {serverConnected ? 'Connecté' : 'Déconnecté'}
              </Text>
              {!serverConnected && (
                <Pressable onPress={testServerConnection} style={{ marginLeft: 10 }}>
                  <Ionicons name="refresh" size={16} color="#0ff" />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* ---------- Lecteur ---------- */}
          <View style={styles.player}>
            <Text style={styles.section}>🎧 LECTEUR AUDIO</Text>
            <View style={styles.trackBox}>
              <Text style={styles.trackTitle}>
                {originalName || "Aucun son sélectionné"}
              </Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.time}>{time(seeking ? tempSeek : playbackPos)}</Text>
              <View
                style={styles.progressWrap}
                onLayout={(e) => setProgressW(e.nativeEvent.layout.width)}
              >
                <TouchableOpacity
                  style={styles.progressTouch}
                  activeOpacity={0.9}
                  onPress={seekPress}
                  onPressIn={seekStart}
                  onPressOut={seekEnd}
                >
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { 
                          width: duration ? `${((seeking ? tempSeek : playbackPos) / duration) * 100}%` : "0%",
                          backgroundColor: seeking ? '#ff6b6b' : '#0ff'
                        }
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <Text style={styles.time}>{time(duration)}</Text>
            </View>
            <View style={styles.ctrlRow}>
              <Pressable onPress={() => skip(-15)}>
                <Ionicons name="play-back" size={24} color="#0ff" />
              </Pressable>
              <Pressable onPress={() => skip(-5)}>
                <Ionicons name="play-skip-back" size={20} color="#fff" />
              </Pressable>
              <Pressable onPress={playPause} style={styles.bigBtn}>
                <LinearGradient 
                  colors={isPlaying ? ['#f44', '#c00'] : ['#4a4', '#393']} 
                  style={styles.bigBtnGrad}
                >
                  <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#fff" />
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => skip(5)}>
                <Ionicons name="play-skip-forward" size={20} color="#fff" />
              </Pressable>
              <Pressable onPress={() => skip(15)}>
                <Ionicons name="play-forward" size={24} color="#0ff" />
              </Pressable>
            </View>
            <Pressable onPress={stop} style={styles.stopBtn}>
              <Ionicons name="stop" size={20} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 6 }}>STOP</Text>
            </Pressable>
          </View>

          {/* ---------- Tabs ---------- */}
          <View style={styles.tabs}>
            <Text style={styles.section}>🎵 SÉLECTION SOURCE</Text>
            <View style={styles.tabBar}>
              {[
                { icon: "📦", label: "Assets" },
                { icon: "😎", label: "Bonus" },
                { icon: "📁", label: "Fichier" },
                { icon: "🎙️", label: "Enreg." }
              ].map((item, i) => (
                <Pressable
                  key={i}
                  style={[styles.tabBtn, tab === i && styles.tabBtnActive]}
                  onPress={() => setTab(i)}
                >
                  <Text style={[styles.tabIco, tab === i && styles.tabIcoA]}>{item.icon}</Text>
                  <Text style={[styles.tabLabel, tab === i && styles.tabLabelA]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <TabContent />
</View>
{/* Charger dans lecteur */}
<View style={styles.quick}>
  <Text style={styles.quickTitle}>⚡ CHARGER DANS LE LECTEUR</Text>
  <View style={styles.quickBtns}>
    {/* Bouton ORIGINAL */}
    <Pressable
      style={[styles.quickBtn, !originalUri && styles.disabled]}
      disabled={!originalUri}
      onPress={() => loadIntoPlayer(originalUri, "ORIGINAL")}
    >
      <Ionicons name="musical-note" size={18} color="#fff" style={{ marginRight: 6 }} />
      <Text style={styles.quickTxt}>ORIGINAL</Text>
    </Pressable>

    {/* Bouton TRANSFORMÉ */}
    <Pressable
      style={[styles.quickBtn, !transformedUri && styles.disabled]}
      disabled={!transformedUri}
      onPress={() => loadIntoPlayer(transformedUri, "TRANSFORMÉ")}
    >
      <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 6 }} />
      <Text style={styles.quickTxt}>TRANSFORMÉ</Text>
    </Pressable>
  </View>
</View>


          {/* ---------- Choix modèle ---------- */}
          <View style={styles.sectionBox}>
            <Text style={styles.section}>🧠 MODÈLE NEURAL</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={selectedModel}
                onValueChange={setSelectedModel}
                style={{ color: "#fff", flex: 1 }}
                enabled={serverConnected && availableModels.length > 0}
              >
                <Picker.Item label="Choisir un modèle..." value="" />
                {availableModels.map((m) => (
                  <Picker.Item key={m} label={`🎯 ${m}`} value={m} />
                ))}
              </Picker>
            </View>
            {!serverConnected && (
              <Text style={styles.warningText}>
                ⚠️ Connectez-vous au serveur pour voir les modèles
              </Text>
            )}
          </View>

          {/* ---------- Upload / Download avec progression ---------- */}
          <Pressable
  style={[
    styles.servBtn,
    (uploading || downloading || !originalUri || !selectedModel) && styles.disabled
  ]}
  disabled={uploading || downloading || !originalUri || !selectedModel}
  onPress={sendToServer}
>
            <LinearGradient
              colors={uploading || downloading ? ['#666', '#444'] : ['#099', '#066']}
              style={styles.servBtnGrad}
            >
              {uploading && (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.servTxt}>Upload... {Math.round(uploadProgress)}%</Text>
                </>
              )}
              {downloading && (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.servTxt}>Download... {Math.round(downloadProgress)}%</Text>
                </>
              )}
              {!uploading && !downloading && (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.servTxt}>TRANSFORMER</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {/* ---------- Infos debug ---------- */}
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>🔧 Debug</Text>
            <Text style={styles.debugText}>Serveur: {SERVER_URL}</Text>
            <Text style={styles.debugText}>IP: {SERVER_IP}</Text>
            <Text style={styles.debugText}>
              Pour Android émulateur, utilisez: http://10.0.2.2:5000
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

/* ------------ Styles améliorés --------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  scroll: { padding: 20 },
  
  // Header
  header: { alignItems: "center", marginBottom: 25 },
  headGradient: { padding: 15, paddingHorizontal: 28, borderRadius: 30 },
  headTitle: { fontSize: 40, color: "#fff", fontWeight: "900" },
  headSub: { color: "#0ff", marginTop: 4, fontSize: 14 },
  headVer: { color: "#888", fontSize: 12 },
  
  // Statut serveur
  serverStatus: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10,
    backgroundColor: '#0003',
    padding: 8,
    borderRadius: 20
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#fff', fontSize: 12 },
  
  // Lecteur
  player: { 
    backgroundColor: "#0008", 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#0ff3'
  },
  section: { 
    color: "#0ff", 
    fontSize: 16, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 12 
  },
  trackBox: { alignItems: "center", marginBottom: 12 },
  trackTitle: { color: "#fff", fontSize: 14 },
  
  // Progress
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  time: { color: "#fff", width: 45, textAlign: "center", fontSize: 12 },
  progressWrap: { flex: 1, marginHorizontal: 10 },
  progressTouch: { height: 30, justifyContent: "center" },
  progressBg: { height: 6, backgroundColor: "#fff2", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#0ff" },
  
  // Contrôles
  ctrlRow: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    alignItems: "center", 
    marginBottom: 15 
  },
  bigBtn: { 
    borderRadius: 35,
    overflow: 'hidden'
  },
  bigBtnGrad: {
    padding: 15,
    borderRadius: 35,
  },
  stopBtn: { 
    flexDirection: "row", 
    alignSelf: "center", 
    alignItems: "center",
    backgroundColor: '#6668',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  
  // Tabs
  tabs: { 
    backgroundColor: "#0006", 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 25 
  },
  tabBar: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    marginBottom: 16,
    backgroundColor: '#fff1',
    padding: 4,
    borderRadius: 15
  },
  tabBtn: { 
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1
  },
  tabBtnActive: { backgroundColor: "#0ff5" },
  tabIco: { fontSize: 22, color: "#fff" },
  tabIcoA: { color: "#000" },
  tabLabel: { fontSize: 10, color: '#fff', marginTop: 2 },
  tabLabelA: { color: '#000', fontWeight: 'bold' },
  
  tabContent: { minHeight: 160 },
  tabDescription: { color: "#ccc", textAlign: "center", marginBottom: 12 },
  
  // Grille sons
  soundGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between" 
  },
  soundButton: { 
    width: (width - 80) / 2, 
    backgroundColor: "#fff1", 
    borderRadius: 12, 
    padding: 16, 
    alignItems: "center", 
    marginBottom: 10 
  },
  soundButtonActive: { 
    borderColor: "#0ff", 
    borderWidth: 2,
    backgroundColor: '#0ff2'
  },
  soundIcon: { fontSize: 26 },
  soundText: { color: "#fff", marginTop: 6, fontSize: 13 },
  soundDuration: { color: "#888", fontSize: 10, marginTop: 2 },
  
  // Picker fichier
  pickButton: { alignSelf: "center" },
  buttonGradient: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    borderRadius: 20 
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  selectedFileInfo: { 
    backgroundColor: "#0f04", 
    padding: 12, 
    borderRadius: 10, 
    marginTop: 10 
  },
  selectedFileText: { color: "#0f8", fontSize: 12 },
  selectedFileName: { color: "#fff", fontSize: 13, marginTop: 4 },
  
  // Quick load
  quick: { 
    backgroundColor: '#0006',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20 
  },
  quickTitle: { 
    color: '#0ff', 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 12,
    fontWeight: 'bold'
  },
  quickBtns: { 
    flexDirection: "row", 
    justifyContent: "space-around" 
  },
  quickBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    backgroundColor: "#4a4", 
    borderRadius: 20,
    flex: 0.45
  },
  quickTxt: { color: "#fff", fontWeight: 'bold', fontSize: 13 },
  
  // Désactivé
  disabled: { opacity: 0.4 },
  
  // Bouton serveur
  servBtn: { 
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden'
  },
  servBtnGrad: {
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  servTxt: { color: "#fff", marginLeft: 6, fontWeight: 'bold' },
  
  // Section modèle
  sectionBox: { 
    backgroundColor: "#0006", 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 25 
  },
  pickerWrap: { 
    borderWidth: 1, 
    borderColor: "#0ff4", 
    borderRadius: 10, 
    overflow: "hidden",
    backgroundColor: '#0003'
  },
  warningText: {
    color: '#ff6b6b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic'
  },
  
  // Debug
  debugBox: {
    backgroundColor: '#ff04',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20
  },
  debugTitle: {
    color: '#ff0',
    fontWeight: 'bold',
    marginBottom: 6
  },
  debugText: {
    color: '#ffa',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2
  }
});