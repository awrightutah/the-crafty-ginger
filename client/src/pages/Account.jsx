import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Account({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchOrders();
  }, [user]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-header">
          <h1>My Account</h1>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>

        <div className="account-content">
          <div className="profile-section">
            <h2>Profile Information</h2>
            <div className="profile-card">
              <p><strong>Name:</strong> {profile?.full_name || user?.user_metadata?.full_name || 'Not set'}</p>
              <p><strong>Email:</strong> {profile?.email || user?.email}</p>
            </div>
          </div>

          <div className="orders-section">
            <h2>Order History</h2>
            {orders.length === 0 ? (
              <div className="no-orders">
                <p>You haven't placed any orders yet.</p>
                <Link to="/products" className="btn btn-primary">Start Shopping</Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div>
                        <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                        <span className="order-date">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span 
                        className="order-status"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="order-total">
                      Total: ${order.total?.toFixed(2)}
                    </div>
                    {order.notes && (
                      <p className="order-notes"><strong>Notes:</strong> {order.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .account-page {
          padding: 2rem 0;
        }
        
        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .account-header h1 {
          color: var(--color-primary);
        }
        
        .account-content {
          display: grid;
          gap: 2rem;
        }
        
        .profile-section h2, .orders-section h2 {
          color: var(--color-primary);
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }
        
        .profile-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }
        
        .profile-card p {
          margin-bottom: 0.5rem;
        }
        
        .no-orders {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          text-align: center;
        }
        
        .no-orders p {
          margin-bottom: 1rem;
          color: var(--color-text-light);
        }
        
        .orders-list {
          display: grid;
          gap: 1rem;
        }
        
        .order-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }
        
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .order-id {
          font-weight: 600;
          margin-right: 1rem;
        }
        
        .order-date {
          font-size: 0.9rem;
          color: var(--color-text-light);
        }
        
        .order-status {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          color: white;
          font-size: 0.85rem;
          text-transform: capitalize;
        }
        
        .order-total {
          font-weight: 600;
          color: var(--color-primary);
        }
        
        .order-notes {
          font-size: 0.9rem;
          color: var(--color-text-light);
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default Account;