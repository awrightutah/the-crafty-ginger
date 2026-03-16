import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  async function fetchFeaturedProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(4);
      
      if (error) throw error;
      setFeaturedProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Handmade Resin Creations</h1>
            <p>Small-batch pieces poured with love in every swirl.</p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary">Shop Creations</Link>
              <Link to="/products?category=Custom%20Orders" className="btn btn-secondary">Request Custom Piece</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why People Love The Crafty Ginger</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">✨</div>
              <h3>Hand-Poured Quality</h3>
              <p>Each piece is individually crafted with care, precision, and a little bit of magic.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Custom Colors & Designs</h3>
              <p>Choose your colors, inclusions, themes, and styles to make something truly one-of-a-kind.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎁</div>
              <h3>Meaningful Gifts</h3>
              <p>Our resin art makes unforgettable gifts for holidays, celebrations, and loved ones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <h2>Featured Creations</h2>
          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="products-grid">
              {featuredProducts.map(product => (
                <Link to={`/products/${product.id}`} key={product.id} className="product-card card">
                  <div className="product-image">
                    <img src={product.image_url} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-category">{product.category}</p>
                    <p className="product-price">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="view-all">
            <Link to="/products" className="btn btn-primary">View All Products</Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>Custom Orders Made Simple</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Tell Us About Your Idea</h3>
              <p>Share your colors, style, and the type of piece you're dreaming of — trays, ornaments, coasters, and more.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>We Design Your Piece</h3>
              <p>We review your form, confirm details, pricing, and timeline, and send you a custom order summary for approval.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>We Create & Ship</h3>
              <p>Your piece is poured, finished, and carefully packaged — then shipped right to your door.</p>
            </div>
          </div>
          <div className="cta">
            <Link to="/products?category=Custom%20Orders" className="btn btn-accent">Start Your Custom Order Today</Link>
          </div>
        </div>
      </section>

      {/* Meet the Maker */}
      <section className="meet-maker">
        <div className="container">
          <div className="maker-content">
            <div className="maker-image">
              <img src="https://thecraftyginger.com/wp-content/uploads/2025/11/img_8784.jpeg" alt="Julie, The Crafty Ginger" />
            </div>
            <div className="maker-info">
              <h2>Meet the Maker</h2>
              <h3>Julie, The Crafty Ginger</h3>
              <p>Julie hand-pours every piece in small batches, combining rich colors, shimmer, and thoughtful details so each creation feels like it was made just for you.</p>
              <ul>
                <li>Specializes in trays, coasters, ornaments, and custom keepsakes.</li>
                <li>Helps you pick colors and styles that match your space or event.</li>
                <li>Loves turning "I have an idea…" into "Oh my gosh, that's perfect!"</li>
              </ul>
              <p className="maker-quote">"Thank you for supporting handmade resin art — it means the world to me." – Julie</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .hero {
          background: linear-gradient(135deg, var(--color-cream) 0%, var(--color-cream-dark) 100%);
          padding: 6rem 0;
          text-align: center;
        }
        
        .hero h1 {
          font-size: 3rem;
          color: var(--color-primary);
          margin-bottom: 1rem;
        }
        
        .hero p {
          font-size: 1.25rem;
          color: var(--color-text-light);
          margin-bottom: 2rem;
        }
        
        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .features {
          padding: 4rem 0;
          background-color: var(--color-white);
        }
        
        .features h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: var(--color-primary);
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        
        .feature-card {
          text-align: center;
          padding: 2rem;
        }
        
        .feature-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .feature-card h3 {
          margin-bottom: 0.5rem;
          color: var(--color-primary);
        }
        
        .featured-products {
          padding: 4rem 0;
        }
        
        .featured-products h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: var(--color-primary);
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        
        .product-card {
          display: block;
        }
        
        .product-image {
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
        
        .product-info {
          padding: 1rem;
        }
        
        .product-info h3 {
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        
        .product-category {
          font-size: 0.85rem;
          color: var(--color-text-light);
        }
        
        .product-price {
          font-weight: 600;
          color: var(--color-primary);
          margin-top: 0.5rem;
        }
        
        .view-all {
          text-align: center;
          margin-top: 2rem;
        }
        
        .how-it-works {
          padding: 4rem 0;
          background-color: var(--color-white);
        }
        
        .how-it-works h2 {
          text-align: center;
          margin-bottom: 2rem;
          color: var(--color-primary);
        }
        
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        
        .step {
          text-align: center;
          padding: 1.5rem;
        }
        
        .step-number {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: var(--color-ginger);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto 1rem;
        }
        
        .step h3 {
          margin-bottom: 0.5rem;
          color: var(--color-primary);
        }
        
        .cta {
          text-align: center;
          margin-top: 2rem;
        }
        
        .meet-maker {
          padding: 4rem 0;
        }
        
        .maker-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 3rem;
          align-items: center;
        }
        
        .maker-image img {
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }
        
        .maker-info h2 {
          color: var(--color-primary);
          margin-bottom: 0.5rem;
        }
        
        .maker-info h3 {
          color: var(--color-ginger);
          margin-bottom: 1rem;
        }
        
        .maker-info ul {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        
        .maker-info li {
          margin-bottom: 0.5rem;
        }
        
        .maker-quote {
          font-style: italic;
          color: var(--color-text-light);
          margin-top: 1rem;
        }
        
        @media (max-width: 768px) {
          .hero h1 {
            font-size: 2rem;
          }
          
          .features-grid,
          .steps-grid {
            grid-template-columns: 1fr;
          }
          
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .maker-content {
            grid-template-columns: 1fr;
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

export default Home;