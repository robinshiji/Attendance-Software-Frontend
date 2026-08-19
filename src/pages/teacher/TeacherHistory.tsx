import React, { useEffect, useState } from 'react';
import { Search, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import api from '../../api';
import { formatDate } from '../../utils/formatDate';

interface AttendanceRecord {
  id: number;
  student: number;
  student_detail: {
    name: string;
    student_id_no: string | null;
  };
  date: string;
  status: 'Present' | 'Absent';
  teacher_name: string;
}

const TeacherHistory: React.FC = () => {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [filterDate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (filterDate) params.date = filterDate;
      
      const response = await api.get('attendance/', { params });
      setHistory(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch attendance history.');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((rec) =>
    rec.student_detail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rec.student_detail.student_id_no && rec.student_detail.student_id_no.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <TeacherLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Attendance History</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Review past registers and active records.</p>
          </div>

          <div className="relative w-full sm:w-44">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-[#0a0f18] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* History Table */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students in logs..."
                className="w-full bg-[#0a0f18] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            
            <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Records Count: {filteredHistory.length}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-20 text-sm font-medium">No records submitted for this date.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Student Name</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Student ID No.</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Status</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Marked By</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Date Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-semibold text-white whitespace-nowrap">{rec.student_detail.name}</td>
                      <td className="px-4 py-4 text-gray-300 font-mono text-xs whitespace-nowrap">{rec.student_detail.student_id_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {rec.status === 'Present' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950/40 text-red-400 border border-red-800/30">
                            <XCircle className="w-3.5 h-3.5" />
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">{rec.teacher_name}</td>
                      <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(rec.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </TeacherLayout>
  );
};

export default TeacherHistory;
