import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Bell, Trash2, Loader2, LogOut, CheckCircle, X, Shield, Settings, Save, Edit2, ArrowLeft } from 'lucide-react';

const ProfilePage = ({ onBack }) => {
    const { user, login, logout } = useAuth(); // login needed for re-auth if password changes (optional) or refreshes
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
    const [cityToUnsubscribe, setCityToUnsubscribe] = useState(null);

    // Form States
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        phone_number: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    // Preferences
    const [preferences, setPreferences] = useState({
        receive_email_alerts: true
    });

    useEffect(() => {
        if (user) {
            fetchSubscriptions();
            fetchProfileDetails();
        }
    }, [user]);

    const fetchSubscriptions = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8000/api/auth/subscriptions/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setSubscriptions(await response.json());
            }
        } catch (err) {
            setError('Failed to load subscriptions');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileDetails = async () => {
        const token = localStorage.getItem('token');
        try {
            // Get basic user info + extended profile
            const [userRes, profileRes] = await Promise.all([
                fetch('http://localhost:8000/api/auth/user/', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:8000/api/auth/profile/', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (userRes.ok && profileRes.ok) {
                const userData = await userRes.json();
                const profileData = await profileRes.json();

                setProfileForm({
                    first_name: userData.first_name || '',
                    last_name: userData.last_name || '',
                    phone_number: profileData.phone_number || ''
                });
                setPreferences({
                    receive_email_alerts: profileData.receive_email_alerts
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const confirmUnsubscribe = (cityName) => {
        setCityToUnsubscribe(cityName);
        setShowUnsubscribeModal(true);
    };

    const performUnsubscribe = async () => {
        if (!cityToUnsubscribe) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:8000/api/auth/subscriptions/?city=${cityToUnsubscribe}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setSubscriptions(subscriptions.filter(sub => sub.city_name !== cityToUnsubscribe));
            }
        } catch (err) {
            alert('Failed to unsubscribe. Please try again.');
        } finally {
            setShowUnsubscribeModal(false);
            setCityToUnsubscribe(null);
        }
    };

    const handleSignOut = () => {
        setIsSigningOut(true);
        setTimeout(() => {
            logout();
            window.location.reload();
        }, 1500);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            // Update User model (First/Last Name)
            await fetch('http://localhost:8000/api/auth/user/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: profileForm.first_name,
                    last_name: profileForm.last_name
                })
            });

            // Update UserProfile model (Phone)
            await fetch('http://localhost:8000/api/auth/profile/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone_number: profileForm.phone_number
                })
            });

            alert('Profile updated successfully!');
            setShowEditProfileModal(false);
            window.location.reload();
        } catch (err) {
            alert('Failed to update profile.');
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            alert("New passwords don't match");
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:8000/api/auth/password/change/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    old_password: passwordForm.old_password,
                    new_password: passwordForm.new_password1 || passwordForm.new_password // dj-rest-auth uses new_password1
                })
            });

            if (response.ok) {
                alert('Password changed successfully. Please login again.');
                logout();
                window.location.reload();
            } else {
                const data = await response.json();
                alert(JSON.stringify(data));
            }
        } catch (err) {
            alert('Failed to change password');
        }
    };

    const toggleEmailAlerts = async () => {
        const newValue = !preferences.receive_email_alerts;
        setPreferences({ ...preferences, receive_email_alerts: newValue });

        const token = localStorage.getItem('token');
        try {
            await fetch('http://localhost:8000/api/auth/profile/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receive_email_alerts: newValue
                })
            });
        } catch (err) {
            console.error("Failed to update preferences");
            // Revert on failure
            setPreferences({ ...preferences, receive_email_alerts: !newValue });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Good': return 'bg-green-100 text-green-800';
            case 'Moderate': return 'bg-yellow-100 text-yellow-800';
            case 'Unhealthy': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    return (
        <div className="max-w-6xl mx-auto p-6 relative">

            {/* --- Modals --- */}

            {/* Sign Out Modal */}
            {showSignOutModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        {!isSigningOut ? (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <LogOut className="w-8 h-8 text-red-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign Out</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Are you sure you want to sign out?</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setShowSignOutModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Cancel</button>
                                    <button onClick={handleSignOut} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Sign Out</button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-600" /></div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Signed Out</h3>
                                <div className="flex items-center justify-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /><span>Redirecting...</span></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditProfileModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h3>
                            <button onClick={() => setShowEditProfileModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                    <input type="text" value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                    <input type="text" value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                <input type="tel" value={profileForm.phone_number} onChange={e => setProfileForm({ ...profileForm, phone_number: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="+1234567890" />
                            </div>
                            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h3>
                            <button onClick={() => setShowChangePasswordModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                                <input type="password" value={passwordForm.old_password} onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })} required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                <input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                                <input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} required className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Password</button>
                        </form>
                    </div>
                </div>
            )}
            {/* Unsubscribe Confirmation Modal */}
            {showUnsubscribeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bell className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unsubscribe?</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Stop receiving alerts for <span className="font-semibold text-gray-800 dark:text-gray-200">{cityToUnsubscribe}</span>?
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowUnsubscribeModal(false)}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={performUnsubscribe}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Unsubscribe
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* --- Main Content --- */}

            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Account</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: User Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {profileForm.first_name ? `${profileForm.first_name} ${profileForm.last_name}` : user?.username}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{user?.email}</p>

                        <div className="flex gap-2 justify-center">
                            <button onClick={() => setShowEditProfileModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => setShowSignOutModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            Contact Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <span className="text-sm">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <span className="text-sm">{profileForm.phone_number || 'No phone number added'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings & Subscriptions */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Security & Preferences */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-blue-500" /> Settings
                        </h3>

                        <div className="space-y-6">
                            {/* Password */}
                            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-700">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-gray-500" /> Password
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last changed: Never</p>
                                </div>
                                <button onClick={() => setShowChangePasswordModal(true)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">Change Password</button>
                            </div>

                            {/* Notifications */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-gray-500" /> Email Notifications
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receive alerts for your subscribed cities</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={preferences.receive_email_alerts} onChange={toggleEmailAlerts} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Subscriptions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-green-500" />
                                My Subscriptions
                            </h3>
                            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">{subscriptions.length} Cities</span>
                        </div>

                        {subscriptions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-750 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>You haven't subscribed to any cities yet.</p>
                                <p className="text-sm mt-2">Go to the map or dashboard to subscribe.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {subscriptions.map((sub) => (
                                    <div key={sub.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{sub.city_name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(sub.status)}`}>
                                                        {sub.status || 'Unknown'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">AQI: {sub.aqi || '--'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => confirmUnsubscribe(sub.city_name)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Unsubscribe"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
