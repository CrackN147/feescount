import React, {useState, useEffect, useCallback, useContext} from 'react';
import { compareAsc, endOfWeek } from 'date-fns'
import { AppDataContext }   from '../contexts/appdata';
import API from '../core/api';
const Output = () => {
  const { appData } = useContext(AppDataContext);
  const [data, setData] = useState(false);

  const roundUp = (num, decimalPlaces = 0) => {
    let p = Math.pow(10, decimalPlaces);
    let n = (num * p) * (1 + Number.EPSILON);
    return Math.round(n) / p;
  }

  const getData = useCallback(async () => {
    if (appData) {
      const apiData = await API.getInputData();
      if (apiData && apiData.length > 0) {
        let result = [];
        let weekSum = [];
        for (let i = 0; i < apiData.length; i++) {
          const item = apiData[i];
          let commission = 0;
          // Logic for Cash In
          if (appData.cashIn && item.type === API.config.cashTypeIn) {
            commission = item.operation.amount / 100 * appData.cashIn.percents
            if (commission > appData.cashIn.max.amount) 
              commission = appData.cashIn.max.amount;
          }
          // Logic for Cash Out
          if (item.type === API.config.cashTypeOut) {
            // Natural 
            if (appData.cashOutNatural && item.user_type === API.config.userTypeNatural) {
              let wsIndex = weekSum.findIndex(x => x.user_id === item.user_id);
              if (wsIndex === -1) {
                weekSum.push({
                  user_id: item.user_id,
                  amount: item.operation.amount,
                  endOfWeek: endOfWeek(new Date(item.date), {weekStartsOn: 1}),
                });
                
                if (item.operation.amount <= appData.cashOutNatural.week_limit.amount) {
                  commission = 0;
                } else {
                  commission = (item.operation.amount - appData.cashOutNatural.week_limit.amount) / 100 * appData.cashOutNatural.percents
                }
              } else {
                if (compareAsc(new Date(item.date), weekSum[wsIndex].endOfWeek) < 1) {
                  weekSum[wsIndex].amount += item.operation.amount;
                  if (weekSum[wsIndex].amount <= appData.cashOutNatural.week_limit.amount) {
                    commission = 0;
                  } else {
                    commission = item.operation.amount / 100 * appData.cashOutNatural.percents
                  }
                } else {
                  weekSum[wsIndex] = {
                    user_id: item.user_id,
                    amount: item.operation.amount,
                    endOfWeek: endOfWeek(new Date(item.date), {weekStartsOn: 1})
                  };
                  if (item.operation.amount <= appData.cashOutNatural.week_limit.amount) {
                    commission = 0;
                  } else {
                    commission = (item.operation.amount - appData.cashOutNatural.week_limit.amount) / 100 * appData.cashOutNatural.percents
                  }
                }
              }
            }
            // Legal
            if (appData.cashOutLegal && item.user_type === API.config.userTypeLegal) {
              commission = item.operation.amount / 100 * appData.cashOutLegal.percents
              if (commission < appData.cashOutLegal.min.amount) 
                commission = appData.cashOutLegal.min.amount;
            }
          }
          item.commission = roundUp(commission, 2);
          result.push(item);
        }
        setData(result);
      }
    }
  }, [appData]);

  useEffect(() => {
    getData();
  }, [getData]);

  return (
    <>
      {!data ?
        <div>Loading</div>
      : data.length > 0 ?
        <>
          {data.map((item, i) => (
            <div key={i}>
              {parseFloat(item.commission).toFixed(2)}
            </div>
          ))}
        </>
      :
        <div>No Result</div>
      }
    </>
  )
}

export default Output;