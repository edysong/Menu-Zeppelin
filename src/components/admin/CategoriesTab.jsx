import { useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../firebase';

export default function CategoriesTab({ categories }) {
  const [editingCat, setEditingCat] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta categoría? Los platos asignados quedarán sin categoría.')) return;
    await deleteDoc(doc(db, 'categories', id));
  }

  function openNew() {
    setEditingCat(null);
    setShowForm(true);
  }

  function openEdit(cat) {
    setEditingCat(cat);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCat(null);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">
          Categorías <span className="text-gray-500 font-normal text-sm">({categories.length})</span>
        </h2>
        <button
          onClick={openNew}
          className="bg-accent hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
        >
          + Nueva categoría
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <CategoryForm cat={editingCat} onClose={closeForm} />
      )}

      {/* List */}
      {categories.length === 0 && !showForm ? (
        <div className="text-center text-gray-500 py-16 border border-dashed border-white/10 rounded-lg">
          Sin categorías.
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[#1e1e1e] rounded-lg px-4 py-3 flex items-center gap-4 border border-white/10"
            >
              <span className="text-3xl flex-shrink-0">{cat.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{cat.name}</div>
                <div className="text-gray-500 text-xs">Orden: {cat.order}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(cat)}
                  className="text-xs px-2.5 py-1 rounded bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-xs px-2.5 py-1 rounded bg-red-700/20 text-red-400 hover:bg-red-700/40 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Category Form ────────────────────────────────────────────────────────────

function CategoryForm({ cat, onClose }) {
  const [name, setName] = useState(cat?.name ?? '');
  const [emoji, setEmoji] = useState(cat?.emoji ?? '');
  const [order, setOrder] = useState(cat?.order ?? 1);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { name: name.trim(), emoji: emoji.trim(), order: Number(order) };
      if (cat) {
        await updateDoc(doc(db, 'categories', cat.id), data);
      } else {
        await addDoc(collection(db, 'categories'), data);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#252525] border border-white/10 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-white text-sm uppercase tracking-widest mb-4">
        {cat ? 'Editar categoría' : 'Nueva categoría'}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-1.5">
              Nombre *
            </label>
            <input
              className="input-admin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Hamburguesas"
            />
          </div>
          <div className="w-24">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-1.5">
              Emoji
            </label>
            <input
              className="input-admin text-xl text-center"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🍔"
            />
          </div>
          <div className="w-24">
            <label className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-1.5">
              Orden
            </label>
            <input
              className="input-admin"
              type="number"
              min="1"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-red-700 disabled:opacity-50 text-white font-black px-4 py-2 rounded-md transition-colors text-sm uppercase tracking-widest"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-gray-300 font-bold px-4 py-2 rounded-md transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
