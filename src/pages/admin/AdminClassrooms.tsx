import React, { useEffect, useState } from 'react';
import { School, Plus, Edit2, Trash2, RefreshCw, X, Check, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api';

interface Classroom {
  id: number;
  class_name: string;
  division: string;
  student_count: number;
}

const AdminClassrooms: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');
  const [division, setDivision] = useState('');
  
  // Modal & Edit mode state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClassrooms();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, sortOrder]);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (sortOrder) params.ordering = sortOrder;
      
      const response = await api.get('classrooms/', { params });
      setClassrooms(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load classrooms.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClassName('');
    setDivision('');
    setIsEditing(false);
    setSelectedId(null);
    setShowModal(false);
    setError('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!className.trim() || !division.trim()) {
      setError('Class name and division are required.');
      return;
    }

    if (!/[a-zA-Z0-9]/.test(className)) {
      setError('Please enter a valid class name. The class name cannot contain only special characters');
      return;
    }

    if (!/[a-zA-Z0-9]/.test(division)) {
      setError('Please enter a valid division. The division cannot contain only special characters');
      return;
    }

    const formatClassName = (name: string) => {
      return name.trim().split(/\s+/).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    };

    const payload = {
      class_name: formatClassName(className),
      division: division.trim().toUpperCase(),
    };

    try {
      if (isEditing && selectedId) {
        await api.put(`classrooms/${selectedId}/`, payload);
        setMsg('Classroom updated successfully!');
      } else {
        await api.post('classrooms/', payload);
        setMsg('Classroom created successfully!');
      }
      resetForm();
      fetchClassrooms();
    } catch (err: any) {
      console.error(err);
      const serverError = err.response?.data;
      let errorMsg = 'Failed to save classroom.';
      if (serverError) {
        if (typeof serverError === 'object') {
          errorMsg = Object.entries(serverError)
            .map(([field, msgs]) => {
              const formattedField = field === 'non_field_errors' ? '' : field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ': ';
              return `${formattedField}${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
            })
            .join(' | ');
        } else if (typeof serverError === 'string') {
          errorMsg = serverError;
        }
      }
      
      if (errorMsg.toLowerCase().includes('unique') || errorMsg.toLowerCase().includes('already exist')) {
        errorMsg = 'The Entered Class and Division Already Exist';
      }
      
      setError(errorMsg);
    }
  };

  const handleEditClick = (cls: Classroom) => {
    setIsEditing(true);
    setSelectedId(cls.id);
    setClassName(cls.class_name);
    setDivision(cls.division);
    setError('');
    setMsg('');
    setShowModal(true);
  };

  const handleDeleteClassroom = async (id: number, studentCount: number) => {
    if (studentCount > 0) {
      alert(`Cannot delete this classroom. There are ${studentCount} student(s) currently registered in it.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return;
    }

    setError('');
    setMsg('');
    try {
      await api.delete(`classrooms/${id}/`);
      setMsg('Classroom deleted.');
      fetchClassrooms();
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete classroom. Ensure no teachers are assigned to it.');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Manage Classrooms</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Configure Sunday School classes and divisions (e.g. Class 1 - A).
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search classrooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#05080c] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-[#05080c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors w-full sm:w-auto"
            >
              <option value="">Sort By</option>
              <option value="name_asc">Class Name (Ascending)</option>
              <option value="name_desc">Class Name (Descending)</option>
            </select>

            <button
              onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/30 text-sm w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Classroom
            </button>
          </div>
        </div>

        {!showModal && error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
            {error}
          </div>
        )}
        {msg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm">
            {msg}
          </div>
        )}

        {/* List Classrooms */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            Registered Classrooms
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
            </div>
          ) : classrooms.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">No classrooms configured.</p>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-320px)] relative">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#0a0f18] shadow-sm">
                  <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 pb-3 font-semibold w-16">Sl No</th>
                    <th className="px-4 pb-3 font-semibold">Classroom</th>
                    <th className="px-4 pb-3 font-semibold">Total Students</th>
                    <th className="px-4 pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {classrooms.map((cls, index) => (
                    <tr key={cls.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 text-gray-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 font-semibold text-white">
                        {cls.class_name} - {cls.division}
                      </td>
                      <td className="px-4 py-4 text-gray-300">
                        {cls.student_count} student{cls.student_count !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(cls)}
                            className="p-2 border border-white/5 bg-[#0e1624] hover:bg-[#131d2f] text-gray-300 hover:text-white rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClassroom(cls.id, cls.student_count)}
                            className="p-2 border border-white/5 bg-[#1d0e14] hover:bg-[#29131d] text-red-400 hover:text-red-300 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0a0f18] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={resetForm}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-400" />
                {isEditing ? 'Edit Classroom' : 'Add Classroom'}
              </h2>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveClassroom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Class Name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={50}
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="e.g. Class 4"
                    className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Division
                  </label>
                  <input
                    type="text"
                    required
                    minLength={1}
                    maxLength={10}
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    placeholder="e.g. A"
                    className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold transition-all text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-5 py-2.5 flex items-center gap-1.5 transition-all duration-300 shadow-lg shadow-emerald-950/30 text-xs"
                  >
                    {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isEditing ? 'Update Class' : 'Add Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminClassrooms;
