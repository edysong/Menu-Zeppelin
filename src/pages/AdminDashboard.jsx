import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ItemsTab from '../components/admin/ItemsTab';
import CategoriesTab from '../components/admin/CategoriesTab';

const TABS = ['Platos', 'Categorías', 'Config'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Platos');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubCats = onSnapshot(
      query(collection(db, 'categories'), orderBy('order')),
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    return () => {
      unsubItems();
      unsubCats();
    };
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    navigate('/admin', { replace: true });
  }

  const unavailableCount = items.filter((i) => !i.available).length;

  return (
    <div className="min-h-screen bg-[#111]">
      {/* Header */}
      <header className="bg-dark border-b border-white/10">
        <div className="h-[3px] bg-accent" />
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-[0.2em] text-white uppercase leading-none">
              ZEPPELIN<span className="text-accent">.</span>
            </h1>
            <p className="text-gray-500 text-xs tracking-widest uppercase mt-0.5">
              Admin
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs hidden sm:block truncate max-w-[200px]">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors font-semibold flex-shrink-0"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Total platos" value={items.length} />
          <StatCard label="Categorías" value={categories.length} />
          <StatCard
            label="Agotados"
            value={unavailableCount}
            highlight={unavailableCount > 0}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-white/10 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-accent text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Platos' && (
          <ItemsTab items={items} categories={categories} />
        )}
        {activeTab === 'Categorías' && (
          <CategoriesTab categories={categories} />
        )}
        {activeTab === 'Config' && (
          <ConfigTab userEmail={user?.email} />
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-lg p-4 border ${
        highlight
          ? 'border-accent/40 bg-accent/10'
          : 'border-white/10 bg-[#1e1e1e]'
      }`}
    >
      <div
        className={`text-3xl font-black leading-none ${
          highlight ? 'text-accent' : 'text-white'
        }`}
      >
        {value}
      </div>
      <div className="text-gray-500 text-xs uppercase tracking-widest mt-1.5">
        {label}
      </div>
    </div>
  );
}

function ConfigTab({ userEmail }) {
  return (
    <div className="max-w-md">
      <h2 className="text-lg font-bold text-white mb-4">Configuración</h2>

      <div className="bg-[#1e1e1e] border border-white/10 rounded-lg divide-y divide-white/10">
        <div className="p-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
            Usuario activo
          </p>
          <p className="text-white text-sm font-semibold">{userEmail}</p>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
            Gestión de usuarios
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            Para crear o modificar el acceso de administrador, usa{' '}
            <strong className="text-gray-200">Firebase Console → Authentication</strong>.
            Los usuarios no se crean desde esta interfaz por seguridad.
          </p>
        </div>
        <div className="p-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">
            Menú público
          </p>
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-accent hover:text-red-400 text-sm font-semibold underline transition-colors"
          >
            Ver menú público →
          </a>
        </div>
      </div>
    </div>
  );
}
