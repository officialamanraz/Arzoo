import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaUpload, 
  FaImages, 
  FaTrash, 
  FaVideo, 
  FaCheckCircle, 
  FaSyncAlt,
  FaTags
} from 'react-icons/fa';
import AdminNav from './AdminNav';
import './AdminAddProduct.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper to safely parse subcategory_ids from DB
const parseSubcategoryIds = (rawIds, fallbackSingleId) => {
  if (Array.isArray(rawIds) && rawIds.length > 0) {
    return rawIds.map(String);
  }
  if (typeof rawIds === 'string' && rawIds.trim() !== '') {
    try {
      const parsed = JSON.parse(rawIds);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
    } catch (e) {
      const splitIds = rawIds.split(',').map((s) => s.trim()).filter(Boolean);
      if (splitIds.length > 0) return splitIds;
    }
  }
  if (fallbackSingleId != null && String(fallbackSingleId).trim() !== '') {
    return [String(fallbackSingleId)];
  }
  return [];
};

const emptyFormState = {
  name: '',
  groupId: '',
  price: '',
  mrp: '',
  discountPercentage: '0',
  dealerBasePrice: '',
  packagingCost: '',
  dealerId: '',
  description: '',
  baseColor: '',
  categoryId: '',
  subcategoryId: '',
  subcategoryIds: [], // 🌟 Multiple subcategories array
  stockQty: '10',
  primaryColor: '',
  otherColor: '',
  borderType: '',
  pattern: '',
  craft: '',
  weave: '',
  zariType: '',
  blouse: '',
  blouseLength: '',
  productLength: '', // 🌟 New Product Length column
  borderMotifs: '',
  origin: '',
  fabric: '',
  khats: '',
  weight: '',
  producer: '',
  maker: '',
  producer_address: '',
  packer_address: '',
  videoUrl: ''
};

function AdminAddProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingProduct = location.state?.product || null;

  const mainInputRef = useRef(null);
  const extraInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [form, setForm] = useState(emptyFormState);

  // Media States (New Uploads)
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [extraImages, setExtraImages] = useState([]); // Array of File objects
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Existing Media States (For Edit Mode)
  const [existingMainImage, setExistingMainImage] = useState('');
  const [existingExtraImages, setExistingExtraImages] = useState([]); // Array of URLs
  const [removedExistingImages, setRemovedExistingImages] = useState([]); // URLs removed by admin

  const [isEditing, setIsEditing] = useState(!!editingProduct);
  const [editId, setEditId] = useState(editingProduct?.product_id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Populate Form & Existing Media in Edit Mode
  useEffect(() => {
    if (editingProduct) {
      console.log('[ADMIN_ADD_PRODUCT] 📝 Editing mode active. ID:', editingProduct.product_id);
      const initialSubIds = parseSubcategoryIds(
        editingProduct.subcategory_ids,
        editingProduct.subcategory_id
      );

      setForm({
        name: editingProduct.name || '',
        groupId: editingProduct.group_id || '',
        price: editingProduct.price || '',
        mrp: editingProduct.mrp != null ? String(editingProduct.mrp) : '',
        discountPercentage: editingProduct.discount_percentage != null ? String(editingProduct.discount_percentage) : '0',
        dealerBasePrice: editingProduct.dealer_base_price != null ? String(editingProduct.dealer_base_price) : '',
        packagingCost: editingProduct.packaging_cost != null ? String(editingProduct.packaging_cost) : '',
        dealerId: editingProduct.dealer_id != null ? String(editingProduct.dealer_id) : '',
        description: editingProduct.description || '',
        baseColor: editingProduct.base_color || '',
        categoryId: editingProduct.category_id != null ? String(editingProduct.category_id) : '',
        subcategoryId: initialSubIds[0] || '',
        subcategoryIds: initialSubIds,
        stockQty: editingProduct.stock_qty != null ? String(editingProduct.stock_qty) : '10',
        primaryColor: editingProduct.primary_color || '',
        otherColor: editingProduct.other_color || '',
        borderType: editingProduct.border_type || '',
        pattern: editingProduct.pattern || '',
        craft: editingProduct.craft || '',
        weave: editingProduct.weave || '',
        zariType: editingProduct.zari_type || '',
        blouse: editingProduct.blouse || '',
        blouseLength: editingProduct.blouse_length || '',
        productLength: editingProduct.product_length || '',
        borderMotifs: editingProduct.border_motifs || '',
        origin: editingProduct.origin || '',
        fabric: editingProduct.fabric || '',
        khats: editingProduct.khats || '',
        weight: editingProduct.weight || '',
        producer: editingProduct.producer || '',
        maker: editingProduct.maker || '',
        producer_address: editingProduct.producer_address || '',
        packer_address: editingProduct.packer_address || '',
        videoUrl: editingProduct.video_url || editingProduct.videoUrl || ''
      });

      if (editingProduct.image_url) {
        setExistingMainImage(editingProduct.image_url);
      }

      // Fetch full product details by ID to get all gallery images & latest subcategories
      const fetchFullProductDetails = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/products/product/${editingProduct.product_id}`);
          if (res.ok) {
            const result = await res.json();
            const fullProd = result.data || result;
            if (fullProd) {
              if (fullProd.image_url) setExistingMainImage(fullProd.image_url);
              const gallery = fullProd.gallery_images || fullProd.images || [];
              // Filter out main image so extra images only show extra gallery photos
              const extras = gallery.filter((url) => url && url !== fullProd.image_url);
              setExistingExtraImages(extras);

              const fetchedSubIds = parseSubcategoryIds(fullProd.subcategory_ids, fullProd.subcategory_id);
              if (fetchedSubIds.length > 0) {
                setForm((prev) => ({
                  ...prev,
                  subcategoryIds: fetchedSubIds,
                  subcategoryId: fetchedSubIds[0],
                  productLength: fullProd.product_length || prev.productLength,
                  videoUrl: fullProd.video_url || prev.videoUrl
                }));
              }
            }
          }
        } catch (err) {
          console.warn('[ADMIN_ADD_PRODUCT] ⚠️ Could not fetch extra gallery details:', err.message);
        }
      };

      fetchFullProductDetails();
    }
  }, [editingProduct]);

  // 2. Fetch Categories and Dealers
  useEffect(() => {
    let isMounted = true;
    const fetchCategoriesAndDealers = async () => {
      try {
        const token = localStorage.getItem('token');
        const catRes = await fetch(`${API_BASE_URL}/api/categories`);
        if (catRes.ok) {
          const catResult = await catRes.json();
          if (isMounted && catResult.categories) setCategories(catResult.categories);
        }

        const dealerRes = await fetch(`${API_BASE_URL}/api/dealer/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (dealerRes.ok) {
          const dealerResult = await dealerRes.json();
          if (isMounted && dealerResult.success && dealerResult.dealers) {
            setDealers(dealerResult.dealers);
          }
        }
      } catch (error) {
        console.error('[ADMIN_ADD_PRODUCT] ❌ Error fetching initial data:', error.message);
      }
    };

    fetchCategoriesAndDealers();
    return () => { isMounted = false; };
  }, []);

  // 3. Fetch Subcategories when Category changes
  useEffect(() => {
    let isMounted = true;
    const fetchSubcategories = async () => {
      if (!form.categoryId) {
        if (isMounted) setSubcategories([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories/get-subcategories/${form.categoryId}`);
        if (!response.ok) throw new Error('Failed to fetch subcategories.');
        const result = await response.json();

        if (isMounted && result && result.data) {
          setSubcategories(result.data);
        } else if (isMounted) {
          setSubcategories([]);
        }
      } catch (error) {
        console.error('[ADMIN_ADD_PRODUCT] ❌ Error fetching subcategories:', error.message);
        if (isMounted) setSubcategories([]);
      }
    };

    fetchSubcategories();
    return () => { isMounted = false; };
  }, [form.categoryId]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [mainImagePreview, videoPreview]);

  const handleFieldChange = (field) => (e) => {
    const value = e.target.value;
    if (field === 'categoryId') {
      setForm((prev) => ({
        ...prev,
        categoryId: value,
        subcategoryId: '',
        subcategoryIds: []
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  // 🌟 Toggle Multiple Subcategories (Automatically syncs top & bottom!)
  const handleSubcategoryToggle = (subIdStr) => {
    setForm((prev) => {
      const exists = prev.subcategoryIds.includes(subIdStr);
      const updated = exists
        ? prev.subcategoryIds.filter((id) => id !== subIdStr)
        : [...prev.subcategoryIds, subIdStr];

      return {
        ...prev,
        subcategoryIds: updated,
        subcategoryId: updated[0] || ''
      };
    });
  };

  // Get selected subcategory names for user-perspective display in Product Details
  const selectedSubcategoryNames = subcategories
    .filter((sub) => form.subcategoryIds.includes(String(sub.subcategory_id)))
    .map((sub) => sub.subcategory_name || sub.name);

  // 🌟 Media Handlers
  const handleMainImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImage(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveMainImage = () => {
    setMainImage(null);
    if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
    setMainImagePreview(null);
    if (mainInputRef.current) mainInputRef.current.value = '';
  };

  const handleExtraImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const filesWithPreview = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}-${Math.random()}`
    }));
    setExtraImages((prev) => [...prev, ...filesWithPreview]);
    if (extraInputRef.current) extraInputRef.current.value = '';
  };

  const handleRemoveNewExtraImage = (idToRemove) => {
    setExtraImages((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleRemoveExistingExtraImage = (urlToRemove) => {
    setExistingExtraImages((prev) => prev.filter((url) => url !== urlToRemove));
    setRemovedExistingImages((prev) => [...prev, urlToRemove]);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
    setForm((prev) => ({ ...prev, videoUrl: '' }));
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const resetForm = () => {
    setForm(emptyFormState);
    handleRemoveMainImage();
    extraImages.forEach((item) => URL.revokeObjectURL(item.preview));
    setExtraImages([]);
    setExistingMainImage('');
    setExistingExtraImages([]);
    setRemovedExistingImages([]);
    handleRemoveVideo();
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.subcategoryIds.length === 0) {
      toast.error('Please select at least one Subcategory.');
      return;
    }

    if (!isEditing && !mainImage) {
      toast.error('Please upload a Main Cover Image.');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('group_id', form.groupId);
    formData.append('price', form.price);
    formData.append('mrp', form.mrp);
    formData.append('discount_percentage', form.discountPercentage);
    formData.append('dealer_base_price', form.dealerBasePrice);
    formData.append('packaging_cost', form.packagingCost);
    formData.append('dealer_id', form.dealerId);
    formData.append('description', form.description);
    formData.append('base_color', form.baseColor);
    formData.append('category_id', form.categoryId);

    // 🌟 Both single primary subcategory_id & multiple subcategory_ids JSON array
    formData.append('subcategory_id', form.subcategoryIds[0] || '');
    formData.append('subcategory_ids', JSON.stringify(form.subcategoryIds.map(Number)));

    formData.append('stock_qty', form.stockQty);
    formData.append('primary_color', form.primaryColor);
    formData.append('other_color', form.otherColor);
    formData.append('border_type', form.borderType);
    formData.append('pattern', form.pattern);
    formData.append('craft', form.craft);
    formData.append('weave', form.weave);
    formData.append('zari_type', form.zariType);
    formData.append('blouse', form.blouse);
    formData.append('blouse_length', form.blouseLength);
    formData.append('product_length', form.productLength); // 🌟 New column
    formData.append('border_motifs', form.borderMotifs);
    formData.append('origin', form.origin);
    formData.append('fabric', form.fabric);
    formData.append('khats', form.khats);
    formData.append('weight', form.weight);
    formData.append('producer', form.producer);
    formData.append('maker', form.maker);
    formData.append('producer_address', form.producer_address);
    formData.append('packer_address', form.packer_address);

    if (mainImage) {
      formData.append('image', mainImage);
    }

    if (videoFile) {
      formData.append('video', videoFile);
    } else {
      formData.append('videoUrl', form.videoUrl || '');
    }

    if (extraImages.length > 0) {
      extraImages.forEach((item) => formData.append('extraImages', item.file));
    }

    if (removedExistingImages.length > 0) {
      formData.append('removed_images', JSON.stringify(removedExistingImages));
    }

    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/products/product/${editId}`
        : `${API_BASE_URL}/api/products/product`;
      const method = isEditing ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        toast.success(isEditing ? 'Product updated successfully!' : 'Product added successfully!');
        navigate('/admin/inventory');
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.message || 'Action failed. Server returned an error.');
      }
    } catch (err) {
      console.error('[ADMIN_ADD_PRODUCT] ❌ Submission exception:', err);
      toast.error('Action failed. Please check the server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
      </div>

      <AdminNav />

      <div className="admin-form-glass form-container">
        <form onSubmit={handleSubmit} className="admin-form">
          
          <div className="responsive-grid-2">
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                value={form.name}
                onChange={handleFieldChange('name')}
                required
                className="admin-input"
                placeholder="e.g. Handcrafted Lavender Kota Doria Floral Saree"
              />
            </div>

            <div className="form-group">
              <label>
                Group ID <small style={{ color: '#888' }}>(To link color variants)</small>
              </label>
              <input
                type="text"
                value={form.groupId}
                onChange={handleFieldChange('groupId')}
                className="admin-input"
                placeholder="e.g. MANDALA-01"
                title="Use the exact same ID for different colors of the same saree"
              />
            </div>
          </div>

          <div className="financial-section">
            <div className="responsive-grid-3">
              <div className="form-group">
                <label>MRP (₹)</label>
                <input
                  type="number"
                  value={form.mrp}
                  onChange={handleFieldChange('mrp')}
                  className="admin-input"
                  placeholder="e.g. 50000"
                />
              </div>
              <div className="form-group">
                <label>Selling Price (₹)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={handleFieldChange('price')}
                  required
                  className="admin-input"
                  placeholder="e.g. 34999"
                />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  value={form.discountPercentage}
                  onChange={handleFieldChange('discountPercentage')}
                  className="admin-input"
                  placeholder="e.g. 20"
                  min="0"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Dealer</label>
                <select value={form.dealerId} onChange={handleFieldChange('dealerId')} className="admin-input">
                  <option value="">-- Direct Sale (No Dealer) --</option>
                  {dealers.map((dealer) => (
                    <option key={dealer.dealer_id} value={String(dealer.dealer_id)}>
                      {dealer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Dealer Base Price (₹)</label>
                <input
                  type="number"
                  value={form.dealerBasePrice}
                  onChange={handleFieldChange('dealerBasePrice')}
                  className="admin-input"
                  placeholder="e.g. 27000"
                />
              </div>
              <div className="form-group">
                <label>Packaging Cost (₹)</label>
                <input
                  type="number"
                  value={form.packagingCost}
                  onChange={handleFieldChange('packagingCost')}
                  required
                  className="admin-input"
                  placeholder="e.g. 500"
                />
              </div>
            </div>
          </div>

          <div className="responsive-grid-2">
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                value={form.stockQty}
                onChange={handleFieldChange('stockQty')}
                className="admin-input"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={handleFieldChange('description')}
              required
              className="admin-input"
              rows="4"
            ></textarea>
          </div>

          {/* 🌟 CATEGORY & MULTI-SUBCATEGORY SELECTOR */}
          <div className="responsive-grid-2">
            <div className="form-group">
              <label>Category</label>
              <select
                value={form.categoryId}
                onChange={handleFieldChange('categoryId')}
                className="admin-input"
                required
              >
                <option value="" disabled>
                  Select Category...
                </option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={String(cat.category_id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="subcat-header-label">
                <span>Subcategories (Select 1 or Multiple)</span>
                {form.subcategoryIds.length > 0 && (
                  <span className="subcat-count-badge">{form.subcategoryIds.length} Selected</span>
                )}
              </label>

              {!form.categoryId ? (
                <div className="subcat-empty-box">Please select a Category first</div>
              ) : subcategories.length === 0 ? (
                <div className="subcat-empty-box">No subcategories available for this category</div>
              ) : (
                <div className="subcat-multi-box">
                  {subcategories.map((sub) => {
                    const idStr = String(sub.subcategory_id);
                    const isSelected = form.subcategoryIds.includes(idStr);
                    return (
                      <button
                        type="button"
                        key={idStr}
                        onClick={() => handleSubcategoryToggle(idStr)}
                        className={`subcat-pill-btn ${isSelected ? 'selected' : ''}`}
                      >
                        {isSelected && <FaCheckCircle className="subcat-check-icon" />}
                        <span>{sub.subcategory_name || sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <small className="edit-note">
                Click to select 2-3 or more subcategories. Selected items automatically sync to Product Details below.
              </small>
            </div>
          </div>

          {/* 🌟 PRODUCT DETAILS FIELDSET */}
          <fieldset className="admin-fieldset">
            <legend>Product Details</legend>

            {/* 🔗 AUTO-SYNCED SUBCATEGORIES IN PRODUCT DETAILS (USER PERSPECTIVE) */}
            <div className="form-group synced-subcat-Highlight">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTags style={{ color: 'var(--primary, #A8325E)' }} />
                Subcategories / Occasion & Style Tags
                <small style={{ color: '#888', fontWeight: 'normal' }}>
                  (Auto-synced from above — Customer View)
                </small>
              </label>
              <div className="synced-subcat-display">
                {selectedSubcategoryNames.length > 0 ? (
                  selectedSubcategoryNames.map((name, idx) => (
                    <span key={idx} className="synced-subcat-tag">
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="synced-subcat-placeholder">
                    Jo subcategories aap upar select karenge, woh automatically yahan customer detail view ke liye jud jayengi...
                  </span>
                )}
              </div>
            </div>

            <div className="responsive-grid-3">
              <div className="form-group">
                <label>Base Color</label>
                <input type="text" value={form.baseColor} onChange={handleFieldChange('baseColor')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Primary Color</label>
                <input type="text" value={form.primaryColor} onChange={handleFieldChange('primaryColor')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Other Color</label>
                <input type="text" value={form.otherColor} onChange={handleFieldChange('otherColor')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Border Type</label>
                <input type="text" value={form.borderType} onChange={handleFieldChange('borderType')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Pattern</label>
                <input type="text" value={form.pattern} onChange={handleFieldChange('pattern')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Craft</label>
                <input type="text" value={form.craft} onChange={handleFieldChange('craft')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Weave</label>
                <input type="text" value={form.weave} onChange={handleFieldChange('weave')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Zari Type</label>
                <input type="text" value={form.zariType} onChange={handleFieldChange('zariType')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Blouse</label>
                <input type="text" value={form.blouse} onChange={handleFieldChange('blouse')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Blouse Length</label>
                <input
                  type="text"
                  value={form.blouseLength}
                  onChange={handleFieldChange('blouseLength')}
                  className="admin-input"
                  placeholder="e.g. 0.80 Meters"
                />
              </div>

              {/* 🌟 NEW COLUMN: PRODUCT LENGTH */}
              <div className="form-group">
                <label>Product Length (Saree Length)</label>
                <input
                  type="text"
                  value={form.productLength}
                  onChange={handleFieldChange('productLength')}
                  className="admin-input"
                  placeholder="e.g. 5.5 Meters"
                />
              </div>

              <div className="form-group">
                <label>Border Motifs</label>
                <input type="text" value={form.borderMotifs} onChange={handleFieldChange('borderMotifs')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Origin</label>
                <input
                  type="text"
                  value={form.origin}
                  onChange={handleFieldChange('origin')}
                  className="admin-input"
                  placeholder="e.g. Kaithoon, Kota"
                />
              </div>
              <div className="form-group">
                <label>Fabric</label>
                <input type="text" value={form.fabric} onChange={handleFieldChange('fabric')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Khats</label>
                <input type="text" value={form.khats} onChange={handleFieldChange('khats')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Weight</label>
                <input
                  type="text"
                  value={form.weight}
                  onChange={handleFieldChange('weight')}
                  className="admin-input"
                  placeholder="e.g. 600g"
                />
              </div>
            </div>

            <div className="responsive-grid-2">
              <div className="form-group">
                <label>Producer</label>
                <input type="text" value={form.producer} onChange={handleFieldChange('producer')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Maker</label>
                <input type="text" value={form.maker} onChange={handleFieldChange('maker')} className="admin-input" />
              </div>
            </div>

            <div className="responsive-grid-2">
              <div className="form-group">
                <label>Producer Address</label>
                <input type="text" value={form.producer_address} onChange={handleFieldChange('producer_address')} className="admin-input" />
              </div>
              <div className="form-group">
                <label>Packer Address</label>
                <input type="text" value={form.packer_address} onChange={handleFieldChange('packer_address')} className="admin-input" />
              </div>
            </div>
          </fieldset>

          {/* 🌟 PROFESSIONAL MEDIA STUDIO (IMAGES & VIDEO) */}
          <fieldset className="admin-fieldset" style={{ marginTop: '20px' }}>
            <legend>Product Media (Images & Video)</legend>

            <div className="media-studio-grid">
              
              {/* 1. MAIN COVER IMAGE CARD */}
              <div className="media-card">
                <div className="media-card-header">
                  <span className="media-card-title">
                    <FaUpload /> Main Cover Image *
                  </span>
                  {(mainImagePreview || existingMainImage) && (
                    <span className="media-badge primary-badge">
                      {mainImagePreview ? 'New Cover Selected' : 'Current Saved Cover'}
                    </span>
                  )}
                </div>

                <input
                  ref={mainInputRef}
                  type="file"
                  onChange={handleMainImageSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {mainImagePreview || existingMainImage ? (
                  <div className="main-preview-wrapper">
                    <img
                      src={mainImagePreview || existingMainImage}
                      alt="Main Cover Preview"
                      className="main-preview-img"
                    />
                    <div className="main-preview-actions">
                      <button
                        type="button"
                        onClick={() => mainInputRef.current?.click()}
                        className="media-action-btn change-btn"
                      >
                        <FaSyncAlt /> Change Cover
                      </button>
                      {mainImagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveMainImage}
                          className="media-action-btn remove-btn"
                        >
                          <FaTrash /> Undo New
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="media-dropzone"
                    onClick={() => mainInputRef.current?.click()}
                  >
                    <FaUpload className="dropzone-icon" />
                    <p className="dropzone-title">Click to Upload Main Cover Photo</p>
                    <span className="dropzone-sub">High-resolution JPG, PNG, or WEBP</span>
                  </div>
                )}
              </div>

              {/* 2. EXTRA GALLERY IMAGES CARD */}
              <div className="media-card">
                <div className="media-card-header">
                  <span className="media-card-title">
                    <FaImages /> Extra Gallery Images
                  </span>
                  <span className="media-badge">
                    {existingExtraImages.length + extraImages.length} Image(s)
                  </span>
                </div>

                <input
                  ref={extraInputRef}
                  type="file"
                  multiple
                  onChange={handleExtraImagesSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                <div
                  className="media-dropzone compact-dropzone"
                  onClick={() => extraInputRef.current?.click()}
                >
                  <FaPlus className="dropzone-icon-sm" />
                  <div>
                    <p className="dropzone-title">Add Gallery Photos (Multiple Angles)</p>
                    <span className="dropzone-sub">Select one or multiple images at once</span>
                  </div>
                </div>

                {/* Gallery Thumbnails Grid (Both Existing & Newly Added) */}
                {(existingExtraImages.length > 0 || extraImages.length > 0) && (
                  <div className="gallery-preview-grid">
                    {existingExtraImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="gallery-thumb-card">
                        <img src={url} alt={`Gallery ${idx + 1}`} />
                        <span className="thumb-tag saved">Saved</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingExtraImage(url)}
                          className="thumb-remove-btn"
                          title="Remove this image"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}

                    {extraImages.map((item) => (
                      <div key={item.id} className="gallery-thumb-card new-thumb">
                        <img src={item.preview} alt="New Upload" />
                        <span className="thumb-tag new">New</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewExtraImage(item.id)}
                          className="thumb-remove-btn"
                          title="Remove this image"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. PRODUCT VIDEO SHOWCASE CARD */}
              <div className="media-card">
                <div className="media-card-header">
                  <span className="media-card-title">
                    <FaVideo /> Product Video (Optional)
                  </span>
                  {(videoPreview || form.videoUrl) && (
                    <span className="media-badge video-badge">Video Attached</span>
                  )}
                </div>

                <input
                  ref={videoInputRef}
                  type="file"
                  onChange={handleVideoSelect}
                  accept="video/mp4,video/webm,video/ogg"
                  style={{ display: 'none' }}
                />

                {videoPreview || form.videoUrl ? (
                  <div className="video-preview-wrapper">
                    <video
                      src={videoPreview || form.videoUrl}
                      controls
                      className="video-preview-player"
                    />
                    <div className="main-preview-actions">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="media-action-btn change-btn"
                      >
                        <FaSyncAlt /> Replace Video
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="media-action-btn remove-btn"
                      >
                        <FaTrash /> Remove Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="media-dropzone"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <FaVideo className="dropzone-icon" />
                    <p className="dropzone-title">Click to Upload Product Video</p>
                    <span className="dropzone-sub">MP4 / WebM • Max 50MB</span>
                  </div>
                )}
              </div>

            </div>
          </fieldset>

          <div className="responsive-grid-2 action-buttons-container">
            <button
              type="submit"
              disabled={isSubmitting}
              className="admin-submit-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <FaPlus /> {isSubmitting ? 'Processing...' : isEditing ? 'Update Product' : 'Add Product'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="admin-cancel-btn">
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminAddProduct;