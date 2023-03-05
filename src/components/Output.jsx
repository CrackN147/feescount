import React, {useState, useEffect, useContext} from 'react';
import { compareAsc, endOfWeek } from 'date-fns'
import { AppDataContext }   from '../contexts/appdata';
import { NoResults, Loading } from './';
import { getInputData, config } from '../core';

export const Output = () => {
  const { appData } = useContext(AppDataContext);
  const [data, setData] = useState(false);

  const roundUp = (num, decimalPlaces = 0) => {
    let p = Math.pow(10, decimalPlaces);
    let n = (num * p) * (1 + Number.EPSILON);
    return Math.round(n) / p;
  }

  const groupUsData = (id, amount, date) => {
    let today = new Date(date);
    return { 
      id, 
      amount, 
      endOfWeek: endOfWeek(today, {
        weekStartsOn: 1
      })
    }
  }

  const getPercentage = (amount, percents) => {
    return amount / 100 * percents;
  }

  const getCommissionAmount = (amount, weekAmount, percents) => {
    let commission = 0;
    if (amount > weekAmount) {
      commission = (amount - weekAmount) / 100 * percents;
    }
    return commission;
  }

  const commissionForCashIN = (item, appData) => {
    let commission = getPercentage(item.operation.amount, appData.cashIn.percents);
    if (commission > appData.cashIn.max.amount){
      commission = appData.cashIn.max.amount;
    }
    return commission;
  }
  const commissionForCashOutNatural = (item, appData) => {
    let weekSum = [];
    let commission = 0;
    let wsIndex = weekSum.findIndex(x => x.id === item.user_id);
    if (wsIndex === -1 || compareAsc(new Date(item.date), weekSum[wsIndex].endOfWeek) === 1) {
      weekSum.push(groupUsData(item.user_id, item.operation.amount, item.date));
      commission = getCommissionAmount(item.operation.amount, appData.cashOutNatural.week_limit.amount, appData.cashOutNatural.percents);
    } else {
      weekSum[wsIndex].amount += item.operation.amount;
      if (weekSum[wsIndex].amount > appData.cashOutNatural.week_limit.amount) {
        commission = getPercentage(item.operation.amount, appData.cashOutNatural.percents);
      }
    }
    return commission;
  }

  const commissionForCashOutLegal = (item, appData) => {
    let commission = getPercentage(item.operation.amount, appData.cashOutLegal.percents)
    if (commission < appData.cashOutLegal.min.amount) {
      commission = appData.cashOutLegal.min.amount;
    }
    return commission;
  }

  useEffect(() => {
    if (appData && !data) {
      const getData = async () => {
        let apiData = await getInputData();
        if (apiData && apiData.length > 0) {
          let result = [];
          for (let i = 0; i < apiData.length; i++) {
            const item = apiData[i];
            let commission = 0;
            // Logic for Cash In
            if (appData.cashIn && item.type === config.cashTypeIn) {
              commission = commissionForCashIN(item, appData);
            }
            // Logic for Cash Out
            else if (item.type === config.cashTypeOut) {
              // Natural 
              if (appData.cashOutNatural && item.user_type === config.userTypeNatural) {
                commission = commissionForCashOutNatural(item, appData);
              }
              // Legal
              else if (appData.cashOutLegal && item.user_type === config.userTypeLegal) {
                commission = commissionForCashOutLegal(item, appData);
              }
            }
            item.commission = roundUp(commission, 2);
            result.push(item);
          }
          setData(result);
        }
      }
      getData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData]);

  return (
    <div className='container'>
      {!data &&
        <Loading/>
      }
      {data.length > 0 ?
        <div className="output">
          {data.map((item, i) => (
            <div key={`output-item-${i}`}>
              {parseFloat(item.commission).toFixed(2)}
            </div>
          ))}
        </div>
      :
        <NoResults/>
      }
    </div>
  )
}