import os
import uuid
import re
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise EnvironmentError("As variáveis SUPABASE_URL e SUPABASE_KEY não foram definidas no .env")

supabase: Client = create_client(url, key)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def sanitize_filename(name):
    """Remove caracteres perigosos para nomes de arquivos (como / ou \)"""
    return re.sub(r'[\\/*?:"<>|]', '_', name)

@app.route('/')
def health_check():
    return jsonify({"status": "API online", "servico": "Supabase Upload Multiplo"}), 200

@app.route('/api/formulario', methods=['POST', 'OPTIONS'])
@cross_origin()
def handle_form():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        data = request.form
        # MUDANÇA 1: Usamos .getlist para pegar TODOS os arquivos enviados
        files = request.files.getlist('arquivo')
        
        if not files or len(files) == 0:
             return jsonify({"erro": "Nenhum arquivo enviado"}), 400

        # Pega o BL e limpa ele para usar no nome do arquivo
        bl_raw = data.get('blContainer', 'SEM-BL')
        bl_clean = sanitize_filename(bl_raw.strip().upper())

        # ID curto para evitar sobrescrita se mandarem o mesmo BL duas vezes
        submission_id = str(uuid.uuid4())[:8]
        bucket_name = "uploads"
        
        uploaded_links = []

        # MUDANÇA 2: Loop para salvar cada arquivo
        for i, file in enumerate(files, start=1):
            if file.filename == '':
                continue
            
            # Pega a extensão original (.pdf, .png)
            extension = os.path.splitext(file.filename)[1].lower()
            # Cria o novo nome: BL + Sequencia + ID curto + Extensão
            # Ex: MSCU12345-ARQUIVO-1-a9f8b7.pdf
            new_filename = f"{bl_clean}-ARQUIVO-{i}-{submission_id}{extension}"
            
            file_content = file.read()
            supabase.storage.from_(bucket_name).upload(
                path=new_filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
            link = supabase.storage.from_(bucket_name).get_public_url(new_filename)
            uploaded_links.append(link)

        # --- Gerar TXT com Resumo ---
        links_text = "\n".join(uploaded_links)
        timestamp = datetime.now().strftime("%d/%m/%Y às %H:%M:%S")
        
        txt_content = f"""
REGISTRO DE DISPUTE - {bl_clean}
ID Controle: {submission_id}
Data: {timestamp}
===================================
BL / CONTAINER: {data.get('blContainer')}
CONSIGNEE: {data.get('consigneeData')}
MOTIVO: {data.get('requestReason')}
FREE TIME: {data.get('freeTimeGranted')}
DESCARGA: {data.get('dischargeDate')}
1ª TENTATIVA: {data.get('firstReturnAttemptDate') or 'N/A'}
DEVOLUÇÃO: {data.get('containerReturnDate')}
TERMINAL: {data.get('returnTerminalCity')}

RESUMO DA OCORRÊNCIA:
{data.get('occurrenceSummary')}

===================================
ARQUIVOS ANEXADOS ({len(uploaded_links)}):
{links_text}
        """

        # Nome do TXT também usa o BL
        txt_filename = f"{bl_clean}-RESUMO-{submission_id}.txt"
        
        supabase.storage.from_(bucket_name).upload(
            path=txt_filename,
            file=txt_content.encode('utf-8'),
            file_options={"content-type": "text/plain"}
        )

        return jsonify({"mensagem": f"Recebidos {len(files)} arquivos com sucesso!"}), 201

    except Exception as e:
        print(f"Erro no servidor: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)