import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Package, Filter } from 'lucide-react';
import api from '@/services/api';
import { formatPrice, debounce } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchProducts = async (pg = 1, q = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/admin/all', { params: { page: pg, limit: 20, search: q } });
      setProducts(data.data.products || []);
      setTotal(data.meta?.total || 0);
    } catch (e) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(page, search); }, [page]);

  const doSearch = debounce((q) => { setPage(1); fetchProducts(1, q); }, 400);

  const handleToggleStatus = async (productId) => {
    try {
      await api.patch(`/products/${productId}/toggle`);
      setProducts((prev) => prev.map((p) => p._id === productId ? { ...p, isActive: !p.isActive } : p));
      toast.success('Status updated');
    } catch (e) { toast.error('Failed to update'); }
  };

  const handleDelete = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setTotal((t) => t - 1);
      setDeleteConfirm(null);
      toast.success('Product deleted');
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-500 mt-1">{total} products total</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="card p-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-9 text-sm"
            onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">SKU</th>
                <th className="table-header">Price</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="table-cell"><div className="h-4 bg-neutral-200 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-neutral-400">
                    <Package className="w-12 h-12 mx-auto mb-3 text-neutral-200" />
                    No products found
                  </td>
                </tr>
              ) : products.map((product) => (
                <tr key={product._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <img src={product.images?.[0]?.url || '/placeholder.jpg'} alt={product.name}
                        className="w-10 h-10 rounded-xl object-cover border border-neutral-100 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-800 truncate max-w-[200px]">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs">{product.sku}</td>
                  <td className="table-cell">
                    <p className="font-semibold text-neutral-900">{formatPrice(product.price)}</p>
                    {product.compareAtPrice > product.price && (
                      <p className="text-xs text-neutral-400 line-through">{formatPrice(product.compareAtPrice)}</p>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`font-medium text-sm ${product.stock <= 0 ? 'text-red-600' : product.stock <= 5 ? 'text-amber-600' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => handleToggleStatus(product._id)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${product.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'}`}>
                      {product.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {product.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <Link to={`/products/${product.slug}`} target="_blank"
                        className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link to={`/admin/products/${product._id}/edit`}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => setDeleteConfirm(product._id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {Math.ceil(total / 20) > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-neutral-100">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-outline btn-sm disabled:opacity-40">Previous</button>
            <span className="flex items-center px-4 text-sm text-neutral-600">Page {page} of {Math.ceil(total / 20)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / 20)} className="btn-outline btn-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-modal animate-scale-in">
            <h3 className="text-lg font-bold mb-2">Delete Product?</h3>
            <p className="text-sm text-neutral-600 mb-5">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
