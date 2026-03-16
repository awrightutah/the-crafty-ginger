import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function Calculator() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cost inputs
  const [epoxyPrice, setEpoxyPrice] = useState('');
  const [epoxySize, setEpoxySize] = useState(''); // in oz
  const [epoxyUsed, setEpoxyUsed] = useState(''); // in oz
  const [inclusionsCost, setInclusionsCost] = useState('');
  const [laborMinutes, setLaborMinutes] = useState('');
  const [laborRate, setLaborRate] = useState('25'); // $ per hour default
  const [packagingCost, setPackagingCost] = useState('');
  const [markupPercent, setMarkupPercent] = useState('50'); // 50% markup default

  // Results
  const [results, setResults] = useState(null);

  useState(() => {
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

    setIsAdmin(true);
    setLoading(false);
  }

  const calculateCost = () => {
    // Parse values
    const epoxyPriceNum = parseFloat(epoxyPrice) || 0;
    const epoxySizeNum = parseFloat(epoxySize) || 1;
    const epoxyUsedNum = parseFloat(epoxyUsed) || 0;
    const inclusionsNum = parseFloat(inclusionsCost) || 0;
    const laborMinutesNum = parseFloat(laborMinutes) || 0;
    const laborRateNum = parseFloat(laborRate) || 25;
    const packagingNum = parseFloat(packagingCost) || 0;
    const markupNum = parseFloat(markupPercent) || 50;

    // Calculate epoxy cost per oz
    const epoxyPerOz = epoxyPriceNum / epoxySizeNum;
    const epoxyTotalCost = epoxyPerOz * epoxyUsedNum;

    // Calculate labor cost
    const laborCost = (laborMinutesNum / 60) * laborRateNum;

    // Total base cost
    const baseCost = epoxyTotalCost + inclusionsNum + laborCost + packagingNum;

    // Markup amount
    const markupAmount = baseCost * (markupNum / 100);

    // Final price
    const finalPrice = baseCost + markupAmount;

    setResults({
      epoxyPerOz: epoxyPerOz.toFixed(2),
      epoxyTotalCost: epoxyTotalCost.toFixed(2),
      laborCost: laborCost.toFixed(2),
      baseCost: baseCost.toFixed(2),
      markupAmount: markupAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      suggestedPrice: Math.ceil(finalPrice) // Round up to nearest dollar
    });
  };

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Access Denied</div>;
  }

  return (
    <div className="calculator-page">
      <div className="container">
        <div className="page-header">
          <h1>💰 Cost Calculator</h1>
          <Link to="/admin" className="btn btn-secondary">← Back to Dashboard</Link>
        </div>

        <div className="calculator-content">
          <div className="calculator-form">
            <h2>Enter Your Costs</h2>

            {/* Epoxy Section */}
            <div className="calc-section">
              <h3>🧪 Epoxy Resin</h3>
              <div className="calc-row">
                <div className="calc-field">
                  <label>Epoxy Bottle Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 45.00"
                    value={epoxyPrice}
                    onChange={(e) => setEpoxyPrice(e.target.value)}
                  />
                </div>
                <div className="calc-field">
                  <label>Bottle Size (oz)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 16"
                    value={epoxySize}
                    onChange={(e) => setEpoxySize(e.target.value)}
                  />
                </div>
                <div className="calc-field">
                  <label>Epoxy Used (oz)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2"
                    value={epoxyUsed}
                    onChange={(e) => setEpoxyUsed(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Inclusions Section */}
            <div className="calc-section">
              <h3>✨ Inclusions & Add-ons</h3>
              <div className="calc-row">
                <div className="calc-field">
                  <label>Inclusions Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="glitter, flowers, etc."
                    value={inclusionsCost}
                    onChange={(e) => setInclusionsCost(e.target.value)}
                  />
                </div>
                <div className="calc-field">
                  <label>Packaging Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="boxes, tissue, etc."
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Labor Section */}
            <div className="calc-section">
              <h3>⏱️ Labor</h3>
              <div className="calc-row">
                <div className="calc-field">
                  <label>Time Spent (minutes)</label>
                  <input
                    type="number"
                    placeholder="e.g., 30"
                    value={laborMinutes}
                    onChange={(e) => setLaborMinutes(e.target.value)}
                  />
                </div>
                <div className="calc-field">
                  <label>Hourly Rate ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Markup Section */}
            <div className="calc-section">
              <h3>📈 Markup</h3>
              <div className="calc-row">
                <div className="calc-field">
                  <label>Markup Percentage (%)</label>
                  <input
                    type="number"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button className="btn btn-primary calculate-btn" onClick={calculateCost}>
              Calculate Price
            </button>
          </div>

          {/* Results Panel */}
          {results && (
            <div className="results-panel">
              <h2>📊 Cost Breakdown</h2>
              
              <div className="result-item">
                <span>Epoxy Cost per oz:</span>
                <span>${results.epoxyPerOz}</span>
              </div>
              <div className="result-item">
                <span>Epoxy Used Cost:</span>
                <span>${results.epoxyTotalCost}</span>
              </div>
              <div className="result-item">
                <span>Inclusions & Packaging:</span>
                <span>${(parseFloat(inclusionsCost || 0) + parseFloat(packagingCost || 0)).toFixed(2)}</span>
              </div>
              <div className="result-item">
                <span>Labor Cost:</span>
                <span>${results.laborCost}</span>
              </div>
              
              <div className="result-divider"></div>
              
              <div className="result-item total">
                <span>Base Cost:</span>
                <span>${results.baseCost}</span>
              </div>
              <div className="result-item">
                <span>Markup ({markupPercent}%):</span>
                <span>${results.markupAmount}</span>
              </div>
              
              <div className="result-divider"></div>
              
              <div className="result-item final">
                <span>Final Price:</span>
                <span>${results.finalPrice}</span>
              </div>
              
              <div className="suggested-price">
                <span>💡 Suggested Price:</span>
                <span className="suggested">${results.suggestedPrice}.00</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .calculator-page {
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
        
        .calculator-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }
        
        .calculator-form {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }
        
        .calculator-form h2 {
          color: var(--color-primary);
          margin-bottom: 1.5rem;
        }
        
        .calc-section {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--color-cream-dark);
        }
        
        .calc-section:last-of-type {
          border-bottom: none;
        }
        
        .calc-section h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: var(--color-text);
        }
        
        .calc-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        
        .calc-field {
          display: flex;
          flex-direction: column;
        }
        
        .calc-field label {
          font-size: 0.85rem;
          color: var(--color-text-light);
          margin-bottom: 0.5rem;
        }
        
        .calc-field input {
          padding: 0.75rem;
          border: 2px solid var(--color-cream-dark);
          border-radius: var(--radius-md);
          font-size: 1rem;
        }
        
        .calc-field input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        
        .calculate-btn {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          margin-top: 1rem;
        }
        
        .results-panel {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          height: fit-content;
          position: sticky;
          top: 100px;
        }
        
        .results-panel h2 {
          color: var(--color-primary);
          margin-bottom: 1.5rem;
        }
        
        .result-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }
        
        .result-item.total {
          font-weight: 600;
        }
        
        .result-item.final {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-primary);
        }
        
        .result-divider {
          height: 1px;
          background: var(--color-cream-dark);
          margin: 0.75rem 0;
        }
        
        .suggested-price {
          background: var(--color-cream);
          padding: 1rem;
          border-radius: var(--radius-md);
          margin-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .suggested {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-success);
        }
        
        @media (max-width: 768px) {
          .calculator-content {
            grid-template-columns: 1fr;
          }
          
          .calc-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Calculator;