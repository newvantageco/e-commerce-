'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, User, Lock, Bell, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile')

  // Profile form
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  })
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false)

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdatingProfile(true)

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setUser(data.data)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsUpdatingPassword(true)

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  async function handleUpdateNotifications() {
    setIsUpdatingNotifications(true)

    try {
      const response = await fetch('/api/auth/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      })

      if (!response.ok) {
        throw new Error('Failed to update notification preferences')
      }

      toast.success('Notification preferences updated')
    } catch (error) {
      toast.error('Failed to update notification preferences')
    } finally {
      setIsUpdatingNotifications(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/account" className="hover:text-gray-700">
            Account
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Settings</span>
        </nav>

        <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">
          Account Settings
        </h1>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1.5 block">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <button type="submit" disabled={isUpdatingProfile} className="btn-primary">
                  {isUpdatingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="label mb-1.5 block">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={8}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters
                  </p>
                </div>
                <div>
                  <label className="label mb-1.5 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    className="input"
                  />
                </div>
                <button type="submit" disabled={isUpdatingPassword} className="btn-primary">
                  {isUpdatingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 max-w-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Order Updates</p>
                      <p className="text-sm text-gray-500">
                        Get notified about order status changes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.orderUpdates}
                        onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Promotions</p>
                      <p className="text-sm text-gray-500">
                        Receive exclusive deals and offers
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.promotions}
                        onChange={(e) => setNotifications({ ...notifications, promotions: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Newsletter</p>
                      <p className="text-sm text-gray-500">
                        Weekly updates about new products
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.newsletter}
                        onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleUpdateNotifications}
                  disabled={isUpdatingNotifications}
                  className="btn-primary"
                >
                  {isUpdatingNotifications ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save Preferences'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
