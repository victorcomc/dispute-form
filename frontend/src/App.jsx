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
  const [attachedFile, setAttachedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
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
      
      if (attachedFile) {
        formData.append('arquivo', attachedFile);
      }

      // Lembre-se de alterar para a URL de produção quando subir para o Render
      const response = await axios.post('http://127.0.0.1:5000/api/formulario', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFeedbackMessage(`Sucesso! Formulário enviado. Arquivo: ${response.data.dados.arquivo_url}`);
      
      // Limpar formulário
      setConsigneeData(''); setRequestReason(''); setBlContainer('');
      setFreeTimeGranted(''); setDischargeDate(''); setFirstReturnAttemptDate('');
      setContainerReturnDate(''); setReturnTerminalCity(''); setOccurrenceSummary('');
      setAttachedFile(null);
      e.target.reset();

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
        
        {/* Cabeçalho Marrom */}
        <header className="form-header">
          <div className="logo-area">
            {/* Certifique-se que logo.png está na pasta 'public' */}
            <img src="/logo.png" alt="Hevile Logo" className="header-logo" />
          </div>
          <h1>Formulário de Solicitação de Dispute</h1>
          <p className="header-desc">Este formulário tem o objetivo de centralizar as informações e evidências referentes ao seu dispute.</p>
          <p className="header-desc">Seu preenchimento contribui para que a Hevile possa atuar de forma ágil e assertiva na análise e abertura do processo junto ao armador.</p>
        </header>

        {/* Corpo do Formulário */}
        <main className="form-body">
          <p className="disclaimer">Quando você enviar este formulário, ele não coletará automaticamente seus detalhes, como nome e endereço de email, a menos que você mesmo o forneça.</p>
          <p className="required-indicator">* Obrigatória</p>

          <form onSubmit={handleSubmit}>
            <section className="form-section">
              <h3 className="section-title">Informações Gerais:</h3>
              
              <div className="question-block">
                <label className="question-label">1. Dados do Consignee conforme BL: <span className="req">*</span></label>
                <textarea className="input-field" value={consigneeData} onChange={(e) => setConsigneeData(e.target.value)} required rows="2" placeholder="Insira sua resposta" />
              </div>

              <div className="question-block">
                <label className="question-label">2. Motivo da Solicitação: <span className="req">*</span></label>
                <textarea className="input-field" value={requestReason} onChange={(e) => setRequestReason(e.target.value)} required rows="2" placeholder="Insira sua resposta" />
              </div>

              <div className="question-block">
                <label className="question-label">3. BL / Container: <span className="req">*</span></label>
                <input type="text" className="input-field" value={blContainer} onChange={(e) => setBlContainer(e.target.value)} required placeholder="Insira sua resposta" />
              </div>
            </section>

            <section className="form-section">
              <h3 className="section-title">Detalhes da Operação:</h3>
              <div className="question-block">
                <label className="question-label">4. Free Time Concedido: <span className="req">*</span></label>
                <input type="text" className="input-field" value={freeTimeGranted} onChange={(e) => setFreeTimeGranted(e.target.value)} required placeholder="Insira sua resposta" />
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
                <input type="text" className="input-field" value={returnTerminalCity} onChange={(e) => setReturnTerminalCity(e.target.value)} required placeholder="Insira sua resposta" />
              </div>
            </section>

            <section className="form-section">
              <h3 className="section-title">Informações da Devolução:</h3>
              <div className="question-block">
                <label className="question-label">9. Anexar as Evidências (e-mail ou documento comprobatório). (Pergunta não anônima) <span className="req">*</span></label>
                <div className="file-upload-wrapper">
                  <input type="file" id="file-upload" className="file-upload-input" onChange={handleFileChange} required />
                  <div className="file-upload-info">Limite de tamanho: 10MB. Tipos permitidos: PDF, Imagem, Office.</div>
                </div>
              </div>
              <div className="question-block">
                <label className="question-label">10. Breve Resumo da Ocorrência: <span className="req">*</span></label>
                <textarea className="input-field" value={occurrenceSummary} onChange={(e) => setOccurrenceSummary(e.target.value)} required rows="4" placeholder="Insira sua resposta" />
              </div>
            </section>

            <div className="submit-area">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>

          </form>

          {feedbackMessage && (
            <div className={`feedback-box ${isError ? 'error' : 'success'}`}>
               {isError ? feedbackMessage : (
                  <>
                    Envio realizado com sucesso! <br/>
                    <a href={feedbackMessage.split('Arquivo: ')[1]} target="_blank" rel="noopener noreferrer" style={{color: 'inherit', fontWeight: 'bold'}}>
                      Ver arquivo anexado
                    </a>
                  </>
                )}
            </div>
          )}
        </main>
        
        <footer className="form-footer">
          Este conteúdo foi criado pelo proprietário do formulário. Os dados que você enviar serão enviados ao proprietário do formulário.
        </footer>
      </div>
    </div>
  );
}

export default App;