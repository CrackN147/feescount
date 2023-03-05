import React from 'react';
import { Output } from './components';
import { AppDataProvider } from './contexts/appdata';
const App = () => {
  return (
    <AppDataProvider>
      <Output/>
    </AppDataProvider>
  );
}

export default App;
