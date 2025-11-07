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
  
  // MUDANÇA 1: Estado agora é um Array (lista) de arquivos
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // MUDANÇA 2: Handler para múltiplos arquivos
  const handleFileChange = (e) => {
    if (e.target.files) {
      // Converte o FileList para um Array normal para podermos manipular melhor
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      
      // MUDANÇA 3: Loop para adicionar TODOS os arquivos selecionados
      // Usamos o mesmo nome 'arquivo' várias vezes, o backend vai entender como uma lista
      attachedFiles.forEach((file) => {
        formData.append('arquivo', file);
      });

      // Lembre-se: use sua URL do Render aqui em produção!
      // const response = await axios.post('http://127.0.0.1:5000/api/formulario', formData, {
      const response = await axios.post('https://dispute-backend.onrender.com/api/formulario', formData, {
         headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFeedbackMessage('Sucesso! Formulário enviado. Obrigado.');
      
      // Limpar formulário
      setConsigneeData(''); setRequestReason(''); setBlContainer('');
      setFreeTimeGranted(''); setDischargeDate(''); setFirstReturnAttemptDate('');
      setContainerReturnDate(''); setReturnTerminalCity(''); setOccurrenceSummary('');
      setAttachedFiles([]); // Limpa a lista de arquivos
      e.target.reset(); // Reseta o input visualmente

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
          <p className="disclaimer">Quando você enviar este formulário, ele não coletará automaticamente seus detalhes.</p>
          <p className="required-indicator">* Obrigatória</p>

          <form onSubmit={handleSubmit}>
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

            <section className="form-section">
              <h3 className="section-title">Informações da Devolução:</h3>
              <div className="question-block">
                <label className="question-label">9. Anexar as Evidências (Pode selecionar vários): <span className="req">*</span></label>
                <div className="file-upload-wrapper">
                  {/* MUDANÇA 4: Atributo 'multiple' adicionado */}
                  <input type="file" id="file-upload" className="file-upload-input" onChange={handleFileChange} required multiple />
                  <div className="file-upload-info">Limite de 10MB por envio.</div>
                  
                  {/* MUDANÇA 5: Mostra a lista de arquivos selecionados */}
                  {attachedFiles.length > 0 && (
                    <ul style={{marginTop: '10px', fontSize: '12px', color: '#333'}}>
                      {attachedFiles.map((file, index) => (
                        <li key={index}>📄 {file.name}</li>
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
              {/* Desabilita se não tiver arquivos selecionados */}
              <button type="submit" className="submit-btn" disabled={loading || attachedFiles.length === 0}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
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