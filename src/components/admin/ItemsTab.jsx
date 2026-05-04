import { useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';

function formatPrice(price) {
  return `$${Number(price).toLocaleString('es-CO')}`;
}

export default function ItemsTab({ items, categories }) {
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function toggleAvailable(item) {
    await updateDoc(doc(db, 'items', item.id), { available: !item.available });
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este plato?')) return;
    await deleteDoc(doc(db, 'items', id));
  }

  function openNew() {
    setEditingItem(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingItem(null);
  }

  if (showForm) {
    return (
      <ItemForm item={editingItem} categories={categories} onClose={closeForm} />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">
          Platos <span className="text-gray-500 font-normal text-sm">({items.length})</span>
        </h2>
        <button
          onClick={openNew}
          className="bg-accent hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
        >
          + Nuevo plato
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 border border-dashed border-white/10 rounded-lg">
          Sin platos. ¡Agrega el primero!
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            return (
              <div
                key={item.id}
                className="bg-[#1e1e1e] rounded-lg p-3 flex gap-3 items-center border border-white/10"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-md overflow-hidden bg-white/10 flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm truncate">
                      {item.name}
                    </span>
                    {item.featured && (
                      <span className="bg-accent text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Top
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {cat ? `${cat.emoji} ${cat.name}` : '—'}
                  </div>
                  <div className="text-gray-500 text-xs mt-0.5 truncate">
                    {item.variants?.length
                      ? item.variants
                          .map((v) => `${v.name} ${formatPrice(v.price)}`)
                          .join(' · ')
                      : 'Sin variantes'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                  <button
                    onClick={() => toggleAvailable(item)}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors ${
                      item.available
                        ? 'bg-emerald-700/30 text-emerald-400 hover:bg-emerald-700/50'
                        : 'bg-red-700/30 text-red-400 hover:bg-red-700/50'
                    }`}
                  >
                    {item.available ? 'Disponible' : 'Agotado'}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs px-2 py-1 rounded bg-red-700/20 text-red-400 hover:bg-red-700/40 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Item Form ────────────────────────────────────────────────────────────────

function ItemForm({ item, categories, onClose }) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? '');
  const [available, setAvailable] = useState(item?.available ?? true);
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [variants, setVariants] = useState(
    item?.variants?.length ? item.variants : []
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.imageUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  function addVariant() {
    setVariants((prev) => [...prev, { name: '', price: 0 }]);
  }

  function updateVariant(i, field, value) {
    setVariants((prev) => {
      const next = [...prev];
      next[i] = {
        ...next[i],
        [field]: field === 'price' ? Number(value) : value,
      };
      return next;
    });
  }

  function removeVariant(i) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = item?.imageUrl ?? '';

      if (imageFile) {
        setUploadProgress('Subiendo imagen...');
        const storageRef = ref(
          storage,
          `items/${Date.now()}_${imageFile.name}`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
        setUploadProgress('');
      }

      const data = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        available,
        featured,
        variants,
        imageUrl,
      };

      if (item) {
        await updateDoc(doc(db, 'items', item.id), data);
      } else {
        await addDoc(collection(db, 'items'), data);
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar. Revisa la consola e intenta de nuevo.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  }

  return (
    <div>
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-6"
      >
        ← Volver a la lista
      </button>

      <h2 className="text-lg font-bold text-white mb-6">
        {item ? 'Editar plato' : 'Nuevo plato'}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
        {/* Name */}
        <Field label="Nombre *">
          <input
            className="input-admin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej: Hamburguesa Zeppelin"
          />
        </Field>

        {/* Description */}
        <Field label="Descripción">
          <textarea
            className="input-admin resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción breve del producto..."
          />
        </Field>

        {/* Category */}
        <Field label="Categoría *">
          <select
            className="input-admin bg-[#1a1a1a]"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-[#1a1a1a]">
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </Field>

        {/* Image */}
        <Field label="Imagen del producto">
          <label className="cursor-pointer block">
            <div className="border border-dashed border-white/20 hover:border-accent rounded-md p-4 text-center transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <span className="text-gray-400 text-sm">
                {imageFile ? imageFile.name : 'Haz clic para seleccionar imagen'}
              </span>
            </div>
          </label>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="mt-2 w-36 h-28 object-cover rounded-md border border-white/10"
            />
          )}
        </Field>

        {/* Toggles */}
        <div className="flex gap-6">
          <Toggle label="Disponible" value={available} onChange={setAvailable} />
          <Toggle label="Destacado (Top)" value={featured} onChange={setFeatured} />
        </div>

        {/* Variants */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
              Variantes y precios
            </span>
            <button
              type="button"
              onClick={addVariant}
              className="text-accent hover:text-red-400 text-sm font-bold transition-colors"
            >
              + Agregar variante
            </button>
          </div>

          {variants.length === 0 && (
            <p className="text-gray-600 text-xs italic">
              Sin variantes. Agrega al menos una con su precio en COP.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {variants.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="input-admin flex-1"
                  placeholder="Nombre (ej: Sencilla)"
                  value={v.name}
                  onChange={(e) => updateVariant(i, 'name', e.target.value)}
                />
                <input
                  className="input-admin w-32"
                  type="number"
                  min="0"
                  placeholder="Precio"
                  value={v.price}
                  onChange={(e) => updateVariant(i, 'price', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-red-400 hover:text-red-300 text-xl leading-none px-1 flex-shrink-0"
                  title="Eliminar variante"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-6 py-2.5 rounded-md transition-colors text-sm uppercase tracking-widest"
          >
            {uploadProgress || (loading ? 'Guardando...' : item ? 'Guardar cambios' : 'Crear plato')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-gray-300 font-bold px-4 py-2.5 rounded-md transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="text-gray-400 text-xs font-semibold uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-accent' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
      <span className="text-gray-300 text-sm">{label}</span>
    </label>
  );
}
