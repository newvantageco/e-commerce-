/**
 * OpticaScan™ - Prescription Verification Engine
 *
 * Validates, parses, and verifies optical prescriptions.
 * Includes OCR simulation structure and comprehensive validation rules
 * based on optical physics and industry standards.
 */

import { PrescriptionStatus } from '@prisma/client'

// ==================== Types ====================

export interface PrescriptionValues {
  // Right Eye (OD - Oculus Dexter)
  odSphere?: number | null     // -20.00 to +20.00
  odCylinder?: number | null   // -6.00 to +6.00
  odAxis?: number | null       // 1 to 180
  odAdd?: number | null        // +0.75 to +4.00
  odPrism?: number | null
  odPrismDirection?: string | null  // BU, BD, BI, BO

  // Left Eye (OS - Oculus Sinister)
  osSphere?: number | null
  osCylinder?: number | null
  osAxis?: number | null
  osAdd?: number | null
  osPrism?: number | null
  osPrismDirection?: string | null

  // Pupillary Distance
  pdSingle?: number | null     // Single PD (54-74mm typical)
  pdRight?: number | null      // Monocular PD right
  pdLeft?: number | null       // Monocular PD left
}

export interface PrescriptionMetadata {
  prescribedDate?: Date | null
  expirationDate?: Date | null
  prescriberName?: string | null
  prescriberLicense?: string | null
  prescriberPhone?: string | null
  clinicName?: string | null
  clinicAddress?: string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  correctedValues?: Partial<PrescriptionValues>
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

export interface OCRExtractionResult {
  success: boolean
  confidence: number
  values: PrescriptionValues
  metadata: PrescriptionMetadata
  rawText?: string
  fieldConfidences: Record<string, number>
}

// ==================== Validation Constants ====================

const VALIDATION_RULES = {
  // Sphere limits (diopters)
  SPHERE_MIN: -20.00,
  SPHERE_MAX: 20.00,
  SPHERE_STEP: 0.25,

  // Cylinder limits (diopters)
  CYLINDER_MIN: -6.00,
  CYLINDER_MAX: 6.00,
  CYLINDER_STEP: 0.25,

  // Axis limits (degrees)
  AXIS_MIN: 1,
  AXIS_MAX: 180,

  // Add power limits (for bifocals/progressives)
  ADD_MIN: 0.75,
  ADD_MAX: 4.00,
  ADD_STEP: 0.25,

  // PD limits (mm)
  PD_MIN: 50,
  PD_MAX: 80,
  PD_MONOCULAR_MIN: 25,
  PD_MONOCULAR_MAX: 40,

  // Prism limits (prism diopters)
  PRISM_MAX: 10,

  // Prescription validity (years)
  PRESCRIPTION_VALIDITY_YEARS: 2,

  // Cross-eye difference warnings
  SPHERE_DIFF_WARNING: 3.00,
  CYLINDER_DIFF_WARNING: 2.00,
}

// ==================== Prescription Validation ====================

/**
 * Comprehensive prescription validation
 * Checks optical physics rules and industry standards
 */
export function validatePrescription(values: PrescriptionValues): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const correctedValues: Partial<PrescriptionValues> = {}

  // ===== Sphere Validation =====

  if (values.odSphere !== undefined && values.odSphere !== null) {
    if (values.odSphere < VALIDATION_RULES.SPHERE_MIN || values.odSphere > VALIDATION_RULES.SPHERE_MAX) {
      errors.push({
        field: 'odSphere',
        message: `Right eye sphere must be between ${VALIDATION_RULES.SPHERE_MIN} and +${VALIDATION_RULES.SPHERE_MAX}`,
        code: 'SPHERE_OUT_OF_RANGE',
      })
    }
    // Check for standard step values
    if (!isValidStep(values.odSphere, VALIDATION_RULES.SPHERE_STEP)) {
      const corrected = roundToStep(values.odSphere, VALIDATION_RULES.SPHERE_STEP)
      correctedValues.odSphere = corrected
      warnings.push({
        field: 'odSphere',
        message: `Sphere values typically come in ${VALIDATION_RULES.SPHERE_STEP} increments. Suggested: ${corrected}`,
        code: 'SPHERE_STEP_WARNING',
      })
    }
  }

  if (values.osSphere !== undefined && values.osSphere !== null) {
    if (values.osSphere < VALIDATION_RULES.SPHERE_MIN || values.osSphere > VALIDATION_RULES.SPHERE_MAX) {
      errors.push({
        field: 'osSphere',
        message: `Left eye sphere must be between ${VALIDATION_RULES.SPHERE_MIN} and +${VALIDATION_RULES.SPHERE_MAX}`,
        code: 'SPHERE_OUT_OF_RANGE',
      })
    }
    if (!isValidStep(values.osSphere, VALIDATION_RULES.SPHERE_STEP)) {
      const corrected = roundToStep(values.osSphere, VALIDATION_RULES.SPHERE_STEP)
      correctedValues.osSphere = corrected
      warnings.push({
        field: 'osSphere',
        message: `Sphere values typically come in ${VALIDATION_RULES.SPHERE_STEP} increments. Suggested: ${corrected}`,
        code: 'SPHERE_STEP_WARNING',
      })
    }
  }

  // ===== Cylinder Validation =====

  if (values.odCylinder !== undefined && values.odCylinder !== null) {
    if (values.odCylinder < VALIDATION_RULES.CYLINDER_MIN || values.odCylinder > VALIDATION_RULES.CYLINDER_MAX) {
      errors.push({
        field: 'odCylinder',
        message: `Right eye cylinder must be between ${VALIDATION_RULES.CYLINDER_MIN} and +${VALIDATION_RULES.CYLINDER_MAX}`,
        code: 'CYLINDER_OUT_OF_RANGE',
      })
    }

    // CRITICAL: If cylinder exists, axis MUST exist
    if (values.odAxis === undefined || values.odAxis === null) {
      errors.push({
        field: 'odAxis',
        message: 'Axis is required when cylinder is specified (right eye)',
        code: 'AXIS_REQUIRED',
      })
    }
  }

  if (values.osCylinder !== undefined && values.osCylinder !== null) {
    if (values.osCylinder < VALIDATION_RULES.CYLINDER_MIN || values.osCylinder > VALIDATION_RULES.CYLINDER_MAX) {
      errors.push({
        field: 'osCylinder',
        message: `Left eye cylinder must be between ${VALIDATION_RULES.CYLINDER_MIN} and +${VALIDATION_RULES.CYLINDER_MAX}`,
        code: 'CYLINDER_OUT_OF_RANGE',
      })
    }

    if (values.osAxis === undefined || values.osAxis === null) {
      errors.push({
        field: 'osAxis',
        message: 'Axis is required when cylinder is specified (left eye)',
        code: 'AXIS_REQUIRED',
      })
    }
  }

  // ===== Axis Validation =====

  if (values.odAxis !== undefined && values.odAxis !== null) {
    if (values.odAxis < VALIDATION_RULES.AXIS_MIN || values.odAxis > VALIDATION_RULES.AXIS_MAX) {
      errors.push({
        field: 'odAxis',
        message: `Right eye axis must be between ${VALIDATION_RULES.AXIS_MIN} and ${VALIDATION_RULES.AXIS_MAX}`,
        code: 'AXIS_OUT_OF_RANGE',
      })
    }

    // Axis without cylinder is meaningless
    if (values.odCylinder === undefined || values.odCylinder === null || values.odCylinder === 0) {
      warnings.push({
        field: 'odAxis',
        message: 'Axis is only meaningful when cylinder is specified',
        code: 'AXIS_WITHOUT_CYLINDER',
      })
    }

    // Must be integer
    if (!Number.isInteger(values.odAxis)) {
      errors.push({
        field: 'odAxis',
        message: 'Axis must be a whole number',
        code: 'AXIS_NOT_INTEGER',
      })
    }
  }

  if (values.osAxis !== undefined && values.osAxis !== null) {
    if (values.osAxis < VALIDATION_RULES.AXIS_MIN || values.osAxis > VALIDATION_RULES.AXIS_MAX) {
      errors.push({
        field: 'osAxis',
        message: `Left eye axis must be between ${VALIDATION_RULES.AXIS_MIN} and ${VALIDATION_RULES.AXIS_MAX}`,
        code: 'AXIS_OUT_OF_RANGE',
      })
    }

    if (values.osCylinder === undefined || values.osCylinder === null || values.osCylinder === 0) {
      warnings.push({
        field: 'osAxis',
        message: 'Axis is only meaningful when cylinder is specified',
        code: 'AXIS_WITHOUT_CYLINDER',
      })
    }

    if (!Number.isInteger(values.osAxis)) {
      errors.push({
        field: 'osAxis',
        message: 'Axis must be a whole number',
        code: 'AXIS_NOT_INTEGER',
      })
    }
  }

  // ===== Add Power Validation =====

  if (values.odAdd !== undefined && values.odAdd !== null) {
    if (values.odAdd < VALIDATION_RULES.ADD_MIN || values.odAdd > VALIDATION_RULES.ADD_MAX) {
      errors.push({
        field: 'odAdd',
        message: `Add power must be between +${VALIDATION_RULES.ADD_MIN} and +${VALIDATION_RULES.ADD_MAX}`,
        code: 'ADD_OUT_OF_RANGE',
      })
    }
    // Add power should be positive
    if (values.odAdd < 0) {
      errors.push({
        field: 'odAdd',
        message: 'Add power must be positive',
        code: 'ADD_NEGATIVE',
      })
    }
  }

  if (values.osAdd !== undefined && values.osAdd !== null) {
    if (values.osAdd < VALIDATION_RULES.ADD_MIN || values.osAdd > VALIDATION_RULES.ADD_MAX) {
      errors.push({
        field: 'osAdd',
        message: `Add power must be between +${VALIDATION_RULES.ADD_MIN} and +${VALIDATION_RULES.ADD_MAX}`,
        code: 'ADD_OUT_OF_RANGE',
      })
    }
    if (values.osAdd < 0) {
      errors.push({
        field: 'osAdd',
        message: 'Add power must be positive',
        code: 'ADD_NEGATIVE',
      })
    }
  }

  // Add power should be same for both eyes (typically)
  if (values.odAdd && values.osAdd && values.odAdd !== values.osAdd) {
    warnings.push({
      field: 'add',
      message: 'Add power is typically the same for both eyes. Please verify.',
      code: 'ADD_MISMATCH',
    })
  }

  // ===== PD Validation =====

  if (values.pdSingle !== undefined && values.pdSingle !== null) {
    if (values.pdSingle < VALIDATION_RULES.PD_MIN || values.pdSingle > VALIDATION_RULES.PD_MAX) {
      errors.push({
        field: 'pdSingle',
        message: `PD must be between ${VALIDATION_RULES.PD_MIN}mm and ${VALIDATION_RULES.PD_MAX}mm`,
        code: 'PD_OUT_OF_RANGE',
      })
    }
  }

  if (values.pdRight !== undefined && values.pdRight !== null) {
    if (values.pdRight < VALIDATION_RULES.PD_MONOCULAR_MIN || values.pdRight > VALIDATION_RULES.PD_MONOCULAR_MAX) {
      errors.push({
        field: 'pdRight',
        message: `Monocular PD must be between ${VALIDATION_RULES.PD_MONOCULAR_MIN}mm and ${VALIDATION_RULES.PD_MONOCULAR_MAX}mm`,
        code: 'PD_MONOCULAR_OUT_OF_RANGE',
      })
    }
  }

  if (values.pdLeft !== undefined && values.pdLeft !== null) {
    if (values.pdLeft < VALIDATION_RULES.PD_MONOCULAR_MIN || values.pdLeft > VALIDATION_RULES.PD_MONOCULAR_MAX) {
      errors.push({
        field: 'pdLeft',
        message: `Monocular PD must be between ${VALIDATION_RULES.PD_MONOCULAR_MIN}mm and ${VALIDATION_RULES.PD_MONOCULAR_MAX}mm`,
        code: 'PD_MONOCULAR_OUT_OF_RANGE',
      })
    }
  }

  // Monocular PDs should add up to approximately single PD
  if (values.pdSingle && values.pdRight && values.pdLeft) {
    const sum = values.pdRight + values.pdLeft
    if (Math.abs(sum - values.pdSingle) > 2) {
      warnings.push({
        field: 'pd',
        message: `Monocular PDs (${sum}mm) don't match single PD (${values.pdSingle}mm)`,
        code: 'PD_MISMATCH',
      })
    }
  }

  // ===== Cross-Eye Consistency Checks =====

  // Sphere difference warning
  if (values.odSphere !== null && values.osSphere !== null &&
      values.odSphere !== undefined && values.osSphere !== undefined) {
    const sphereDiff = Math.abs(values.odSphere - values.osSphere)
    if (sphereDiff > VALIDATION_RULES.SPHERE_DIFF_WARNING) {
      warnings.push({
        field: 'sphere',
        message: `Large difference between eyes (${sphereDiff}D). Please verify prescription.`,
        code: 'SPHERE_LARGE_DIFFERENCE',
      })
    }
  }

  // Cylinder difference warning
  if (values.odCylinder !== null && values.osCylinder !== null &&
      values.odCylinder !== undefined && values.osCylinder !== undefined) {
    const cylDiff = Math.abs(values.odCylinder - values.osCylinder)
    if (cylDiff > VALIDATION_RULES.CYLINDER_DIFF_WARNING) {
      warnings.push({
        field: 'cylinder',
        message: `Large cylinder difference between eyes (${cylDiff}D). Please verify prescription.`,
        code: 'CYLINDER_LARGE_DIFFERENCE',
      })
    }
  }

  // ===== Prism Validation =====

  if (values.odPrism !== undefined && values.odPrism !== null) {
    if (values.odPrism < 0 || values.odPrism > VALIDATION_RULES.PRISM_MAX) {
      errors.push({
        field: 'odPrism',
        message: `Prism must be between 0 and ${VALIDATION_RULES.PRISM_MAX}`,
        code: 'PRISM_OUT_OF_RANGE',
      })
    }
    if (values.odPrism > 0 && !values.odPrismDirection) {
      errors.push({
        field: 'odPrismDirection',
        message: 'Prism direction is required when prism is specified',
        code: 'PRISM_DIRECTION_REQUIRED',
      })
    }
  }

  if (values.osPrism !== undefined && values.osPrism !== null) {
    if (values.osPrism < 0 || values.osPrism > VALIDATION_RULES.PRISM_MAX) {
      errors.push({
        field: 'osPrism',
        message: `Prism must be between 0 and ${VALIDATION_RULES.PRISM_MAX}`,
        code: 'PRISM_OUT_OF_RANGE',
      })
    }
    if (values.osPrism > 0 && !values.osPrismDirection) {
      errors.push({
        field: 'osPrismDirection',
        message: 'Prism direction is required when prism is specified',
        code: 'PRISM_DIRECTION_REQUIRED',
      })
    }
  }

  // Validate prism directions
  const validDirections = ['BU', 'BD', 'BI', 'BO']
  if (values.odPrismDirection && !validDirections.includes(values.odPrismDirection)) {
    errors.push({
      field: 'odPrismDirection',
      message: 'Invalid prism direction. Use BU (base up), BD (base down), BI (base in), or BO (base out)',
      code: 'INVALID_PRISM_DIRECTION',
    })
  }
  if (values.osPrismDirection && !validDirections.includes(values.osPrismDirection)) {
    errors.push({
      field: 'osPrismDirection',
      message: 'Invalid prism direction. Use BU (base up), BD (base down), BI (base in), or BO (base out)',
      code: 'INVALID_PRISM_DIRECTION',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctedValues: Object.keys(correctedValues).length > 0 ? correctedValues : undefined,
  }
}

// ==================== Helper Functions ====================

function isValidStep(value: number, step: number): boolean {
  const remainder = Math.abs(value % step)
  return remainder < 0.001 || Math.abs(remainder - step) < 0.001
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

// ==================== Prescription Expiration ====================

export function isPrescriptionExpired(prescribedDate: Date, customValidityYears?: number): boolean {
  const validityYears = customValidityYears || VALIDATION_RULES.PRESCRIPTION_VALIDITY_YEARS
  const expirationDate = new Date(prescribedDate)
  expirationDate.setFullYear(expirationDate.getFullYear() + validityYears)

  return new Date() > expirationDate
}

export function getExpirationDate(prescribedDate: Date, customValidityYears?: number): Date {
  const validityYears = customValidityYears || VALIDATION_RULES.PRESCRIPTION_VALIDITY_YEARS
  const expirationDate = new Date(prescribedDate)
  expirationDate.setFullYear(expirationDate.getFullYear() + validityYears)
  return expirationDate
}

export function getDaysUntilExpiration(expirationDate: Date): number {
  const now = new Date()
  const diff = expirationDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ==================== Prescription Status Management ====================

export function determinePrescriptionStatus(
  values: PrescriptionValues,
  metadata: PrescriptionMetadata
): PrescriptionStatus {
  // Check if expired
  if (metadata.expirationDate && new Date() > metadata.expirationDate) {
    return 'EXPIRED'
  }

  if (metadata.prescribedDate && isPrescriptionExpired(metadata.prescribedDate)) {
    return 'EXPIRED'
  }

  // Validate prescription values
  const validation = validatePrescription(values)

  // If critical errors, reject
  if (!validation.isValid) {
    return 'REJECTED'
  }

  // If warnings exist, needs manual verification
  if (validation.warnings.length > 0) {
    return 'PENDING_VERIFICATION'
  }

  return 'VERIFIED'
}

// ==================== OCR Simulation Structure ====================

/**
 * Simulated OCR extraction for prescription images
 * In production, this would integrate with a trained ML model
 */
export function simulateOCRExtraction(imageData: string): OCRExtractionResult {
  // This is a simulation structure
  // Real implementation would use TensorFlow.js or call an external OCR service

  // Simulate successful extraction with sample data
  const values: PrescriptionValues = {
    odSphere: null,
    odCylinder: null,
    odAxis: null,
    osSphere: null,
    osCylinder: null,
    osAxis: null,
    pdSingle: null,
  }

  const metadata: PrescriptionMetadata = {
    prescribedDate: null,
    expirationDate: null,
    prescriberName: null,
  }

  return {
    success: false,  // Return false until real OCR is implemented
    confidence: 0,
    values,
    metadata,
    rawText: 'OCR not implemented - manual entry required',
    fieldConfidences: {},
  }
}

// ==================== Prescription Formatting ====================

/**
 * Format prescription values for display
 */
export function formatPrescriptionValue(value: number | null | undefined, type: 'sphere' | 'cylinder' | 'axis' | 'add' | 'pd'): string {
  if (value === null || value === undefined) {
    return '—'
  }

  switch (type) {
    case 'sphere':
    case 'cylinder':
      // Format with sign and 2 decimal places
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value.toFixed(2)}`

    case 'add':
      return `+${value.toFixed(2)}`

    case 'axis':
      return `${value}°`

    case 'pd':
      return `${value}mm`

    default:
      return String(value)
  }
}

/**
 * Generate a human-readable prescription summary
 */
export function generatePrescriptionSummary(values: PrescriptionValues): string {
  const lines: string[] = []

  // Right eye
  const odParts: string[] = []
  if (values.odSphere !== null && values.odSphere !== undefined) {
    odParts.push(`SPH ${formatPrescriptionValue(values.odSphere, 'sphere')}`)
  }
  if (values.odCylinder !== null && values.odCylinder !== undefined) {
    odParts.push(`CYL ${formatPrescriptionValue(values.odCylinder, 'cylinder')}`)
    if (values.odAxis !== null && values.odAxis !== undefined) {
      odParts.push(`AXIS ${formatPrescriptionValue(values.odAxis, 'axis')}`)
    }
  }
  if (values.odAdd !== null && values.odAdd !== undefined) {
    odParts.push(`ADD ${formatPrescriptionValue(values.odAdd, 'add')}`)
  }
  if (odParts.length > 0) {
    lines.push(`OD (Right): ${odParts.join(' | ')}`)
  }

  // Left eye
  const osParts: string[] = []
  if (values.osSphere !== null && values.osSphere !== undefined) {
    osParts.push(`SPH ${formatPrescriptionValue(values.osSphere, 'sphere')}`)
  }
  if (values.osCylinder !== null && values.osCylinder !== undefined) {
    osParts.push(`CYL ${formatPrescriptionValue(values.osCylinder, 'cylinder')}`)
    if (values.osAxis !== null && values.osAxis !== undefined) {
      osParts.push(`AXIS ${formatPrescriptionValue(values.osAxis, 'axis')}`)
    }
  }
  if (values.osAdd !== null && values.osAdd !== undefined) {
    osParts.push(`ADD ${formatPrescriptionValue(values.osAdd, 'add')}`)
  }
  if (osParts.length > 0) {
    lines.push(`OS (Left): ${osParts.join(' | ')}`)
  }

  // PD
  if (values.pdSingle !== null && values.pdSingle !== undefined) {
    lines.push(`PD: ${formatPrescriptionValue(values.pdSingle, 'pd')}`)
  } else if (values.pdRight !== null && values.pdLeft !== null) {
    lines.push(`PD: ${formatPrescriptionValue(values.pdRight, 'pd')} / ${formatPrescriptionValue(values.pdLeft, 'pd')} (R/L)`)
  }

  return lines.join('\n')
}

// ==================== Prescription Strength Classification ====================

export type PrescriptionStrength = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'

export function classifyPrescriptionStrength(values: PrescriptionValues): PrescriptionStrength {
  const odSphere = Math.abs(values.odSphere || 0)
  const osSphere = Math.abs(values.osSphere || 0)
  const maxSphere = Math.max(odSphere, osSphere)

  const odCyl = Math.abs(values.odCylinder || 0)
  const osCyl = Math.abs(values.osCylinder || 0)
  const maxCyl = Math.max(odCyl, osCyl)

  // Combined strength consideration
  if (maxSphere >= 8 || maxCyl >= 4) {
    return 'VERY_HIGH'
  }
  if (maxSphere >= 4 || maxCyl >= 2) {
    return 'HIGH'
  }
  if (maxSphere >= 2 || maxCyl >= 1) {
    return 'MODERATE'
  }
  return 'LOW'
}
