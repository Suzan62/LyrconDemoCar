import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { toast } from 'sonner';

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const [resetEmail, setResetEmail] = useState("");
    const [errors, setErrors] = useState({});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector(state => state.auth);

    const [rememberMe, setRememberMe] = useState(false);

    // Check for remembered email on mount
    React.useEffect(() => {
        const remembered = localStorage.getItem('rememberedEmail');
        if (remembered) {
            setEmail(remembered);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!email) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email format";
        if (!password) newErrors.password = "Password is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});

        dispatch(loginStart());

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                dispatch(loginSuccess(data.user));
                navigate('/');
            } else {
                dispatch(loginFailure(data.message || "Login failed"));
            }
        } catch (err) {
            dispatch(loginFailure("Network error: Could not connect to server. Ensure backend is running."));
            console.error("Login Error:", err);
        }
    };

    const handleForgotPasswordSubmit = async () => {
        if (!resetEmail) {
            toast.error("Please enter your email address.");
            return;
        }

        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: resetEmail })
            });

            if (res.ok) {
                toast.success(`If an account exists for ${resetEmail}, a reset link has been sent.`);
                setShowForgotPassword(false);
                setResetEmail("");
            } else {
                toast.error("Failed to process request. Please try again.");
            }
        } catch (error) {
            console.error("Forgot Password Error:", error);
            toast.error("Network error. Please try again later.");
        }
    };

    return (
        <div className="flex min-h-screen w-full font-sans bg-gray-50">
            {/* Left Side - Hero Image */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:block lg:w-1/2 relative bg-gray-900 overflow-hidden"
            >
                <img
                    src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1983&auto=format&fit=crop"
                    alt="Luxury Sport Car"
                    className="absolute inset-0 h-full w-full object-cover opacity-90 hover:scale-105 transition-transform duration-[2000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
                <div className="absolute bottom-10 left-10 text-white z-10">
                    <h2 className="text-4xl font-bold uppercase tracking-wider mb-2">Drive Excellence</h2>
                    <p className="text-gray-300 tracking-wide text-lg">Experience the future of automotive management.</p>
                </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="flex w-full lg:w-1/2 items-center justify-center p-8 lg:p-12 relative overflow-hidden"
            >
                {/* Decorative Background Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 space-y-8 border border-white/50 relative z-10">
                    <div className="text-left space-y-2">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-extrabold uppercase tracking-tight text-slate-800"
                        >
                            Lyrcon <span className="text-blue-600">Demo Car</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-sm font-medium text-slate-400 uppercase tracking-widest"
                        >
                            Welcome Back, Sign In to Continue
                        </motion.p>
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                        <div className="space-y-5">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className={`block w-full rounded-lg border bg-white px-4 py-3.5 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                            </motion.div>
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required

                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`block w-full rounded-lg border bg-white px-4 py-3.5 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${errors.password ? 'border-red-500' : 'border-slate-200'}`}
                                />
                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                            </motion.div>

                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none">
                                    Remember Me
                                </label>
                            </div>
                            <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline uppercase tracking-wide focus:outline-none">
                                Forgot Password?
                            </button>
                        </motion.div>

                        {error && (
                            <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="text-sm text-red-500 font-medium bg-red-50 p-3 rounded-md border border-red-100"
                            >
                                {error}
                            </motion.p>
                        )}

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                data-testid="login-submit"
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:bg-none hover:bg-white hover:text-blue-600 hover:border hover:border-blue-600 hover:shadow-blue-500/50 py-4 rounded-xl font-bold uppercase tracking-widest transition-all text-sm"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authenticating...
                                    </span>
                                ) : "Sign In"}
                            </Button>
                        </motion.div>
                    </form>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-center mt-6 pt-6 border-t border-gray-100"
                    >
                        <p className="text-xs text-slate-400 font-medium">
                            Don't have an account? <Link to="/register" className="font-bold text-blue-600 hover:underline hover:text-blue-700 transition-colors">Create Account</Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div >

            <Modal
                isOpen={showForgotPassword}
                onClose={() => setShowForgotPassword(false)}
                title="Reset Password"
                className="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:border-blue-300"
                            placeholder="name@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={() => setShowForgotPassword(false)}>Cancel</Button>
                    <Button onClick={handleForgotPasswordSubmit}>Send Reset Link</Button>
                </div>
            </Modal>
        </div >
    );
}
