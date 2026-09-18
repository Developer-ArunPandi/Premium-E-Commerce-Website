import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Edit, Save, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone || '' },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await api.patch('/auth/update-me', data);
      updateUser(res.data.data.user);
      setEditing(false);
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-neutral-900">Personal Information</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-outline btn-sm">
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input {...register('firstName', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })} className={`input ${errors.firstName ? 'input-error' : ''}`} />
                {errors.firstName && <p className="error-text">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input {...register('lastName', { required: 'Required', minLength: { value: 2, message: 'Min 2 chars' } })} className={`input ${errors.lastName ? 'input-error' : ''}`} />
                {errors.lastName && <p className="error-text">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="label">Phone <span className="text-neutral-400 font-normal">(optional)</span></label>
              <input {...register('phone')} type="tel" placeholder="+91 98765 43210" className="input" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => { setEditing(false); reset(); }} className="btn-outline">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'First Name', value: user?.firstName },
              { label: 'Last Name', value: user?.lastName },
              { label: 'Email', value: user?.email, full: true },
              { label: 'Phone', value: user?.phone || 'Not added' },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '' },
              { label: 'Account Type', value: user?.role === 'admin' ? 'Administrator' : 'Customer' },
            ].map(({ label, value, full }) => (
              <div key={label} className={full ? 'col-span-2' : ''}>
                <p className="text-xs text-neutral-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-neutral-800">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password */}
      <ChangePasswordSection />
    </div>
  );
}

function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();
  const password = watch('newPassword', '');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.patch('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully');
      setOpen(false);
      reset();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-neutral-900">Security</h2>
        <button onClick={() => setOpen(!open)} className="btn-outline btn-sm">
          {open ? 'Cancel' : 'Change Password'}
        </button>
      </div>

      {open ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input {...register('currentPassword', { required: 'Required' })} type="password" placeholder="••••••••" className={`input ${errors.currentPassword ? 'input-error' : ''}`} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input {...register('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} type="password" placeholder="••••••••" className={`input ${errors.newPassword ? 'input-error' : ''}`} />
            {errors.newPassword && <p className="error-text">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input {...register('confirmPassword', { validate: (v) => v === password || "Passwords don't match" })} type="password" placeholder="••••••••" className={`input ${errors.confirmPassword ? 'input-error' : ''}`} />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-neutral-500">Your password is encrypted and secure. You can change it anytime.</p>
      )}
    </div>
  );
}
