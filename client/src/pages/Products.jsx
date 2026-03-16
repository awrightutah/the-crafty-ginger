import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Products() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory]);

  async function fetchProducts() {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('is_active', true);
      
      if (error) throw error;
      const uniqueCategories = [...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  return (
    <div className="products-page">
      <div className="container">
        <h1>Shop Creations</h1>
        
        {/* Category Filter */}
        <div className="category-filter">
          <button 
            className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>No products found in this category.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <Link to={`/products/${product.id}`} key={product.id} className="product-card card">
                <div className="product-image">
                  <img src={product.image_url} alt={product.name} />
                  {product.is_custom && <span className="custom-badge">Custom</span>}
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <p className="product-price">${product.price.toFixed(2)}</p>
                  <p className="product-description">{product.description?.substring(0, 100)}...</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .products-page {
          padding: 2rem 0;
        }
        
        .products-page h1 {
          text-align: center;
          margin-bottom: 2rem;
          color: var(--color-primary);
        }
        
        .category-filter {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-bottom: 2rem;
        }
        
        .filter-btn {
          padding: 0.5rem 1rem;
          border: 2px solid var(--color-primary);
          background: transparent;
          border-radius: var(--radius-md);
          color: var(--color-primary);
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .filter-btn:hover,
        .filter-btn.active {
          background: var(--color-primary);
          color: white;
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        
        .product-card {
          display: block;
        }
        
        .product-image {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
        }
        
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .product-card:hover .product-image img {
          transform: scale(1.05);
        }
        
        .custom-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: var(--color-ginger);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .product-info {
          padding: 1rem;
        }
        
        .product-info h3 {
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }
        
        .product-category {
          font-size: 0.85rem;
          color: var(--color-text-light);
        }
        
        .product-price {
          font-weight: 600;
          color: var(--color-primary);
          margin: 0.5rem 0;
        }
        
        .product-description {
          font-size: 0.9rem;
          color: var(--color-text-light);
        }
        
        .loading,
        .no-products {
          text-align: center;
          padding: 3rem;
          color: var(--color-text-light);
        }
        
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Products;