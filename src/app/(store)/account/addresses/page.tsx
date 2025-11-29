'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, MapPin, Plus, Pencil, Trash2, Loader2, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

interface Address {
  id: string
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  isDefault: boolean
}

export default function AddressesPage() {
  const { user } = useAuthStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    phone: '',
    isDefault: false,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchAddresses()
  }, [user])

  async function fetchAddresses() {
    try {
      const response = await fetch('/api/addresses')
      const data = await response.json()
      if (data.data) {
        setAddresses(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleEdit(address: Address) {
    setEditingAddress(address)
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault,
    })
    setShowForm(true)
  }

  function handleAddNew() {
    setEditingAddress(null)
    setFormData({
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      phone: '',
      isDefault: addresses.length === 0,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingAddress
        ? `/api/addresses/${editingAddress.id}`
        : '/api/addresses'
      const method = editingAddress ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save address')
      }

      toast.success(editingAddress ? 'Address updated' : 'Address added')
      setShowForm(false)
      setEditingAddress(null)
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to save address')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(addressId: string) {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete address')
      }

      toast.success('Address deleted')
      fetchAddresses()
    } catch (error) {
      toast.error('Failed to delete address')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/account" className="hover:text-gray-700">
            Account
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Addresses</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Your Addresses
          </h1>
          {!showForm && (
            <button onClick={handleAddNew} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </button>
          )}
        </div>

        {showForm ? (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label mb-1.5 block">Company (Optional)</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label mb-1.5 block">Address Line 1</label>
                <input
                  type="text"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="label mb-1.5 block">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label mb-1.5 block">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">State / Province</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    required
                    className="input"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input"
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Australia</option>
                  </select>
                </div>
                <div>
                  <label className="label mb-1.5 block">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingAddress ? (
                    'Update Address'
                  ) : (
                    'Add Address'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingAddress(null)
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white rounded-xl border shadow-sm p-6 relative"
              >
                {address.isDefault && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Default
                  </span>
                )}
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {address.firstName} {address.lastName}
                    </p>
                    {address.company && (
                      <p className="text-sm text-gray-500">{address.company}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {address.address1}
                      {address.address2 && <>, {address.address2}</>}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                      <br />
                      {address.country}
                    </p>
                    {address.phone && (
                      <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No addresses saved
            </h2>
            <p className="text-gray-500 mb-6">
              Add an address for faster checkout.
            </p>
            <button onClick={handleAddNew} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
