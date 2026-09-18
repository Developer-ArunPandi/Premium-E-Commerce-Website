import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2, Package, Plus, Trash2 } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AdminProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '', description: '', shortDescription: '', sku: '', brand: '',
      price: '', compareAtPrice: '', stock: 0, category: '',
      isFeatured: false, isNewArrival: false, isBestSeller: false,
      isActive: true, returnPolicy: '30 days return policy', tags: '',
    },
  });

  useEffect(() => {
    const init = async () => {
      try {
        const catRes = await api.get('/categories');
        setCategories(catRes.data.data.categories || []);
        if (isEdit) {
          const prodRes = await api.get('/products/' + id);
          const p = prodRes.data.data.product;
          if (p) {
            reset({
              name: p.name || '', description: p.description || '',
              shortDescription: p.shortDescription || '', sku: p.sku || '',
              brand: p.brand || '', price: p.price || '', compareAtPrice: p.compareAtPrice || '',
              stock: p.stock || 0, category: p.category?._id || p.category || '',
              isFeatured: p.isFeatured || false, isNewArrival: p.isNewArrival || false,
              isBestSeller: p.isBestSeller || false, isActive: p.isActive !== false,
              returnPolicy: p.returnPolicy || '30 days return policy',
              tags: (p.tags || []).join(', '),
            });
            setImageUrls((p.images || []).map(img => img.url || img));
          }
        }
      } catch (err) { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    init();
  }, [id]);

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        stock: parseInt(formData.stock),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images: imageUrls.map(url => ({ url, alt: formData.name })),
      };
      if (isEdit) { await api.patch('/products/' + id, payload); toast.success('Product updated!'); }
      else { await api.post('/products', payload); toast.success('Product created!'); }
      navigate('/admin/products');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save product'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 flex items-center justify-center min-h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-primary-500" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/products')} className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{isEdit ? 'Update product information' : 'Fill in the details to add a new product'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2"><Package className="w-4 h-4 text-primary-500" />Basic Information</h2>
              <div>
                <label className="label">Product Name *</label>
                <input {...register('name', { required: 'Required' })} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Premium Wireless Headphones" />
                {errors.name && <p className="error-text">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Short Description</label>
                <input {...register('shortDescription')} className="input" placeholder="Brief one-line description" />
              </div>
              <div>
                <label className="label">Full Description *</label>
                <textarea {...register('description', { required: 'Required' })} rows={5} className={`input resize-none ${errors.description ? 'input-error' : ''}`} placeholder="Detailed product description..." />
                {errors.description && <p className="error-text">{errors.description.message}</p>}
              </div>
              <div>
                <label className="label">Tags <span className="text-neutral-400 font-normal">(comma separated)</span></label>
                <input {...register('tags')} className="input" placeholder="wireless, headphones, audio" />
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-neutral-900">Product Images (URLs)</h2>
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img src={url} alt="Product" className="w-full h-full object-cover rounded-xl border border-neutral-200" onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=Image'; }} />
                      {idx === 0 && <span className="absolute top-1 left-1 text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded-md font-medium">Main</span>}
                      <button type="button" onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="url" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), newImageUrl.trim() && setImageUrls(p => [...p, newImageUrl.trim()]) && setNewImageUrl(''))} className="input flex-1 text-sm" placeholder="https://example.com/image.jpg" />
                <button type="button" onClick={() => { if (newImageUrl.trim()) { setImageUrls(p => [...p, newImageUrl.trim()]); setNewImageUrl(''); } }} className="btn-outline btn-sm whitespace-nowrap"><Plus className="w-3.5 h-3.5" />Add</button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-neutral-900">Pricing</h2>
              <div>
                <label className="label">Selling Price (Rs.) *</label>
                <input type="number" step="0.01" min="0" {...register('price', { required: 'Required' })} className={`input ${errors.price ? 'input-error' : ''}`} placeholder="0.00" />
                {errors.price && <p className="error-text">{errors.price.message}</p>}
              </div>
              <div>
                <label className="label">Compare-at Price (Rs.)</label>
                <input type="number" step="0.01" min="0" {...register('compareAtPrice')} className="input" placeholder="0.00" />
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-neutral-900">Inventory</h2>
              <div>
                <label className="label">SKU</label>
                <input {...register('sku')} className="input" placeholder="EL-HP-001" />
              </div>
              <div>
                <label className="label">Stock *</label>
                <input type="number" min="0" {...register('stock', { required: 'Required' })} className={`input ${errors.stock ? 'input-error' : ''}`} />
                {errors.stock && <p className="error-text">{errors.stock.message}</p>}
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="text-base font-bold text-neutral-900">Organization</h2>
              <div>
                <label className="label">Brand</label>
                <input {...register('brand')} className="input" placeholder="Sony, Nike..." />
              </div>
              <div>
                <label className="label">Category *</label>
                <select {...register('category', { required: 'Required' })} className={`input ${errors.category ? 'input-error' : ''}`}>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
                {errors.category && <p className="error-text">{errors.category.message}</p>}
              </div>
            </div>

            <div className="card p-6 space-y-3">
              <h2 className="text-base font-bold text-neutral-900">Product Flags</h2>
              {[
                { field: 'isActive', label: 'Active (visible to customers)' },
                { field: 'isFeatured', label: 'Featured on homepage' },
                { field: 'isNewArrival', label: 'New Arrival' },
                { field: 'isBestSeller', label: 'Best Seller' },
              ].map(({ field, label }) => (
                <label key={field} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register(field)} className="w-4 h-4 rounded accent-primary-600" />
                  <span className="text-sm text-neutral-700">{label}</span>
                </label>
              ))}
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full btn-lg">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
