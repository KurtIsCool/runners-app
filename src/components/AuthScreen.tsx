import React, { useState } from 'react';
import { BookOpen, AlertCircle, Mail, Lock, Loader2, ArrowRight, X } from 'lucide-react';
import { type UserRole } from '../types';
import AppLogo from './AppLogo';
import { staticContent } from './StaticPages';

const AuthScreen = ({ onLogin, onSignup }: { onLogin: (e: string, p: string) => Promise<void>, onSignup: (e: string, p: string, r: UserRole) => Promise<void> }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('student');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!isLogin && !agreeTerms) {
        setError('You must agree to the Terms and Conditions.');
        return;
      }

      setLoading(true);
      try {
        if (isLogin) await onLogin(email, password);
        else await onSignup(email, password, role);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unexpected error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="auth-split bg-gray-50 font-sans text-gray-900 relative">
        {/* Terms Modal */}
        {showTerms && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-scale-in">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-3xl">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <staticContent.terms.icon className="text-blue-600" />
                  {staticContent.terms.title}
                </h2>
                <button
                  onClick={() => setShowTerms(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar">
                {staticContent.terms.body}
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LEFT SIDE: Brand (Hidden on Mobile) */}
        <div className="hidden md:flex auth-left relative">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-blob"></div>
           <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-blob"></div>

           <div className="relative z-10 max-w-md">
             <div className="relative h-48 w-full mb-4">
               <AppLogo dark={true} className="h-full w-auto" />
             </div>
             <h1 className="text-5xl font-black mb-6 leading-tight">We run,<br/>you study.</h1>
             <p className="text-blue-100 text-lg mb-8">Join the student community that helps you focus on what matters most. Whether you need a delivery or want to earn extra cash, we've got you covered.</p>

             <div className="flex gap-4">
               <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex-1">
                 <BookOpen className="mb-2 text-blue-200" />
                 <h3 className="font-bold">Students</h3>
                 <p className="text-xs text-blue-200 opacity-80">Get food & prints delivered.</p>
               </div>
               <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex-1">
                 <AppLogo className="mb-2 h-6 w-6 text-green-300" />
                 <h3 className="font-bold">Runners</h3>
                 <p className="text-xs text-blue-200 opacity-80">Earn cash in your free time.</p>
               </div>
             </div>
           </div>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl animate-blob md:hidden"></div>

           <div className="w-full max-w-md bg-white md:bg-transparent rounded-3xl shadow-2xl md:shadow-none p-8 z-10 animate-scale-in border md:border-0 border-gray-100">
              <div className="md:hidden text-center mb-8">
                 <div className="h-24 w-full flex justify-center mb-4">
                   <AppLogo className="h-full w-auto" />
                 </div>
                 <h2 className="text-2xl font-bold text-gray-800">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
              </div>

              <div className="hidden md:block mb-8">
                 <h2 className="text-3xl font-bold text-gray-900">{isLogin ? 'Sign In' : 'Create Account'}</h2>
                 <p className="text-gray-500 mt-2 text-sm">Enter your credentials to access your account.</p>
              </div>

              {/* Toggle Switch */}
              <div className="bg-gray-100 p-1 rounded-xl flex mb-8">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Log In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Sign Up
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-3 border border-red-100">
                  <AlertCircle size={18} className="mt-0.5 shrink-0"/>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative group">
                     <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                     <input
                       required
                       type="email"
                       placeholder="Email Address"
                       value={email}
                       onChange={e => setEmail(e.target.value)}
                       className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                     />
                  </div>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                     <input
                       required
                       type="password"
                       placeholder="Password"
                       value={password}
                       onChange={e => setPassword(e.target.value)}
                       className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                     />
                  </div>
                </div>

                {/* Enhanced Role Selection */}
                {!isLogin && (
                  <div className="space-y-4 animate-slide-up">
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div
                        onClick={() => setRole('student')}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${role === 'student' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                        <BookOpen className={`mx-auto mb-2 ${role === 'student' ? 'text-blue-600' : 'text-gray-400'}`} size={24}/>
                        <div className={`font-bold text-sm ${role === 'student' ? 'text-blue-700' : 'text-gray-600'}`}>Student</div>
                      </div>
                      <div
                        onClick={() => setRole('runner')}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${role === 'runner' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                        <AppLogo className={`mx-auto mb-2 h-6 w-6 ${role === 'runner' ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className={`font-bold text-sm ${role === 'runner' ? 'text-green-700' : 'text-gray-600'}`}>Runner</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-500">
                        I agree to the <span onClick={() => setShowTerms(true)} className="text-blue-600 font-bold cursor-pointer hover:underline">Terms and Conditions</span>
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                  {!loading && <ArrowRight size={20} />}
                </button>
              </form>
           </div>
        </div>
      </div>
    );
}

export default AuthScreen;
