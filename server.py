
# ----------------------------------------------------------
# API Flask : upload → traitement RAVE (mode DÉMO intégré) → download
# ----------------------------------------------------------
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import traceback
from uuid import uuid4
import shutil
from process_rave_demo import apply_effect  # votre script DÉMO

app = Flask(__name__)
CORS(app)

# --- Dossiers ---
BASE_DIR    = os.path.abspath(os.path.dirname(__file__))
UPLOAD_DIR  = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR  = os.path.join(BASE_DIR, "outputs")
for d in (UPLOAD_DIR, OUTPUT_DIR):
    os.makedirs(d, exist_ok=True)

# --- Modèle par défaut / état global ---
SELECTED_MODEL    = "Jazz"
PROCESSING_STATUS = {}

app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 Mo max


@app.route("/")
def root():
    return "Connexion success !"


@app.route("/getmodels")
def get_models():
    """Liste statique des modèles (mode démo)."""
    return jsonify(["Jazz", "Parole", "Darbouka", "Chats", "Chiens"])


@app.route("/selectModel/<modelname>")
def select_model(modelname: str):
    global SELECTED_MODEL
    SELECTED_MODEL = modelname
    print(f"🎯 Modèle sélectionné (mode démo) : {SELECTED_MODEL}")
    return jsonify({"status": "ok", "model": SELECTED_MODEL})


@app.route("/upload", methods=["POST"])
def upload():
    """Réception + transformation en mode DÉMO (apply_effect)."""
    pid = uuid4().hex
    PROCESSING_STATUS[pid] = {"status": "started", "progress": 0}

    # 1) Récupérer le fichier
    file_obj = (
        request.files.get("audio")
        or request.files.get("file")
        or (next(iter(request.files.values())) if request.files else None)
    )
    if not file_obj:
        return jsonify({"status": "error", "msg": "Aucun fichier audio trouvé"}), 400

    # 2) Sauvegarde temporaire
    input_name  = f"{pid}_{file_obj.filename}"
    input_path  = os.path.join(UPLOAD_DIR, input_name)
    file_obj.save(input_path)
    print(f"💾 Sauvegardé : {input_path}")
    PROCESSING_STATUS[pid]["progress"] = 20

    # 3) Préparer le chemin de sortie
    output_name = f"transformed_{pid}.wav"
    output_path = os.path.join(OUTPUT_DIR, output_name)
    PROCESSING_STATUS[pid]["progress"] = 40

    # 4) Appel direct du mode DÉMO
    try:
        print(f"🚀 DÉMO intégré: apply_effect({SELECTED_MODEL})")
        apply_effect(input_path, output_path, SELECTED_MODEL)
        PROCESSING_STATUS[pid].update(status="completed", progress=100)
        # Nettoyer l'upload
        os.remove(input_path)
        print(f"🧹 Supprimé upload temporaire")
        return jsonify({
            "status": "ok",
            "msg": "Transformé en mode DÉMO",
            "process_id": pid,
            "output_file": output_name
        })
    except Exception as e:
        print("❌ Erreur DÉMO intégré :", e)
        traceback.print_exc()
        PROCESSING_STATUS[pid].update(status="error")
        # fallback : copie simple
        shutil.copy(input_path, output_path)
        os.remove(input_path)
        return jsonify({
            "status": "ok",
            "msg": "Copie simple (fallback démo)",
            "process_id": pid,
            "output_file": output_name
        })


@app.route("/download")
def download():
    """Renvoie le dernier fichier transformé."""
    # Trouver le plus récent dans outputs
    wavs = [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".wav")]
    if not wavs:
        return jsonify({"status": "error", "msg": "Aucun wav disponible"}), 404
    latest = max(wavs, key=lambda f: os.path.getmtime(os.path.join(OUTPUT_DIR, f)))
    path = os.path.join(OUTPUT_DIR, latest)
    return send_file(path, as_attachment=True, download_name="transformed.wav", mimetype="audio/wav")


@app.route("/status/<pid>")
def status(pid):
    return jsonify(PROCESSING_STATUS.get(pid, {"status":"unknown"}))


@app.route("/clean", methods=["POST"])
def clean():
    """Vide uploads et garde 5 derniers outputs."""
    for f in os.listdir(UPLOAD_DIR):
        try: os.remove(os.path.join(UPLOAD_DIR, f))
        except: pass
    outs = sorted(
        os.listdir(OUTPUT_DIR),
        key=lambda f: os.path.getmtime(os.path.join(OUTPUT_DIR, f)),
        reverse=True
    )
    for old in outs[5:]:
        try: os.remove(os.path.join(OUTPUT_DIR, old))
        except: pass
    return jsonify({"status":"ok","msg":"Clean effectué"})


@app.route("/info")
def info():
    return jsonify({
        "server":         "RAVE DEMO INTÉGRÉ",
        "selected_model": SELECTED_MODEL,
        "upload_dir":     UPLOAD_DIR,
        "output_dir":     OUTPUT_DIR
    })


if __name__ == "__main__":
    print("🚀 Serveur RAVE DÉMO démarré sur http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
