import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// IMPORTANTE: Removemos a importação do './theme' e a estrutura do Material UI
// para evitar erros de dependência não resolvida.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* Renderiza diretamente o componente principal */}
  </React.StrictMode>,
)