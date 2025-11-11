import { useState } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient'; // Importa o cliente Supabase
import './App.css';

// Função para limpar nomes de arquivos para URLs
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9-._]/g, '_');
};

function App() {
  // ... (todos os seus 'useState' para campos de formulário ficam iguais)
  const [consigneeData, setConsigneeData] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [blContainer, setBlContainer] = useState('');
  const [freeTimeGranted, setFreeTimeGranted] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [firstReturnAttemptDate, setFirstReturnAttemptDate] = useState('');
  const [containerReturnDate, setContainerReturnDate] = useState('');
  const [returnTerminalCity, setReturnTerminalCity] = useState('');
  const [occurrenceSummary, setOccurrenceSummary] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prevFiles => [...prevFiles, ...newFiles]);
      e.target.value = null;
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setAttachedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleResetForm = () => {
    // ... (função igual)
    setConsigneeData(''); setRequestReason(''); setBlContainer('');
    setFreeTimeGranted(''); setDischargeDate(''); setFirstReturnAttemptDate('');
    setContainerReturnDate(''); setReturnTerminalCity(''); setOccurrenceSummary('');
    setAttachedFiles([]);
    setFeedbackMessage('');
    setIsError(false);
    setShowSuccessPage(false);
  };

  // --- NOVO HANDLESUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (attachedFiles.length === 0) {
      alert("Por favor, anexe pelo menos um documento.");
      return;
    }

    setLoading(true);
    setIsError(false);
    setFeedbackMessage('Iniciando envio...');

    const submissionId = crypto.randomUUID(); // ID único para esta pasta
    const blClean = sanitizeFilename(blContainer || 'SEM-BL');

    try {
      // --- PASSO A: FAZ UPLOAD DIRETO DOS ARQUIVOS ---
      setFeedbackMessage(`Enviando ${attachedFiles.length} arquivo(s)...`);
      
      const uploadPromises = attachedFiles.map((file, index) => {
        const cleanFileName = sanitizeFilename(file.name);
        // Cria um caminho de pasta único para esta submissão
        const filePath = `${blClean}/${submissionId}/ARQ-${index + 1}-${cleanFileName}`;
        
        return supabase.storage
          .from('uploads') // Nome do seu bucket
          .upload(filePath, file);
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Verifica se houve erro em algum upload
      const uploadErrors = uploadResults.filter(result => result.error);
      if (uploadErrors.length > 0) {
        console.error("Erro em um ou mais uploads:", uploadErrors);
        throw new Error('Falha ao enviar um ou mais arquivos.');
      }

      // Pega os links públicos de todos os arquivos enviados
      const publicUrls = uploadResults.map(result => {
        const { data } = supabase.storage.from('uploads').getPublicUrl(result.data.path);
        return data.publicUrl;
      });

      // --- PASSO B: ENVIA SÓ O TEXTO E OS LINKS PARA O BACKEND ---
      setFeedbackMessage('Finalizando registro...');

      const textData = {
        consigneeData, requestReason, blContainer, freeTimeGranted,
        dischargeDate, firstReturnAttemptDate, containerReturnDate,
        returnTerminalCity, occurrenceSummary,
        fileUrls: publicUrls // Envia a lista de URLs prontas
      };

      // URL de produção do Render
      await axios.post('https://dispute-backend.onrender.com/api/formulario', textData, {
         // Agora enviamos JSON, não FormData
         headers: { 'Content-Type': 'application/json' },
      });

      // SUCESSO!
      setShowSuccessPage(true);

    } catch (error) {
      console.error('Erro no envio:', error);
      setIsError(true);
      setFeedbackMessage(error.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // --- (O resto do seu JSX 'return' continua igual) ---
  return (
    <div className="app-background">
      <div className="form-container">
        
        {showSuccessPage ? (
          <div className="success-view">
            <div className="success-icon">✅</div>
            <h2 className="success-title">Solicitação Enviada!</h2>
            <p className="success-desc">
              Recebemos suas informações e documentos com sucesso. 
              Nossa equipe analisará o dispute e entrará em contato em breve.
            </p>
            <button onClick={handleResetForm} className="new-dispute-btn">
              <span>+</span> Criar nova solicitação
            </button>
          </div>
        ) : (
          <>
            <header className="form-header">
              <div className="logo-area">
                <img src="/logo.png" alt="Hevile Logo" className="header-logo" />
              </div>
              <h1>Formulário de Solicitação de Dispute</h1>
              <p className="header-desc">Este formulário tem o objetivo de centralizar as informações e evidências referentes ao seu dispute.</p>
            </header>

            <main className="form-body">
              <p className="required-indicator">* Obrigatória</p>

              <form onSubmit={handleSubmit}>
                {/* ... (Todas as seções do formulário iguais) ... */}
                <section className="form-section">
                  <h3 className="section-title">Informações Gerais:</h3>
                  {/* ... campos 1, 2, 3 ... */}
                  <div className="question-block"><label className="question-label">1. Dados do Consignee conforme BL: <span className="req">*</span></label><textarea className="input-field" value={consigneeData} onChange={(e) => setConsigneeData(e.target.value)} required rows="2" /></div>
                  <div className="question-block"><label className="question-label">2. Motivo da Solicitação: <span className="req">*</span></label><textarea className="input-field" value={requestReason} onChange={(e) => setRequestReason(e.target.value)} required rows="2" /></div>
                  <div className="question-block"><label className="question-label">3. BL / Container: <span className="req">*</span></label><input type="text" className="input-field" value={blContainer} onChange={(e) => setBlContainer(e.target.value)} required /></div>
                </section>
                <section className="form-section">
                  <h3 className="section-title">Detalhes da Operação:</h3>
                  {/* ... campos 4, 5, 6, 7, 8 ... */}
                  <div className="question-block"><label className="question-label">4. Free Time Concedido: <span className="req">*</span></label><input type="text" className="input-field" value={freeTimeGranted} onChange={(e) => setFreeTimeGranted(e.target.value)} required /></div>
                  <div className="question-block"><label className="question-label">5. Data da Descarga: <span className="req">*</span></label><input type="date" className="input-field" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} required /></div>
                  <div className="question-block"><label className="question-label">6. Data da Primeira Tentativa da Devolução (se aplicável):</label><input type="date" className="input-field" value={firstReturnAttemptDate} onChange={(e) => setFirstReturnAttemptDate(e.target.value)} /></div>
                  <div className="question-block"><label className="question-label">7. Data da Devolução do Container: <span className="req">*</span></label><input type="date" className="input-field" value={containerReturnDate} onChange={(e) => setContainerReturnDate(e.target.value)} required /></div>
                  <div className="question-block"><label className="question-label">8. Terminal de Devolução (Nome e Cidade): <span className="req">*</span></label><input type="text" className="input-field" value={returnTerminalCity} onChange={(e) => setReturnTerminalCity(e.target.value)} required /></div>
                </section>
                <section className="form-section">
                  <h3 className="section-title">Informações da Devolução:</h3>
                  {/* ... campo 9 (upload) ... */}
                  <div className="question-block">
                    <label className="question-label">9. Anexar Evidências (Você pode adicionar vários arquivos): <span className="req">*</span></label>
                    <div className="file-upload-wrapper">
                      <input type="file" id="file-upload" className="file-upload-input" onChange={handleFileChange} multiple />
                      <div className="file-upload-info">Clique novamente para adicionar mais arquivos.</div>
                      {attachedFiles.length > 0 && (
                        <ul className="file-list">
                          {attachedFiles.map((file, index) => (
                            <li key={index} className="file-list-item">
                              <span style={{marginRight: '10px'}}>📄 {file.name}</span>
                              <button type="button" onClick={() => handleRemoveFile(index)} className="remove-file-btn" title="Remover arquivo">×</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  {/* ... campo 10 ... */}
                  <div className="question-block">
                    <label className="question-label">10. Breve Resumo da Ocorrência: <span className="req">*</span></label>
                    <textarea className="input-field" value={occurrenceSummary} onChange={(e) => setOccurrenceSummary(e.target.value)} required rows="4" />
                  </div>
                </section>

                <div className="submit-area">
                  <button type="submit" className="submit-btn" disabled={loading || attachedFiles.length === 0}>
                    {loading ? (feedbackMessage || 'Enviando...') : 'Enviar'}
                  </button>
                  {/* ... (mensagem de erro anexa) ... */}
                  {attachedFiles.length === 0 && !loading && <p style={{fontSize: '12px', color: '#a4262c', marginTop: '8px'}}>* Anexe pelo menos um arquivo para enviar.</p>}
                  {loading && <p style={{fontSize: '14px', color: '#333', marginTop: '10px'}}>{feedbackMessage}</p>}
                </div>
              </form>

              {feedbackMessage && isError && (
                <div className="feedback-box error">
                   {feedbackMessage}
                </div>
              )}
            </main>
            <footer className="form-footer">Este formulário foi criado pela Hevile.</footer>
          </>
        )}
      </div>
    </div>
  );
}

export default App;