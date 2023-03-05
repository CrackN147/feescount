import React, {useState, useEffect, useContext} from 'react';
import { compareAsc, endOfWeek } from 'date-fns'
import { AppDataContext }   from '../contexts/appdata';
import { NoResults, Loading, Tabs, Item } from './';
import { getGlobalData, getLocalData, config } from '../core';

export const Output = () => {
  const { appData } = useContext(AppDataContext);
  const [data, setData] = useState(null);

  const roundUp = (num, decimalPlaces = 0) => {
    let p = Math.pow(10, decimalPlaces);
    let n = (num * p) * (1 + Number.EPSILON);
    return Math.round(n) / p;
  }

  const groupUserData = (id, amount, date) => {
    let today = new Date(date);
    return { 
      id, 
      amount, 
      endOfWeek: endOfWeek(today, {
        weekStartsOn: 1
      })
    }
  }

  const getPercent = (amount, percents) => {
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
    let commission = getPercent(item.operation.amount, appData.cashIn.percents);
    if (commission > appData.cashIn.max.amount){
      commission = appData.cashIn.max.amount;
    }
    return commission;
  }
  const commissionForCashOutNatural = (weekSum, item, appData) => {
    let commission = 0;
    let wsIndex = weekSum.findIndex(x => x.id === item.user_id);
    if (wsIndex === -1 || compareAsc(new Date(item.date), weekSum[wsIndex].endOfWeek) === 1) {
      weekSum.push(groupUserData(item.user_id, item.operation.amount, item.date));
      commission = getCommissionAmount(item.operation.amount, appData.cashOutNatural.week_limit.amount, appData.cashOutNatural.percents);
    } else {
      weekSum[wsIndex].amount += item.operation.amount;
      if (weekSum[wsIndex].amount > appData.cashOutNatural.week_limit.amount) {
        commission = getPercent(item.operation.amount, appData.cashOutNatural.percents);
      }
    }
    return {
      commission, 
      weekSum
    };
  }

  const commissionForCashOutLegal = (item, appData) => {
    let commission = getPercent(item.operation.amount, appData.cashOutLegal.percents)
    if (commission < appData.cashOutLegal.min.amount) {
      commission = appData.cashOutLegal.min.amount;
    }
    return commission;
  }

  useEffect(() => {
    if (appData !== null && data === null) {
      const getData = async () => {
        let apiData = await (config.InputDataLocal ? getLocalData() : getGlobalData());
        if (apiData && apiData.length > 0) {
          let weekSum = [];
          apiData.map((item) => {
            let commission = 0;
            // Logic for Cash In
            if (appData.cashIn && item.type === config.cashTypeIn) {
              commission = commissionForCashIN(item, appData);
            }
            // Logic for Cash Out
            else if (item.type === config.cashTypeOut) {
              // Natural 
              if (appData.cashOutNatural && item.user_type === config.userTypeNatural) {
                let calc = commissionForCashOutNatural(weekSum, item, appData);
                commission = calc.commission;
                weekSum = calc.weekSum;
              }
              // Legal
              else if (appData.cashOutLegal && item.user_type === config.userTypeLegal) {
                commission = commissionForCashOutLegal(item, appData);
              }
            }
            item.commission = parseFloat(roundUp(commission, 2)).toFixed(2);
            return item;
          });
          setData(apiData);
        } else {
          setData(false);
        }
      }
      getData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData]);

  return (
    <div className='container'>
      {data === null &&
        <Loading/>
      }
      {(data && appData && data.length > 0) &&
        <div className="output">
          <Tabs/>
          {data.map((item, i) => (
            <Item key={`output-item-${i}`} {...{item}}/>
          ))}
        </div>
      }
      {((data === false || appData === false || (data !== null && data.length === 0))) &&
        <NoResults/>
      }
    </div>
  )
}