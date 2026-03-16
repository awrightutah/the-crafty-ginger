import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    checkAdmin();
  }, [user]);

  async function checkAdmin() {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchStats();
    } catch (error) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*').eq('is_active', true)
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        totalProducts: products.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Admin Dashboard</h1>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalOrders}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-value">{stats.pendingOrders}</span>
              <span className="stat-label">Pending Orders</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎨</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalProducts}</span>
              <span className="stat-label">Products</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <span className="stat-value">${stats.totalRevenue.toFixed(2)}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
        </div>

        <div className="admin-actions">
          <Link to="/admin/products" className="action-card">
            <h3>📦 Manage Products</h3>
            <p>Add, edit, or remove products from your store</p>
          </Link>
          <Link to="/admin/orders" className="action-card">
            <h3>📋 Manage Orders</h3>
            <p>View and update order statuses</p>
          </Link>
        </div>
      </div>

      <style>{`
        .admin-dashboard {
          padding: 2rem 0;
        }
        
        .admin-dashboard h1 {
          color: var(--color-primary);
          margin-bottom: 2rem;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .stat-icon {
          font-size: 2.5rem;
        }
        
        .stat-value {
          display: block;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-primary);
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: var(--color-text-light);
        }
        
        .admin-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        
        .action-card {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        
        .action-card h3 {
          color: var(--color-primary);
          margin-bottom: 0.5rem;
        }
        
        .action-card p {
          color: var(--color-text-light);
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .admin-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;