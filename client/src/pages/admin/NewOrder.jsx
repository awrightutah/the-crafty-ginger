import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function NewOrder() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('');

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Order details
  const [orderType, setOrderType] = useState('in_person');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');
  const [venmoUsername, setVenmoUsername] = useState('');

  // Cart items
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!data) {
      navigate('/');
      return;
    }

    setIsAdmin(true);
    fetchProducts();
    setLoading(false);
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    setProducts(data || []);
  }

  const addToCart = (product) => {
    const existing = cartItems.find(item => item.product_id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      setMessage('Please add at least one product to the order');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const total = calculateTotal();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          total,
          status: paymentStatus === 'paid' ? 'confirmed' : 'pending',
          notes: `In-Person Order\nCustomer: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail || 'N/A'}\nAddress: ${customerAddress || 'N/A'}\n\n${notes}`,
          venmo_username: paymentMethod === 'venmo' ? venmoUsername : null,
          order_type: orderType,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        })
        .select()
        .maybeSingle();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      setMessage('Order created successfully!');
      setTimeout(() => {
        navigate('/admin/orders');
      }, 1500);
    } catch (error) {
      console.error('Error creating order:', error);
      setMessage('Error creating order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Access Denied</div>;
  }

  return (
    <div className="new-order-page">
      <div className="container">
        <div className="page-header">
          <h1>📝 New In-Person Order</h1>
          <Link to="/admin/orders" className="btn btn-secondary">← Back to Orders</Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="order-layout">
            <div className="order-form-section">
              <div className="form-card">
                <h2>👤 Customer Information</h2>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="form-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Enter email (optional)"
                    />
                  </div>
                  <div className="form-field">
                    <label>Address</label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter address (optional)"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <h2>💳 Payment Details</h2>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Order Type</label>
                    <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                      <option value="in_person">In-Person</option>
                      <option value="phone">Phone Order</option>
                      <option value="custom">Custom Order</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="venmo">Venmo</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Payment Status</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                      <option value="paid">✅ Paid</option>
                      <option value="pending">⏳ Pending</option>
                    </select>
                  </div>
                  {paymentMethod === 'venmo' && (
                    <div className="form-field">
                      <label>Venmo Username</label>
                      <input
                        type="text"
                        value={venmoUsername}
                        onChange={(e) => setVenmoUsername(e.target.value)}
                        placeholder="@username"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-card">
                <h2>📋 Order Notes</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="order-cart-section">
              <div className="form-card">
                <h2>🎨 Add Products</h2>
                <div className="products-list">
                  {products.map(product => (
                    <div key={product.id} className="product-item">
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        <span className="product-price">${product.price.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-add"
                        onClick={() => addToCart(product)}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-card cart-card">
                <h2>🛒 Order Items</h2>
                {cartItems.length === 0 ? (
                  <p className="empty-cart">No items added yet</p>
                ) : (
                  <div className="cart-items">
                    {cartItems.map(item => (
                      <div key={item.product_id} className="cart-item">
                        <div className="cart-item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-price">${item.price.toFixed(2)}</span>
                        </div>
                        <div className="cart-item-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          >-</button>
                          <span className="qty">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          >+</button>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => removeFromCart(item.product_id)}
                          >✕</button>
                        </div>
                        <div className="item-total">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-amount">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={saving || cartItems.length === 0}
              >
                {saving ? 'Creating Order...' : 'Create Order'}
              </button>

              {message && (
                <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .new-order-page {
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h1 {
          color: var(--color-primary);
        }

        .order-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .form-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          margin-bottom: 1.5rem;
        }

        .form-card h2 {
          color: var(--color-primary);
          font-size: 1.1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid var(--color-cream);
        }

        .form-grid {
          display: grid;
          gap: 1rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-field label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--color-text);
        }

        .form-field input,
        .form-field textarea,
        .form-field select {
          padding: 0.75rem;
          border: 2px solid var(--color-cream-dark);
          border-radius: var(--radius-md);
          font-size: 1rem;
        }

        .form-field input:focus,
        .form-field textarea:focus,
        .form-field select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .products-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid var(--color-cream);
        }

        .product-item:last-child {
          border-bottom: none;
        }

        .product-info {
          display: flex;
          flex-direction: column;
        }

        .product-name {
          font-weight: 500;
        }

        .product-price {
          font-size: 0.9rem;
          color: var(--color-text-light);
        }

        .btn-add {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.9rem;
        }

        .btn-add:hover {
          background: var(--color-primary-dark);
        }

        .cart-card {
          background: var(--color-cream);
        }

        .empty-cart {
          text-align: center;
          color: var(--color-text-light);
          padding: 1rem;
        }

        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cart-item {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 1rem;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: var(--radius-md);
        }

        .cart-item-info {
          display: flex;
          flex-direction: column;
        }

        .item-name {
          font-weight: 500;
          font-size: 0.95rem;
        }

        .item-price {
          font-size: 0.85rem;
          color: var(--color-text-light);
        }

        .cart-item-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .qty-btn {
          width: 28px;
          height: 28px;
          border: 2px solid var(--color-primary);
          background: white;
          color: var(--color-primary);
          border-radius: 50%;
          cursor: pointer;
          font-weight: bold;
        }

        .qty-btn:hover {
          background: var(--color-primary);
          color: white;
        }

        .qty {
          width: 30px;
          text-align: center;
          font-weight: 600;
        }

        .remove-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 50%;
          cursor: pointer;
          margin-left: 0.5rem;
        }

        .remove-btn:hover {
          background: #fecaca;
        }

        .item-total {
          font-weight: 600;
          color: var(--color-primary);
          text-align: right;
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          margin-top: 1rem;
          border-top: 2px solid var(--color-cream-dark);
          font-size: 1.25rem;
          font-weight: 600;
        }

        .total-amount {
          color: var(--color-primary);
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          margin-top: 1rem;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 1rem;
          border-radius: var(--radius-md);
          text-align: center;
          margin-top: 1rem;
          font-weight: 500;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
        }

        .message.error {
          background: #fee2e2;
          color: #991b1b;
        }

        @media (max-width: 900px) {
          .order-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default NewOrder;