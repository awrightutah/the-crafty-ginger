import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getPlatformName, detectVideoPlatform } from '../lib/videoEmbed';

function Gallery() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_reels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setReels(data || []);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gallery-page">
      <div className="container">
        <div className="gallery-header">
          <h1>🎬 Our Gallery</h1>
          <p>See The Crafty Ginger in action! Watch our resin creations come to life.</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading videos...</p>
          </div>
        ) : reels.length === 0 ? (
          <div className="empty-state">
            <p>Check back soon for behind-the-scenes content!</p>
            <a 
              href="https://www.instagram.com/thecraftyginger" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Follow us on Instagram
            </a>
          </div>
        ) : (
          <div className="reels-grid">
            {reels.map((reel) => (
              <div key={reel.id} className="reel-item">
                <div className="reel-header">
                  <h3>{reel.title}</h3>
                  {reel.video_url && (
                    <span className="platform-badge">
                      {getPlatformName(reel.video_url)}
                    </span>
                  )}
                </div>
                <div 
                  className="reel-embed"
                  dangerouslySetInnerHTML={{ __html: reel.embed_code }} 
                />
                {reel.video_url && detectVideoPlatform(reel.video_url) && detectVideoPlatform(reel.video_url) !== 'direct' && (
                  <a 
                    href={reel.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-source-link"
                  >
                    View on {getPlatformName(reel.video_url)} →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .gallery-page {
          padding: 2rem 0;
        }

        .gallery-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .gallery-header h1 {
          color: var(--color-primary);
          margin-bottom: 0.5rem;
        }

        .gallery-header p {
          color: var(--color-text-light);
          font-size: 1.1rem;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: var(--radius-lg);
        }

        .empty-state p {
          margin-bottom: 1.5rem;
          color: var(--color-text-light);
        }

        .reels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 2rem;
        }

        .reel-item {
          background: white;
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .reel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .reel-header h3 {
          color: var(--color-primary);
          margin: 0;
        }

        .platform-badge {
          background: var(--color-cream);
          color: var(--color-primary);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .reel-embed {
          border-radius: var(--radius-md);
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .reel-embed iframe,
        .reel-embed video {
          max-width: 100%;
          border-radius: var(--radius-md);
        }

        .view-source-link {
          display: inline-block;
          color: var(--color-primary);
          font-weight: 500;
          text-decoration: none;
        }

        .view-source-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .reels-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Gallery;