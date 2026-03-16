import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function Products() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    is_custom: false
  });

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
      .single();

    if (!data) {
      navigate('/');
      return;
    }

    fetchProducts();
  }

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Update form data with the image URL
      setFormData({ ...formData, image_url: publicUrl });
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', category: '', image_url: '', is_custom: false });
      fetchProducts();
    } catch (error) {
      alert('Error saving product: ' + error.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || '',
      is_custom: product.is_custom
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      alert('Error deleting product: ' + error.message);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="admin-products">
      <div className="container">
        <div className="page-header">
          <h1>Manage Products</h1>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', description: '', price: '', category: '', image_url: '', is_custom: false });
              setShowForm(true);
            }}
          >
            + Add Product
          </button>
        </div>

        {showForm && (
          <div className="product-form-container">
            <form onSubmit={handleSubmit} className="product-form">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Keychains & Tassels">Keychains & Tassels</option>
                  <option value="Resin Coasters">Resin Coasters</option>
                  <option value="Resin Globes">Resin Globes</option>
                  <option value="Custom Orders">Custom Orders</option>
                  <option value="Christmas Ornaments">Christmas Ornaments</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Product Image</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button"
                    className="btn btn-secondary upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : '📷 Upload Image'}
                  </button>
                  <span className="or-divider">OR</span>
                  <input
                    type="url"
                    className="form-input image-url-input"
                    placeholder="Paste image URL (e.g., https://...)"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
                {formData.image_url && (
                  <div className="image-preview">
                    <img src={formData.image_url} alt="Preview" />
                    <p className="image-url-display">{formData.image_url}</p>
                  </div>
                )}
              </div>
              
              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_custom}
                    onChange={(e) => setFormData({ ...formData, is_custom: e.target.checked })}
                  />
                  This is a custom order product (allows color/notes input)
                </label>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <img 
                      src={product.image_url || 'https://via.placeholder.com/50'} 
                      alt={product.name}
                      className="product-thumb"
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price?.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(product.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .admin-products {
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
        
        .product-form-container {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          margin-bottom: 2rem;
          box-shadow: var(--shadow-md);
        }
        
        .product-form h2 {
          color: var(--color-primary);
          margin-bottom: 1.5rem;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1rem;
        }
        
        .image-upload-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .upload-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1rem;
        }
        
        .or-divider {
          text-align: center;
          color: var(--color-text-light);
          font-size: 0.9rem;
        }
        
        .image-url-input {
          width: 100%;
        }
        
        .image-preview {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--color-cream);
          border-radius: var(--radius-md);
          text-align: center;
        }
        
        .image-preview img {
          max-width: 200px;
          max-height: 200px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }
        
        .image-url-display {
          font-size: 0.75rem;
          color: var(--color-text-light);
          margin-top: 0.5rem;
          word-break: break-all;
        }
        
        .checkbox label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .products-table-container {
          background: white;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        
        .products-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .products-table th,
        .products-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--color-cream-dark);
        }
        
        .products-table th {
          background: var(--color-cream);
          font-weight: 600;
        }
        
        .product-thumb {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }
        
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .status-badge.active {
          background: #D1FAE5;
          color: #059669;
        }
        
        .status-badge.inactive {
          background: #FEE2E2;
          color: #DC2626;
        }
        
        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: var(--radius-sm);
          margin-right: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
        }
        
        .action-btn.edit {
          background: var(--color-cream);
          color: var(--color-primary);
        }
        
        .action-btn.delete {
          background: #FEE2E2;
          color: var(--color-error);
        }
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .products-table-container {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default Products;