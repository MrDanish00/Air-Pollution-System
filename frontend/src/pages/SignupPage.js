import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const SignupPage = ({ onSwitchToLogin, onBack }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // We'll auto-login after signup if possible

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/auth/registration/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password1: formData.password,
                    password2: formData.confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Success - show beautiful message
                setError('');
                setSuccess(true);

                // Redirect after delay
                setTimeout(() => {
                    onSwitchToLogin();
                }, 2000);
            } else {
                // Parse error object for display
                let errorMsg = 'Registration failed.';
                if (typeof data === 'object') {
                    // Extract values and join
                    const messages = Object.entries(data).map(([key, value]) => {
                        const fieldName = key === 'password1' ? 'Password' : key.charAt(0).toUpperCase() + key.slice(1);
                        const valErrors = Array.isArray(value) ? value.join(' ') : value;
                        return `${fieldName}: ${valErrors}`;
                    });
                    errorMsg = messages.join('\n');
                }
                setError(errorMsg);
            }
        } catch (err) {
            console.error('Signup Error:', err);
            setError(err.message === 'Failed to fetch' ? 'Unable to connect to server. Is backend running?' : 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                        Your account has been created successfully.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-blue-600 animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Redirecting to login...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg dark:bg-gray-800 relative">
                <button
                    onClick={onBack}
                    className="absolute left-6 top-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title="Back to Home"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2 pt-2">Create Account</h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Join to track air quality</p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-6 text-sm whitespace-pre-line">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="johndoe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 mt-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="text-blue-600 hover:text-blue-500 font-medium">
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
