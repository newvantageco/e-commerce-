'use client'

/**
 * OpticaScan™ Prescription Form Component
 *
 * Allows users to enter and validate their prescription data.
 */

import { useState } from 'react'
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  Save,
  FileText,
} from 'lucide-react'

interface PrescriptionValues {
  odSphere: number | null
  odCylinder: number | null
  odAxis: number | null
  odAdd: number | null
  osSphere: number | null
  osCylinder: number | null
  osAxis: number | null
  osAdd: number | null
  pdSingle: number | null
  pdRight: number | null
  pdLeft: number | null
}

interface PrescriptionMetadata {
  prescribedDate?: string
  prescriberName?: string
  clinicName?: string
}

interface ValidationResult {
  isValid: boolean
  warnings: string[]
}

interface PrescriptionFormProps {
  onSave?: (values: PrescriptionValues, metadata: PrescriptionMetadata) => void
  initialValues?: Partial<PrescriptionValues>
  showMetadata?: boolean
}

const SPHERE_OPTIONS = Array.from({ length: 161 }, (_, i) => {
  const value = (i - 80) * 0.25
  return { value, label: value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2) }
})

const CYLINDER_OPTIONS = Array.from({ length: 49 }, (_, i) => {
  const value = (i - 24) * 0.25
  return { value, label: value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2) }
})

const AXIS_OPTIONS = Array.from({ length: 180 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}°`,
}))

const ADD_OPTIONS = Array.from({ length: 14 }, (_, i) => {
  const value = 0.75 + i * 0.25
  return { value, label: `+${value.toFixed(2)}` }
})

export default function PrescriptionForm({
  onSave,
  initialValues,
  showMetadata = true,
}: PrescriptionFormProps) {
  const [values, setValues] = useState<PrescriptionValues>({
    odSphere: initialValues?.odSphere ?? null,
    odCylinder: initialValues?.odCylinder ?? null,
    odAxis: initialValues?.odAxis ?? null,
    odAdd: initialValues?.odAdd ?? null,
    osSphere: initialValues?.osSphere ?? null,
    osCylinder: initialValues?.osCylinder ?? null,
    osAxis: initialValues?.osAxis ?? null,
    osAdd: initialValues?.osAdd ?? null,
    pdSingle: initialValues?.pdSingle ?? null,
    pdRight: initialValues?.pdRight ?? null,
    pdLeft: initialValues?.pdLeft ?? null,
  })

  const [metadata, setMetadata] = useState<PrescriptionMetadata>({})
  const [useSplitPD, setUseSplitPD] = useState(false)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleValueChange = (field: keyof PrescriptionValues, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setValues(prev => ({ ...prev, [field]: numValue }))
    setSaved(false)
  }

  const validatePrescription = (): ValidationResult => {
    const warnings: string[] = []

    // Check cylinder requires axis
    if (values.odCylinder !== null && values.odCylinder !== 0 && values.odAxis === null) {
      warnings.push('Right eye: Axis is required when cylinder is specified')
    }
    if (values.osCylinder !== null && values.osCylinder !== 0 && values.osAxis === null) {
      warnings.push('Left eye: Axis is required when cylinder is specified')
    }

    // Check ADD power consistency
    if (values.odAdd !== null && values.osAdd !== null && values.odAdd !== values.osAdd) {
      warnings.push('ADD power is typically the same for both eyes')
    }

    // Check for large difference between eyes
    if (values.odSphere !== null && values.osSphere !== null) {
      const diff = Math.abs(values.odSphere - values.osSphere)
      if (diff > 3) {
        warnings.push(`Large sphere difference (${diff.toFixed(2)}D) between eyes - please verify`)
      }
    }

    // PD validation
    if (!useSplitPD && values.pdSingle !== null) {
      if (values.pdSingle < 50 || values.pdSingle > 80) {
        warnings.push('PD is outside typical adult range (50-80mm)')
      }
    }

    const isValid = !warnings.some(w =>
      w.includes('required') || w.includes('Required')
    )

    return { isValid, warnings }
  }

  const handleSave = async () => {
    const result = validatePrescription()
    setValidation(result)

    if (!result.isValid) return

    setSaving(true)

    try {
      const response = await fetch('/api/optica/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values,
          metadata: showMetadata ? metadata : undefined,
          sourceType: 'MANUAL',
          consentGiven: true,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save prescription')
      }

      setSaved(true)
      onSave?.(values, metadata)
    } catch (error) {
      console.error('Error saving prescription:', error)
      setValidation({
        isValid: false,
        warnings: [error instanceof Error ? error.message : 'Failed to save prescription'],
      })
    } finally {
      setSaving(false)
    }
  }

  const renderValueSelect = (
    field: keyof PrescriptionValues,
    options: { value: number; label: string }[],
    placeholder: string
  ) => (
    <select
      value={values[field] ?? ''}
      onChange={(e) => handleValueChange(field, e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Enter Your Prescription</h2>
          <p className="text-sm text-gray-500">
            Refer to your prescription from your eye doctor
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-xl mb-6">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>OD</strong> = Right Eye (Oculus Dexter) | <strong>OS</strong> = Left Eye (Oculus Sinister)
          <br />
          <strong>SPH</strong> = Sphere | <strong>CYL</strong> = Cylinder | <strong>AXIS</strong> = Axis direction
        </div>
      </div>

      {/* Prescription Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Eye</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">SPH (Sphere)</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">CYL (Cylinder)</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">AXIS</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">ADD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Right Eye (OD) */}
            <tr>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">OD (Right)</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {renderValueSelect('odSphere', SPHERE_OPTIONS, 'Select')}
              </td>
              <td className="px-4 py-3">
                {renderValueSelect('odCylinder', CYLINDER_OPTIONS, 'Select')}
              </td>
              <td className="px-4 py-3">
                {renderValueSelect('odAxis', AXIS_OPTIONS, 'Select')}
              </td>
              <td className="px-4 py-3">
                {renderValueSelect('odAdd', ADD_OPTIONS, 'None')}
              </td>
            </tr>

            {/* Left Eye (OS) */}
            <tr>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-500" />
                  <span className="font-medium">OS (Left)</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {renderValueSelect('osSphere', SPHERE_OPTIONS, 'Select')}
              </td>
              <td className="px-4 py-3">
                {renderValueSelect('osCylinder', CYLINDER_OPTIONS, 'Select')}
              </td>
              <td className="px-4 py-3">
                {renderValueSelect('osAxis', AXIS_OPTIONS, 'Select')}
              </td>
              <td className="px-4 py-3">
                {renderValueSelect('osAdd', ADD_OPTIONS, 'None')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PD Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Pupillary Distance (PD)</h3>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useSplitPD}
              onChange={(e) => setUseSplitPD(e.target.checked)}
              className="rounded text-blue-500 focus:ring-blue-500"
            />
            I have separate PD for each eye
          </label>
        </div>

        {useSplitPD ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Right Eye PD (mm)</label>
              <input
                type="number"
                value={values.pdRight ?? ''}
                onChange={(e) => handleValueChange('pdRight', e.target.value)}
                placeholder="e.g., 31"
                step="0.5"
                min="25"
                max="40"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Left Eye PD (mm)</label>
              <input
                type="number"
                value={values.pdLeft ?? ''}
                onChange={(e) => handleValueChange('pdLeft', e.target.value)}
                placeholder="e.g., 31"
                step="0.5"
                min="25"
                max="40"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-gray-600 mb-1">Single PD (mm)</label>
            <input
              type="number"
              value={values.pdSingle ?? ''}
              onChange={(e) => handleValueChange('pdSingle', e.target.value)}
              placeholder="e.g., 62"
              step="0.5"
              min="50"
              max="80"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Metadata Section */}
      {showMetadata && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <h3 className="font-medium mb-4">Prescription Details (Optional)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date Prescribed</label>
              <input
                type="date"
                value={metadata.prescribedDate || ''}
                onChange={(e) => setMetadata(prev => ({ ...prev, prescribedDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Doctor/Optometrist Name</label>
              <input
                type="text"
                value={metadata.prescriberName || ''}
                onChange={(e) => setMetadata(prev => ({ ...prev, prescriberName: e.target.value }))}
                placeholder="Dr. Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Clinic/Office Name</label>
              <input
                type="text"
                value={metadata.clinicName || ''}
                onChange={(e) => setMetadata(prev => ({ ...prev, clinicName: e.target.value }))}
                placeholder="Vision Care Center"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {validation && (
        <div className={`p-4 rounded-xl mb-6 ${validation.isValid ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {validation.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            <span className={`font-medium ${validation.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
              {validation.isValid ? 'Prescription looks good!' : 'Please review the following:'}
            </span>
          </div>
          {validation.warnings.length > 0 && (
            <ul className={`text-sm space-y-1 ${validation.isValid ? 'text-green-600' : 'text-yellow-600'}`}>
              {validation.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setValidation(validatePrescription())}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Validate
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Prescription
            </>
          )}
        </button>
      </div>
    </div>
  )
}
