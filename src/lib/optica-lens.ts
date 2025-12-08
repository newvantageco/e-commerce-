/**
 * OpticaLens™ - Intelligent Lens Configuration Engine
 *
 * Recommends optimal lens configurations based on prescription strength,
 * lifestyle, budget, and optical physics calculations.
 */

import { LensIndex, LensCoating } from '@prisma/client'
import { PrescriptionValues, classifyPrescriptionStrength, PrescriptionStrength } from './optica-scan'

// ==================== Types ====================

export type UsageType = 'EVERYDAY' | 'COMPUTER' | 'READING' | 'DRIVING' | 'SPORTS' | 'FASHION'
export type BudgetRange = 'BUDGET' | 'MID_RANGE' | 'PREMIUM'
export type PriorityFactor = 'THIN_LIGHT' | 'DURABILITY' | 'CLARITY' | 'PROTECTION' | 'COST'
export type LensDesign = 'SINGLE_VISION' | 'PROGRESSIVE' | 'BIFOCAL' | 'OFFICE' | 'NON_PRESCRIPTION'

export interface LensConfigInput {
  prescription?: PrescriptionValues
  usageType: UsageType
  budgetRange: BudgetRange
  priorityFactors: PriorityFactor[]
  frameInfo?: {
    lensWidth?: number
    lensHeight?: number
    frameShape?: string
  }
}

export interface LensRecommendationResult {
  lensIndex: LensIndex
  lensDesign: LensDesign
  recommendedCoatings: LensCoating[]
  estimatedThickness: {
    center: number  // mm
    edge: number    // mm
  }
  estimatedWeight: number  // grams per lens
  estimatedCost: {
    lensBase: number
    coatings: number
    total: number
  }
  explanations: LensExplanation[]
  alternatives: AlternativeOption[]
}

export interface LensExplanation {
  category: string
  recommendation: string
  reason: string
}

export interface AlternativeOption {
  lensIndex: LensIndex
  coatings: LensCoating[]
  priceDiff: number
  benefits: string[]
  tradeoffs: string[]
}

// ==================== Lens Index Properties ====================

interface LensIndexProperties {
  index: number
  name: string
  description: string
  minPrescription: number  // Minimum sphere for recommendation
  maxPrescription: number  // Maximum sphere for recommendation
  basePrice: number
  thicknessReduction: number  // Percentage vs standard 1.50
  abbe: number  // Abbe value (chromatic aberration, higher = better)
  specificGravity: number  // Density (lower = lighter)
  impactResistance: string
}

const LENS_INDEX_PROPERTIES: Record<LensIndex, LensIndexProperties> = {
  STANDARD_1_50: {
    index: 1.50,
    name: 'Standard (CR-39)',
    description: 'Classic optical plastic, excellent clarity',
    minPrescription: 0,
    maxPrescription: 2.00,
    basePrice: 0,
    thicknessReduction: 0,
    abbe: 58,  // Excellent
    specificGravity: 1.32,
    impactResistance: 'Low',
  },
  MID_INDEX_1_56: {
    index: 1.56,
    name: 'Mid-Index 1.56',
    description: 'Thinner than standard, good value',
    minPrescription: 1.50,
    maxPrescription: 4.00,
    basePrice: 30,
    thicknessReduction: 15,
    abbe: 42,
    specificGravity: 1.28,
    impactResistance: 'Low',
  },
  MID_INDEX_1_59: {
    index: 1.59,
    name: 'Polycarbonate',
    description: 'Impact-resistant, ideal for active lifestyles',
    minPrescription: 0,
    maxPrescription: 6.00,
    basePrice: 50,
    thicknessReduction: 20,
    abbe: 30,  // Lower optical quality
    specificGravity: 1.20,
    impactResistance: 'Excellent',
  },
  HIGH_INDEX_1_60: {
    index: 1.60,
    name: 'High-Index 1.60',
    description: 'Noticeably thinner, great for moderate prescriptions',
    minPrescription: 3.00,
    maxPrescription: 6.00,
    basePrice: 80,
    thicknessReduction: 30,
    abbe: 42,
    specificGravity: 1.34,
    impactResistance: 'Moderate',
  },
  HIGH_INDEX_1_67: {
    index: 1.67,
    name: 'High-Index 1.67',
    description: 'Significantly thinner and lighter',
    minPrescription: 4.00,
    maxPrescription: 10.00,
    basePrice: 130,
    thicknessReduction: 40,
    abbe: 32,
    specificGravity: 1.35,
    impactResistance: 'Moderate',
  },
  ULTRA_HIGH_1_74: {
    index: 1.74,
    name: 'Ultra High-Index 1.74',
    description: 'Thinnest possible lenses for strong prescriptions',
    minPrescription: 6.00,
    maxPrescription: 20.00,
    basePrice: 200,
    thicknessReduction: 50,
    abbe: 33,
    specificGravity: 1.47,
    impactResistance: 'Moderate',
  },
}

// ==================== Coating Properties ====================

interface CoatingProperties {
  name: string
  description: string
  price: number
  benefits: string[]
  recommendedFor: UsageType[]
}

const COATING_PROPERTIES: Record<LensCoating, CoatingProperties> = {
  ANTI_REFLECTIVE: {
    name: 'Anti-Reflective',
    description: 'Reduces glare and reflections for clearer vision',
    price: 50,
    benefits: ['Reduces eye strain', 'Better appearance in photos', 'Improved night driving'],
    recommendedFor: ['EVERYDAY', 'COMPUTER', 'DRIVING'],
  },
  BLUE_LIGHT_FILTER: {
    name: 'Blue Light Filter',
    description: 'Filters harmful blue light from screens',
    price: 40,
    benefits: ['Reduces digital eye strain', 'Better sleep patterns', 'Protects from screen glare'],
    recommendedFor: ['COMPUTER', 'EVERYDAY'],
  },
  SCRATCH_RESISTANT: {
    name: 'Scratch-Resistant',
    description: 'Hardened coating to prevent scratches',
    price: 25,
    benefits: ['Longer lens life', 'Maintains clarity'],
    recommendedFor: ['EVERYDAY', 'SPORTS', 'DRIVING'],
  },
  UV_PROTECTION: {
    name: 'UV Protection',
    description: '100% UV-A and UV-B protection',
    price: 20,
    benefits: ['Protects eyes from sun damage', 'Prevents cataracts'],
    recommendedFor: ['EVERYDAY', 'DRIVING', 'SPORTS'],
  },
  ANTI_SMUDGE: {
    name: 'Oleophobic (Anti-Smudge)',
    description: 'Repels fingerprints and oils',
    price: 30,
    benefits: ['Easier to clean', 'Stays clearer longer'],
    recommendedFor: ['EVERYDAY', 'COMPUTER'],
  },
  HYDROPHOBIC: {
    name: 'Hydrophobic',
    description: 'Water-repellent coating',
    price: 25,
    benefits: ['Rain rolls off', 'Reduces fogging'],
    recommendedFor: ['SPORTS', 'EVERYDAY', 'DRIVING'],
  },
  PHOTOCHROMIC: {
    name: 'Photochromic (Transitions)',
    description: 'Automatically darkens in sunlight',
    price: 150,
    benefits: ['Adapts to light conditions', 'No need for separate sunglasses'],
    recommendedFor: ['EVERYDAY', 'DRIVING'],
  },
  POLARIZED: {
    name: 'Polarized',
    description: 'Reduces glare from reflective surfaces',
    price: 100,
    benefits: ['Eliminates harsh glare', 'Better contrast', 'Reduced eye fatigue'],
    recommendedFor: ['DRIVING', 'SPORTS'],
  },
  MIRROR: {
    name: 'Mirror Coating',
    description: 'Reflective fashion coating',
    price: 40,
    benefits: ['Stylish appearance', 'Reduces light transmission'],
    recommendedFor: ['FASHION', 'SPORTS'],
  },
}

// ==================== Lens Thickness Calculation ====================

/**
 * Calculate approximate lens thickness based on prescription and index
 * Uses simplified lens maker's equations
 */
export function calculateLensThickness(
  sphere: number,
  cylinder: number,
  lensIndex: LensIndex,
  lensWidth: number = 52  // Default lens width in mm
): { center: number; edge: number } {
  const indexProps = LENS_INDEX_PROPERTIES[lensIndex]
  const n = indexProps.index

  // Simplified calculation
  // For minus lenses (myopia): thicker at edges
  // For plus lenses (hyperopia): thicker at center

  const totalPower = Math.abs(sphere) + Math.abs(cylinder || 0) / 2
  const radius = lensWidth / 2

  // Base thickness (minimum center for minus, minimum edge for plus)
  const baseThickness = 1.5  // mm

  if (sphere < 0) {
    // Minus lens - calculate edge thickness
    // Edge = Center + (r² × |P|) / (2000 × (n-1))
    const edgeAddition = (radius * radius * totalPower) / (2000 * (n - 1))
    return {
      center: baseThickness,
      edge: Math.round((baseThickness + edgeAddition) * 10) / 10,
    }
  } else {
    // Plus lens - calculate center thickness
    // Center = Edge + (r² × P) / (2000 × (n-1))
    const centerAddition = (radius * radius * totalPower) / (2000 * (n - 1))
    return {
      center: Math.round((baseThickness + centerAddition) * 10) / 10,
      edge: baseThickness,
    }
  }
}

/**
 * Calculate approximate lens weight
 */
export function calculateLensWeight(
  thickness: { center: number; edge: number },
  lensIndex: LensIndex,
  lensWidth: number = 52,
  lensHeight: number = 40
): number {
  const indexProps = LENS_INDEX_PROPERTIES[lensIndex]

  // Approximate volume (simplified as elliptical cylinder)
  const avgThickness = (thickness.center + thickness.edge) / 2
  const area = Math.PI * (lensWidth / 2) * (lensHeight / 2)
  const volumeCm3 = (area * avgThickness) / 1000

  // Weight = volume × specific gravity
  const weight = volumeCm3 * indexProps.specificGravity

  return Math.round(weight * 10) / 10  // grams per lens
}

// ==================== Recommendation Engine ====================

/**
 * Determine optimal lens index based on prescription and priorities
 */
function recommendLensIndex(
  prescriptionStrength: PrescriptionStrength,
  budgetRange: BudgetRange,
  priorityFactors: PriorityFactor[]
): LensIndex {
  // Start with prescription-appropriate options
  const prioritizeThin = priorityFactors.includes('THIN_LIGHT')
  const prioritizeDurability = priorityFactors.includes('DURABILITY')
  const prioritizeClarity = priorityFactors.includes('CLARITY')
  const prioritizeCost = priorityFactors.includes('COST')

  // Prescription-based minimum index
  let minIndex: LensIndex = 'STANDARD_1_50'

  switch (prescriptionStrength) {
    case 'LOW':
      minIndex = 'STANDARD_1_50'
      break
    case 'MODERATE':
      minIndex = 'MID_INDEX_1_56'
      break
    case 'HIGH':
      minIndex = 'HIGH_INDEX_1_60'
      break
    case 'VERY_HIGH':
      minIndex = 'HIGH_INDEX_1_67'
      break
  }

  // Adjust based on priorities and budget
  if (prioritizeThin && budgetRange !== 'BUDGET') {
    // Upgrade index for thinner lenses
    if (minIndex === 'STANDARD_1_50') minIndex = 'MID_INDEX_1_56'
    else if (minIndex === 'MID_INDEX_1_56') minIndex = 'HIGH_INDEX_1_60'
    else if (minIndex === 'HIGH_INDEX_1_60') minIndex = 'HIGH_INDEX_1_67'
    else if (minIndex === 'HIGH_INDEX_1_67' && budgetRange === 'PREMIUM') minIndex = 'ULTRA_HIGH_1_74'
  }

  if (prioritizeDurability) {
    // Polycarbonate for impact resistance
    if (prescriptionStrength !== 'VERY_HIGH') {
      minIndex = 'MID_INDEX_1_59'
    }
  }

  if (prioritizeClarity && !prioritizeThin) {
    // Standard CR-39 has best optical quality (highest Abbe)
    if (prescriptionStrength === 'LOW') {
      minIndex = 'STANDARD_1_50'
    }
  }

  if (prioritizeCost || budgetRange === 'BUDGET') {
    // Don't exceed mid-index for budget
    if (minIndex === 'HIGH_INDEX_1_67' || minIndex === 'ULTRA_HIGH_1_74') {
      minIndex = 'HIGH_INDEX_1_60'
    }
  }

  return minIndex
}

/**
 * Determine lens design based on prescription
 */
function recommendLensDesign(prescription?: PrescriptionValues): LensDesign {
  if (!prescription) {
    return 'NON_PRESCRIPTION'
  }

  const hasAdd = (prescription.odAdd && prescription.odAdd > 0) ||
                 (prescription.osAdd && prescription.osAdd > 0)

  if (hasAdd) {
    // Progressive is generally preferred over bifocal for aesthetics
    return 'PROGRESSIVE'
  }

  const hasPrescription = (prescription.odSphere !== null && prescription.odSphere !== undefined) ||
                          (prescription.osSphere !== null && prescription.osSphere !== undefined)

  if (hasPrescription) {
    return 'SINGLE_VISION'
  }

  return 'NON_PRESCRIPTION'
}

/**
 * Recommend coatings based on usage type and budget
 */
function recommendCoatings(
  usageType: UsageType,
  budgetRange: BudgetRange,
  priorityFactors: PriorityFactor[]
): LensCoating[] {
  const coatings: LensCoating[] = []

  // Essential coatings for all
  coatings.push('SCRATCH_RESISTANT')
  coatings.push('UV_PROTECTION')

  // Usage-specific recommendations
  switch (usageType) {
    case 'COMPUTER':
      coatings.push('BLUE_LIGHT_FILTER')
      coatings.push('ANTI_REFLECTIVE')
      if (budgetRange !== 'BUDGET') {
        coatings.push('ANTI_SMUDGE')
      }
      break

    case 'DRIVING':
      coatings.push('ANTI_REFLECTIVE')
      if (budgetRange === 'PREMIUM') {
        coatings.push('POLARIZED')
      }
      coatings.push('HYDROPHOBIC')
      break

    case 'SPORTS':
      if (budgetRange !== 'BUDGET') {
        coatings.push('HYDROPHOBIC')
      }
      if (budgetRange === 'PREMIUM') {
        coatings.push('POLARIZED')
      }
      break

    case 'EVERYDAY':
      coatings.push('ANTI_REFLECTIVE')
      if (budgetRange !== 'BUDGET') {
        coatings.push('BLUE_LIGHT_FILTER')
        coatings.push('ANTI_SMUDGE')
      }
      if (budgetRange === 'PREMIUM') {
        coatings.push('PHOTOCHROMIC')
      }
      break

    case 'READING':
      coatings.push('ANTI_REFLECTIVE')
      break

    case 'FASHION':
      if (budgetRange === 'PREMIUM') {
        coatings.push('MIRROR')
      }
      break
  }

  // Priority-based additions
  if (priorityFactors.includes('PROTECTION') && !coatings.includes('BLUE_LIGHT_FILTER')) {
    coatings.push('BLUE_LIGHT_FILTER')
  }

  return [...new Set(coatings)]  // Remove duplicates
}

/**
 * Calculate total estimated cost
 */
function calculateCost(
  lensIndex: LensIndex,
  lensDesign: LensDesign,
  coatings: LensCoating[]
): { lensBase: number; coatings: number; total: number } {
  let lensBase = LENS_INDEX_PROPERTIES[lensIndex].basePrice

  // Add design premium
  switch (lensDesign) {
    case 'PROGRESSIVE':
      lensBase += 150
      break
    case 'BIFOCAL':
      lensBase += 75
      break
    case 'OFFICE':
      lensBase += 100
      break
  }

  // Calculate coatings cost
  const coatingsCost = coatings.reduce((sum, coating) => {
    return sum + COATING_PROPERTIES[coating].price
  }, 0)

  return {
    lensBase,
    coatings: coatingsCost,
    total: lensBase + coatingsCost,
  }
}

/**
 * Generate explanations for recommendations
 */
function generateExplanations(
  lensIndex: LensIndex,
  lensDesign: LensDesign,
  coatings: LensCoating[],
  prescriptionStrength: PrescriptionStrength,
  usageType: UsageType
): LensExplanation[] {
  const explanations: LensExplanation[] = []
  const indexProps = LENS_INDEX_PROPERTIES[lensIndex]

  // Lens index explanation
  explanations.push({
    category: 'Lens Material',
    recommendation: indexProps.name,
    reason: prescriptionStrength === 'LOW'
      ? 'Your prescription allows for standard lenses with excellent optical clarity.'
      : `With your ${prescriptionStrength.toLowerCase()} prescription, ${indexProps.name} provides ${indexProps.thicknessReduction}% thickness reduction for better aesthetics and comfort.`,
  })

  // Lens design explanation
  if (lensDesign === 'PROGRESSIVE') {
    explanations.push({
      category: 'Lens Design',
      recommendation: 'Progressive Lenses',
      reason: 'Your prescription includes reading correction (ADD power). Progressives provide seamless transition between distance and near vision without visible lines.',
    })
  } else if (lensDesign === 'SINGLE_VISION') {
    explanations.push({
      category: 'Lens Design',
      recommendation: 'Single Vision',
      reason: 'Optimized for your primary viewing distance with full lens clarity.',
    })
  }

  // Coating explanations (top 3)
  coatings.slice(0, 3).forEach(coating => {
    const coatingProps = COATING_PROPERTIES[coating]
    explanations.push({
      category: 'Coating',
      recommendation: coatingProps.name,
      reason: coatingProps.benefits[0],
    })
  })

  return explanations
}

/**
 * Generate alternative options
 */
function generateAlternatives(
  recommendedIndex: LensIndex,
  recommendedCoatings: LensCoating[],
  budgetRange: BudgetRange,
  prescriptionStrength: PrescriptionStrength
): AlternativeOption[] {
  const alternatives: AlternativeOption[] = []

  // Budget alternative
  if (budgetRange !== 'BUDGET' && recommendedIndex !== 'STANDARD_1_50') {
    const budgetIndex = prescriptionStrength === 'LOW' ? 'STANDARD_1_50' : 'MID_INDEX_1_56'
    const budgetCoatings = recommendedCoatings.filter(c =>
      !['PHOTOCHROMIC', 'POLARIZED', 'MIRROR'].includes(c)
    )

    const currentCost = calculateCost(recommendedIndex, 'SINGLE_VISION', recommendedCoatings).total
    const altCost = calculateCost(budgetIndex as LensIndex, 'SINGLE_VISION', budgetCoatings).total

    alternatives.push({
      lensIndex: budgetIndex as LensIndex,
      coatings: budgetCoatings,
      priceDiff: altCost - currentCost,
      benefits: ['Lower cost', 'Good optical quality'],
      tradeoffs: ['Thicker lenses', 'Fewer features'],
    })
  }

  // Premium alternative
  if (budgetRange !== 'PREMIUM' && recommendedIndex !== 'ULTRA_HIGH_1_74') {
    let premiumIndex: LensIndex = recommendedIndex

    if (recommendedIndex === 'STANDARD_1_50') premiumIndex = 'HIGH_INDEX_1_60'
    else if (recommendedIndex === 'MID_INDEX_1_56') premiumIndex = 'HIGH_INDEX_1_60'
    else if (recommendedIndex === 'MID_INDEX_1_59') premiumIndex = 'HIGH_INDEX_1_67'
    else if (recommendedIndex === 'HIGH_INDEX_1_60') premiumIndex = 'HIGH_INDEX_1_67'
    else if (recommendedIndex === 'HIGH_INDEX_1_67') premiumIndex = 'ULTRA_HIGH_1_74'

    const premiumCoatings = [...recommendedCoatings]
    if (!premiumCoatings.includes('PHOTOCHROMIC')) {
      premiumCoatings.push('PHOTOCHROMIC')
    }

    const currentCost = calculateCost(recommendedIndex, 'SINGLE_VISION', recommendedCoatings).total
    const altCost = calculateCost(premiumIndex, 'SINGLE_VISION', premiumCoatings).total

    alternatives.push({
      lensIndex: premiumIndex,
      coatings: premiumCoatings,
      priceDiff: altCost - currentCost,
      benefits: ['Thinner lenses', 'Photochromic convenience', 'Premium appearance'],
      tradeoffs: ['Higher cost'],
    })
  }

  return alternatives
}

// ==================== Main Recommendation Function ====================

export function generateLensRecommendation(input: LensConfigInput): LensRecommendationResult {
  // Determine prescription strength
  const prescriptionStrength = input.prescription
    ? classifyPrescriptionStrength(input.prescription)
    : 'LOW'

  // Recommend lens index
  const lensIndex = recommendLensIndex(
    prescriptionStrength,
    input.budgetRange,
    input.priorityFactors
  )

  // Determine lens design
  const lensDesign = recommendLensDesign(input.prescription)

  // Recommend coatings
  const recommendedCoatings = recommendCoatings(
    input.usageType,
    input.budgetRange,
    input.priorityFactors
  )

  // Calculate thickness
  const sphere = input.prescription?.odSphere || input.prescription?.osSphere || 0
  const cylinder = input.prescription?.odCylinder || input.prescription?.osCylinder || 0
  const lensWidth = input.frameInfo?.lensWidth || 52
  const lensHeight = input.frameInfo?.lensHeight || 40

  const thickness = calculateLensThickness(sphere, cylinder, lensIndex, lensWidth)
  const weight = calculateLensWeight(thickness, lensIndex, lensWidth, lensHeight)

  // Calculate cost
  const cost = calculateCost(lensIndex, lensDesign, recommendedCoatings)

  // Generate explanations
  const explanations = generateExplanations(
    lensIndex,
    lensDesign,
    recommendedCoatings,
    prescriptionStrength,
    input.usageType
  )

  // Generate alternatives
  const alternatives = generateAlternatives(
    lensIndex,
    recommendedCoatings,
    input.budgetRange,
    prescriptionStrength
  )

  return {
    lensIndex,
    lensDesign,
    recommendedCoatings,
    estimatedThickness: thickness,
    estimatedWeight: weight,
    estimatedCost: cost,
    explanations,
    alternatives,
  }
}

// ==================== Exports ====================

export {
  LENS_INDEX_PROPERTIES,
  COATING_PROPERTIES,
}
