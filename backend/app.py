import os
import uuid
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

@app.route('/')
def health_check():
    return jsonify({"status": "API online", "servico": "Supabase Upload"}), 200

@app.route('/api/formulario', methods=['POST', 'OPTIONS'])
@cross_origin()
def handle_form():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        # 1. Receber os dados
        data = request.form
        file = request.files.get('arquivo')
        
        if not file or file.filename == '':
            return jsonify({"erro": "Arquivo obrigatório não enviado"}), 400

        # 2. Gerar um ID único para esta submissão (usaremos para os dois arquivos)
        submission_id = str(uuid.uuid4())
        bucket_name = "uploads"

        # --- PASSO A: Upload do Arquivo Anexado ---
        # Nome ex: "d9f8c7...-ANEXO-Proposta.pdf"
        attachment_filename = f"{submission_id}-ANEXO-{file.filename}"
        file_content = file.read()
        
        supabase.storage.from_(bucket_name).upload(
            path=attachment_filename,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        # Pega o link público do anexo
        attachment_url = supabase.storage.from_(bucket_name).get_public_url(attachment_filename)

        # --- PASSO B: Gerar e Upload do TXT ---
        # Cria o conteúdo do texto
        timestamp = datetime.now().strftime("%d/%m/%Y às %H:%M:%S")
        txt_content = f"""
REGISTRO DE SOLICITAÇÃO DE DISPUTE
ID: {submission_id}
Data de Recebimento: {timestamp}
===================================

1. Dados do Consignee:
{data.get('consigneeData')}

2. Motivo da Solicitação:
{data.get('requestReason')}

3. BL / Container:
{data.get('blContainer')}

4. Free Time Concedido:
{data.get('freeTimeGranted')}

5. Data da Descarga:
{data.get('dischargeDate')}

6. Data da Primeira Tentativa da Devolução:
{data.get('firstReturnAttemptDate') or 'Não informada'}

7. Data da Devolução do Container:
{data.get('containerReturnDate')}

8. Terminal de Devolução:
{data.get('returnTerminalCity')}

9. Link do Arquivo Anexado:
{attachment_url}

10. Resumo da Ocorrência:
{data.get('occurrenceSummary')}
        """

        # Nome ex: "d9f8c7...-RESPOSTAS.txt"
        txt_filename = f"{submission_id}-RESPOSTAS.txt"
        
        # Faz o upload do texto diretamente como arquivo
        supabase.storage.from_(bucket_name).upload(
            path=txt_filename,
            file=txt_content.encode('utf-8'), # Converte o texto para bytes
            file_options={"content-type": "text/plain"}
        )

        print(f"Sucesso! Registro criado: {txt_filename}")

        return jsonify({
            "mensagem": "Formulário recebido com sucesso!"
        }), 201

    except Exception as e:
        print(f"Erro no servidor: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)