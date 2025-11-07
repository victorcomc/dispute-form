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

# --- Configurações ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY") # Nova chave!
EMAIL_RECEIVER = os.environ.get("EMAIL_RECEIVER")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
resend.api_key = RESEND_API_KEY # Configura o Resend

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
        # Monta o corpo do e-mail
        email_body = f"""
NOVA SOLICITAÇÃO DE DISPUTE RECEBIDA

BL/Container: {bl}
Consignee: {consignee}

ARQUIVOS ANEXADOS (Links):
{links_text}

(Veja o arquivo TXT anexo para todos os detalhes preenchidos)
        """

        # Envia usando Resend
        r = resend.Emails.send({
            "from": "onboarding@resend.dev", # E-mail padrão de testes do Resend
            "to": EMAIL_RECEIVER,
            "subject": f"📢 NOVO DISPUTE: {bl}",
            "text": email_body,
            "attachments": [
                # O Resend pede o conteúdo do anexo como uma lista de números (bytes)
                {
                    "filename": txt_filename,
                    "content": list(txt_content.encode('utf-8'))
                }
            ]
        })
        print(f"✅ E-mail enviado via Resend! ID: {r.get('id')}")

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

        bl_clean = sanitize_filename(data.get('blContainer', 'SEM-BL').strip().upper())
        submission_id = str(uuid.uuid4())[:8]
        bucket_name = "uploads"
        uploaded_links = []

        for i, file in enumerate(files, start=1):
            if file.filename == '': continue
            ext = os.path.splitext(file.filename)[1].lower()
            new_name = f"{bl_clean}-ARQ-{i}-{submission_id}{ext}"
            supabase.storage.from_(bucket_name).upload(new_name, file.read(), file_options={"content-type": file.content_type})
            uploaded_links.append(supabase.storage.from_(bucket_name).get_public_url(new_name))

        links_text = "\n".join(uploaded_links)
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        txt_content = f"REGISTRO - {bl_clean}\nData: {timestamp}\n\nBL: {data.get('blContainer')}\nCONSIGNEE: {data.get('consigneeData')}\nMOTIVO: {data.get('requestReason')}\nFREE TIME: {data.get('freeTimeGranted')}\nDESCARGA: {data.get('dischargeDate')}\n1a TENTATIVA: {data.get('firstReturnAttemptDate')}\nDEVOLUÇÃO: {data.get('containerReturnDate')}\nTERMINAL: {data.get('returnTerminalCity')}\n\nRESUMO:\n{data.get('occurrenceSummary')}\n\nLINKS:\n{links_text}"
        txt_filename = f"{bl_clean}-RESUMO-{submission_id}.txt"
        supabase.storage.from_(bucket_name).upload(txt_filename, txt_content.encode('utf-8'), file_options={"content-type": "text/plain"})

        # Dispara o envio em segundo plano
        threading.Thread(target=send_email_thread, args=(bl_clean, txt_filename, txt_content, links_text, data.get('consigneeData'))).start()

        return jsonify({"mensagem": "Recebido com sucesso!"}), 201

    except Exception as e:
        print(f"Erro crítico: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)