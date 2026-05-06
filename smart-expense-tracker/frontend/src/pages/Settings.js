import React, { useState, useEffect } from 'react';
import { MdPerson, MdLock, MdCategory, MdAdd, MdDelete } from 'react-icons/md';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input, { Select } from '../components/UI/Input';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import './Settings.css';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'BRL', 'MXN', 'CHF'];

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [categories, setCategories] = useState([]);
  const [showCatModal, setShowCatModal] = useState(false);

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name || '',
    currency: user?.currency || 'INR',
    monthlyBudget: user?.monthlyBudget || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Category form
  const [catForm, setCatForm] = useState({ name: '', type: 'expense', icon: '📦', color: '#6366f1' });
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, currency: user.currency || 'INR', monthlyBudget: user.monthlyBudget || '' });
    }
  }, [user]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories);
      } catch {}
    };
    fetchCategories();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', profile);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwords.currentPassword) errs.currentPassword = 'Current password is required';
    if (!passwords.newPassword || passwords.newPassword.length < 6) errs.newPassword = 'Min. 6 characters';
    if (passwords.newPassword !== passwords.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }

    setPasswordLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) { toast.error('Category name is required'); return; }

    setCatLoading(true);
    try {
      const res = await api.post('/categories', catForm);
      setCategories([...categories, res.data.category]);
      toast.success('Category added');
      setShowCatModal(false);
      setCatForm({ name: '', type: 'expense', icon: '📦', color: '#6366f1' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter((c) => c._id !== id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: MdPerson },
    { id: 'security', label: 'Security', icon: MdLock },
    { id: 'categories', label: 'Categories', icon: MdCategory }
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Tabs */}
        <nav className="settings-tabs" aria-label="Settings sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`settings-tab ${activeTab === id ? 'settings-tab--active' : ''}`}
              onClick={() => setActiveTab(id)}
              aria-selected={activeTab === id}
              role="tab"
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="settings-content" role="tabpanel">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2 className="settings-section__title">Profile Settings</h2>
              <p className="settings-section__desc">Update your personal information and preferences</p>

              <form onSubmit={handleProfileSave} className="settings-form" noValidate>
                <div className="settings-avatar-row">
                  <div className="settings-avatar" aria-hidden="true">
                    {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="settings-avatar__name">{user?.name}</p>
                    <p className="settings-avatar__email">{user?.email}</p>
                  </div>
                </div>

                <Input
                  label="Full Name"
                  id="settings-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />

                <div className="input-group">
                  <label className="input-label" htmlFor="settings-email">Email Address</label>
                  <input
                    id="settings-email"
                    type="email"
                    className="input-field"
                    value={user?.email || ''}
                    disabled
                    aria-describedby="email-note"
                  />
                  <p id="email-note" className="settings-note">Email cannot be changed</p>
                </div>

                <Select
                  label="Currency"
                  id="settings-currency"
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>

                <Input
                  label="Monthly Budget Goal"
                  id="settings-budget"
                  type="number"
                  value={profile.monthlyBudget}
                  onChange={(e) => setProfile({ ...profile, monthlyBudget: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />

                <Button type="submit" loading={profileLoading}>
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2 className="settings-section__title">Security</h2>
              <p className="settings-section__desc">Change your password to keep your account secure</p>

              <form onSubmit={handlePasswordChange} className="settings-form" noValidate>
                <Input
                  label="Current Password"
                  id="current-password"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, currentPassword: e.target.value });
                    setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                  }}
                  error={passwordErrors.currentPassword}
                  required
                  autoComplete="current-password"
                />

                <Input
                  label="New Password"
                  id="new-password"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, newPassword: e.target.value });
                    setPasswordErrors({ ...passwordErrors, newPassword: '' });
                  }}
                  error={passwordErrors.newPassword}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                />

                <Input
                  label="Confirm New Password"
                  id="confirm-password"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, confirmPassword: e.target.value });
                    setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                  }}
                  error={passwordErrors.confirmPassword}
                  required
                  autoComplete="new-password"
                />

                <Button type="submit" loading={passwordLoading}>
                  Change Password
                </Button>
              </form>
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="settings-section">
              <div className="settings-section__header">
                <div>
                  <h2 className="settings-section__title">Categories</h2>
                  <p className="settings-section__desc">Manage your transaction categories</p>
                </div>
                <Button size="sm" onClick={() => setShowCatModal(true)}>
                  <MdAdd aria-hidden="true" /> Add Category
                </Button>
              </div>

              <div className="categories-list">
                {categories.map((cat) => (
                  <div key={cat._id} className="category-item">
                    <div className="category-item__left">
                      <span
                        className="category-item__icon"
                        style={{ background: cat.color + '22' }}
                        aria-hidden="true"
                      >
                        {cat.icon}
                      </span>
                      <div>
                        <p className="category-item__name">{cat.name}</p>
                        <p className="category-item__type">{cat.type}</p>
                      </div>
                    </div>
                    {!cat.isDefault && (
                      <button
                        className="category-item__delete"
                        onClick={() => handleDeleteCategory(cat._id)}
                        aria-label={`Delete ${cat.name} category`}
                      >
                        <MdDelete />
                      </button>
                    )}
                    {cat.isDefault && (
                      <span className="category-item__default">Default</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Add Category" size="sm">
        <form onSubmit={handleAddCategory} className="settings-form" noValidate>
          <Input
            label="Category Name"
            id="cat-name"
            type="text"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            placeholder="e.g. Gym, Subscriptions"
            required
          />

          <Select
            label="Type"
            id="cat-type"
            value={catForm.type}
            onChange={(e) => setCatForm({ ...catForm, type: e.target.value })}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="both">Both</option>
          </Select>

          <Input
            label="Icon (emoji)"
            id="cat-icon"
            type="text"
            value={catForm.icon}
            onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
            placeholder="📦"
            maxLength={4}
          />

          <div className="input-group">
            <label className="input-label" htmlFor="cat-color">Color</label>
            <div className="color-picker-row">
              <input
                id="cat-color"
                type="color"
                className="color-picker"
                value={catForm.color}
                onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                aria-label="Category color"
              />
              <span className="color-picker-value">{catForm.color}</span>
            </div>
          </div>

          <div className="budget-form__actions">
            <Button type="button" variant="secondary" onClick={() => setShowCatModal(false)}>Cancel</Button>
            <Button type="submit" loading={catLoading}>Add Category</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
