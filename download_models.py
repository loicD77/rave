# download_models.py
# Script pour télécharger les modèles RAVE pré-entraînés
import os
import requests
from tqdm import tqdm

# URLs des modèles RAVE (à adapter selon disponibilité)
MODEL_URLS = {
    "vintage": "https://github.com/acids-ircam/RAVE/releases/download/v2.3.0/vintage.ts",
    "percussion": "https://github.com/acids-ircam/RAVE/releases/download/v2.3.0/percussion.ts",
    "VCTK": "https://github.com/acids-ircam/RAVE/releases/download/v2.3.0/VCTK.ts",
    # Ajouter d'autres URLs selon disponibilité
}

# Mapping pour votre application
MODEL_MAPPING = {
    "vintage": "Jazz.ts",
    "percussion": "Darbouka.ts", 
    "VCTK": "Vctk.ts",
    # Pour Cats et Dogs, vous devrez entraîner vos propres modèles
}

def download_file(url, filename):
    """Télécharge un fichier avec barre de progression"""
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(filename, 'wb') as file:
        with tqdm(total=total_size, unit='iB', unit_scale=True) as pbar:
            for data in response.iter_content(chunk_size=1024):
                size = file.write(data)
                pbar.update(size)

def main():
    # Créer le dossier models s'il n'existe pas
    os.makedirs('models', exist_ok=True)
    
    print("🎵 Téléchargement des modèles RAVE...")
    print("=" * 50)
    
    for model_name, url in MODEL_URLS.items():
        output_name = MODEL_MAPPING.get(model_name, f"{model_name}.ts")
        output_path = os.path.join('models', output_name)
        
        if os.path.exists(output_path):
            print(f"✅ {output_name} existe déjà")
            continue
        
        print(f"\n📥 Téléchargement de {model_name}...")
        try:
            download_file(url, output_path)
            print(f"✅ {output_name} téléchargé avec succès")
        except Exception as e:
            print(f"❌ Erreur téléchargement {model_name}: {e}")
    
    print("\n" + "=" * 50)
    print("📋 Modèles disponibles:")
    for f in os.listdir('models'):
        if f.endswith('.ts'):
            size = os.path.getsize(os.path.join('models', f)) / (1024*1024)
            print(f"  - {f} ({size:.1f} MB)")
    
    # Instructions pour les modèles manquants
    print("\n⚠️  Pour les modèles Cats et Dogs:")
    print("   Vous devez les entraîner vous-même avec RAVE")
    print("   ou utiliser des modèles de substitution")

if __name__ == "__main__":
    main()