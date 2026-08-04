import React, { useEffect, useState } from 'react';
import { Calendar, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api';

interface AcademicYear {
  id: number;
  name: string;
  is_active: boolean;
}

const AdminAcademicYears: React.FC = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [newYearName, setNewYearName] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      const response = await api.get('academic-years/');
      setYears(response.data);
    } catch (err: any) {
      setError('Failed to load academic years.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!newYearName.trim()) return;

    try {
      const response = await api.post('academic-years/', {
        name: newYearName,
        is_active: years.length === 0, // make active if it's the first one
      });
      setYears([...years, response.data]);
      setNewYearName('');
      setMsg('Academic Year created successfully!');
      fetchYears(); // refresh to update active states
    } catch (err: any) {
      setError(err.response?.data?.name?.[0] || 'Failed to create academic year.');
    }
  };

  const handleToggleActive = async (id: number) => {
    setError('');
    setMsg('');
    try {
      await api.patch(`academic-years/${id}/`, { is_active: true });
      setMsg('Active academic year updated.');
      fetchYears();
    } catch (err: any) {
      setError('Failed to update active state.');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Manage Academic Years</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Register academic sessions. Only one session can be active at a time.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
            {error}
          </div>
        )}
        {msg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm">
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <div className="glass-card rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Add Academic Year
            </h2>
            <form onSubmit={handleCreateYear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Academic Year Name
                </label>
                <input
                  type="text"
                  required
                  pattern="^\d{4}-\d{4}$"
                  title="Format: YYYY-YYYY (e.g., 2026-2027)"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  placeholder="e.g. 2026-2027"
                  className="w-full bg-[#0a0f18] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/30 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Session
              </button>
            </form>
          </div>

          {/* List Years */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              Registered Sessions
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
              </div>
            ) : years.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">No academic years configured.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {years.map((y) => (
                  <div key={y.id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                    <div>
                      <h3 className="font-semibold text-white">{y.name}</h3>
                      <span className="text-[10px] text-gray-500 font-medium">Session ID: #{y.id}</span>
                    </div>
                    <div>
                      {y.is_active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active Session
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(y.id)}
                          className="px-3.5 py-1.5 border border-white/10 hover:border-emerald-500 hover:text-emerald-400 rounded-xl text-xs font-semibold transition-all duration-200"
                        >
                          Make Active
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAcademicYears;
