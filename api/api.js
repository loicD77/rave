import * as FileSystem from 'expo-file-system';

// Fonction pour tester la connexion au serveur
export const testServerConnection = async (ip, port) => {
  try {
    console.log(`🔗 Test de connexion au serveur ${ip}:${port}`);
    const response = await fetch(`http://${ip}:${port}/`, {
      method: 'GET',
      timeout: 10000,
    });
    
    if (response.ok) {
      const text = await response.text();
      console.log('✅ Réponse serveur:', text);
      return { success: true, message: text };
    } else {
      throw new Error(`Serveur répond avec le statut: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion serveur:', error);
    return { success: false, error: error.message };
  }
};

// Fonction pour obtenir la liste des modèles
export const getModels = async (ip, port) => {
  try {
    console.log(`📋 Récupération des modèles depuis ${ip}:${port}`);
    const response = await fetch(`http://${ip}:${port}/getmodels`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    if (response.ok) {
      const models = await response.json();
      console.log('✅ Modèles récupérés:', models);
      return models;
    } else {
      throw new Error(`Erreur lors de la récupération des modèles: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur récupération modèles:', error);
    throw error;
  }
};

// Fonction pour sélectionner un modèle
export const selectModel = async (ip, port, modelName) => {
  try {
    console.log(`🎯 Sélection du modèle ${modelName} sur ${ip}:${port}`);
    const response = await fetch(`http://${ip}:${port}/selectModel/${modelName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Modèle sélectionné:', result);
      return result;
    } else {
      const errorText = await response.text();
      throw new Error(`Erreur sélection modèle (${response.status}): ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Erreur sélection modèle:', error);
    throw error;
  }
};

// Fonction pour uploader un fichier
export const uploadFile = async (fileUri, ip, port) => {
  try {
    console.log(`⬆️ Upload du fichier ${fileUri} vers ${ip}:${port}`);
    
    // Vérifier que le fichier existe
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Le fichier source n\'existe pas');
    }
    
    console.log('📁 Info fichier:', fileInfo);
    
    // Préparer les données du formulaire
    const formData = new FormData();
    
    // Déterminer le nom et le type du fichier
    const fileName = fileUri.split('/').pop() || 'audio.wav';
    const fileType = fileName.toLowerCase().endsWith('.wav') ? 'audio/wav' : 'audio/m4a';
    
    // Ajouter le fichier au FormData
    formData.append('file', {
      uri: fileUri,
      type: fileType,
      name: fileName,
    });
    
    console.log(`📤 Upload de ${fileName} (${fileType})`);
    
    const response = await fetch(`http://${ip}:${port}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 1 minute pour l'upload et le traitement
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Fichier uploadé avec succès:', result);
      return result;
    } else {
      const errorText = await response.text();
      throw new Error(`Erreur upload (${response.status}): ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Erreur upload fichier:', error);
    throw error;
  }
};

// Fonction pour télécharger le fichier transformé
export const downloadFile = async (ip, port, destinationUri) => {
  try {
    console.log(`⬇️ Téléchargement depuis ${ip}:${port} vers ${destinationUri}`);
    
    const downloadUrl = `http://${ip}:${port}/download`;
    
    const downloadResult = await FileSystem.downloadAsync(
      downloadUrl,
      destinationUri,
      {
        headers: {
          'Accept': 'audio/wav',
        },
      }
    );
    
    console.log('📥 Résultat téléchargement:', downloadResult);
    
    if (downloadResult.status === 200) {
      // Vérifier que le fichier a bien été téléchargé
      const fileInfo = await FileSystem.getInfoAsync(destinationUri);
      console.log('📁 Info fichier téléchargé:', fileInfo);
      
      if (fileInfo.exists && fileInfo.size > 0) {
        console.log('✅ Fichier téléchargé avec succès');
        return destinationUri;
      } else {
        throw new Error('Le fichier téléchargé est vide ou n\'existe pas');
      }
    } else {
      throw new Error(`Erreur téléchargement: ${downloadResult.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur téléchargement fichier:', error);
    throw error;
  }
};

// Fonction helper pour valider les paramètres du serveur
export const validateServerParams = (ip, port) => {
  if (!ip || !port) {
    return { valid: false, error: 'IP et port requis' };
  }
  
  // Validation de l'IP (basique)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return { valid: false, error: 'Format IP invalide' };
  }
  
  // Validation du port
  const portNum = parseInt(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return { valid: false, error: 'Port invalide (1-65535)' };
  }
  
  return { valid: true };
};

// Configuration par défaut
export const DEFAULT_CONFIG = {
  ip: '192.168.1.100',
  port: '5000',
  timeout: 30000,
  models: ['Jazz', 'Darbouka', 'Parole', 'Chats', 'Chiens'],
};