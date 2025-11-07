import os
import uuid
import re
import smtplib
import threading
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# --- Variáveis de Ambiente ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
EMAIL_SENDER = os.environ.get("EMAIL_SENDER")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD")
EMAIL_RECEIVER = os.environ.get("EMAIL_RECEIVER")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', '_', name)

def send_email_thread(bl, txt_filename, txt_content, links_text, consignee):
    """Envia e-mail em segundo plano para não travar o site"""
    if not all([EMAIL_SENDER, EMAIL_PASSWORD, EMAIL_RECEIVER]):
        print("⚠️ E-mail não configurado.")
        return

    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_SENDER
        msg['To'] = EMAIL_RECEIVER
        msg['Subject'] = f"NOVO DISPUTE: {bl}"

        body = f"BL: {bl}\nConsignee: {consignee}\n\nARQUIVOS:\n{links_text}\n\n(Veja anexo para detalhes)"
        msg.attach(MIMEText(body, 'plain'))

        part = MIMEBase('application', "octet-stream")
        part.set_payload(txt_content.encode('utf-8'))
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="{txt_filename}"')
        msg.attach(part)

        # --- CONFIGURAÇÃO OUTLOOK ---
        server = smtplib.SMTP('smtp.office365.com', 587)
        server.starttls() # Importante para Outlook
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, EMAIL_RECEIVER, msg.as_string())
        server.quit()
        print(f"✅ E-mail enviado para {EMAIL_RECEIVER}")

    except Exception as e:
        print(f"❌ FALHA NO E-MAIL: {e}")

@app.route('/')
def health_check():
    return jsonify({"status": "API online (Outlook)"}), 200

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

        # Inicia o envio de e-mail em paralelo (sem travar a resposta)
        threading.Thread(target=send_email_thread, args=(bl_clean, txt_filename, txt_content, links_text, data.get('consigneeData'))).start()

        return jsonify({"mensagem": "Recebido com sucesso!"}), 201

    except Exception as e:
        print(f"Erro crítico: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)