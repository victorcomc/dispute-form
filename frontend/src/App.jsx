import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [consigneeData, setConsigneeData] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [blContainer, setBlContainer] = useState('');
  const [freeTimeGranted, setFreeTimeGranted] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [firstReturnAttemptDate, setFirstReturnAttemptDate] = useState('');
  const [containerReturnDate, setContainerReturnDate] = useState('');
  const [returnTerminalCity, setReturnTerminalCity] = useState('');
  const [occurrenceSummary, setOccurrenceSummary] = useState('');
  
  // Lista de arquivos anexados
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // MUDANÇA 1: Agora ADICIONA à lista existente em vez de substituir
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Limpa o input para permitir selecionar o mesmo arquivo novamente se quiser
      e.target.value = null; 
    }
  };

  // MUDANÇA 2: Função para remover um arquivo da lista
  const handleRemoveFile = (indexToRemove) => {
    setAttachedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
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
      formData.append('blContainer', blContainer);
      formData.append('freeTimeGranted', freeTimeGranted);
      formData.append('dischargeDate', dischargeDate);
      formData.append('firstReturnAttemptDate', firstReturnAttemptDate);
      formData.append('containerReturnDate', containerReturnDate);
      formData.append('returnTerminalCity', returnTerminalCity);
      formData.append('occurrenceSummary', occurrenceSummary);
      
      // Adiciona todos os arquivos da nossa lista manual
      attachedFiles.forEach((file) => {
        formData.append('arquivo', file);
      });

      // URL de produção do Render
      const response = await axios.post('https://dispute-backend.onrender.com/api/formulario', formData, {
         headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFeedbackMessage('Sucesso! Formulário enviado. Obrigado.');
      
      // Limpar tudo
      setConsigneeData(''); setRequestReason(''); setBlContainer('');
      setFreeTimeGranted(''); setDischargeDate(''); setFirstReturnAttemptDate('');
      setContainerReturnDate(''); setReturnTerminalCity(''); setOccurrenceSummary('');
      setAttachedFiles([]); 

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
            {/* ... (Seções 1 e 2 iguais) ... */}
            <section className="form-section">
              <h3 className="section-title">Informações Gerais:</h3>
              <div className="question-block">
                <label className="question-label">1. Dados do Consignee conforme BL: <span className="req">*</span></label>
                <textarea className="input-field" value={consigneeData} onChange={(e) => setConsigneeData(e.target.value)} required rows="2" />
              </div>
              <div className="question-block">
                <label className="question-label">2. Motivo da Solicitação: <span className="req">*</span></label>
                <textarea className="input-field" value={requestReason} onChange={(e) => setRequestReason(e.target.value)} required rows="2" />
              </div>
              <div className="question-block">
                <label className="question-label">3. BL / Container: <span className="req">*</span></label>
                <input type="text" className="input-field" value={blContainer} onChange={(e) => setBlContainer(e.target.value)} required />
              </div>
            </section>

            <section className="form-section">
              <h3 className="section-title">Detalhes da Operação:</h3>
              <div className="question-block">
                <label className="question-label">4. Free Time Concedido: <span className="req">*</span></label>
                <input type="text" className="input-field" value={freeTimeGranted} onChange={(e) => setFreeTimeGranted(e.target.value)} required />
              </div>
              <div className="question-block">
                <label className="question-label">5. Data da Descarga: <span className="req">*</span></label>
                <input type="date" className="input-field" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} required />
              </div>
              <div className="question-block">
                <label className="question-label">6. Data da Primeira Tentativa da Devolução (se aplicável):</label>
                <input type="date" className="input-field" value={firstReturnAttemptDate} onChange={(e) => setFirstReturnAttemptDate(e.target.value)} />
              </div>
              <div className="question-block">
                <label className="question-label">7. Data da Devolução do Container: <span className="req">*</span></label>
                <input type="date" className="input-field" value={containerReturnDate} onChange={(e) => setContainerReturnDate(e.target.value)} required />
              </div>
              <div className="question-block">
                <label className="question-label">8. Terminal de Devolução (Nome e Cidade): <span className="req">*</span></label>
                <input type="text" className="input-field" value={returnTerminalCity} onChange={(e) => setReturnTerminalCity(e.target.value)} required />
              </div>
            </section>

            {/* SEÇÃO 3: Upload Atualizado */}
            <section className="form-section">
              <h3 className="section-title">Informações da Devolução:</h3>
              <div className="question-block">
                <label className="question-label">9. Anexar Evidências (Você pode adicionar vários arquivos): <span className="req">*</span></label>
                
                <div className="file-upload-wrapper">
                  {/* Removemos o 'required' nativo do input porque agora controlamos manualmente */}
                  <input type="file" id="file-upload" className="file-upload-input" onChange={handleFileChange} multiple />
                  <div className="file-upload-info">Clique novamente para adicionar mais arquivos.</div>
                  
                  {/* MUDANÇA 3: Lista visual melhorada com botão de remover */}
                  {attachedFiles.length > 0 && (
                    <ul style={{marginTop: '15px', listStyle: 'none', padding: 0}}>
                      {attachedFiles.map((file, index) => (
                        <li key={index} style={{display: 'flex', alignItems: 'center', marginBottom: '8px', background: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #eee'}}>
                          <span style={{marginRight: '10px'}}>📄 {file.name}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveFile(index)}
                            style={{marginLeft: 'auto', background: '#a4262c', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                            title="Remover arquivo"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="question-block">
                <label className="question-label">10. Breve Resumo da Ocorrência: <span className="req">*</span></label>
                <textarea className="input-field" value={occurrenceSummary} onChange={(e) => setOccurrenceSummary(e.target.value)} required rows="4" />
              </div>
            </section>

            <div className="submit-area">
              <button type="submit" className="submit-btn" disabled={loading || attachedFiles.length === 0}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
              {attachedFiles.length === 0 && <p style={{fontSize: '12px', color: '#a4262c', marginTop: '8px'}}>* Anexe pelo menos um arquivo para enviar.</p>}
            </div>
          </form>

          {feedbackMessage && (
            <div className={`feedback-box ${isError ? 'error' : 'success'}`}>
               {feedbackMessage}
            </div>
          )}
        </main>
        <footer className="form-footer">Este formulário foi criado pela Hevile.</footer>
      </div>
    </div>
  );
}

export default App;