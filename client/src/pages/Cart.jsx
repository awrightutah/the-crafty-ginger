import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Cart() {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const total = getCartTotal();

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <h1>Your Cart is Empty</h1>
            <p>Looks like you haven't added any beautiful resin creations yet!</p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>
        
        <div className="cart-content">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.cartId} className="cart-item">
                <div className="item-image">
                  <img src={item.image_url} alt={item.name} />
                </div>
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p className="item-category">{item.category}</p>
                  {item.customOptions && (
                    <div className="custom-options-summary">
                      {item.customOptions.color && <p><strong>Colors:</strong> {item.customOptions.color}</p>}
                      {item.customOptions.notes && <p><strong>Notes:</strong> {item.customOptions.notes}</p>}
                    </div>
                  )}
                  <div className="item-actions">
                    <div className="quantity">
                      <button onClick={() => updateQuantity(item.cartId, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>+</button>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.cartId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Link to="/checkout" className="btn btn-primary checkout-btn">
              Proceed to Checkout
            </Link>
            <button className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cart-page {
          padding: 2rem 0;
        }
        
        .cart-page h1 {
          color: var(--color-primary);
          margin-bottom: 2rem;
        }
        
        .empty-cart {
          text-align: center;
          padding: 4rem 2rem;
        }
        
        .empty-cart h1 {
          margin-bottom: 1rem;
        }
        
        .empty-cart p {
          color: var(--color-text-light);
          margin-bottom: 2rem;
        }
        
        .cart-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }
        
        .cart-item {
          display: grid;
          grid-template-columns: 100px 1fr auto;
          gap: 1.5rem;
          padding: 1.5rem;
          background: white;
          border-radius: var(--radius-lg);
          margin-bottom: 1rem;
          box-shadow: var(--shadow-sm);
        }
        
        .item-image img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: var(--radius-md);
        }
        
        .item-details h3 {
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }
        
        .item-category {
          font-size: 0.85rem;
          color: var(--color-text-light);
        }
        
        .custom-options-summary {
          font-size: 0.85rem;
          margin-top: 0.5rem;
          padding: 0.5rem;
          background: var(--color-cream);
          border-radius: var(--radius-sm);
        }
        
        .item-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.75rem;
        }
        
        .quantity {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .quantity button {
          width: 28px;
          height: 28px;
          border: 1px solid var(--color-primary);
          background: transparent;
          border-radius: var(--radius-sm);
          color: var(--color-primary);
        }
        
        .quantity span {
          width: 30px;
          text-align: center;
          font-weight: 500;
        }
        
        .remove-btn {
          background: none;
          border: none;
          color: var(--color-error);
          font-size: 0.9rem;
        }
        
        .item-price {
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--color-primary);
        }
        
        .cart-summary {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          height: fit-content;
          position: sticky;
          top: 100px;
        }
        
        .cart-summary h2 {
          font-size: 1.25rem;
          margin-bottom: 1.5rem;
          color: var(--color-primary);
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--color-cream-dark);
        }
        
        .summary-row.total {
          font-weight: 700;
          font-size: 1.25rem;
          border-bottom: none;
          margin-top: 0.5rem;
        }
        
        .checkout-btn {
          width: 100%;
          margin-top: 1.5rem;
        }
        
        .clear-cart-btn {
          width: 100%;
          margin-top: 0.5rem;
          background: none;
          border: none;
          color: var(--color-text-light);
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .cart-content {
            grid-template-columns: 1fr;
          }
          
          .cart-item {
            grid-template-columns: 80px 1fr;
          }
          
          .item-price {
            grid-column: 2;
          }
        }
      `}</style>
    </div>
  );
}

export default Cart;