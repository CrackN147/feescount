import React, { useRef, useState, useEffect, useCallback, createContext } from 'react';
import API from '../core/api';
export const AppDataContext = createContext();

export const AppDataProvider = (props) => {
  let loader = useRef();
  const [appData, setAppData] = useState(false);
  
  const generateAppData = useCallback(async () => {
    if (!loader.current) {
      loader.current = true;
      const apiData = await API.getAppConfig()
      if (apiData) setAppData(apiData);
    }
  }, [])

  useEffect(() => {
    generateAppData()
  }, [generateAppData]);

  return (
    <AppDataContext.Provider value={{ appData}}>
      {props.children}
    </AppDataContext.Provider>
  );
};
export default AppDataProvider;