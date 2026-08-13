import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, School, Users, CheckSquare, AlertCircle, X, Gift } from 'lucide-react';
import TeacherLayout from '../../components/TeacherLayout';
import api from '../../api';

interface DashboardStats {
  role: string;
  academic_year: string | null;
  assigned_classroom: {
    id: number;
    class_name: string;
    division: string;
  } | null;
  total_students: number;
  today_attendance: {
    date: string;
    marked: boolean;
    status: string;
    present: number;
    absent: number;
  };
  upcoming_birthdays: {
    student_name: string;
    classroom: string;
    dob: string;
    formatted_date: string;
  }[];
}

const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [absentReport, setAbsentReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);

  useEffect(() => {
    fetchStats(true);
    const intervalId = setInterval(() => {
      fetchStats(false);
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchStats = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [statsRes, reportRes] = await Promise.all([
        api.get('dashboard/'),
        api.get('reports/', { params: { type: 'five_weeks_absent' } })
      ]);
      setStats(statsRes.data);
      if (reportRes.data && reportRes.data.students) {
        setAbsentReport(reportRes.data.students);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load dashboard stats.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
        </div>
      </TeacherLayout>
    );
  }

  if (error || !stats) {
    return (
      <TeacherLayout>
        <div className="p-8">
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
            {error || 'Dashboard stats are not accessible.'}
          </div>
        </div>
      </TeacherLayout>
    );
  }

  if (!stats.academic_year) {
    return (
      <TeacherLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-950/50">
            <Calendar className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-3">Welcome to your Dashboard!</h2>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            The new academic session has not been started yet by the administrator. Please check back later to manage your class.
          </p>
        </div>
      </TeacherLayout>
    );
  }

  const hasClass = stats.assigned_classroom !== null;

  return (
    <TeacherLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Teacher Dashboard</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Active Session: <span className="text-emerald-400 font-semibold">{stats.academic_year}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#0e1624] border border-white/5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Today: {stats.today_attendance.date}</span>
          </div>
        </div>

        {!hasClass ? (
          <div className="glass-card rounded-2xl p-8 border-red-500/20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">No Classroom Assigned</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              You currently do not have a Sunday School class assigned to you by the  administrator. Please contact the office to assign your class.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-400">Assigned Classroom</span>
                  <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-400">
                    <School className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white">
                  {stats.assigned_classroom?.class_name} - {stats.assigned_classroom?.division}
                </p>
                <span className="text-xs text-gray-500 font-semibold block mt-1 uppercase tracking-wider">Current Division</span>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-400">Total Students</span>
                  <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black">{stats.total_students}</p>
                <span className="text-xs text-gray-500 font-semibold block mt-1 uppercase tracking-wider">In Register</span>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-400">Marking Status</span>
                  <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-400">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  {stats.today_attendance.marked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                      Completed ({stats.today_attendance.present} Present)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-400 border border-amber-800/30">
                      Pending Submission
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-semibold block mt-2.5 uppercase tracking-wider">Today's Register</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
              <p className="text-gray-400 text-sm mb-6">Access class roll-call or view details.</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/teacher/mark"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-6 py-4 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg text-sm"
                >
                  <CheckSquare className="w-4 h-4" />
                  {stats.today_attendance.marked ? 'Review/Update Attendance' : 'Mark Attendance Now'}
                </Link>
                <Link
                  to="/teacher/history"
                  className="bg-[#0e1624] border border-white/5 hover:border-emerald-500 hover:text-emerald-400 text-gray-300 font-semibold rounded-xl px-6 py-4 flex items-center justify-center gap-2 transition-all text-sm"
                >
                  View Attendance History
                </Link>
              </div>
            </div>

            {/* 5-Weeks Absent Alert Widget */}
            <div className="glass-card rounded-2xl p-6 border-amber-500/20">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">5-Weeks Absent Alert</h2>
              </div>
              {absentReport.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Great! None of your students have been absent for 5 consecutive Sundays.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                        <th className="px-4 pb-3 font-semibold whitespace-nowrap">Student Name</th>
                        <th className="px-4 pb-3 font-semibold whitespace-nowrap">Admission No.</th>
                        <th className="px-4 pb-3 font-semibold whitespace-nowrap">Parent Contact</th>
                        <th className="px-4 pb-3 font-semibold whitespace-nowrap">Most Recent Absence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {absentReport.map((s: any) => (
                        <tr key={s.student_id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 font-semibold text-white whitespace-nowrap">
                            <button 
                              onClick={() => setSelectedStudentDetails(s)}
                              className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer bg-transparent border-none p-0 text-left transition-colors"
                            >
                              {s.student_name}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-gray-300 font-mono text-xs whitespace-nowrap">{s.admission_number || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{s.parent_name || '-'}</div>
                            <div className="text-xs text-gray-500">{s.parent_phone || '-'}</div>
                          </td>
                          <td className="px-4 py-4 text-amber-400 font-medium whitespace-nowrap">{s.last_attendance_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                      <div className="mt-3 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                        {bday.formatted_date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Absent Dates Modal */}
        {selectedStudentDetails && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#0a0f18] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
              <button
                onClick={() => setSelectedStudentDetails(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h2 className="text-lg font-bold text-white mb-2">Absent Dates</h2>
              <p className="text-gray-400 text-sm mb-4">
                Missed Sundays for <span className="text-white font-semibold">{selectedStudentDetails.student_name}</span>
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedStudentDetails.absent_dates?.map((date: string, idx: number) => (
                  <div key={idx} className="bg-red-950/20 border border-red-900/30 text-red-400 p-3 rounded-xl flex items-center gap-3">
                    <Calendar className="w-4 h-4" />
                    <span className="font-semibold text-sm">{date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
