import os
import uuid
import re
import threading
import resend
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# --- Configurações (continuam iguais) ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
EMAIL_RECEIVER = os.environ.get("EMAIL_RECEIVER")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
resend.api_key = RESEND_API_KEY 

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', '_', name)

def send_email_thread(bl, txt_filename, txt_content, links_text, consignee):
    """Envia e-mail via RESEND em segundo plano"""
    if not RESEND_API_KEY:
        print("⚠️ Resend API Key não configurada.")
        return

    try:
        email_body = f"BL: {bl}\nConsignee: {consignee}\n\nARQUIVOS:\n{links_text}\n\n(Veja anexo para detalhes)"
        
        r = resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": EMAIL_RECEIVER,
            "subject": f"📢 NOVO DISPUTE BL: {bl}", # ASSUNTO ATUALIZADO
            "text": email_body,
            "attachments": [
                {
                    "filename": txt_filename,
                    "content": list(txt_content.encode('utf-8'))
                }
            ]
        })
        print(f"✅ E-mail enviado via Resend!")

    except Exception as e:
        print(f"❌ FALHA NO RESEND: {e}")

@app.route('/')
def health_check():
    return jsonify({"status": "API online (Resend)"}), 200

@app.route('/api/formulario', methods=['POST', 'OPTIONS'])
@cross_origin()
def handle_form():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        data = request.form
        files = request.files.getlist('arquivo')
        if not files: return jsonify({"erro": "Sem arquivos"}), 400

        # NOVOS CAMPOS LIDOS AQUI
        bl_raw = data.get('bl', 'SEM-BL')
        container_info = data.get('containerInfo', 'N/A')
        
        bl_clean = sanitize_filename(bl_raw.strip().upper())
        submission_id = str(uuid.uuid4())[:8]
        bucket_name = "uploads"
        uploaded_links = []

        # ... (Upload dos arquivos continua igual)
        for i, file in enumerate(files, start=1):
            if file.filename == '': continue
            ext = os.path.splitext(file.filename)[1].lower()
            new_name = f"{bl_clean}-ARQ-{i}-{submission_id}{ext}"
            supabase.storage.from_(bucket_name).upload(new_name, file.read(), file_options={"content-type": file.content_type})
            uploaded_links.append(supabase.storage.from_(bucket_name).getPublicUrl(new_name))

        links_text = "\n".join(uploaded_links)
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        
        # --- TXT ATUALIZADO ---
        txt_content = f"""REGISTRO - {bl_clean}\nData: {timestamp}\n
BL: {bl_raw}
INFORMAÇÕES DO CONTAINER: {container_info}
CONSIGNEE: {data.get('consigneeData')}
MOTIVO: {data.get('requestReason')}
FREE TIME: {data.get('freeTimeGranted')}
DESCARGA: {data.get('dischargeDate')}\n
1a TENTATIVA: {data.get('firstReturnAttemptDate')}
DEVOLUÇÃO: {data.get('containerReturnDate')}
TERMINAL: {data.get('returnTerminalCity')}

RESUMO:\n{data.get('occurrenceSummary')}
LINKS:\n{links_text}"""
        txt_filename = f"{bl_clean}-RESUMO-{submission_id}.txt"
        supabase.storage.from_(bucket_name).upload(txt_filename, txt_content.encode('utf-8'), file_options={"content-type": "text/plain"})

        threading.Thread(target=send_email_thread, args=(bl_clean, txt_filename, txt_content, links_text, data.get('consigneeData'))).start()

        return jsonify({"mensagem": "Recebido com sucesso!"}), 201

    except Exception as e:
        print(f"Erro crítico: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)