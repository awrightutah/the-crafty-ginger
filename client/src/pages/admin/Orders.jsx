import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

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

    fetchOrders();
  }

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      fetchOrders();
    } catch (error) {
      alert('Error updating order: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#F59E0B',
      confirmed: '#3B82F6',
      in_progress: '#8B5CF6',
      shipped: '#10B981',
      delivered: '#059669',
      cancelled: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const filteredOrders = orders.filter(o => {
      const statusMatch = filter === 'all' || o.status === filter;
      const paymentMatch = paymentFilter === 'all' || o.payment_status === paymentFilter;
      return statusMatch && paymentMatch;
    });

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: '#10B981',
      pending: '#F59E0B',
      refunded: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getOrderTypeIcon = (type) => {
    const icons = {
      online: '🌐',
      in_person: '🏪',
      phone: '📞',
      custom: '✨'
    };
    return icons[type] || '📦';
  };

  const updatePaymentStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      fetchOrders();
    } catch (error) {
      alert('Error updating payment status: ' + error.message);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="admin-orders">
      <div className="container">
        <div className="page-header">
          <h1>Manage Orders</h1>
          <Link to="/admin/orders/new" className="btn btn-primary">
            + New Order
          </Link>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label>Status:</label>
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({orders.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
              onClick={() => setFilter('confirmed')}
            >
              Confirmed ({orders.filter(o => o.status === 'confirmed').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'shipped' ? 'active' : ''}`}
              onClick={() => setFilter('shipped')}
            >
              Shipped ({orders.filter(o => o.status === 'shipped').length})
            </button>
          </div>
          <div className="filter-group">
            <label>Payment:</label>
            <button 
              className={`filter-btn payment ${paymentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn payment paid ${paymentFilter === 'paid' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('paid')}
            >
              Paid ({orders.filter(o => o.payment_status === 'paid').length})
            </button>
            <button 
              className={`filter-btn payment pending ${paymentFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('pending')}
            >
              Unpaid ({orders.filter(o => o.payment_status === 'pending').length})
            </button>
          </div>
        </div>

        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <p>No orders found.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-id">
                      {getOrderTypeIcon(order.order_type)} Order #{order.id.slice(0, 8)}
                    </span>
                    <span className="order-date">
                      {new Date(order.created_at).toLocaleDateString()} at{' '}
                      {new Date(order.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="order-badges">
                    <span 
                      className="order-status"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                    <span 
                      className="payment-status"
                      style={{ backgroundColor: getPaymentStatusColor(order.payment_status) }}
                    >
                      {order.payment_status === 'paid' ? '✓ Paid' : order.payment_status}
                    </span>
                  </div>
                </div>
                
                <div className="order-details">
                  <div className="detail-section">
                    <h4>Customer</h4>
                    {order.customer_name ? (
                      <>
                        <p><strong>{order.customer_name}</strong></p>
                        {order.customer_phone && <p>📱 {order.customer_phone}</p>}
                        {order.customer_email && <p>✉️ {order.customer_email}</p>}
                      </>
                    ) : (
                      <p>Online Customer</p>
                    )}
                    {order.venmo_username && (
                      <p><strong>Venmo:</strong> {order.venmo_username}</p>
                    )}
                  </div>
                  
                  <div className="detail-section">
                    <h4>Order Info</h4>
                    <p className="order-total">Total: ${order.total?.toFixed(2)}</p>
                    {order.payment_method && (
                      <p>Payment: {order.payment_method === 'venmo' ? '💸 Venmo' : order.payment_method === 'cash' ? '💵 Cash' : order.payment_method}</p>
                    )}
                    {order.order_type && order.order_type !== 'online' && (
                      <p>Type: {order.order_type.replace('_', ' ')}</p>
                    )}
                    {order.notes && (
                      <p className="order-notes"><strong>Notes:</strong> {order.notes}</p>
                    )}
                  </div>
                </div>

                <div className="order-actions">
                  <div className="action-group">
                    <label>Order Status:</label>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="action-group">
                    <label>Payment Status:</label>
                    <select
                      value={order.payment_status || 'pending'}
                      onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="paid">✓ Paid</option>
                      <option value="refunded">↩ Refunded</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .admin-orders {
          padding: 2rem 0;
        }
        
        .admin-orders h1 {
          color: var(--color-primary);
          margin-bottom: 1.5rem;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .filter-bar {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .filter-group label {
          font-weight: 600;
          color: var(--color-text-light);
          margin-right: 0.5rem;
        }
        
        .filter-btn {
          padding: 0.5rem 1rem;
          border: 2px solid var(--color-primary);
          background: transparent;
          border-radius: var(--radius-md);
          color: var(--color-primary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .filter-btn:hover,
        .filter-btn.active {
          background: var(--color-primary);
          color: white;
        }
        
        .filter-btn.payment.paid {
          border-color: #10B981;
          color: #10B981;
        }
        
        .filter-btn.payment.paid.active,
        .filter-btn.payment.paid:hover {
          background: #10B981;
          color: white;
        }
        
        .filter-btn.payment.pending {
          border-color: #F59E0B;
          color: #F59E0B;
        }
        
        .filter-btn.payment.pending.active,
        .filter-btn.payment.pending:hover {
          background: #F59E0B;
          color: white;
        }
        
        .orders-list {
          display: grid;
          gap: 1rem;
        }
        
        .order-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }
        
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-cream-dark);
        }
        
        .order-id {
          font-weight: 600;
          font-size: 1.1rem;
        }
        
        .order-date {
          font-size: 0.85rem;
          color: var(--color-text-light);
          margin-left: 1rem;
        }
        
        .order-badges {
          display: flex;
          gap: 0.5rem;
        }
        
        .order-status {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          color: white;
          font-size: 0.85rem;
          text-transform: capitalize;
        }
        
        .payment-status {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          color: white;
          font-size: 0.85rem;
          text-transform: capitalize;
        }
        
        .order-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .detail-section h4 {
          color: var(--color-primary);
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }
        
        .detail-section p {
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        
        .order-total {
          font-weight: 600;
          color: var(--color-ginger);
        }
        
        .order-notes {
          font-size: 0.85rem;
          color: var(--color-text-light);
        }
        
        .order-actions {
          display: flex;
          gap: 2rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-cream-dark);
          flex-wrap: wrap;
        }
        
        .action-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .action-group label {
          font-weight: 500;
          color: var(--color-text-light);
        }
        
        .status-select {
          padding: 0.5rem 1rem;
          border: 2px solid var(--color-cream-dark);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }
        
        .no-orders {
          text-align: center;
          padding: 3rem;
          color: var(--color-text-light);
        }
        
        @media (max-width: 768px) {
          .order-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Orders;