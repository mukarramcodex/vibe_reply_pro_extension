import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsApp } from './components/OptionsApp';
import './index.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
);