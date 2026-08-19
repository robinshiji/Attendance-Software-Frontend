import React, { useEffect, useState } from 'react';
import { Users, UserCheck, School, Calendar, CheckCircle2, AlertCircle, Gift } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatDate';

interface ClassroomStatus {
  id: number;
  class_name: string;
  division: string;
  total_students: number;
  marked: boolean;
  present_count: number;
  absent_count: number;
}

interface DashboardStats {
  role: string;
  academic_year: string | null;
  total_students: number;
  total_teachers: number;
  total_classes: number;
  today_attendance: {
    date: string;
    present: number;
    absent: number;
    marked_percentage: number;
  };
  classrooms_status: ClassroomStatus[];
  upcoming_birthdays: {
    student_name: string;
    classroom: string;
    dob: string;
    formatted_date: string;
  }[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchStats(true);
    const intervalId = setInterval(() => {
      fetchStats(false);
    }, 15000);
    return () => clearInterval(intervalId);
  }, [selectedDate]);

  const fetchStats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get(`dashboard/?date=${selectedDate}`);
      setStats(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch dashboard statistics.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
            {error || 'No statistics available.'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats.academic_year) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-950/50">
            <Calendar className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Welcome to the Dashboard!</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8 text-sm">
            Your system is almost ready. To start tracking attendance and managing students, you need to configure your first Academic Year.
          </p>
          <Link
            to="/admin/academic-years"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            <Calendar className="w-5 h-5" />
            Set Up Academic Year
          </Link>
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Academic Year: <span className="text-emerald-400 font-semibold">{stats.academic_year}</span>
            </p>
          </div>
          <div className="relative flex items-center gap-2 bg-[#0e1624] border border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 self-start sm:self-auto hover:bg-[#152136] transition-colors cursor-pointer">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Date: {formatDate(stats.today_attendance.date)}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Stats Grid -- Students Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Link
            to="/admin/students"
            className="glass-card rounded-2xl p-6 block hover:scale-[1.01] transition-transform duration-200 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-medium text-gray-400">
                Total Students
              </span>
              <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <p className="text-3xl font-black text-white">{stats.total_students}</p>

            <span className="text-xs text-gray-500 font-semibold block mt-1 uppercase tracking-wider">
              Active Students
            </span>
          </Link>

          {/*teachers link */}

          <Link to="/admin/teachers" className="block">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-gray-400">Total Teachers</span>
                <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black">{stats.total_teachers}</p>
              <span className="text-xs text-gray-500 font-semibold block mt-1 uppercase tracking-wider">Active Teachers</span>
            </div>
          </Link>


          {/* Total classrooms link */}

          <Link to="/admin/classrooms"className="block">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-medium text-gray-400">Total Classrooms</span>
              <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-400">
                <School className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black">{stats.total_classes}</p>
            <span className="text-xs text-gray-500 font-semibold block mt-1 uppercase tracking-wider">Registered Classes</span>
          </div>
          </Link>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-medium text-gray-400">Daily Attendance</span>
              <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black">{Math.round(stats.today_attendance.marked_percentage)}%</p>
            <span className="text-xs text-gray-500 font-semibold block mt-1 uppercase tracking-wider">Marked Date</span>
          </div>
        </div>

        {/* Mid section: Today Attendance break down & classrooms list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today Overview Card */}
          <div className="lg:col-span-1 glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-4">Attendance Roll</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-[#0a0f18] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-gray-300">Present Students</span>
                  </div>
                  <span className="font-extrabold text-lg text-emerald-400">{stats.today_attendance.present}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#0a0f18] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-gray-300">Absent Students</span>
                  </div>
                  <span className="font-extrabold text-lg text-red-400">{stats.today_attendance.absent}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <span className="text-xs text-gray-500 block">Total students counted:</span>
              <span className="text-2xl font-bold text-white block mt-1">
                {stats.today_attendance.present + stats.today_attendance.absent} / {stats.total_students}
              </span>
            </div>
          </div>

          {/* Classrooms list */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Classwise Submission Status</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Classroom</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Total Students</th>
                    <th className="px-4 pb-3 font-semibold whitespace-nowrap">Submission</th>
                    <th className="px-4 pb-3 font-semibold text-right whitespace-nowrap">Present / Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {stats.classrooms_status.map((cls) => (
                    <tr key={cls.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-semibold text-white whitespace-nowrap">
                        {cls.class_name} - {cls.division}
                      </td>
                      <td className="px-4 py-4 text-gray-300 whitespace-nowrap">{cls.total_students}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {cls.marked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-800/30">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {cls.marked ? (
                          <span className="font-medium">
                            <span className="text-emerald-400">{cls.present_count}</span>
                            <span className="text-gray-500 px-1">/</span>
                            <span className="text-red-400">{cls.absent_count}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upcoming Birthdays */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Gift className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Upcoming Birthdays This Week</h2>
          </div>
          
          {stats.upcoming_birthdays.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No birthdays in the next 7 days.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.upcoming_birthdays.map((bday, idx) => (
                <div key={idx} className="bg-[#0a0f18] border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center text-center hover:border-purple-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate w-full">{bday.student_name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{bday.classroom}</p>
                  <div className="mt-3 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                    {bday.formatted_date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
