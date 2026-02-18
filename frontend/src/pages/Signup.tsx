import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { UtensilsCrossed, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Signup: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
            login(res.data);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0c0a09] flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-md bg-[#0f0d0c] border border-[#2a2725] rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-[#0c0a09] shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-6">
                        <UtensilsCrossed size={32} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-serif text-amber-500 font-medium tracking-wide">Join The Table</h1>
                    <p className="text-stone-500 text-sm mt-2">Create your account for personalized dining</p>
                </div>

                {error && (
                    <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-600 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-[#1c1917] border border-[#2a2725] rounded-xl py-4 pl-12 pr-4 text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                                placeholder="Auguste Escoffier"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-600 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-[#1c1917] border border-[#2a2725] rounded-xl py-4 pl-12 pr-4 text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                                placeholder="chef@goldentable.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-600 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[#1c1917] border border-[#2a2725] rounded-xl py-4 pl-12 pr-12 text-stone-200 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-500 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-[#0c0a09] font-bold py-4 rounded-xl transition-all shadow-[0_5px_15px_rgba(245,158,11,0.2)] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-stone-500 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-amber-500 hover:text-amber-400 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
