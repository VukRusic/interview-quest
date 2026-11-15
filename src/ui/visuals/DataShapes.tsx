import { useState } from 'react';

type Shape = 'rows' | 'doc';
type Question = 'order' | 'product';

const NOTE: Record<Shape, Record<Question, string>> = {
  rows: {
    order: 'One query that joins orders and order_items: 1 order row and 3 item rows read.',
    product: 'One indexed lookup on order_items by product, then the matching orders. The database does this without any special design.',
  },
  doc: {
    order: 'One document read. Everything about the order is already together, with no join.',
    product:
      'Every order document has to be opened, unless you add and maintain a separate index on the items inside. This store was shaped for the other question.',
  },
};

/** The same order as joined rows and as one document, and what each of two questions costs. */
export function DataShapes() {
  const [shape, setShape] = useState<Shape>('rows');
  const [question, setQuestion] = useState<Question>('order');
  return (
    <div className="viz viz-shapes">
      <div className="retry-options" role="radiogroup" aria-label="How the order is stored">
        <label className="switch">
          <input type="radio" name="shape" checked={shape === 'rows'} onChange={() => setShape('rows')} />
          <span>Rows in two tables (relational)</span>
        </label>
        <label className="switch">
          <input type="radio" name="shape" checked={shape === 'doc'} onChange={() => setShape('doc')} />
          <span>One document per order</span>
        </label>
      </div>
      <pre className="shape-data" aria-label="How order 42 is stored">
        {shape === 'rows'
          ? `orders       id=42  customer=7  total=58
order_items  order=42  product=A  qty=1
order_items  order=42  product=X  qty=2
order_items  order=42  product=C  qty=1`
          : `{ id: 42, customer: 7, total: 58,
  items: [ { product: "A", qty: 1 },
           { product: "X", qty: 2 },
           { product: "C", qty: 1 } ] }`}
      </pre>
      <div className="viz-controls">
        <button type="button" className="btn" aria-pressed={question === 'order'} onClick={() => setQuestion('order')}>
          Show order 42 with its items
        </button>
        <button type="button" className="btn" aria-pressed={question === 'product'} onClick={() => setQuestion('product')}>
          Find every order containing product X
        </button>
      </div>
      <p className="viz-note" data-testid="shape-note" aria-live="polite">
        {NOTE[shape][question]}
      </p>
    </div>
  );
}
