/** Stepper.jsx — − 2 + for a dish's quantity. */
import React from 'react';

export default function Stepper({ qty, onAdd, onRemove }) {
  return (
    <div className="km-stepper">
      <button type="button" aria-label="−" onClick={onRemove}>−</button>
      <span>{qty}</span>
      <button type="button" aria-label="+" onClick={onAdd}>+</button>
    </div>
  );
}
