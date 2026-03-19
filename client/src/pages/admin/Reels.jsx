import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { detectVideoPlatform, generateVideoEmbed, getPlatformName, isValidVideoUrl } from '../../lib/videoEmbed';

function Reels({ user }) {
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    video_url: '',
    embed_code: '',
    sort_order: 0,
    is_active: true
  });
  const [videoPreview, setVideoPreview] = useState('');

  useEffect(() => {
    checkAdmin();
    fetchReels();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Admin check error:', error);
        navigate('/');
        return;
      }

      if (!data) {
        navigate('/');
        return;
      }

      setIsAdminUser(true);
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate('/');
    }
  };

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('instagram_reels')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setReels(data || []);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUrlChange = (url) => {
    setFormData({ ...formData, video_url: url });
    
    if (url && isValidVideoUrl(url)) {
      const embed = generateVideoEmbed(url);
      if (embed) {
        setVideoPreview(embed);
        setFormData(prev => ({ ...prev, embed_code: embed }));
      }
    } else {
      setVideoPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalEmbedCode = formData.embed_code;
    if (formData.video_url && !formData.embed_code) {
      finalEmbedCode = generateVideoEmbed(formData.video_url);
    }
    
    try {
      if (editingReel) {
        const { error } = await supabase
          .from('instagram_reels')
          .update({
            title: formData.title,
            video_url: formData.video_url,
            embed_code: finalEmbedCode,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReel.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('instagram_reels')
          .insert([{
            title: formData.title,
            video_url: formData.video_url,
            embed_code: finalEmbedCode,
            sort_order: formData.sort_order,
            is_active: formData.is_active
          }]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingReel(null);
      setFormData({
        title: '',
        video_url: '',
        embed_code: '',
        sort_order: 0,
        is_active: true
      });
      setVideoPreview('');
      fetchReels();
    } catch (error) {
      console.error('Error saving reel:', error);
      alert('Error saving reel. Please try again.');
    }
  };

  const handleEdit = (reel) => {
    setEditingReel(reel);
    setFormData({
      title: reel.title,
      video_url: reel.video_url || '',
      embed_code: reel.embed_code,
      sort_order: reel.sort_order || 0,
      is_active: reel.is_active
    });
    setVideoPreview(reel.embed_code);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reel?')) return;

    try {
      const { error } = await supabase
        .from('instagram_reels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchReels();
    } catch (error) {
      console.error('Error deleting reel:', error);
      alert('Error deleting reel. Please try again.');
    }
  };

  const toggleActive = async (reel) => {
    try {
      const { error } = await supabase
        .from('instagram_reels')
        .update({ is_active: !reel.is_active })
        .eq('id', reel.id);

      if (error) throw error;
      fetchReels();
    } catch (error) {
      console.error('Error updating reel:', error);
    }
  };

  if (!isAdminUser) {
    return (
      <div className="admin-reels">
        <div className="container">
          <h1>Access Denied</h1>
          <p>You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-reels">
      <div className="container">
        <div className="page-header">
          <h1>🎬 Video Gallery Manager</h1>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingReel(null);
              setFormData({
                title: '',
                video_url: '',
                embed_code: '',
                sort_order: reels.length,
                is_active: true
              });
              setVideoPreview('');
              setShowForm(true);
            }}
          >
            + Add New Video
          </button>
        </div>

        <div className="supported-platforms">
          <span>Supported: </span>
          <span className="platform-tag">YouTube</span>
          <span className="platform-tag">TikTok</span>
          <span className="platform-tag">Instagram</span>
          <span className="platform-tag">Vimeo</span>
          <span className="platform-tag">MP4 Files</span>
          <span className="platform-tag">Custom Embed</span>
        </div>

        {showForm && (
          <div className="form-overlay">
            <div className="form-modal">
              <h2>{editingReel ? 'Edit Video' : 'Add New Video'}</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., Coaster Making Process"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Video URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="Paste YouTube, TikTok, Instagram, Vimeo, or MP4 link..."
                    value={formData.video_url}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                  />
                  <p className="form-hint">
                    {formData.video_url && detectVideoPlatform(formData.video_url) ? (
                      <span className="platform-detected">
                        ✓ Detected: {getPlatformName(formData.video_url)}
                      </span>
                    ) : formData.video_url ? (
                      <span className="platform-unknown">
                        ⚠ URL not recognized. Use Custom Embed Code below.
                      </span>
                    ) : (
                      'Auto-embeds from YouTube, TikTok, Instagram, Vimeo, or direct MP4 links'
                    )}
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Custom Embed Code (Optional)</label>
                  <textarea
                    className="form-input form-textarea"
                    rows="4"
                    placeholder="Paste embed code from CapCut, InShot, or any other platform..."
                    value={formData.embed_code}
                    onChange={(e) => setFormData({ ...formData, embed_code: e.target.value })}
                  />
                  <p className="form-hint">
                    Use this for CapCut, InShot, or other platforms. Will override auto-generated embed.
                  </p>
                </div>

                {videoPreview && (
                  <div className="form-group">
                    <label className="form-label">Preview</label>
                    <div 
                      className="video-preview"
                      dangerouslySetInnerHTML={{ __html: videoPreview }} 
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sort Order</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    />
                    <p className="form-hint">Lower numbers appear first</p>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <span>Active (visible on site)</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingReel ? 'Update Video' : 'Add Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <p>Loading videos...</p>
        ) : reels.length === 0 ? (
          <div className="empty-state">
            <p>No videos added yet. Click "Add New Video" to get started!</p>
          </div>
        ) : (
          <div className="reels-grid">
            {reels.map((reel) => (
              <div key={reel.id} className={`reel-card ${!reel.is_active ? 'inactive' : ''}`}>
                <div className="reel-header">
                  <h3>{reel.title}</h3>
                  <span className={`status-badge ${reel.is_active ? 'active' : 'inactive'}`}>
                    {reel.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                
                {reel.video_url && (
                  <p className="video-source">
                    <strong>Source:</strong> {getPlatformName(reel.video_url)}
                  </p>
                )}
                
                <div className="reel-preview" dangerouslySetInnerHTML={{ __html: reel.embed_code }} />
                
                <div className="reel-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(reel)}
                  >
                    Edit
                  </button>
                  <button 
                    className={`btn btn-sm ${reel.is_active ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => toggleActive(reel)}
                  >
                    {reel.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(reel.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .admin-reels {
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .page-header h1 {
          color: var(--color-primary);
          margin: 0;
        }

        .supported-platforms {
          margin-bottom: 2rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        .platform-tag {
          background: var(--color-cream);
          color: var(--color-primary);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .form-modal {
          background: white;
          padding: 2rem;
          border-radius: var(--radius-lg);
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-modal h2 {
          color: var(--color-primary);
          margin-top: 0;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .checkbox-group {
          display: flex;
          align-items: flex-end;
          padding-bottom: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--color-primary);
        }

        .platform-detected {
          color: var(--color-success);
          font-weight: 500;
        }

        .platform-unknown {
          color: #dc3545;
        }

        .video-preview {
          background: var(--color-cream);
          border-radius: var(--radius-md);
          padding: 1rem;
          overflow: hidden;
        }

        .video-preview iframe,
        .video-preview video {
          max-width: 100%;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: var(--radius-lg);
          color: var(--color-text-light);
        }

        .reels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .reel-card {
          background: white;
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          border: 2px solid var(--color-cream-dark);
        }

        .reel-card.inactive {
          opacity: 0.6;
          border-color: #ddd;
        }

        .reel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .reel-header h3 {
          margin: 0;
          color: var(--color-primary);
        }

        .video-source {
          font-size: 0.85rem;
          color: var(--color-text-light);
          margin-bottom: 1rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .reel-preview {
          margin-bottom: 1rem;
          min-height: 100px;
          background: var(--color-cream);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .reel-preview iframe,
        .reel-preview video,
        .reel-preview blockquote {
          max-width: 100%;
        }

        .reel-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-sm {
          padding: 0.4rem 0.8rem;
          font-size: 0.85rem;
        }

        .btn-warning {
          background: #ffc107;
          color: #333;
        }

        .btn-warning:hover {
          background: #e0a800;
        }

        .btn-success {
          background: var(--color-success);
          color: white;
        }

        .btn-success:hover {
          background: #218838;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .reels-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Reels;