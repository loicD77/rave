# test_server.py
# Script de test pour vérifier que le serveur RAVE fonctionne
import requests
import os
import time
import json

# Configuration
SERVER_URL = "http://localhost:5000"
TEST_AUDIO = "test.wav"  # Placez un fichier WAV de test à côté de ce script

def test_connection():
    """Test de connexion basique"""
    print("\n1. Test de connexion...")
    try:
        response = requests.get(f"{SERVER_URL}/")
        if response.status_code == 200:
            print(f"✅ Connexion OK: {response.text}")
            return True
        else:
            print(f"❌ Erreur connexion: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Impossible de se connecter: {e}")
        print("   Vérifiez que le serveur est lancé avec: python server.py")
        return False

def test_get_models():
    """Test de récupération des modèles"""
    print("\n2. Récupération des modèles...")
    try:
        response = requests.get(f"{SERVER_URL}/getmodels")
        if response.status_code == 200:
            models = response.json()
            print(f"✅ Modèles disponibles: {models}")
            return models
        else:
            print(f"❌ Erreur: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return []

def test_server_info():
    """Test des infos serveur"""
    print("\n3. Informations serveur...")
    try:
        response = requests.get(f"{SERVER_URL}/info")
        if response.status_code == 200:
            info = response.json()
            print(f"✅ Infos serveur:")
            print(f"   - Version: {info.get('version', 'N/A')}")
            print(f"   - Modèle actuel: {info.get('selected_model', 'N/A')}")
            print(f"   - Modèles trouvés: {info.get('available_models', [])}")
            print(f"   - Script process_rave.py: {'✅ Présent' if info.get('process_script_exists') else '❌ Manquant'}")
            return True
        else:
            print(f"❌ Erreur: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_select_model(model_name):
    """Test de sélection d'un modèle"""
    print(f"\n4. Sélection du modèle '{model_name}'...")
    try:
        response = requests.get(f"{SERVER_URL}/selectModel/{model_name}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Modèle sélectionné: {result}")
            return True
        else:
            print(f"❌ Erreur: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def test_upload_transform_download():
    """Test complet: upload, transformation, download"""
    print(f"\n5. Test complet avec fichier audio...")
    
    # Vérifier que le fichier test existe
    if not os.path.exists(TEST_AUDIO):
        print(f"❌ Fichier test '{TEST_AUDIO}' introuvable")
        print("   Créez un fichier WAV de test ou modifiez TEST_AUDIO dans ce script")
        return False
    
    try:
        # Upload
        print(f"   📤 Upload de {TEST_AUDIO}...")
        with open(TEST_AUDIO, 'rb') as f:
            files = {'audio': (TEST_AUDIO, f, 'audio/wav')}
            response = requests.post(f"{SERVER_URL}/upload", files=files)
        
        if response.status_code != 200:
            print(f"   ❌ Erreur upload: {response.status_code}")
            print(f"      {response.text}")
            return False
        
        result = response.json()
        print(f"   ✅ Upload OK: {result}")
        
        # Attendre un peu pour le traitement
        print("   ⏳ Attente du traitement...")
        time.sleep(3)
        
        # Download
        print("   📥 Téléchargement du résultat...")
        response = requests.get(f"{SERVER_URL}/download")
        
        if response.status_code != 200:
            print(f"   ❌ Erreur download: {response.status_code}")
            return False
        
        # Sauvegarder le fichier
        output_file = "test_transformed.wav"
        with open(output_file, 'wb') as f:
            f.write(response.content)
        
        print(f"   ✅ Fichier transformé sauvegardé: {output_file}")
        print(f"      Taille: {len(response.content) / 1024:.1f} KB")
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def create_test_audio():
    """Créer un fichier audio de test simple"""
    print("\n📝 Création d'un fichier audio de test...")
    try:
        import numpy as np
        import wave
        
        # Générer un signal sinusoïdal simple
        sample_rate = 44100
        duration = 2  # secondes
        frequency = 440  # La 440Hz
        
        t = np.linspace(0, duration, int(sample_rate * duration))
        signal = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Convertir en int16
        signal_int16 = np.int16(signal * 32767)
        
        # Sauvegarder en WAV
        with wave.open(TEST_AUDIO, 'w') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)   # 16 bits
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(signal_int16.tobytes())
        
        print(f"✅ Fichier test créé: {TEST_AUDIO}")
        return True
    except ImportError:
        print("❌ NumPy non installé, impossible de créer un fichier test")
        print("   Installez avec: pip install numpy")
        return False
    except Exception as e:
        print(f"❌ Erreur création fichier test: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("=" * 60)
    print("🧪 TEST DU SERVEUR RAVE")
    print("=" * 60)
    
    # Test 1: Connexion
    if not test_connection():
        print("\n❌ Le serveur n'est pas accessible. Tests arrêtés.")
        return
    
    # Test 2: Modèles
    models = test_get_models()
    
    # Test 3: Infos
    test_server_info()
    
    # Test 4: Sélection modèle
    if models:
        test_select_model(models[0])
    
    # Test 5: Upload/Download
    if not os.path.exists(TEST_AUDIO):
        if create_test_audio():
            test_upload_transform_download()
    else:
        test_upload_transform_download()
    
    print("\n" + "=" * 60)
    print("✅ Tests terminés !")
    print("=" * 60)

if __name__ == "__main__":
    main()