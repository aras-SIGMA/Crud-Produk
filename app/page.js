'use client';

import { useEffect, useState } from 'react';

const emptyForm = { name: '', description: '', price: '', id_categories: '' };

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Inline category creation
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Gagal memuat kategori:', err);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat data');
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    setCreatingCategory(true);
    setError('');
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name_categories: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah kategori');

      await loadCategories();
      setForm((prev) => ({ ...prev, id_categories: data.id_categories }));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingCategory(false);
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      id_categories: product.id_categories ? String(product.id_categories) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');

      setForm(emptyForm);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus data');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  }

  const displayedProducts = selectedFilterCategory
    ? products.filter((p) => String(p.id_categories) === String(selectedFilterCategory))
    : products;

  return (
    <main>
      <h1>CRUD Produk</h1>
      <p className="subtitle">Next.js + MySQL (Aiven)</p>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <h3>{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="name">Nama Produk</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Misal: Kopi Susu"
              required
            />
          </div>

          <div className="form-row">
            <div className="label-row">
              <label htmlFor="id_categories">Kategori</label>
              <button
                type="button"
                className="btn-text-action"
                onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
              >
                {showNewCategoryInput ? 'Batal Tambah Kategori' : '+ Tambah Kategori Baru'}
              </button>
            </div>

            {showNewCategoryInput && (
              <div className="inline-category-box">
                <input
                  type="text"
                  placeholder="Nama kategori baru..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-primary"
                  disabled={creatingCategory || !newCategoryName.trim()}
                  onClick={handleCreateCategory}
                >
                  {creatingCategory ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            )}

            <select
              id="id_categories"
              name="id_categories"
              value={form.id_categories}
              onChange={handleChange}
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id_categories} value={c.id_categories}>
                  {c.name_categories}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="description">Deskripsi</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Deskripsi singkat produk (opsional)"
            />
          </div>

          <div className="form-row">
            <label htmlFor="price">Harga (Rp)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              placeholder="0"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-controls">
        <div className="status">
          {loading ? 'Memuat data...' : `${displayedProducts.length} produk ditemukan`}
        </div>
        <div className="filter-group">
          <label htmlFor="filter-cat">Filter Kategori:</label>
          <select
            id="filter-cat"
            value={selectedFilterCategory}
            onChange={(e) => setSelectedFilterCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id_categories} value={c.id_categories}>
                {c.name_categories}
              </option>
            ))}
          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Kategori</th>
            <th>Deskripsi</th>
            <th>Harga</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {displayedProducts.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>
                <span className="badge-category">
                  {p.name_categories || '-'}
                </span>
              </td>
              <td>{p.description}</td>
              <td>Rp {Number(p.price).toLocaleString('id-ID')}</td>
              <td>
                <button className="btn-edit" onClick={() => startEdit(p)}>
                  Edit
                </button>
                <button className="btn-danger" onClick={() => handleDelete(p.id)}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && displayedProducts.length === 0 && (
        <div className="empty">
          {selectedFilterCategory
            ? 'Tidak ada produk dalam kategori ini.'
            : 'Belum ada produk. Tambahkan produk pertama di atas.'}
        </div>
      )}
    </main>
  );
}
