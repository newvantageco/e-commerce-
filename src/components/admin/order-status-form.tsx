'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Truck } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  orderId: string
  currentStatus: string
  trackingNumber: string
  trackingUrl: string
}

const statuses = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function OrderStatusForm({
  orderId,
  currentStatus,
  trackingNumber: initialTracking,
  trackingUrl: initialTrackingUrl,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [trackingNumber, setTrackingNumber] = useState(initialTracking)
  const [trackingUrl, setTrackingUrl] = useState(initialTrackingUrl)
  const [isUpdating, setIsUpdating] = useState(false)

  async function handleUpdate() {
    setIsUpdating(true)

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || null,
          trackingUrl: trackingUrl || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order')
      }

      toast.success('Order updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-900">Update Order</h2>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <label className="label mb-1.5 block">Order Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {(status === 'SHIPPED' || status === 'DELIVERED') && (
          <>
            <div>
              <label className="label mb-1.5 block">Tracking Number</label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label mb-1.5 block">Tracking URL</label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </div>
          </>
        )}

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="btn-primary w-full"
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Update Order'
          )}
        </button>
      </div>
    </div>
  )
}
