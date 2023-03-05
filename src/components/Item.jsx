import React from "react";
export const Item = ({item}) => {
  return (
    <div className='row'>
      <div>{item.date}</div>
      <div>{item.user_id}</div>
      <div>{item.user_type}</div>
      <div>{item.type}</div>
      <div>{item.operation.amount}</div>
      <div>{item.operation.currency}</div>
      <div>{item.commission}</div>
    </div>
  )
}