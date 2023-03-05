import React, { useState, useEffect, createContext } from 'react';
import { getAppConfig } from '../core';
export const AppDataContext = createContext();

export const AppDataProvider = (props) => {
  const [appData, setAppData] = useState(null);

  useEffect(() => {
    const generateAppData = async () => {
      let apiData = await getAppConfig()
      if (apiData) {
        setAppData(apiData);
      }
    };
    if (!appData) {
      generateAppData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppDataContext.Provider value={{ appData }}>
      {props.children}
    </AppDataContext.Provider>
  );
};