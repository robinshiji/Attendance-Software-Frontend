import React, { useEffect, useState } from 'react';
import { Calendar, Search, Check, AlertCircle, Save } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import api from '../../api';

interface Student {
  id: number;
  name: string;
  admission_number: string | null;
  status: string;
}

const TeacherAttendance: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, 'Present' | 'Absent'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchClassData();
  }, [selectedDate]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      setError('');
      setMsg('');

      // 1. Fetch classroom students
      const studentsRes = await api.get('students/', { params: { status: 'Active', nopaging: 'true' } });
      const activeStudents: Student[] = studentsRes.data;
      setStudents(activeStudents);

      // Initialize all to Present by default
      const defaultAttendance: Record<number, 'Present' | 'Absent'> = {};
      activeStudents.forEach((student) => {
        defaultAttendance[student.id] = 'Present';
      });

      // 2. Fetch existing attendance for this date (if any)
      const attendanceRes = await api.get('attendance/', { params: { date: selectedDate } });
      const existingAttendance = attendanceRes.data;

      if (existingAttendance && existingAttendance.length > 0) {
        existingAttendance.forEach((rec: any) => {
          defaultAttendance[rec.student] = rec.status;
        });
      }

      setAttendance(defaultAttendance);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch class registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (studentId: number, status: 'Present' | 'Absent') => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMsg('');

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: parseInt(studentId),
      status,
    }));

    try {
      await api.post('attendance/bulk-save/', {
        date: selectedDate,
        records,
      });
      setMsg(`Attendance sheet saved successfully for ${selectedDate}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.admission_number && s.admission_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <TeacherLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Mark Attendance</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Tap status to toggle attendance for your class.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-44">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#0a0f18] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none"
              />
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving || students.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-semibold rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg text-sm shrink-0"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Registry'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm flex gap-2 items-center">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {msg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm flex gap-2 items-center">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {/* List Registry */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full bg-[#0a0f18] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Total Active: {filteredStudents.length} Students
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-20 text-sm font-medium">No students registered in this class.</p>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const status = attendance[student.id] || 'Present';
                return (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#0a0f18]/60 border border-white/5 rounded-2xl hover:border-white/10 transition-all duration-300"
                  >
                    <div>
                      <h3 className="font-bold text-white text-base">{student.name}</h3>
                      <span className="text-xs text-gray-500 font-mono">Roll/Adm: {student.admission_number || '-'}</span>
                    </div>

                    {/* Single-tap present/absent switch buttons */}
                    <div className="flex gap-2.5 mt-3 sm:mt-0 w-full sm:w-auto p-1 bg-[#101625] border border-white/5 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(student.id, 'Present')}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                          status === 'Present'
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-extrabold'
                            : 'text-gray-400 hover:text-white border border-transparent'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(student.id, 'Absent')}
                        className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                          status === 'Absent'
                            ? 'bg-red-600/20 text-red-400 border border-red-500/30 font-extrabold'
                            : 'text-gray-400 hover:text-white border border-transparent'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </TeacherLayout>
  );
};

export default TeacherAttendance;
