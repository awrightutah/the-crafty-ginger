import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

function Header({ user }) {
  const { getCartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = getCartCount();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          <img 
            src="https://thecraftyginger.com/wp-content/uploads/2025/11/cropped-primary-logo-1.png" 
            alt="The Crafty Ginger" 
            className="logo-img"
          />
        </Link>

        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <Link to="/products" className="nav-link">Shop</Link>
          <Link to="/gallery" className="nav-link">Gallery</Link>
          <Link to="/products?category=Custom%20Orders" className="nav-link">Custom Orders</Link>
          
          {user ? (
            <>
              <Link to="/account" className="nav-link">My Account</Link>
              <button onClick={handleLogout} className="nav-link btn-link">Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Login</Link>
          )}
          
          <Link to="/cart" className="cart-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
        </nav>
      </div>

      <style>{`
        .header {
          background-color: var(--color-white);
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
        }
        
        .logo-img {
          height: 50px;
          width: auto;
        }
        
        .nav {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        
        .nav-link {
          font-weight: 500;
          color: var(--color-text);
          transition: color 0.3s ease;
        }
        
        .nav-link:hover {
          color: var(--color-primary);
        }
        
        .btn-link {
          background: none;
          border: none;
          font-size: inherit;
          padding: 0;
        }
        
        .cart-link {
          position: relative;
          color: var(--color-primary);
        }
        
        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: var(--color-ginger);
          color: white;
          font-size: 0.75rem;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mobile-menu-btn {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          padding: 8px;
        }
        
        .mobile-menu-btn span {
          width: 24px;
          height: 2px;
          background-color: var(--color-primary);
          transition: all 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }
          
          .nav {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: var(--color-white);
            flex-direction: column;
            padding: 1rem;
            box-shadow: var(--shadow-md);
            display: none;
          }
          
          .nav-open {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
}

export default Header;