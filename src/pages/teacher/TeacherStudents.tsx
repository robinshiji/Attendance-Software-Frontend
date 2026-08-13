import React, { useEffect, useState, useRef } from 'react';
import { UserPlus, Edit2, Trash2, X, Check, Search, UploadCloud, Calendar, BarChart3 } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
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
}

const TeacherStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [search, setSearch] = useState('');
  
  // Modal state for form
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // CSV Modal state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [name, setName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [houseName, setHouseName] = useState('');
  const [baptismName, setBaptismName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhoneNumber, setParentPhoneNumber] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Student history modal state
  const [studentHistory, setStudentHistory] = useState<any>(null);

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

  const viewHistory = async (student: Student) => {
    try {
      const response = await api.get('reports/', { params: { type: 'student', student: student.id } });
      setStudentHistory(response.data);
    } catch (err: any) {
      console.error(err);
      alert('Failed to load student history.');
    }
  };

  useEffect(() => {
    fetchStudents(true);
    setSelectedIds([]); // Clear selection when search changes
    const intervalId = setInterval(() => {
      fetchStudents(false);
    }, 15000);
    return () => clearInterval(intervalId);
  }, [search]);

  const fetchStudents = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params: any = { nopaging: 'true' };
      if (search) params.search = search;
      
      const response = await api.get('students/', { params });
      setStudents(response.data);
    } catch (err: any) {
      setError('Failed to fetch students.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedStudentId(null);
    setName('');
    setAdmissionNumber('');
    setGender('Male');
    setDob('');
    setHouseName('');
    setBaptismName('');
    setParentName('');
    setParentPhoneNumber('');
    setStatus('Active');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (student: Student) => {
    setModalMode('edit');
    setSelectedStudentId(student.id);
    setName(student.name);
    setAdmissionNumber(student.admission_number || '');
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

    let classroomId = null;
    const assignedClassroomStr = localStorage.getItem('assigned_classroom');
    if (assignedClassroomStr) {
      try {
        classroomId = JSON.parse(assignedClassroomStr).id;
      } catch (e) {
        console.error('Failed to parse assigned_classroom from local storage', e);
      }
    }

    const payload = {
      name,
      admission_number: admissionNumber || null,
      gender: gender || null,
      dob: dob || null,
      house_name: houseName || null,
      baptism_name: baptismName || null,
      parent_name: parentName || null,
      parent_phone_number: parentPhoneNumber ? `+91 ${parentPhoneNumber}` : null,
      status,
      classroom: classroomId,
    };

    try {
      if (modalMode === 'create') {
        await api.post('students/', payload);
        setMsg('Student added successfully!');
      } else {
        await api.put(`students/${selectedStudentId}/`, payload);
        setMsg('Student updated successfully!');
      }
      setShowModal(false);
      fetchStudents();
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
      fetchStudents();
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
      fetchStudents();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete selected students.');
    }
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setUploadingCsv(true);
    setError('');
    setMsg('');

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await api.post('students/upload-csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg(response.data.message || 'CSV processed successfully.');
      setShowCsvModal(false);
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStudents();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload CSV.');
    } finally {
      setUploadingCsv(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Students</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 font-medium">Manage your classroom roster.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 hover:text-red-300 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg text-sm flex-1 sm:flex-none"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => { setShowCsvModal(true); setError(''); setMsg(''); }}
              className="bg-[#0e1624] hover:bg-[#131d2f] border border-white/10 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg text-sm flex-1 sm:flex-none"
            >
              <UploadCloud className="w-4 h-4" />
              Upload CSV
            </button>
            <button
              onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/30 text-sm flex-1 sm:flex-none"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        </div>

        {!showModal && !showCsvModal && error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
            {error}
          </div>
        )}
        {msg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm">
            {msg}
          </div>
        )}

        {/* Search */}
        <div className="glass-card rounded-2xl p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or admission no."
              className="w-full bg-[#0a0f18] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Students list */}
        <div className="glass-card rounded-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
            </div>
          ) : students.length === 0 ? (
            <p className="text-gray-500 text-center py-20 text-sm font-medium">No students found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
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
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Student Name</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">House & Bap. Name</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Admission No.</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Details</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Parent Contact</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 pb-3 font-semibold text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {students.map((student) => (
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
                      <td className="px-4 py-4 font-semibold text-white whitespace-nowrap">
                        <button 
                          onClick={() => viewHistory(student)}
                          className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer bg-transparent border-none p-0 text-left transition-colors font-semibold"
                        >
                          {student.name}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-300">{student.house_name || '-'}</div>
                        <div className="text-[11px] text-gray-500">{student.baptism_name || '-'}</div>
                      </td>
                      <td className="px-4 py-4 text-gray-300 font-mono text-xs whitespace-nowrap">{student.admission_number || '-'}</td>
                      <td className="px-4 py-4 text-gray-400 whitespace-nowrap">
                        <div className="text-xs text-gray-300">{student.gender || '-'}</div>
                        <div className="text-[11px] text-gray-500">{formatDate(student.dob)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-300">{student.parent_name || '-'}</div>
                        <div className="text-[11px] text-gray-500">{student.parent_phone_number || '-'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {student.status === 'Active' ? (
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
        </div>

        {/* CSV Upload Modal */}
        {showCsvModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0a0f18] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowCsvModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                Upload Students CSV
              </h2>

              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
                  {error}
                </div>
              )}
              
              <div className="mb-4 text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="font-semibold mb-1 text-gray-300">Expected CSV format:</p>
                <p className="font-mono text-emerald-400">class,name,Housename,ID,Bap Name,Gen,Dob</p>
                <p className="mt-2 text-gray-500">Note: Students will automatically be assigned to your classroom.</p>
              </div>

              <form onSubmit={handleCsvUpload} className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    required
                    ref={fileInputRef}
                    onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                    className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-emerald-600/10 file:text-emerald-400
                      hover:file:bg-emerald-600/20 file:transition-all
                      file:cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCsvModal(false)}
                    className="px-4 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold transition-all text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingCsv || !csvFile}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2.5 flex items-center gap-1.5 transition-all text-xs"
                  >
                    {uploadingCsv ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Student Form Modal */}
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
                {modalMode === 'create' ? 'Add Student Record' : 'Edit Student Details'}
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
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-[#05080c] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
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

        {/* Student History Modal */}
        {studentHistory && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-[#0a0f18] border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    Attendance History
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {studentHistory.student_name} ({studentHistory.admission_number || 'No Admn'})
                  </p>
                </div>
                <button
                  onClick={() => setStudentHistory(null)}
                  className="p-2 text-gray-400 hover:text-white bg-black/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#0e1624] border border-white/5 p-4 rounded-xl text-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Present</div>
                    <div className="text-2xl font-black text-emerald-400">{studentHistory.present_days}</div>
                  </div>
                  <div className="bg-[#0e1624] border border-white/5 p-4 rounded-xl text-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Absent</div>
                    <div className="text-2xl font-black text-red-400">{studentHistory.absent_days}</div>
                  </div>
                  <div className="bg-[#0e1624] border border-emerald-500/20 p-4 rounded-xl text-center">
                    <div className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">Score</div>
                    <div className="text-2xl font-black text-emerald-400">{studentHistory.attendance_percentage || 0}%</div>
                  </div>
                </div>

                {!studentHistory.history ? (
                  <div className="text-center py-10 text-red-400">
                    <p>Error: Unexpected data format received from server.</p>
                    <pre className="text-xs mt-4 bg-black p-4 rounded overflow-auto max-w-full text-left">
                      {JSON.stringify(studentHistory, null, 2)}
                    </pre>
                  </div>
                ) : studentHistory.history.length === 0 ? (
                  <div className="text-center py-10">
                    <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No attendance records found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Date</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Status</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Teacher</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {studentHistory.history.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-4 font-semibold text-white whitespace-nowrap">{r.date}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                r.status === 'Present' 
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' 
                                  : 'bg-red-950/40 text-red-400 border border-red-800/30'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{r.marked_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </TeacherLayout>
  );
};

export default TeacherStudents;
