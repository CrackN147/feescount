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

  const groupUsData = (id, amount, date) => {
    return { id, amount, 
      endOfWeek: endOfWeek(new Date(date), {
        weekStartsOn: 1
      })
    }
  }

  const getPercentage = (amount, percents) => (
    amount / 100 * percents
  )

  const getAmount = (amount, weekAmount, percents) => (
    amount > weekAmount ? ((amount - weekAmount) / 100 * percents) : 0
  )

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
            commission = getPercentage(item.operation.amount,appData.cashIn.percents);
            if (commission > appData.cashIn.max.amount) 
              commission = appData.cashIn.max.amount;
          }
          // Logic for Cash Out
          else if (item.type === API.config.cashTypeOut) {
            // Natural 
            if (appData.cashOutNatural && item.user_type === API.config.userTypeNatural) {
              let wsIndex = weekSum.findIndex(x => x.id === item.user_id);
              if (wsIndex === -1 || compareAsc(new Date(item.date), weekSum[wsIndex].endOfWeek) === 1) {
                weekSum.push(groupUsData(item.user_id, item.operation.amount, item.date));
                commission = getAmount(item.operation.amount, appData.cashOutNatural.week_limit.amount, appData.cashOutNatural.percents);
              } else {
                weekSum[wsIndex].amount += item.operation.amount;
                commission = weekSum[wsIndex].amount > appData.cashOutNatural.week_limit.amount ? getPercentage(item.operation.amount, appData.cashOutNatural.percents) : 0;
              }
            }
            // Legal
            else if (appData.cashOutLegal && item.user_type === API.config.userTypeLegal) {
              commission = getPercentage(item.operation.amount, appData.cashOutLegal.percents)
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