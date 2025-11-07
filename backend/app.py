import os
import uuid
from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin # Adicionamos cross_origin
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise EnvironmentError("As variáveis SUPABASE_URL e SUPABASE_KEY não foram definidas no .env")

supabase: Client = create_client(url, key)

app = Flask(__name__)

# --- CONFIGURAÇÃO CORS ATUALIZADA ---
# Permite que qualquer origem (*) acesse qualquer rota (/api/*)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def health_check():
    return jsonify({"status": "API online", "servico": "Supabase Upload"}), 200

@app.route('/api/formulario', methods=['POST', 'OPTIONS']) # Aceita OPTIONS também (importante para CORS)
@cross_origin() # Força o CORS nesta rota específica
def handle_form():
    # Se for um "pré-voo" (preflight) do navegador verificando permissões
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    try:
        data = request.form
        # ... (resto do seu código igual) ...
        consignee_data = data.get('consigneeData')
        request_reason = data.get('requestReason')
        bl_container = data.get('blContainer')
        free_time_granted = data.get('freeTimeGranted')
        discharge_date = data.get('dischargeDate')
        first_return_attempt_date = data.get('firstReturnAttemptDate')
        container_return_date = data.get('containerReturnDate')
        return_terminal_city = data.get('returnTerminalCity')
        occurrence_summary = data.get('occurrenceSummary')
        
        file = None
        file_url = None
        if 'arquivo' in request.files and request.files['arquivo'].filename != '':
            file = request.files['arquivo']
            filename = f"{uuid.uuid4()}-{file.filename}"
            bucket_name = "uploads" 
            file_content = file.read()
            res = supabase.storage.from_(bucket_name).upload(
                path=filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
            file_url = supabase.storage.from_(bucket_name).get_public_url(filename)
            print(f"Sucesso! Arquivo disponível em: {file_url}")
        
        return jsonify({
            "mensagem": "Formulário enviado com sucesso!",
            "dados": {
                "arquivo_url": file_url
            }
        }), 201

    except Exception as e:
        print(f"Erro no servidor: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)