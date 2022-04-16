import React from 'react';
import Output from './components/Output';
import {AppDataProvider} from './contexts/appdata';
const App = () => {
  return (
    <AppDataProvider>
      <Output/>
    </AppDataProvider>
  );
}

export default App;
