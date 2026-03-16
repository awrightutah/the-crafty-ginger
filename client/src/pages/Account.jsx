import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Account({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchOrders();
    checkAdmin();
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
      // Initialize edit fields
      setEditName(data?.full_name || user?.user_metadata?.full_name || '');
      setEditPhone(data?.phone || '');
      setEditAddress(data?.address || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Initialize with user metadata if profile doesn't exist
      setEditName(user?.user_metadata?.full_name || '');
    }
  }

  const startEditing = () => {
    setEditName(profile?.full_name || user?.user_metadata?.full_name || '');
    setEditPhone(profile?.phone || '');
    setEditAddress(profile?.address || '');
    setEditing(true);
    setMessage('');
  };

  const cancelEditing = () => {
    setEditing(false);
    setMessage('');
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Update profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: editName,
          email: user.email,
          phone: editPhone,
          address: editAddress,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setProfile({
        ...profile,
        full_name: editName,
        phone: editPhone,
        address: editAddress
      });

      setEditing(false);
      setMessage('Profile updated successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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

  async function checkAdmin() {
    try {
      console.log('Checking admin status for user:', user?.id);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('Admin check result:', { data, error });
      
      if (data) {
        setIsAdmin(true);
        console.log('User is admin!');
      } else {
        setIsAdmin(false);
        console.log('User is not admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
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

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <div className="admin-section">
            <h2>Admin Tools</h2>
            <div className="admin-cards">
              <Link to="/admin" className="admin-card">
                <span className="admin-icon">📊</span>
                <div className="admin-card-content">
                  <h3>Admin Dashboard</h3>
                  <p>View sales stats and manage your store</p>
                </div>
              </Link>
              <Link to="/admin/products" className="admin-card">
                <span className="admin-icon">🎨</span>
                <div className="admin-card-content">
                  <h3>Manage Products</h3>
                  <p>Add, edit, or remove products</p>
                </div>
              </Link>
              <Link to="/admin/orders" className="admin-card">
                <span className="admin-icon">📦</span>
                <div className="admin-card-content">
                  <h3>Manage Orders</h3>
                  <p>View and update order statuses</p>
                </div>
              </Link>
              <Link to="/admin/calculator" className="admin-card">
                <span className="admin-icon">💰</span>
                <div className="admin-card-content">
                  <h3>Cost Calculator</h3>
                  <p>Calculate pricing for products</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        <div className="account-content">
          <div className="profile-section">
            <h2>Profile Information</h2>
            <div className="profile-card">
              {editing ? (
                <div className="edit-form">
                  <div className="edit-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="edit-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="disabled-input"
                    />
                    <small>Email cannot be changed</small>
                  </div>
                  <div className="edit-field">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="edit-field">
                    <label>Address</label>
                    <textarea
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Enter your shipping address"
                      rows={3}
                    />
                  </div>
                  <div className="edit-actions">
                    <button 
                      onClick={saveProfile} 
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={cancelEditing} 
                      className="btn btn-secondary"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p><strong>Name:</strong> {profile?.full_name || user?.user_metadata?.full_name || 'Not set'}</p>
                  <p><strong>Email:</strong> {profile?.email || user?.email}</p>
                  <p><strong>Phone:</strong> {profile?.phone || 'Not set'}</p>
                  <p><strong>Address:</strong> {profile?.address || 'Not set'}</p>
                  <button onClick={startEditing} className="btn btn-secondary edit-btn">
                    Edit Profile
                  </button>
                </>
              )}
              {message && (
                <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                  {message}
                </p>
              )}
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
        
        .admin-section {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          margin-bottom: 2rem;
        }
        
        .admin-section h2 {
          color: white;
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }
        
        .admin-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        
        .admin-card {
          background: white;
          padding: 1.25rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .admin-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .admin-icon {
          font-size: 2rem;
        }
        
        .admin-card-content h3 {
          font-size: 1rem;
          color: var(--color-primary);
          margin-bottom: 0.25rem;
        }
        
        .admin-card-content p {
          font-size: 0.85rem;
          color: var(--color-text-light);
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
        
        .edit-btn {
          margin-top: 1rem;
        }
        
        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .edit-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .edit-field label {
          font-weight: 600;
          color: var(--color-text);
          font-size: 0.9rem;
        }
        
        .edit-field input,
        .edit-field textarea {
          padding: 0.75rem;
          border: 2px solid var(--color-cream-dark);
          border-radius: var(--radius-md);
          font-size: 1rem;
          font-family: inherit;
        }
        
        .edit-field input:focus,
        .edit-field textarea:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        
        .edit-field small {
          color: var(--color-text-light);
          font-size: 0.8rem;
        }
        
        .disabled-input {
          background-color: var(--color-cream);
          cursor: not-allowed;
        }
        
        .edit-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        
        .edit-actions .btn {
          flex: 1;
        }
        
        .message {
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          text-align: center;
          font-weight: 500;
        }
        
        .message.success {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .message.error {
          background-color: #fee2e2;
          color: #991b1b;
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
        
        @media (max-width: 768px) {
          .admin-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Account;