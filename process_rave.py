# process_rave.py
# Script corrigé pour le traitement audio avec les modèles RAVE
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import sys
import os
import torch
import torchaudio
import numpy as np
import warnings
warnings.filterwarnings('ignore')
import sys

# Sous Windows, on réconfigure stdout/stderr en UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

def load_rave_model(model_path):
    """Charge un modèle RAVE (.ts)"""
    print(f"Chargement du modèle RAVE: {model_path}")
    
    try:
        # Les modèles RAVE sont des TorchScript
        model = torch.jit.load(model_path, map_location='cpu')
        model.eval()
        print("✅ Modèle RAVE chargé")
        return model
    except Exception as e:
        print(f"❌ Erreur chargement: {e}")
        raise

def load_audio(input_path, target_sr=48000):  # RAVE utilise 48kHz par défaut
    """Charge et prépare l'audio pour RAVE"""
    print(f"Chargement audio: {input_path}")
    
    try:
        # Charger l'audio
        waveform, sr = torchaudio.load(input_path)
        print(f"Audio chargé: {sr}Hz, {waveform.shape}")
        
        # Convertir en mono si nécessaire
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
            print("Converti en mono")
        
        # Rééchantillonner à 48kHz (taux standard RAVE)
        if sr != target_sr:
            resampler = torchaudio.transforms.Resample(sr, target_sr)
            waveform = resampler(waveform)
            print(f"Rééchantillonné à {target_sr}Hz")
        
        # Normaliser entre -1 et 1
        max_val = torch.max(torch.abs(waveform))
        if max_val > 0:
            waveform = waveform / max_val
        
        return waveform, target_sr
    except Exception as e:
        print(f"❌ Erreur chargement audio: {e}")
        raise

def process_with_rave(model, waveform):
    """Traite l'audio avec un modèle RAVE"""
    print("Traitement avec RAVE...")
    
    with torch.no_grad():
        # Ajouter dimension batch si nécessaire
        if waveform.dim() == 2:
            waveform = waveform.unsqueeze(0)  # [1, 1, samples]
        
        try:
            # RAVE v2 utilise forward directement
            # Le modèle retourne (audio_resynth, z_latent) ou juste audio
            output = model(waveform)
            
            # Gérer différents formats de sortie
            if isinstance(output, tuple):
                processed = output[0]  # Premier élément est l'audio
            else:
                processed = output
            
            # Retirer dimension batch
            if processed.dim() == 3:
                processed = processed.squeeze(0)
            
            print(f"✅ Traitement terminé: {processed.shape}")
            return processed
            
        except Exception as e:
            print(f"❌ Erreur traitement forward: {e}")
            
            # Essayer l'ancienne API RAVE v1
            try:
                print("Tentative avec l'API RAVE v1...")
                z = model.encode(waveform)
                processed = model.decode(z)
                
                if processed.dim() == 3:
                    processed = processed.squeeze(0)
                
                print(f"✅ Traitement v1 réussi: {processed.shape}")
                return processed
            except:
                # Si rien ne marche, essayer de trouver les bonnes méthodes
                print("Analyse des méthodes du modèle...")
                methods = [m for m in dir(model) if not m.startswith('_')]
                print(f"Méthodes disponibles: {methods}")
                raise Exception("Impossible de traiter avec ce modèle RAVE")

def save_audio(output_tensor, output_path, sr=48000):
    """Sauvegarde l'audio traité"""
    print(f"Sauvegarde: {output_path}")
    
    try:
        # S'assurer que c'est un tensor 2D
        if output_tensor.dim() == 1:
            output_tensor = output_tensor.unsqueeze(0)
        
        # Normaliser pour éviter le clipping
        max_val = torch.max(torch.abs(output_tensor))
        if max_val > 0:
            output_tensor = output_tensor / max_val * 0.95  # Petite marge
        
        # Sauvegarder
        torchaudio.save(output_path, output_tensor, sr)
        print(f"✅ Audio sauvegardé: {output_path}")
        
    except Exception as e:
        print(f"❌ Erreur sauvegarde: {e}")
        raise

def main():
    """Fonction principale"""
    if len(sys.argv) != 4:
        print("Usage: python process_rave.py <input_audio> <output_audio> <model_path>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    model_path = sys.argv[3]
    
    print("=" * 50)
    print(" RAVE Audio Processing")
    print("=" * 50)
    print(f"Input:  {input_path}")
    print(f"Output: {output_path}")
    print(f"Model:  {model_path}")
    print("=" * 50)
    
    try:
        # 1. Charger le modèle
        model = load_rave_model(model_path)
        
        # 2. Charger l'audio
        waveform, sr = load_audio(input_path)
        
        # 3. Traiter l'audio
        processed = process_with_rave(model, waveform)
        
        # 4. Sauvegarder le résultat
        save_audio(processed, output_path, sr)
        
        print("=" * 50)
        print("✅ Traitement terminé avec succès!")
        
    except Exception as e:
        print("=" * 50)
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()