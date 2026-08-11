import React, { useEffect, useState } from 'react';
import { UserPlus, Edit2, Trash2, X, Check, ShieldAlert, Eye, EyeOff, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api';

interface Classroom {
  id: number;
  class_name: string;
  division: string;
}

interface Teacher {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile?: {
    id: number;
    phone_number: string;
    assigned_classroom: number | null;
    assigned_classroom_detail: Classroom | null;
    status: 'Active' | 'Inactive';
  };
}

const AdminTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [assignedClassroom, setAssignedClassroom] = useState<string>('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers(currentPage, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchQuery]);

  const fetchTeachers = async (page: number, search: string) => {
    try {
      setLoading(true);
      const response = await api.get('teachers/', { params: { page, search } });
      if (response.data && response.data.results) {
        setTeachers(response.data.results);
        setTotalCount(response.data.count);
      } else {
        setTeachers(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err: any) {
      setError('Failed to fetch teachers list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const response = await api.get('classrooms/');
      setClassrooms(response.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTeacherId(null);
    setUsername('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setAssignedClassroom('');
    setStatus('Active');
    setShowPassword(false);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setModalMode('edit');
    setSelectedTeacherId(teacher.id);
    setUsername(teacher.username);
    setFirstName(teacher.first_name);
    setLastName(teacher.last_name);
    setEmail(teacher.email);
    setPassword(''); // leave password empty to not modify
    let initPhone = teacher.profile?.phone_number || '';
    if (initPhone.startsWith('+91 ')) initPhone = initPhone.replace('+91 ', '');
    setPhoneNumber(initPhone);
    setAssignedClassroom(teacher.profile?.assigned_classroom?.toString() || '');
    setStatus(teacher.profile?.status || 'Active');
    setShowPassword(false);
    setError('');
    setShowModal(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (!/[a-zA-Z]/.test(firstName)) {
      setError('Please enter a valid first name. It cannot contain only numbers or special characters.');
      return;
    }

    if (lastName && !/[a-zA-Z]/.test(lastName)) {
      setError('Please enter a valid last name. It cannot contain only numbers or special characters.');
      return;
    }

    setIsSaving(true);

    const payload: any = {
      username,
      first_name: firstName,
      last_name: lastName,
      email,
      profile: {
        phone_number: phoneNumber ? `+91 ${phoneNumber}` : null,
        assigned_classroom: assignedClassroom ? parseInt(assignedClassroom) : null,
        status,
      }
    };

    if (password) {
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (password.length < 8 || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        setError('Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.');
        setIsSaving(false);
        return;
      }
      payload.password = password;
    } else if (modalMode === 'create') {
      setError('Password is required for new teacher.');
      setIsSaving(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        await api.post('teachers/', payload);
        setMsg('Teacher profile created successfully!');
      } else {
        await api.put(`teachers/${selectedTeacherId}/`, payload);
        setMsg('Teacher profile updated successfully!');
      }
      setShowModal(false);
      fetchTeachers(currentPage, searchQuery);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.username?.[0] || err.response?.data?.detail || 'Failed to save teacher.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teacher profile? This action will permanently remove access.')) {
      return;
    }

    try {
      await api.delete(`teachers/${id}/`);
      setMsg('Teacher profile deleted.');
      fetchTeachers(currentPage, searchQuery);
    } catch (err: any) {
      setError('Failed to delete teacher.');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Manage Teachers</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Add instructors and assign classes.</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 bg-[#05080c] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <button
              onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/30 text-sm w-full sm:w-auto shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Add Teacher
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

        {/* Teachers Table list */}
        <div className="glass-card rounded-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
            </div>
          ) : teachers.length === 0 ? (
            <p className="text-gray-500 text-center py-20 text-sm font-medium">No teachers registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Teacher Name</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Username</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Email & Phone</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Assigned Class</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 pb-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-semibold text-white whitespace-nowrap">
                        {teacher.first_name} {teacher.last_name}
                      </td>
                      <td className="px-4 py-4 text-gray-300 font-mono text-xs whitespace-nowrap">{teacher.username}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-300">{teacher.email}</div>
                        <div className="text-[11px] text-gray-500">{teacher.profile?.phone_number || '-'}</div>
                      </td>
                      <td className="px-4 py-4 font-medium text-emerald-400 whitespace-nowrap">
                        {teacher.profile?.assigned_classroom_detail
                          ? `${teacher.profile.assigned_classroom_detail.class_name} - ${teacher.profile.assigned_classroom_detail.division}`
                          : <span className="text-gray-600">Unassigned</span>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {teacher.profile?.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950/40 text-red-400 border border-red-800/30">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(teacher)}
                            className="p-2 border border-white/5 bg-[#0e1624] hover:bg-[#131d2f] text-gray-300 hover:text-white rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teacher.id)}
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

          {/* Pagination Controls */}
          {!loading && teachers.length > 0 && totalCount > 10 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6">
              <span className="text-sm text-gray-400">
                Showing <span className="font-semibold text-white">{(currentPage - 1) * 10 + 1}</span> to <span className="font-semibold text-white">{Math.min(currentPage * 10, totalCount)}</span> of <span className="font-semibold text-white">{totalCount}</span> results
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage * 10 >= totalCount}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-4 py-2 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0a0f18] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                {modalMode === 'create' ? 'Create Teacher Profile' : 'Edit Teacher Profile'}
              </h2>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveTeacher} className="space-y-4" autoComplete="off">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Username</label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      disabled={modalMode === 'edit'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. johndoe"
                      autoComplete="off"
                      className="w-full bg-[#05080c] disabled:opacity-50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required={modalMode === 'create'}
                        minLength={modalMode === 'create' || password ? 8 : undefined}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={modalMode === 'edit' ? 'Leave blank to retain' : '••••••••'}
                        autoComplete="new-password"
                        className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="relative flex items-center bg-[#05080c] border border-white/10 rounded-xl focus-within:border-emerald-500 overflow-hidden">
                      <span className="pl-4 pr-3 py-2.5 text-gray-400 font-medium text-sm bg-white/5 border-r border-white/10">
                        +91
                      </span>
                      <input
                        type="text"
                        required
                        pattern="^[0-9]{10}$"
                        maxLength={10}
                        title="Please enter exactly 10 digits"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full bg-transparent px-3 py-2.5 text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assign Classroom</label>
                    <select
                      value={assignedClassroom}
                      onChange={(e) => setAssignedClassroom(e.target.value)}
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Unassigned</option>
                      {classrooms.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name} - {cls.division}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold transition-all text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-5 py-2.5 flex items-center gap-1.5 transition-all text-xs"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
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

export default AdminTeachers;
