import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // --- ESTADOS ATUALIZADOS ---
  const [consigneeData, setConsigneeData] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [bl, setBl] = useState(''); // NOVO: Campo BL
  const [containerInfo, setContainerInfo] = useState(''); // NOVO: Campo Container
  const [freeTimeGranted, setFreeTimeGranted] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [firstReturnAttemptDate, setFirstReturnAttemptDate] = useState('');
  const [containerReturnDate, setContainerReturnDate] = useState('');
  const [returnTerminalCity, setReturnTerminalCity] = useState('');
  const [occurrenceSummary, setOccurrenceSummary] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Estados de controle
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
    // Resetando todos os estados (incluindo os novos)
    setConsigneeData(''); setRequestReason(''); setBl(''); setContainerInfo(''); // Novos
    setFreeTimeGranted(''); setDischargeDate(''); setFirstReturnAttemptDate('');
    setContainerReturnDate(''); setReturnTerminalCity(''); setOccurrenceSummary('');
    setAttachedFiles([]);
    setFeedbackMessage('');
    setIsError(false);
    setShowSuccessPage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (attachedFiles.length === 0) {
      alert("Por favor, anexe pelo menos um documento.");
      return;
    }

    setLoading(true);
    setFeedbackMessage('');
    setIsError(false);

    try {
      const formData = new FormData();
      formData.append('consigneeData', consigneeData);
      formData.append('requestReason', requestReason);
      
      // ENVIANDO OS NOVOS CAMPOS
      formData.append('bl', bl); 
      formData.append('containerInfo', containerInfo);
      
      formData.append('freeTimeGranted', freeTimeGranted);
      formData.append('dischargeDate', dischargeDate);
      formData.append('firstReturnAttemptDate', firstReturnAttemptDate);
      formData.append('containerReturnDate', containerReturnDate);
      formData.append('returnTerminalCity', returnTerminalCity);
      formData.append('occurrenceSummary', occurrenceSummary);
      
      attachedFiles.forEach((file) => {
        formData.append('arquivo', file);
      });

      // URL de produção (Render)
      await axios.post('https://dispute-backend.onrender.com/api/formulario', formData, {
         headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowSuccessPage(true);

    } catch (error) {
      console.error('Erro no envio:', error);
      setIsError(true);
      setFeedbackMessage('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
                {/* Seção 1 */}
                <section className="form-section">
                  <h3 className="section-title">Informações Gerais:</h3>
                  <div className="question-block"><label className="question-label">1. Dados do Consignee conforme BL: <span className="req">*</span></label><textarea className="input-field" value={consigneeData} onChange={(e) => setConsigneeData(e.target.value)} required rows="2" /></div>
                  <div className="question-block"><label className="question-label">2. Motivo da Solicitação: <span className="req">*</span></label><textarea className="input-field" value={requestReason} onChange={(e) => setRequestReason(e.target.value)} required rows="2" /></div>
                  
                  {/* NOVOS CAMPOS BL e CONTAINER */}
                  <div className="question-block">
                    <label className="question-label">3. BL: <span className="req">*</span></label>
                    <input type="text" className="input-field" value={bl} onChange={(e) => setBl(e.target.value)} required />
                  </div>
                  <div className="question-block">
                    <label className="question-label">4. Numéro do Container: <span className="req">*</span></label>
                    <input type="text" className="input-field" value={containerInfo} onChange={(e) => setContainerInfo(e.target.value)} required />
                  </div>
                </section>

                {/* Seção 2 (O número das perguntas abaixo precisará ser ajustado, mas o foco é o campo 3) */}
                <section className="form-section">
                  <h3 className="section-title">Detalhes da Operação:</h3>
                  <div className="question-block"><label className="question-label">5. Free Time Concedido: <span className="req">*</span></label><input type="text" className="input-field" value={freeTimeGranted} onChange={(e) => setFreeTimeGranted(e.target.value)} required /></div>
                  <div className="question-block"><label className="question-label">6. Data da Descarga: <span className="req">*</span></label><input type="date" className="input-field" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} required /></div>
                  <div className="question-block"><label className="question-label">7. Data da Primeira Tentativa da Devolução (se aplicável):</label><input type="date" className="input-field" value={firstReturnAttemptDate} onChange={(e) => setFirstReturnAttemptDate(e.target.value)} /></div>
                  <div className="question-block"><label className="question-label">8. Data da Devolução do Container: <span className="req">*</span></label><input type="date" className="input-field" value={containerReturnDate} onChange={(e) => setContainerReturnDate(e.target.value)} required /></div>
                  <div className="question-block"><label className="question-label">9. Terminal de Devolução (Nome e Cidade): <span className="req">*</span></label><input type="text" className="input-field" value={returnTerminalCity} onChange={(e) => setReturnTerminalCity(e.target.value)} required /></div>
                </section>

                <section className="form-section">
                  <h3 className="section-title">Informações da Devolução:</h3>
                  <div className="question-block">
                    <label className="question-label">10. Anexar Evidências (Você pode adicionar vários arquivos): <span className="req">*</span></label>
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
                  <div className="question-block">
                    <label className="question-label">11. Breve Resumo da Ocorrência: <span className="req">*</span></label>
                    <textarea className="input-field" value={occurrenceSummary} onChange={(e) => setOccurrenceSummary(e.target.value)} required rows="4" />
                  </div>
                </section>

                <div className="submit-area">
                  <button type="submit" className="submit-btn" disabled={loading || attachedFiles.length === 0}>
                    {loading ? 'Enviando...' : 'Enviar'}
                  </button>
                  {attachedFiles.length === 0 && !loading && <p style={{fontSize: '12px', color: '#a4262c', marginTop: '8px'}}>* Anexe pelo menos um arquivo para enviar.</p>}
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