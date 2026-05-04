import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const SEED_CATEGORIES = [
  { name: 'Hamburguesas', emoji: '🍔', order: 1 },
  { name: 'Perros', emoji: '🌭', order: 2 },
  { name: 'Salchipapas', emoji: '🍟', order: 3 },
  { name: 'Bebidas', emoji: '🥤', order: 4 },
];

function formatPrice(price) {
  return `$${Number(price).toLocaleString('es-CO')}`;
}

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function seedIfEmpty() {
      const snap = await getDocs(collection(db, 'categories'));
      if (snap.empty) {
        await Promise.all(
          SEED_CATEGORIES.map((cat) => addDoc(collection(db, 'categories'), cat))
        );
      }
    }
    seedIfEmpty();

    const q = query(collection(db, 'categories'), orderBy('order'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, 'items'), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const filteredItems =
    activeCategory === 'all'
      ? items
      : items.filter((item) => item.categoryId === activeCategory);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="bg-dark sticky top-0 z-20">
        <div className="h-[3px] bg-accent" />
        <div className="max-w-5xl mx-auto px-4 py-4 text-center">
          <h1 className="text-3xl md:text-4xl font-black tracking-[0.25em] uppercase text-white leading-none">
            ZEPPELIN<span className="text-accent">.</span>
          </h1>
          <p className="text-gray-400 text-xs tracking-[0.2em] mt-1.5 uppercase">
            Sogamoso · Comida rápida
          </p>
        </div>
      </header>

      {/* Category pills */}
      <div className="sticky top-[70px] z-10 bg-dark border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          <PillButton
            label="Todo"
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          />
          {categories.map((cat) => (
            <PillButton
              key={cat.id}
              label={`${cat.emoji} ${cat.name}`}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Items */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-500 py-24">
            No hay productos en esta categoría aún
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PillButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
        active
          ? 'bg-accent text-white'
          : 'bg-white/10 text-gray-300 hover:bg-white/20'
      }`}
    >
      {label}
    </button>
  );
}

function ItemCard({ item }) {
  return (
    <div
      className={`bg-[#1e1e1e] rounded-lg overflow-hidden border border-white/10 flex flex-col transition-opacity ${
        !item.available ? 'opacity-50' : ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[#252525] flex-shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-600">
            🍽️
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.featured && (
            <span className="bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
              Top
            </span>
          )}
          {!item.available && (
            <span className="bg-black/80 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
              Agotado
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-white text-sm leading-tight">{item.name}</h3>

        {item.description && (
          <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Variants */}
        {item.variants && item.variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
            {item.variants.map((v, i) => (
              <span
                key={i}
                className="bg-white/10 text-white text-xs px-2 py-1 rounded font-semibold"
              >
                {v.name} {formatPrice(v.price)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
