import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// import './index.css' // <-- Pode remover ou comentar o CSS global antigo se ele estiver atrapalhando
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme'; // <--- Importe o tema que criamos

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normaliza o CSS e aplica a cor de fundo global */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)