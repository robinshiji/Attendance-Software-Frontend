import React, { useEffect, useState, useRef } from 'react';
import { Search, Filter, Edit2, Trash2, X, Check } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api';

interface Classroom {
  id: number;
  class_name: string;
  division: string;
}

interface Student {
  id: number;
  name: string;
  admission_number: string | null;
  classroom: number;
  classroom_detail: Classroom | null;
  gender: string | null;
  dob: string | null;
  house_name: string | null;
  baptism_name: string | null;
  parent_name: string | null;
  parent_phone_number: string | null;
  status: 'Active' | 'Inactive';
  today_attendance: string;
}

const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal state for form
  const [showModal, setShowModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [classroom, setClassroom] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [houseName, setHouseName] = useState('');
  const [baptismName, setBaptismName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhoneNumber, setParentPhoneNumber] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  
  const [msg, setMsg] = useState('');

  // Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}-${month}-${year}`;
    }
    return dateString;
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on filter change
    fetchStudents(1, true);
    setSelectedIds([]); // Clear selection when filters change
  }, [search, filterClass, filterStatus, sortOrder]);

  const fetchRef = useRef(fetchStudents);
  useEffect(() => {
    fetchRef.current = fetchStudents;
  }, [fetchStudents]);

  useEffect(() => {
    fetchStudents(currentPage, true);
    const intervalId = setInterval(() => {
      fetchRef.current(currentPage, false);
    }, 15000);
    return () => clearInterval(intervalId);
  }, [currentPage]);

  const fetchStudents = async (page: number, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params: any = { page };
      if (search) params.search = search;
      if (filterClass) params.classroom = filterClass;
      if (filterStatus) params.status = filterStatus;
      if (sortOrder) params.ordering = sortOrder;

      const response = await api.get('students/', { params });
      
      if (response.data && response.data.results) {
        setStudents(response.data.results);
        setTotalCount(response.data.count);
      } else {
        setStudents(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err: any) {
      setError('Failed to fetch students.');
    } finally {
      if (showLoading) setLoading(false);
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

  const openEditModal = (student: Student) => {
    setSelectedStudentId(student.id);
    setName(student.name);
    setAdmissionNumber(student.admission_number || '');
    setClassroom(student.classroom.toString());
    setGender(student.gender || 'Male');
    setDob(student.dob || '');
    setHouseName(student.house_name || '');
    setBaptismName(student.baptism_name || '');
    setParentName(student.parent_name || '');
    let initPhone = student.parent_phone_number || '';
    if (initPhone.startsWith('+91 ')) initPhone = initPhone.replace('+91 ', '');
    setParentPhoneNumber(initPhone);
    setStatus(student.status);
    setError('');
    setShowModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMsg('');

    const payload = {
      name,
      admission_number: admissionNumber || null,
      classroom: parseInt(classroom),
      gender: gender || null,
      dob: dob || null,
      house_name: houseName || null,
      baptism_name: baptismName || null,
      parent_name: parentName || null,
      parent_phone_number: parentPhoneNumber ? `+91 ${parentPhoneNumber}` : null,
      status,
    };

    try {
      await api.put(`students/${selectedStudentId}/`, payload);
      setMsg('Student updated successfully!');
      setShowModal(false);
      fetchStudents(currentPage);
    } catch (err: any) {
      console.error(err);
      const serverError = err.response?.data;
      let errorMsg = 'Failed to save student details.';
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
      setError(errorMsg);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student record?')) {
      return;
    }

    try {
      await api.delete(`students/${id}/`);
      setMsg('Student record removed.');
      fetchStudents(currentPage);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err: any) {
      setError('Failed to delete student.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected student(s)?`)) {
      return;
    }
    try {
      const response = await api.post('students/bulk-delete/', { student_ids: selectedIds });
      setMsg(response.data.message || 'Selected students deleted successfully.');
      setSelectedIds([]);
      fetchStudents(currentPage);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete selected students.');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">View Students</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 font-medium">Browse student rosters and attendance.</p>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 hover:text-red-300 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg text-sm w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedIds.length})
            </button>
          )}
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

        {/* Search & Filters */}
        <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or admission no."
              className="w-full bg-[#0a0f18] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto md:w-auto">
              <Filter className="w-4 h-4 text-gray-500 hidden md:block" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full bg-[#0a0f18] border border-white/5 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
              >
                <option value="">All Classrooms</option>
                {classrooms.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} - {cls.division}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 w-full sm:w-auto md:w-auto">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="flex-1 sm:w-auto md:w-auto bg-[#0a0f18] border border-white/5 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
              >
                <option value="">Sort By</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 sm:w-auto md:w-auto bg-[#0a0f18] border border-white/5 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students list */}
        <div className="glass-card rounded-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
            </div>
          ) : students.length === 0 ? (
            <p className="text-gray-500 text-center py-20 text-sm font-medium">No students found matching filters.</p>
          ) : (
            <div className="overflow-auto max-h-[calc(100vh-360px)] relative">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-[#0a0f18] shadow-sm">
                  <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 pb-3 w-10">
                      <input 
                        type="checkbox" 
                        className="rounded border-white/10 bg-[#0a0f18] text-emerald-500 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                        checked={students.length > 0 && selectedIds.length === students.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(students.map(s => s.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap w-16">Sl No</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Student Name</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">House & Bap. Name</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Admission No.</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Classroom</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Details</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Parent Contact</th>
                    <th className="px-4 pb-3 font-semibold text-right whitespace-nowrap">Today's Attendance</th>
                    <th className="px-4 pb-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {students.map((student, index) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-white/10 bg-[#0a0f18] text-emerald-500 focus:ring-emerald-500/20 w-4 h-4 cursor-pointer"
                          checked={selectedIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, student.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-4 text-gray-400 font-medium">
                        {(currentPage - 1) * 10 + index + 1}
                      </td>
                      <td className="px-4 py-4 font-semibold text-white whitespace-nowrap">{student.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-300">{student.house_name || '-'}</div>
                        <div className="text-[11px] text-gray-500">{student.baptism_name || '-'}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-300 font-mono text-xs whitespace-nowrap">{student.admission_number || '-'}</td>
                      <td className="px-4 py-4 text-gray-300 font-medium whitespace-nowrap">
                        {student.classroom_detail
                          ? `${student.classroom_detail.class_name} - ${student.classroom_detail.division}`
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-gray-400 whitespace-nowrap">
                        <div className="text-xs text-gray-300">{student.gender || '-'}</div>
                        <div className="text-[11px] text-gray-500">{formatDate(student.dob)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-300">{student.parent_name || '-'}</div>
                        <div className="text-[11px] text-gray-500">{student.parent_phone_number || '-'}</div>
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {student.today_attendance === 'Present' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                            Present
                          </span>
                        )}
                        {student.today_attendance === 'Absent' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950/40 text-red-400 border border-red-800/30">
                            Absent
                          </span>
                        )}
                        {student.today_attendance === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-800/50 text-gray-400 border border-gray-700/50">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2 border border-white/5 bg-[#0e1624] hover:bg-[#131d2f] text-gray-300 hover:text-white rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
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
          {!loading && students.length > 0 && totalCount > 10 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
              <div className="text-sm text-gray-400">
                Showing <span className="font-semibold text-white">{(currentPage - 1) * 10 + 1}</span> to <span className="font-semibold text-white">{Math.min(currentPage * 10, totalCount)}</span> of <span className="font-semibold text-white">{totalCount}</span> entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0a0f18] text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage * 10 >= totalCount}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#0a0f18] text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Student Form Modal (Edit Only) */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0a0f18] border border-white/10 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-xl font-bold mb-6 text-white">
                Edit Student Details
              </h2>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Student Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Samuel John"
                    className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admission Number (ID)</label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={admissionNumber}
                      onChange={(e) => setAdmissionNumber(e.target.value)}
                      placeholder="e.g. ADM1002"
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Classroom</label>
                    <select
                      value={classroom}
                      onChange={(e) => setClassroom(e.target.value)}
                      required
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Classroom</option>
                      {classrooms.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name} - {cls.division}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gender</label>
                    <select
                      value={gender}
                      required
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">House Name</label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={houseName}
                      onChange={(e) => setHouseName(e.target.value)}
                      placeholder="e.g. Smith House"
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Baptism Name</label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      value={baptismName}
                      onChange={(e) => setBaptismName(e.target.value)}
                      placeholder="e.g. Peter"
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Parent Name</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. David John"
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Parent Phone</label>
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
                        value={parentPhoneNumber}
                        onChange={(e) => setParentPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full bg-transparent px-3 py-2.5 text-white text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-5 py-2.5 flex items-center gap-1.5 transition-all text-xs"
                  >
                    <Check className="w-4 h-4" />
                    Save Student
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

export default AdminStudents;
