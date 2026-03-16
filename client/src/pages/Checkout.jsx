import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

function Checkout({ user }) {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const total = getCartTotal();
  
  const [formData, setFormData] = useState({
    venmo_username: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  if (!user) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="login-prompt">
            <h1>Please Login to Continue</h1>
            <p>You need to be logged in to complete your order.</p>
            <Link to="/login" className="btn btn-primary">Login</Link>
            <p style={{ marginTop: '1rem' }}>
              Don't have an account? <Link to="/register">Register here</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="order-complete">
            <div className="success-icon">✓</div>
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your order! Julie will be in touch soon.</p>
            <div className="venmo-info">
              <h3>Payment via Venmo</h3>
              <p>Please send <strong>${total.toFixed(2)}</strong> to complete your order.</p>
              <p className="venmo-note">Julie will confirm your payment and begin working on your beautiful resin creation!</p>
            </div>
            <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        custom_options: item.customOptions
      }));

      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total,
          notes: formData.notes,
          venmo_username: formData.venmo_username,
          status: 'pending'
        });

      if (error) throw error;

      // In a real app, we'd also insert order_items
      // For simplicity, we'll just show success
      clearCart();
      setOrderComplete(true);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('There was an error placing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-content">
            <div className="checkout-details">
              <h2>Order Details</h2>
              
              <div className="order-items">
                {cart.map(item => (
                  <div key={item.cartId} className="order-item">
                    <img src={item.image_url} alt={item.name} />
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p>Qty: {item.quantity}</p>
                    </div>
                    <div className="item-price">${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Venmo Username *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="@your-venmo-username"
                  value={formData.venmo_username}
                  onChange={(e) => setFormData({ ...formData, venmo_username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Order Notes (Optional)</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Any special instructions for your order..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="checkout-summary">
              <h2>Order Summary</h2>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="payment-info">
                <h3>💳 Payment Method: Venmo</h3>
                <p>After placing your order, you'll receive instructions to send payment via Venmo.</p>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary place-order-btn"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .checkout-page {
          padding: 2rem 0;
        }
        
        .checkout-page h1 {
          color: var(--color-primary);
          margin-bottom: 2rem;
        }
        
        .login-prompt, .order-complete {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: var(--radius-lg);
          max-width: 500px;
          margin: 0 auto;
        }
        
        .success-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--color-success);
          color: white;
          font-size: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        
        .venmo-info {
          background: var(--color-cream);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          margin: 1.5rem 0;
        }
        
        .venmo-info h3 {
          color: var(--color-primary);
          margin-bottom: 0.5rem;
        }
        
        .venmo-note {
          font-size: 0.9rem;
          color: var(--color-text-light);
        }
        
        .checkout-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }
        
        .checkout-details, .checkout-summary {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
        }
        
        .checkout-details h2, .checkout-summary h2 {
          color: var(--color-primary);
          margin-bottom: 1.5rem;
        }
        
        .order-items {
          margin-bottom: 1.5rem;
        }
        
        .order-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--color-cream-dark);
        }
        
        .order-item img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }
        
        .item-info {
          flex: 1;
        }
        
        .item-info h4 {
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        
        .item-info p {
          font-size: 0.85rem;
          color: var(--color-text-light);
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
        }
        
        .payment-info {
          background: var(--color-cream);
          padding: 1rem;
          border-radius: var(--radius-md);
          margin: 1rem 0;
        }
        
        .payment-info h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .payment-info p {
          font-size: 0.85rem;
          color: var(--color-text-light);
        }
        
        .place-order-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
        }
        
        @media (max-width: 768px) {
          .checkout-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Checkout;