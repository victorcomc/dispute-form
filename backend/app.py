import os
import uuid
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client

# Carrega as variáveis de ambiente
load_dotenv()

# --- Configuração do Supabase ---
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise EnvironmentError("As variáveis SUPABASE_URL e SUPABASE_KEY não foram definidas no .env")

supabase: Client = create_client(url, key)

# --- Configuração do Flask ---
app = Flask(__name__)
CORS(app) # Permite todas as origens por enquanto (para facilitar testes)

# --- Rotas ---

@app.route('/')
def health_check():
    return jsonify({"status": "API online", "servico": "Supabase Upload"}), 200

@app.route('/api/formulario', methods=['POST'])
def handle_form():
    try:
        # 1. Recebe dados de texto (ATUALIZADO COM OS NOVOS NOMES)
        data = request.form
        consignee_data = data.get('consigneeData')
        request_reason = data.get('requestReason')
        bl_container = data.get('blContainer')
        free_time_granted = data.get('freeTimeGranted')
        discharge_date = data.get('dischargeDate')
        first_return_attempt_date = data.get('firstReturnAttemptDate')
        container_return_date = data.get('containerReturnDate')
        return_terminal_city = data.get('returnTerminalCity')
        occurrence_summary = data.get('occurrenceSummary')
        
        # 2. Validação básica do arquivo
        file = None
        file_url = None
        if 'arquivo' in request.files and request.files['arquivo'].filename != '':
            file = request.files['arquivo']
            
            # 3. Gerar nome único para o arquivo (evita sobrescrever)
            filename = f"{uuid.uuid4()}-{file.filename}"
            bucket_name = "uploads" 

            # 4. Ler o conteúdo do arquivo
            file_content = file.read()

            # 5. Fazer UPLOAD para o Supabase Storage
            res = supabase.storage.from_(bucket_name).upload(
                path=filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )

            # 6. Obter a URL pública do arquivo
            file_url = supabase.storage.from_(bucket_name).get_public_url(filename)
            print(f"Sucesso! Arquivo disponível em: {file_url}")
        else:
            print("Nenhum arquivo anexado ou arquivo vazio.")

        # TODO: Salvar TODOS os dados (incluindo file_url) no Supabase DB (PostgreSQL)
        # Este é o próximo passo! Por enquanto, apenas retornamos os dados.

        # Retorna sucesso para o frontend
        return jsonify({
            "mensagem": "Formulário enviado com sucesso!",
            "dados": {
                "consigneeData": consignee_data,
                "requestReason": request_reason,
                "blContainer": bl_container,
                "freeTimeGranted": free_time_granted,
                "dischargeDate": discharge_date,
                "firstReturnAttemptDate": first_return_attempt_date,
                "containerReturnDate": container_return_date,
                "returnTerminalCity": return_terminal_city,
                "occurrenceSummary": occurrence_summary,
                "arquivo_url": file_url
            }
        }), 201

    except Exception as e:
        print(f"Erro no servidor: {e}")
        return jsonify({"erro": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)