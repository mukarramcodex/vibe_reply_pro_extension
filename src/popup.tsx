import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PopupApp } from './components/PopupApp';
import './index.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <PopupApp />
  </StrictMode>
);