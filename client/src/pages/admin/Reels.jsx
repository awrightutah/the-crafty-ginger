import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { detectVideoPlatform, generateVideoEmbed, getPlatformName, isValidVideoUrl } from '../../lib/videoEmbed';

function Reels({ user }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoType, setVideoType] = useState('url'); // 'url' or 'upload'
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type - now accepting all video types since Cloudflare will transcode
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/mov', 'video/x-msvideo', 'video/x-matroska'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    // Also check by extension for MOV files which might not have the right MIME type
    const validExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v'];
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExt)) {
      alert('Please upload a valid video file (MP4, WebM, OGG, MOV, AVI, MKV)');
      return;
    }

    // Validate file size (max 200MB for Cloudflare basic upload)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      alert('Video file is too large. Maximum size is 200MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('Getting upload URL from Cloudflare...');

      // Get direct upload URL from our Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zwtpllgtzbotkdjyeiqi.supabase.co';
      const uploadUrlResponse = await fetch(`${supabaseUrl}/functions/v1/cloudflare-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600 // 1 hour max
        }),
      });

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();
        console.error('Failed to get upload URL:', errorData);
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, videoId } = await uploadUrlResponse.json();
      console.log('Got upload URL:', uploadUrl, 'Video ID:', videoId);

      setUploadProgress(25);

      // Upload directly to Cloudflare Stream
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading video to Cloudflare Stream...');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error('Upload failed');
      }

      setUploadProgress(75);
      console.log('Upload complete!');

      // Cloudflare Stream video URL and embed
      // Use iframe player for better compatibility
      const customerCode = import.meta.env.VITE_CLOUDFLARE_CUSTOMER_CODE || '';
      const iframeSrc = customerCode 
        ? `https://customer-${customerCode}.cloudflarestream.com/${videoId}/iframe?preload=true&muted=true&autoplay=false`
        : `https://iframe.cloudflarestream.com/${videoId}?preload=true&muted=true&autoplay=false`;
      
      const embedCode = `<iframe src="${iframeSrc}" loading="lazy" style="border:none;width:100%;height:100%;background:black;" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowfullscreen="true"></iframe>`;

      // Update form data
      setFormData(prev => ({
        ...prev,
        video_url: `https://watch.cloudflarestream.com/${videoId}`,
        embed_code: embedCode
      }));

      // Set preview
      setVideoPreview(embedCode);

      setUploadProgress(100);
      alert('Video uploaded successfully! It may take a few minutes to process and become playable.');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeUploadedVideo = () => {
    setFormData(prev => ({
      ...prev,
      video_url: '',
      embed_code: ''
    }));
    setVideoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <span className="platform-tag upload-tag">📁 Device Upload</span>
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

                {/* Video Type Selector */}
                <div className="form-group">
                  <label className="form-label">Add Video From</label>
                  <div className="video-type-selector">
                    <button
                      type="button"
                      className={`type-btn ${videoType === 'url' ? 'active' : ''}`}
                      onClick={() => {
                        setVideoType('url');
                        removeUploadedVideo();
                      }}
                    >
                      🔗 URL / Embed
                    </button>
                    <button
                      type="button"
                      className={`type-btn ${videoType === 'upload' ? 'active' : ''}`}
                      onClick={() => setVideoType('upload')}
                    >
                      📁 Upload File
                    </button>
                  </div>
                </div>

                {/* URL/Embed Option */}
                {videoType === 'url' && (
                  <>
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
                  </>
                )}

                {/* Upload Option */}
                {videoType === 'upload' && (
                  <div className="form-group">
                    <label className="form-label">Upload Video File</label>
                    
                    {!formData.video_url ? (
                      <div className="upload-area">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="file-input"
                        />
                        <div className="upload-placeholder">
                          <span className="upload-icon">📹</span>
                          <p>Click to upload or drag and drop</p>
                          <p className="upload-formats">MP4, MOV, WebM, AVI, MKV (max 200MB)</p>
                          <p className="upload-info">✨ Videos are automatically optimized for web playback</p>
                        </div>
                      </div>
                    ) : (
                      <div className="uploaded-file">
                        <span className="file-icon">🎬</span>
                        <span className="file-name">Video uploaded successfully!</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={removeUploadedVideo}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {uploading && (
                      <div className="upload-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <span>Uploading... {uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                )}

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

        .upload-tag {
          background: var(--color-primary);
          color: white;
        }

        .video-type-selector {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .type-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid var(--color-cream-dark);
          background: white;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .type-btn:hover {
          border-color: var(--color-primary);
        }

        .type-btn.active {
          border-color: var(--color-primary);
          background: var(--color-cream);
          color: var(--color-primary);
          font-weight: 600;
        }

        .upload-area {
          position: relative;
          border: 2px dashed var(--color-cream-dark);
          border-radius: var(--radius-md);
          padding: 2rem;
          text-align: center;
          transition: all 0.2s ease;
          background: var(--color-cream);
        }

        .upload-area:hover {
          border-color: var(--color-primary);
          background: white;
        }

        .upload-area .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-placeholder {
          pointer-events: none;
        }

        .upload-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        .upload-formats {
          font-size: 0.85rem;
          color: var(--color-text-light);
          margin-top: 0.25rem;
        }

        .upload-warning {
          font-size: 0.8rem;
          color: #856404;
          background: #fff3cd;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          margin-top: 0.5rem;
        }

        .upload-info {
          font-size: 0.8rem;
          color: #0c5460;
          background: #d1ecf1;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          margin-top: 0.5rem;
        }

        .uploaded-file {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #d4edda;
          border-radius: var(--radius-md);
          border: 1px solid #c3e6cb;
        }

        .file-icon {
          font-size: 1.5rem;
        }

        .file-name {
          flex: 1;
          color: #155724;
          font-weight: 500;
        }

        .upload-progress {
          margin-top: 1rem;
        }

        .progress-bar {
          height: 8px;
          background: var(--color-cream-dark);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary);
          transition: width 0.3s ease;
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