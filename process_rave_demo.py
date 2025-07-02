# process_rave_demo.py
# Mode démo pour simuler les transformations RAVE

import os
import sys
import time
import wave
import struct
import shutil

import numpy as np

# Permettre le démarrage même si plusieurs runtimes OpenMP coexistent
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"


def apply_effect(input_path: str, output_path: str, model_name: str):
    """Applique un effet audio simple selon le modèle choisi (mode démo)."""
    print(f"[DEMO] Effet : {model_name}")

    try:
        # Lecture du WAV
        with wave.open(input_path, 'rb') as wav_in:
            params = wav_in.getparams()
            frames = wav_in.readframes(params.nframes)

        # Conversion en numpy array normalisé
        audio_data = struct.unpack(f"{params.nframes * params.nchannels}h", frames)
        audio = np.array(audio_data, dtype=np.float32) / 32768.0

        # Sélection de l’effet
        name = model_name.lower()
        if "jazz" in name:
            audio = np.tanh(audio * 1.5) * 0.8
            # Réverb simple
            delay = int(0.05 * params.framerate)
            if audio.size > delay:
                delayed = np.zeros_like(audio)
                delayed[delay:] = audio[:-delay] * 0.3
                audio += delayed

        elif any(x in name for x in ("parole", "vctk")):
            # Pitch up par simple échantillonnage
            idx = np.arange(0, audio.size, 1.2).astype(int)
            audio = audio[idx]

        elif "darbouka" in name:
            # Gate + compression
            thresh = 0.1
            audio = np.where(np.abs(audio) > thresh, audio, 0)
            audio = np.sign(audio) * np.sqrt(np.abs(audio))

        elif any(x in name for x in ("chat", "cats")):
            idx = np.arange(0, audio.size, 0.7).astype(int)
            audio = audio[idx]

        elif any(x in name for x in ("chien", "dogs")):
            # Stretch pour basses
            new_len = int(audio.size * 1.5)
            x_old = np.linspace(0, audio.size - 1, audio.size)
            x_new = np.linspace(0, audio.size - 1, new_len)
            audio = np.interp(x_new, x_old, audio)

        # Re-normalisation et conversion 16-bits
        audio = np.clip(audio, -1, 1)
        out_data = (audio * 32767).astype(np.int16)

        # Écriture du WAV de sortie
        with wave.open(output_path, 'wb') as wav_out:
            wav_out.setparams(params)
            wav_out.writeframes(out_data.tobytes())

        print("[DEMO] Effet appliqué avec succès !")

    except Exception as e:
        print(f"[ERROR] Échec effet démo : {e}")
        # Fallback : copie brute du fichier
        shutil.copy(input_path, output_path)
        print("[DEMO] Fichier copié sans modification.")


def main():
    if len(sys.argv) != 4:
        print("Usage: python process_rave_demo.py <input> <output> <model>")
        sys.exit(1)

    input_path, output_path, model_path = sys.argv[1:]
    model_name = os.path.splitext(os.path.basename(model_path))[0]

    print("=" * 40)
    print("   RAVE Audio Processing — MODE DÉMO   ")
    print("=" * 40)
    print(f" • Input :  {input_path}")
    print(f" • Output:  {output_path}")
    print(f" • Model :  {model_path}")
    print("⏳ Traitement en cours…")
    time.sleep(1)

    apply_effect(input_path, output_path, model_name)

    print("=" * 40)
    print("✅ Transformation terminée (MODE DÉMO)")

if __name__ == "__main__":
    main()
