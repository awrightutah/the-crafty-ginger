import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-section">
            <img 
              src="https://thecraftyginger.com/wp-content/uploads/2025/11/cropped-primary-logo-1.png" 
              alt="The Crafty Ginger" 
              className="footer-logo"
            />
            <p className="footer-tagline">
              Handmade resin trays, coasters, ornaments, and keepsakes poured in small batches with care and a little bit of ginger magic.
            </p>
          </div>

          <div className="footer-section">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?category=Keychains%20%26%20Tassels">Keychains & Tassels</Link></li>
              <li><Link to="/products?category=Resin%20Coasters">Resin Coasters</Link></li>
              <li><Link to="/products?category=Resin%20Globes">Resin Globes</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Custom Orders</h4>
            <ul>
              <li><Link to="/products?category=Custom%20Orders">Request Custom Piece</Link></li>
              <li><Link to="/products?category=Custom%20Orders">How It Works</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Connect</h4>
            <ul>
              <li><a href="mailto:julie@thecraftyginger.com">Email Julie</a></li>
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">TikTok</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} The Crafty Ginger. All rights reserved.</p>
        </div>
      </div>

      <style>{`
        .footer {
          background-color: var(--color-primary);
          color: var(--color-white);
          padding: 3rem 0 1rem;
          margin-top: 4rem;
        }
        
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 2rem;
        }
        
        .footer-logo {
          height: 60px;
          width: auto;
          margin-bottom: 1rem;
        }
        
        .footer-tagline {
          font-size: 0.9rem;
          opacity: 0.9;
          line-height: 1.7;
        }
        
        .footer-section h4 {
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        
        .footer-section ul {
          list-style: none;
        }
        
        .footer-section ul li {
          margin-bottom: 0.5rem;
        }
        
        .footer-section ul a {
          color: var(--color-cream);
          opacity: 0.9;
          transition: opacity 0.3s ease;
        }
        
        .footer-section ul a:hover {
          opacity: 1;
        }
        
        .footer-bottom {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}

export default Footer;