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
    if not RESEND_API_KEY:
        print("⚠️ Resend API Key não configurada.")
        return
    try:
        email_body = f"BL: {bl}\nConsignee: {consignee}\n\nARQUIVOS:\n{links_text}\n\n(Veja anexo para detalhes)"
        r = resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": EMAIL_RECEIVER,
            "subject": f"📢 NOVO DISPUTE: {bl}",
            "text": email_body,
            "attachments": [{"filename": txt_filename, "content": list(txt_content.encode('utf-8'))}]
        })
        print(f"✅ E-mail enviado via Resend! ID: {r.get('id')}")
    except Exception as e:
        print(f"❌ FALHA NO RESEND: {e}")

@app.route('/')
def health_check():
    return jsonify({"status": "API online (Direct Upload Mode)"}), 200

@app.route('/api/formulario', methods=['POST', 'OPTIONS'])
@cross_origin()
def handle_form():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        # --- MUDANÇA 1: Lendo JSON em vez de FormData ---
        data = request.json
        if not data:
            return jsonify({"erro": "Nenhum dado JSON recebido"}), 400

        bl_clean = sanitize_filename(data.get('blContainer', 'SEM-BL').strip().upper())
        submission_id = str(uuid.uuid4())[:8]
        bucket_name = "uploads"

        # --- MUDANÇA 2: Não fazemos mais upload de anexos aqui! ---
        # Apenas pegamos os links que o frontend já enviou
        file_urls = data.get('fileUrls', [])
        links_text = "\n".join(file_urls) if file_urls else "Nenhum link recebido."
        
        # --- MUDANÇA 3: Geramos o TXT ---
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        txt_content = f"""REGISTRO - {bl_clean}\nData: {timestamp}\n
BL: {data.get('blContainer')}
CONSIGNEE: {data.get('consigneeData')}
MOTIVO: {data.get('requestReason')}
FREE TIME: {data.get('freeTimeGranted')}
DESCARGA: {data.get('dischargeDate')}
1a TENTATIVA: {data.get('firstReturnAttemptDate')}
DEVOLUÇÃO: {data.get('containerReturnDate')}
TERMINAL: {data.get('returnTerminalCity')}

RESUMO:
{data.get('occurrenceSummary')}

LINKS DOS ARQUIVOS (Upload Direto):
{links_text}
"""
        txt_filename = f"{bl_clean}-RESUMO-{submission_id}.txt"
        
        # O backend SÓ faz o upload do TXT
        supabase.storage.from_(bucket_name).upload(
            path=f"{bl_clean}/{submission_id}/{txt_filename}", # Salva na mesma pasta
            file=txt_content.encode('utf-8'),
            file_options={"content-type": "text/plain"}
        )

        # --- MUDANÇA 4: Dispara o e-mail (como antes) ---
        threading.Thread(target=send_email_thread, args=(
            bl_clean, txt_filename, txt_content, links_text, data.get('consigneeData')
        )).start()

        return jsonify({"mensagem": "Registro finalizado com sucesso!"}), 201

    except Exception as e:
        print(f"Erro crítico: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)