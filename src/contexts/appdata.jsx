import React, { useState, useEffect, createContext } from 'react';
import { getAppConfig } from '../core';
export const AppDataContext = createContext();

export const AppDataProvider = (props) => {
  const [appData, setAppData] = useState(null);

  useEffect(() => {
    const generateAppData = async () => {
      let apiData = await getAppConfig()
      if (apiData && apiData.cashOutNatural && apiData.cashOutLegal && apiData.cashIn) {
        setAppData(apiData);
      } else {
        setAppData(false);
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