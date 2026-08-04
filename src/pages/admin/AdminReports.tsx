import React, { useEffect, useState } from 'react';
import { BarChart3, Download, Search, Calendar, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../api';

interface Classroom {
  id: number;
  class_name: string;
  division: string;
}

const Pagination = ({ totalItems, itemsPerPage, currentPage, setCurrentPage }: any) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-between items-center mt-4 px-4 py-3 bg-[#0a0f18] rounded-xl border border-white/5">
      <span className="text-sm text-gray-400">
        Page <span className="font-semibold text-white">{currentPage}</span> of <span className="font-semibold text-white">{totalPages}</span>
      </span>
      <div className="flex gap-2">
        <button 
          disabled={currentPage === 1} 
          onClick={() => setCurrentPage((p: number) => p - 1)}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-md text-sm transition-all text-gray-300 font-medium"
        >
          Previous
        </button>
        <button 
          disabled={currentPage === totalPages} 
          onClick={() => setCurrentPage((p: number) => p + 1)}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-md text-sm transition-all text-gray-300 font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const AdminReports: React.FC = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'class' | 'five_weeks_absent' | 'student'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState('');
  const [dailyFilter, setDailyFilter] = useState<'All' | 'Present' | 'Absent'>('All');
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchClassrooms();
    handleFetchReport();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [reportData, dailyFilter, reportType]);

  useEffect(() => {
    if (reportType === 'student' && selectedClass) {
      fetchStudentsForClass(selectedClass);
    }
  }, [selectedClass, reportType]);

  const fetchStudentsForClass = async (classId: string) => {
    try {
      const response = await api.get('students/', { params: { classroom: classId, nopaging: 'true' } });
      setStudents(response.data);
      if (response.data.length > 0) setSelectedStudent(response.data[0].id.toString());
      else setSelectedStudent('');
    } catch (err) {
      console.error(err);
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

  const handleFetchReport = async () => {
    if (reportType === 'student' && !selectedStudent) {
      setError('Please select a student to generate a student history report.');
      return;
    }

    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const params: any = { type: reportType, date: selectedDate };
      if (selectedClass) params.classroom = selectedClass;
      if (reportType === 'student' && selectedStudent) params.student = selectedStudent;
      
      const response = await api.get('reports/', { params });
      setReportData(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch attendance reports.');
    } finally {
      setLoading(false);
    }
  };

  // Pure Client-side CSV Download
  const downloadCSV = () => {
    if (!reportData) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (reportData.report_type === 'daily') {
      csvContent += "Student Name,Admission Number,Class,Parent Name,Parent Phone,Gender,Status,Marked By\n";
      reportData.records.forEach((r: any) => {
        csvContent += `"${r.student_name}","${r.admission_number || ''}","${r.class_name}-${r.division}","${r.parent_name || ''}","${r.parent_phone || ''}","${r.gender || ''}","${r.status}","${r.marked_by}"\n`;
      });
    } else if (reportData.report_type === 'monthly') {
      csvContent += "Student Name,Admission Number,Classroom,Total Days,Present Days,Absent Days,Attendance Percentage\n";
      reportData.students_summary.forEach((s: any) => {
        csvContent += `"${s.student_name}","${s.admission_number || ''}","${s.classroom}","${s.total_days}","${s.present_days}","${s.absent_days}","${s.attendance_percentage}%"\n`;
      });
    } else if (reportData.report_type === 'class') {
      csvContent += "Classroom,Total Students,Total Records,Present Count,Absent Count,Attendance Percentage\n";
      reportData.summary.forEach((c: any) => {
        csvContent += `"${c.class_name}-${c.division}","${c.total_students}","${c.total_attendance_records}","${c.present_count}","${c.absent_count}","${c.attendance_percentage}%"\n`;
      });
    } else if (reportData.report_type === 'weekly') {
      csvContent += "Date,Present Count,Absent Count,Total Count\n";
      reportData.chart_data.forEach((w: any) => {
        csvContent += `"${w.date}","${w.present}","${w.absent}","${w.total}"\n`;
      });
    } else if (reportData.report_type === 'five_weeks_absent') {
      csvContent += "Student Name,Admission Number,Classroom,Parent Name,Parent Phone,Last Attendance\n";
      reportData.students.forEach((s: any) => {
        csvContent += `"${s.student_name}","${s.admission_number || ''}","${s.classroom}","${s.parent_name || ''}","${s.parent_phone || ''}","${s.last_attendance_date}"\n`;
      });
    } else if (reportData.report_type === 'student') {
      csvContent += "Date,Status,Marked By\n";
      reportData.history.forEach((r: any) => {
        csvContent += `"${r.date}","${r.status}","${r.marked_by}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${reportData.report_type}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Attendance Reports</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">Generate lists and analyze percentages.</p>
          </div>
          {reportData && (
            <button
              onClick={downloadCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/30 text-sm w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <div className="glass-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full bg-[#0a0f18] border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="daily">Daily Attendance</option>
              <option value="weekly">Weekly Overview</option>
              <option value="monthly">Monthly Detailed Summary</option>
              <option value="student">Student History</option>
              {/* <option value="class">Classwise Comparison</option> */}
              <option value="five_weeks_absent">5-Weeks Absent Alert</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Classroom</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={reportType === 'class'}
              className="w-full bg-[#0a0f18] disabled:opacity-50 border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Classrooms</option>
              {classrooms.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} - {cls.division}
                </option>
              ))}
            </select>
          </div>

          {reportType === 'student' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Student</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={!selectedClass}
                className="w-full bg-[#0a0f18] disabled:opacity-50 border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {!selectedClass && <option value="">Select Class First</option>}
                {selectedClass && students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.admission_number || '-'})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reference Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#0a0f18] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            onClick={handleFetchReport}
            className="w-full bg-[#0e1624] border border-white/5 hover:border-emerald-500 hover:text-emerald-400 text-gray-300 font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Search className="w-4 h-4" />
            Generate Report
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Report Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500"></div>
          </div>
        ) : !reportData ? (
          <div className="glass-card rounded-2xl p-12 text-center text-gray-500 text-sm">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-600 mb-3" />
            Click "Generate Report" to view analytics.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Daily Report Output */}
            {reportData.report_type === 'daily' && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-lg font-bold text-white">Daily Summary - {reportData.date}</h2>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex bg-[#0a0f18] rounded-lg p-1 border border-white/10">
                      <button onClick={() => setDailyFilter('All')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${dailyFilter === 'All' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>All</button>
                      <button onClick={() => setDailyFilter('Present')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${dailyFilter === 'Present' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>Presenters</button>
                      <button onClick={() => setDailyFilter('Absent')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${dailyFilter === 'Absent' ? 'bg-red-500/20 text-red-400' : 'text-gray-500 hover:text-gray-300'}`}>Absentees</button>
                    </div>

                    <span className="text-sm font-medium">
                      Present: <span className="text-emerald-400 font-bold">{reportData.present_count}</span>
                      <span className="text-gray-500 px-2">|</span>
                      Absent: <span className="text-red-400 font-bold">{reportData.absent_count}</span>
                    </span>
                  </div>
                </div>
                {(() => {
                  const dailyFiltered = reportData.records.filter((r: any) => dailyFilter === 'All' || r.status === dailyFilter);
                  const dailyPaginated = dailyFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  return dailyFiltered.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">No attendance records submitted for this day.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Student Name</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Admission No.</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Classroom</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Parent Contact</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Status</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Marked By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {dailyPaginated.map((r: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3.5 font-semibold text-white whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {r.student_name}
                                {r.gender && <span className="text-xs text-gray-500 font-normal">({r.gender.charAt(0)})</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-gray-300 font-mono text-xs whitespace-nowrap">{r.admission_number || '-'}</td>
                            <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">{r.class_name} - {r.division}</td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="text-sm text-gray-300">{r.parent_name || '-'}</div>
                              <div className="text-xs text-gray-500">{r.parent_phone || '-'}</div>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                r.status === 'Present' 
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' 
                                  : 'bg-red-950/40 text-red-400 border border-red-800/30'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{r.marked_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination totalItems={dailyFiltered.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </>
                );
              })()}
              </div>
            )}

            {/* Weekly Report Output */}
            {reportData.report_type === 'weekly' && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">Weekly Attendance Trend</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                  {reportData.chart_data.map((day: any, idx: number) => {
                    const pct = day.total > 0 ? Math.round((day.present / day.total) * 100) : 0;
                    return (
                      <div key={idx} className="bg-[#0a0f18] border border-white/5 rounded-2xl p-4 text-center">
                        <div className="text-xs text-gray-500 font-bold mb-2">{day.date}</div>
                        <div className="text-xl font-black text-emerald-400 mb-1">{pct}%</div>
                        <div className="text-[10px] text-gray-400">
                          {day.present}P / {day.absent}A
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly Report Output */}
            {reportData.report_type === 'monthly' && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">Monthly Student Summaries ({reportData.month})</h2>
                {(() => {
                  const monthlyPaginated = reportData.students_summary.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  return reportData.students_summary.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">No logs found for this month.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Student Name</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Admission No.</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Classroom</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Marked Days</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Present</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Absent</th>
                          <th className="px-4 pb-3 font-semibold text-right whitespace-nowrap">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {monthlyPaginated.map((s: any) => (
                          <tr key={s.student_id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3.5 font-semibold text-white whitespace-nowrap">{s.student_name}</td>
                            <td className="px-4 py-3.5 text-gray-300 font-mono text-xs whitespace-nowrap">{s.admission_number || '-'}</td>
                            <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">{s.classroom}</td>
                            <td className="px-4 py-3.5 text-gray-300 whitespace-nowrap">{s.total_days} days</td>
                            <td className="px-4 py-3.5 text-emerald-400 font-bold whitespace-nowrap">{s.present_days}</td>
                            <td className="px-4 py-3.5 text-red-400 font-bold whitespace-nowrap">{s.absent_days}</td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-emerald-400 whitespace-nowrap">
                              {s.attendance_percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination totalItems={reportData.students_summary.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </>
                );
              })()}
              </div>
            )}

            {/* Student History Output */}
            {reportData.report_type === 'student' && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-white">Student History: {reportData.student_name}</h2>
                    <p className="text-sm text-gray-400">{reportData.classroom} | Admn: {reportData.admission_number || 'N/A'}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-[#0a0f18] rounded-xl border border-white/5">
                      <div className="text-xs text-gray-400 uppercase">Present</div>
                      <div className="text-lg font-bold text-emerald-400">{reportData.present_days}</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-[#0a0f18] rounded-xl border border-white/5">
                      <div className="text-xs text-gray-400 uppercase">Absent</div>
                      <div className="text-lg font-bold text-red-400">{reportData.absent_days}</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-[#0a0f18] rounded-xl border border-emerald-500/20">
                      <div className="text-xs text-emerald-400/70 uppercase">Score</div>
                      <div className="text-lg font-bold text-emerald-400">{reportData.attendance_percentage}%</div>
                    </div>
                  </div>
                </div>
                
                {(() => {
                  const historyPaginated = reportData.history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  return reportData.history.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">No attendance records found for this student.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Date</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Status</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Marked By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {historyPaginated.map((r: any, idx: number) => (
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
                            <td className="px-4 py-4 text-gray-400 whitespace-nowrap">{r.marked_by}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination totalItems={reportData.history.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </>
                );
              })()}
              </div>
            )}

            {/* 5-Weeks Absent Report Output */}
            {reportData.report_type === 'five_weeks_absent' && (
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">5-Weeks Absent Alert</h2>
                {(() => {
                  const absentPaginated = reportData.students.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                  return reportData.students.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">Great! No students have been absent for 5 consecutive weeks.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-xs text-gray-400 uppercase tracking-wider">
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Student Name</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Admission No.</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Classroom</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Parent Contact</th>
                          <th className="px-4 pb-3 font-semibold whitespace-nowrap">Most Recent Absence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {absentPaginated.map((s: any) => (
                          <tr key={s.student_id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-4 font-semibold text-white whitespace-nowrap">
                              <button 
                                onClick={() => setSelectedStudentDetails(s)}
                                className="text-white hover:text-emerald-400 hover:underline transition-all text-left"
                              >
                                {s.student_name}
                              </button>
                            </td>
                            <td className="px-4 py-4 text-gray-300 font-mono text-xs whitespace-nowrap">{s.admission_number || '-'}</td>
                            <td className="px-4 py-4 text-gray-400 whitespace-nowrap">{s.classroom}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">{s.parent_name || '-'}</div>
                              <div className="text-xs text-gray-500">{s.parent_phone || '-'}</div>
                            </td>
                            <td className="px-4 py-4 text-red-400 font-semibold text-sm whitespace-nowrap">{s.last_attendance_date || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {reportData.students.length > itemsPerPage && (
                    <Pagination totalItems={reportData.students.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                  )}
                </>
                );
              })()}
              </div>
            )}
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
    </AdminLayout>
  );
};

export default AdminReports;
