import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, User, Lock, BookOpen, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import api from '../api';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [forgotpassword,setforgotpassword]=useState(false)
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    
    if (token && role) {
      if (role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'teacher') {
        navigate('/teacher', { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('auth/token/', { username, password });
      const { access, refresh, role, name, assigned_classroom } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_name', name);
      if (assigned_classroom) {
        localStorage.setItem('assigned_classroom', JSON.stringify(assigned_classroom));
      } else {
        localStorage.removeItem('assigned_classroom');
      }

      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'teacher') {
        navigate('/teacher');
      } else {
        setError('Access denied. Unknown user role.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }


    
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#0B0F19] overflow-x-hidden text-white font-sans">
      
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/15 blur-[150px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#10B981]/10 blur-[150px] pointer-events-none animate-pulse duration-[6000ms]" />

      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
           St. John the Baptist Church
          </span>
        </div>
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 sm:p-2.5 rounded-xl border border-white/5 bg-[#111827]/70 text-gray-400 hover:text-emerald-400 transition-all flex items-center justify-center shrink-0"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </header>

      {/* Centered Login Card layout */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 flex items-center justify-center relative z-20">
        <div className="w-full max-w-md bg-[#111827]/70 border border-emerald-500/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {forgotpassword ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-white">Reset Password</h3>
                <p className="text-sm text-gray-400 mt-2">
                  Enter your username and we'll send instructions to reset your password.
                </p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                const form = e.target as HTMLFormElement;
                const usernameInput = form.elements.namedItem('resetUsername') as HTMLInputElement;
                const resetUser = usernameInput.value;
                
                setLoading(true);
                try {
                  const response = await api.post('auth/password_reset/', { username: resetUser });
                  alert(response.data.message || 'Reset link sent.');
                  setforgotpassword(false);
                } catch (err: any) {
                  console.error(err);
                  setError(err.response?.data?.error || 'Failed to send reset link.');
                } finally {
                  setLoading(false);
                }
              }} className="space-y-4 sm:space-y-6">
                {error && (
                  <div className="mb-4 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      name="resetUsername"
                      type="text"
                      required
                      minLength={3}
                      placeholder="Enter username"
                      className="w-full bg-[#090D16] border border-white/5 focus:border-emerald-500/50 rounded-xl sm:rounded-2xl pl-10 pr-4 py-3 sm:py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-extrabold rounded-full py-3.5 sm:py-4 mt-2 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/40 text-sm tracking-wide"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
                
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setforgotpassword(false);
                      setError('');
                    }}
                    className="text-sm font-medium text-gray-500 hover:text-emerald-400 transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-8 duration-500">
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-white">Welcome Back</h3>
              </div>

              {/* Error alerts */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                {/* Username Input with Absolute Icon */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 capitalize tracking-wider mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type="text"
                      required
                      minLength={3}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      className="w-full bg-[#090D16] border border-white/5 focus:border-emerald-500/50 rounded-xl sm:rounded-2xl pl-10 pr-4 py-3 sm:py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Password Input with Absolute Icon */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 capitalize tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#090D16] border border-white/5 focus:border-emerald-500/50 rounded-xl sm:rounded-2xl pl-10 pr-12 py-3 sm:py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-400 transition-colors p-1 rounded-lg"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-extrabold rounded-full py-3.5 sm:py-4 mt-2 flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-950/40 text-sm tracking-wide"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Log in
                    </>
                  )}
                </button>

              </form>
              <div className="mt-4 text-center flex justify-start">
                <button
                  type="button"
                  className="text-sm font-medium text-gray-500 hover:text-emerald-400 transition-colors" 
                  onClick={() => {
                    setforgotpassword(true);
                    setError('');
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center justify-between border-t border-white/5 text-xs text-gray-500 relative z-20 gap-2 text-center sm:text-left">
        <span>© 2026 Sunday School Catechism. All rights reserved</span>
       <a
    href="https://nextgencoderstech.in/"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:text-white transition-colors"
  >
    <span>Powered By NextGenCoders.tech</span>
  </a>
      </footer>

    </div>
  );
};

export default Login;
