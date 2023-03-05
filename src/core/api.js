import { config } from './'
export const getLocalData = async () => {
  let data = require('../test.data.json');
  return data;
}
export const getGlobalData = async () => {
  return fetch(config.InputDataPath).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('NoData');
    }
  }).catch(() => false );
}
export const getAppConfig = async () => {
  return Promise.all([
    fetch(config.cashInPath).then(response => response.json()).catch(() => false),
    fetch(config.cashOutNaturalPath).then(response => response.json()).catch(() => false),
    fetch(config.cashOutLegalPath).then(response => response.json()).catch(() => false),
  ]).then(([cashIn, cashOutNatural, cashOutLegal]) => ({ cashIn, cashOutNatural, cashOutLegal })).catch(() => false )
}