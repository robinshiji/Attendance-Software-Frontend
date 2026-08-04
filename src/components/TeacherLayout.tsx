import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, CalendarRange, LogOut, Award, Menu, X, Sun, Moon, Users
} from 'lucide-react';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem('user_name') || 'Teacher';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const assignedClassroomStr = localStorage.getItem('assigned_classroom');
  const assignedClassroom = assignedClassroomStr ? JSON.parse(assignedClassroomStr) : null;

  const menuItems = [
    { name: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
    { name: 'My Students', path: '/teacher/students', icon: Users },
    { name: 'Mark Attendance', path: '/teacher/mark', icon: CheckSquare },
    { name: 'Attendance History', path: '/teacher/history', icon: CalendarRange },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderSidebarContent = () => (
    <>
      <div>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between lg:justify-start gap-3 px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Sunday School</h2>
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Teacher Portal</span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/5">
        <div className="flex flex-col gap-1 px-3 py-3 bg-[#0e1624] rounded-xl border border-white/5 mb-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <p className="text-xs font-semibold truncate">{name}</p>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">Instructor</span>
            </div>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg border border-white/5 bg-[#111827]/70 text-gray-400 hover:text-emerald-400 transition-all flex items-center justify-center shrink-0"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
          {assignedClassroom ? (
            <div className="text-[11px] text-gray-400 mt-1 border-t border-white/5 pt-1.5 flex justify-between">
              <span>Classroom:</span>
              <span className="font-semibold text-white">{assignedClassroom.class_name} - {assignedClassroom.division}</span>
            </div>
          ) : (
            <span className="text-[10px] text-red-400 mt-1 block">No Assigned Class</span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-red-500/20 text-red-400 hover:text-white hover:bg-red-500/15 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col lg:flex-row">
      {/* Desktop Sidebar (always visible on lg+) */}
      <aside className="hidden lg:flex w-64 bg-[#0a0f18] border-r border-white/5 flex-col justify-between shrink-0 h-screen sticky top-0">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Sidebar Drawer */}
          <aside className="relative w-64 bg-[#0a0f18] border-r border-white/5 flex flex-col justify-between shrink-0 z-10 animate-in slide-in-from-left duration-200 h-full">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden h-16 bg-[#0a0f18] border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-white leading-none">Sunday School</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-gray-400 hover:text-emerald-400 transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-[#0e1624] px-2.5 py-1 rounded-md border border-white/5">
              Teacher
            </span>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
