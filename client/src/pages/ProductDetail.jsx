import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [customOptions, setCustomOptions] = useState({
    color: '',
    notes: ''
  });
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddToCart = () => {
    const options = product.is_custom ? customOptions : null;
    addToCart(product, quantity, options);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <div className="container">
        <Link to="/products" className="back-link">← Back to Products</Link>
        
        <div className="product-content">
          <div className="product-image-section">
            <img src={product.image_url} alt={product.name} />
          </div>
          
          <div className="product-details-section">
            <span className="product-category">{product.category}</span>
            <h1>{product.name}</h1>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <p className="product-description">{product.description}</p>

            {product.is_custom && (
              <div className="custom-options">
                <h3>Customize Your Order</h3>
                <div className="form-group">
                  <label className="form-label">Preferred Colors</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Blue and silver with glitter"
                    value={customOptions.color}
                    onChange={(e) => setCustomOptions({ ...customOptions, color: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Special Instructions</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Any specific design requests..."
                    value={customOptions.notes}
                    onChange={(e) => setCustomOptions({ ...customOptions, notes: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="quantity-selector">
              <label className="form-label">Quantity</label>
              <div className="quantity-controls">
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="qty-value">{quantity}</span>
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <button 
              className={`btn ${addedToCart ? 'btn-accent' : 'btn-primary'} add-to-cart`}
              onClick={handleAddToCart}
            >
              {addedToCart ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>

            <div className="product-meta">
              <p><strong>Custom Order Timeline:</strong> Most custom pieces take about 1–2 weeks from design approval to shipping.</p>
              <p><strong>Care Instructions:</strong> Wipe gently with a soft cloth, keep away from extreme heat.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .product-detail {
          padding: 2rem 0;
        }
        
        .back-link {
          display: inline-block;
          margin-bottom: 2rem;
          color: var(--color-primary);
          font-weight: 500;
        }
        
        .back-link:hover {
          text-decoration: underline;
        }
        
        .product-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
        }
        
        .product-image-section img {
          width: 100%;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }
        
        .product-details-section {
          padding: 1rem 0;
        }
        
        .product-category {
          display: inline-block;
          background: var(--color-cream-dark);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          color: var(--color-text-light);
          margin-bottom: 0.5rem;
        }
        
        .product-details-section h1 {
          color: var(--color-primary);
          margin-bottom: 0.5rem;
        }
        
        .product-price {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-ginger);
          margin-bottom: 1rem;
        }
        
        .product-description {
          color: var(--color-text-light);
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }
        
        .custom-options {
          background: var(--color-cream);
          padding: 1.5rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }
        
        .custom-options h3 {
          color: var(--color-primary);
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        
        .quantity-selector {
          margin-bottom: 1.5rem;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .qty-btn {
          width: 40px;
          height: 40px;
          border: 2px solid var(--color-primary);
          background: transparent;
          border-radius: var(--radius-md);
          font-size: 1.25rem;
          color: var(--color-primary);
          transition: all 0.3s ease;
        }
        
        .qty-btn:hover {
          background: var(--color-primary);
          color: white;
        }
        
        .qty-value {
          font-size: 1.25rem;
          font-weight: 600;
          min-width: 40px;
          text-align: center;
        }
        
        .add-to-cart {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }
        
        .product-meta {
          background: var(--color-cream);
          padding: 1rem;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }
        
        .product-meta p {
          margin-bottom: 0.5rem;
          color: var(--color-text-light);
        }
        
        .product-meta strong {
          color: var(--color-text);
        }
        
        @media (max-width: 768px) {
          .product-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default ProductDetail;