import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2, BookOpen, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import api from '../api';

const ResetPassword: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const criteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(criteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet the required criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('auth/password_reset/confirm/', {
        uid,
        token,
        new_password: password
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to reset password. The link might be invalid or expired.');
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
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/login')}>
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

      {/* Centered Card layout */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 flex items-center justify-center relative z-20">
        <div className="w-full max-w-md bg-[#111827]/70 border border-emerald-500/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-6 sm:mb-8 text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Set New Password</h3>
              <p className="text-sm text-gray-400 mt-2">
                Please enter your new password below.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            {success ? (
              <div className="mb-6 p-6 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="font-semibold text-lg mb-2">Password Reset Successful!</p>
                <p className="text-emerald-400/80">You will be redirected to the login page momentarily...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
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
                  
                  {/* Dynamic Password Criteria Checklist */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 px-1">
                    <p className={`text-xs flex items-center gap-1.5 transition-colors ${criteria.minLength ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" /> Minimum 8 characters
                    </p>
                    <p className={`text-xs flex items-center gap-1.5 transition-colors ${criteria.hasUpper ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" /> 1 uppercase letter
                    </p>
                    <p className={`text-xs flex items-center gap-1.5 transition-colors ${criteria.hasLower ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" /> 1 lowercase letter
                    </p>
                    <p className={`text-xs flex items-center gap-1.5 transition-colors ${criteria.hasNumber ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" /> 1 number
                    </p>
                    <p className={`text-xs flex items-center gap-1.5 transition-colors sm:col-span-2 ${criteria.hasSpecial ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]" /> 1 special character (@, #, $, etc.)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
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
                    "Reset Password"
                  )}
                </button>
              </form>
            )}

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-gray-500 hover:text-emerald-400 transition-colors"
              >
                Back to Login
              </button>
            </div>

          </div>

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

export default ResetPassword;
