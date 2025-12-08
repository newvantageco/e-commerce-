/**
 * OpticaVision™ - AI Face Analysis Engine
 *
 * Analyzes facial geometry to provide personalized frame recommendations.
 * This is proprietary technology that differentiates Optica from competitors.
 */

import { FrameShape, FrameMaterial, FaceShape, SkinTone } from '@prisma/client'

// ==================== Types ====================

export interface FacialMeasurements {
  faceWidth: number       // Temple to temple (mm)
  faceLength: number      // Forehead to chin (mm)
  foreheadWidth: number   // Width at forehead (mm)
  cheekboneWidth: number  // Width at cheekbones (mm)
  jawWidth: number        // Width at jaw (mm)
  noseBridgeHeight?: number
  noseBridgeWidth?: number
}

export interface FacialLandmarks {
  // 68-point facial landmarks (simplified)
  leftEye: { x: number; y: number }
  rightEye: { x: number; y: number }
  noseTip: { x: number; y: number }
  leftMouth: { x: number; y: number }
  rightMouth: { x: number; y: number }
  chin: { x: number; y: number }
  leftTemple: { x: number; y: number }
  rightTemple: { x: number; y: number }
  leftJaw: { x: number; y: number }
  rightJaw: { x: number; y: number }
  foreheadCenter: { x: number; y: number }
  leftCheek: { x: number; y: number }
  rightCheek: { x: number; y: number }
}

export interface ColorAnalysis {
  skinTone: SkinTone
  hairColor: string
  eyeColor: string
  recommendedColors: string[]  // Hex codes
}

export interface FaceAnalysisResult {
  faceShape: FaceShape
  confidence: number
  measurements: FacialMeasurements
  proportions: {
    widthToLengthRatio: number
    foreheadToJawRatio: number
  }
  colorAnalysis?: ColorAnalysis
  recommendedFrameShapes: FrameShape[]
  recommendedMaterials: FrameMaterial[]
  optimalDimensions: {
    frameWidth: number
    bridgeWidth: number
    templeLength: number
  }
}

export interface FrameMatchScore {
  productId: string
  overallScore: number
  shapeScore: number
  sizeScore: number
  colorScore: number
  styleScore: number
  matchReasons: string[]
  warnings: string[]
}

// ==================== Face Shape Classification ====================

/**
 * Face Shape Classification Rules (derived from optical industry standards)
 *
 * OVAL: Face length > width, curved jawline, balanced proportions
 * ROUND: Face length ≈ width, soft curves, full cheeks
 * SQUARE: Face length ≈ width, strong angular jaw, wide forehead
 * HEART: Wide forehead, narrow chin, high cheekbones
 * OBLONG: Face length >> width, long narrow face
 * DIAMOND: Narrow forehead and jaw, wide cheekbones
 * TRIANGLE: Narrow forehead, wide jaw
 */

const FACE_SHAPE_THRESHOLDS = {
  // Width to length ratio thresholds
  ROUND_RATIO_MIN: 0.85,
  ROUND_RATIO_MAX: 1.05,
  SQUARE_RATIO_MIN: 0.85,
  SQUARE_RATIO_MAX: 1.05,
  OBLONG_RATIO_MAX: 0.75,

  // Forehead to jaw ratio thresholds
  HEART_FOREHEAD_JAW_MIN: 1.15,
  TRIANGLE_FOREHEAD_JAW_MAX: 0.85,
  DIAMOND_CHEEK_PROMINENCE: 1.1,
}

export function classifyFaceShape(measurements: FacialMeasurements): { shape: FaceShape; confidence: number } {
  const { faceWidth, faceLength, foreheadWidth, cheekboneWidth, jawWidth } = measurements

  const widthToLengthRatio = faceWidth / faceLength
  const foreheadToJawRatio = foreheadWidth / jawWidth
  const cheekProminence = cheekboneWidth / Math.max(foreheadWidth, jawWidth)

  const scores: Record<FaceShape, number> = {
    OVAL: 0,
    ROUND: 0,
    SQUARE: 0,
    HEART: 0,
    OBLONG: 0,
    DIAMOND: 0,
    TRIANGLE: 0,
  }

  // Calculate scores based on proportions

  // OVAL: Balanced face, length > width, gradual curves
  if (widthToLengthRatio >= 0.65 && widthToLengthRatio <= 0.85) {
    scores.OVAL += 40
    if (foreheadToJawRatio >= 0.9 && foreheadToJawRatio <= 1.1) {
      scores.OVAL += 30
    }
    if (cheekProminence >= 0.95 && cheekProminence <= 1.1) {
      scores.OVAL += 30
    }
  }

  // ROUND: Length ≈ width, soft features
  if (widthToLengthRatio >= FACE_SHAPE_THRESHOLDS.ROUND_RATIO_MIN &&
      widthToLengthRatio <= FACE_SHAPE_THRESHOLDS.ROUND_RATIO_MAX) {
    scores.ROUND += 35
    if (foreheadToJawRatio >= 0.9 && foreheadToJawRatio <= 1.1) {
      scores.ROUND += 35
    }
    if (cheekProminence <= 1.05) {
      scores.ROUND += 30
    }
  }

  // SQUARE: Length ≈ width, angular jaw
  if (widthToLengthRatio >= FACE_SHAPE_THRESHOLDS.SQUARE_RATIO_MIN &&
      widthToLengthRatio <= FACE_SHAPE_THRESHOLDS.SQUARE_RATIO_MAX) {
    scores.SQUARE += 30
    if (jawWidth >= foreheadWidth * 0.95) {
      scores.SQUARE += 40
    }
    // Angular jaw indicator (simplified)
    scores.SQUARE += 30
  }

  // HEART: Wide forehead, narrow chin
  if (foreheadToJawRatio >= FACE_SHAPE_THRESHOLDS.HEART_FOREHEAD_JAW_MIN) {
    scores.HEART += 50
    if (cheekboneWidth >= jawWidth) {
      scores.HEART += 30
    }
    if (widthToLengthRatio <= 0.85) {
      scores.HEART += 20
    }
  }

  // OBLONG: Very long face
  if (widthToLengthRatio <= FACE_SHAPE_THRESHOLDS.OBLONG_RATIO_MAX) {
    scores.OBLONG += 50
    if (foreheadToJawRatio >= 0.85 && foreheadToJawRatio <= 1.15) {
      scores.OBLONG += 30
    }
    scores.OBLONG += 20
  }

  // DIAMOND: Prominent cheekbones, narrow forehead and jaw
  if (cheekProminence >= FACE_SHAPE_THRESHOLDS.DIAMOND_CHEEK_PROMINENCE) {
    scores.DIAMOND += 40
    if (foreheadWidth < cheekboneWidth && jawWidth < cheekboneWidth) {
      scores.DIAMOND += 40
    }
    scores.DIAMOND += 20
  }

  // TRIANGLE: Narrow forehead, wide jaw
  if (foreheadToJawRatio <= FACE_SHAPE_THRESHOLDS.TRIANGLE_FOREHEAD_JAW_MAX) {
    scores.TRIANGLE += 50
    if (jawWidth > cheekboneWidth) {
      scores.TRIANGLE += 30
    }
    scores.TRIANGLE += 20
  }

  // Find highest scoring shape
  let maxScore = 0
  let detectedShape: FaceShape = 'OVAL'

  for (const [shape, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score
      detectedShape = shape as FaceShape
    }
  }

  // Normalize confidence to 0-1
  const confidence = Math.min(maxScore / 100, 1)

  return { shape: detectedShape, confidence }
}

// ==================== Frame Recommendations ====================

/**
 * Frame-to-Face Shape Compatibility Matrix
 * Based on optical industry best practices and customer satisfaction data
 */
const FRAME_COMPATIBILITY: Record<FaceShape, { best: FrameShape[]; good: FrameShape[]; avoid: FrameShape[] }> = {
  OVAL: {
    best: ['SQUARE', 'RECTANGLE', 'GEOMETRIC', 'AVIATOR'],
    good: ['BROWLINE', 'CAT_EYE', 'ROUND', 'WRAP'],
    avoid: [],  // Oval faces suit most frames
  },
  ROUND: {
    best: ['RECTANGLE', 'SQUARE', 'GEOMETRIC', 'BROWLINE'],
    good: ['CAT_EYE', 'AVIATOR', 'WRAP'],
    avoid: ['ROUND', 'OVAL'],  // Avoid mimicking face shape
  },
  SQUARE: {
    best: ['ROUND', 'OVAL', 'AVIATOR'],
    good: ['CAT_EYE', 'BROWLINE', 'GEOMETRIC'],
    avoid: ['SQUARE', 'RECTANGLE'],  // Avoid emphasizing angles
  },
  HEART: {
    best: ['AVIATOR', 'ROUND', 'OVAL', 'CAT_EYE'],
    good: ['RECTANGLE', 'BROWLINE'],
    avoid: ['OVERSIZED', 'WRAP'],  // Avoid top-heavy frames
  },
  OBLONG: {
    best: ['OVERSIZED', 'SQUARE', 'ROUND', 'AVIATOR'],
    good: ['BROWLINE', 'GEOMETRIC', 'WRAP'],
    avoid: ['RECTANGLE'],  // Avoid elongating further
  },
  DIAMOND: {
    best: ['OVAL', 'CAT_EYE', 'BROWLINE'],
    good: ['ROUND', 'AVIATOR', 'RECTANGLE'],
    avoid: ['GEOMETRIC'],  // Avoid angular frames
  },
  TRIANGLE: {
    best: ['CAT_EYE', 'BROWLINE', 'AVIATOR'],
    good: ['ROUND', 'OVAL', 'GEOMETRIC'],
    avoid: ['RECTANGLE', 'SQUARE'],  // Avoid bottom-heavy emphasis
  },
}

/**
 * Material recommendations based on face shape and style
 */
const MATERIAL_RECOMMENDATIONS: Record<FaceShape, FrameMaterial[]> = {
  OVAL: ['ACETATE', 'METAL', 'TITANIUM', 'TR90'],
  ROUND: ['METAL', 'TITANIUM', 'ACETATE'],  // Thinner frames
  SQUARE: ['ACETATE', 'TR90', 'MIXED'],  // Softer materials
  HEART: ['METAL', 'TITANIUM', 'ACETATE'],  // Light, elegant
  OBLONG: ['ACETATE', 'PLASTIC', 'TR90'],  // Bold frames
  DIAMOND: ['METAL', 'TITANIUM', 'ACETATE'],  // Delicate frames
  TRIANGLE: ['ACETATE', 'MIXED', 'METAL'],  // Top-heavy designs
}

export function getFrameRecommendations(faceShape: FaceShape): {
  recommendedShapes: FrameShape[]
  recommendedMaterials: FrameMaterial[]
  explanations: string[]
} {
  const compatibility = FRAME_COMPATIBILITY[faceShape]
  const materials = MATERIAL_RECOMMENDATIONS[faceShape]

  const explanations: string[] = []

  // Add shape-specific explanations
  switch (faceShape) {
    case 'OVAL':
      explanations.push('Your balanced proportions work with most frame styles')
      explanations.push('Angular frames add definition while soft shapes maintain harmony')
      break
    case 'ROUND':
      explanations.push('Angular frames add definition and lengthen your face')
      explanations.push('Rectangular shapes create contrast with soft features')
      break
    case 'SQUARE':
      explanations.push('Round and oval frames soften strong angular features')
      explanations.push('Curved lines complement your defined jawline')
      break
    case 'HEART':
      explanations.push('Bottom-heavy frames balance a wider forehead')
      explanations.push('Aviators and rounds draw attention to your eyes')
      break
    case 'OBLONG':
      explanations.push('Oversized and deep frames add width to your face')
      explanations.push('Bold shapes break up the length')
      break
    case 'DIAMOND':
      explanations.push('Oval frames highlight your cheekbones elegantly')
      explanations.push('Cat-eye shapes complement your unique bone structure')
      break
    case 'TRIANGLE':
      explanations.push('Top-heavy frames balance your wider jaw')
      explanations.push('Cat-eye and browline draw attention upward')
      break
  }

  return {
    recommendedShapes: [...compatibility.best, ...compatibility.good],
    recommendedMaterials: materials,
    explanations,
  }
}

// ==================== Optimal Frame Dimensions ====================

/**
 * Calculate optimal frame dimensions based on face measurements
 */
export function calculateOptimalDimensions(measurements: FacialMeasurements): {
  frameWidth: number
  bridgeWidth: number
  templeLength: number
  lensWidth: number
  lensHeight: number
} {
  const { faceWidth, noseBridgeWidth, faceLength } = measurements

  // Frame width should be approximately equal to face width
  // Industry standard: frame width = face width ± 5mm
  const frameWidth = Math.round(faceWidth)

  // Bridge width based on nose bridge measurement
  // Default to 18mm (medium) if not measured
  const bridgeWidth = noseBridgeWidth
    ? Math.round(noseBridgeWidth + 2)  // Add 2mm for comfort
    : 18

  // Temple length based on face proportions
  // Standard ranges: 135mm (short), 140mm (medium), 145mm (long)
  let templeLength: number
  if (faceLength < 115) {
    templeLength = 135
  } else if (faceLength < 125) {
    templeLength = 140
  } else {
    templeLength = 145
  }

  // Lens dimensions
  const lensWidth = Math.round((frameWidth - bridgeWidth) / 2 - 4)  // Account for frame thickness
  const lensHeight = Math.round(lensWidth * 0.7)  // Standard aspect ratio

  return {
    frameWidth,
    bridgeWidth,
    templeLength,
    lensWidth,
    lensHeight,
  }
}

// ==================== Color Harmony ====================

/**
 * Color recommendations based on skin tone
 */
const COLOR_RECOMMENDATIONS: Record<SkinTone, { colors: string[]; avoid: string[] }> = {
  WARM: {
    colors: ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#FFD700', '#F4A460', '#228B22', '#6B8E23'],
    avoid: ['#C0C0C0', '#808080', '#000080'],  // Cool metallics, navy
  },
  COOL: {
    colors: ['#000000', '#C0C0C0', '#4169E1', '#800080', '#FF69B4', '#008080', '#2F4F4F'],
    avoid: ['#FF8C00', '#FFD700', '#8B4513'],  // Warm earth tones
  },
  NEUTRAL: {
    colors: ['#000000', '#8B4513', '#708090', '#556B2F', '#800020', '#2F4F4F', '#CD853F'],
    avoid: [],  // Neutral tones work with most colors
  },
}

export function getColorRecommendations(skinTone: SkinTone): { colors: string[]; avoid: string[] } {
  return COLOR_RECOMMENDATIONS[skinTone]
}

// ==================== Frame Matching Score ====================

interface ProductForMatching {
  id: string
  frameShape?: FrameShape | null
  frameMaterial?: FrameMaterial | null
  frameWidth?: string | null
  lensWidth?: number | null
  bridgeWidth?: number | null
  templeLength?: number | null
}

export function calculateFrameMatchScore(
  faceAnalysis: FaceAnalysisResult,
  product: ProductForMatching
): FrameMatchScore {
  const matchReasons: string[] = []
  const warnings: string[] = []

  let shapeScore = 50  // Default neutral score
  let sizeScore = 50
  let colorScore = 50
  let styleScore = 50

  // Shape scoring
  if (product.frameShape) {
    const compatibility = FRAME_COMPATIBILITY[faceAnalysis.faceShape]

    if (compatibility.best.includes(product.frameShape)) {
      shapeScore = 95
      matchReasons.push(`${product.frameShape} frames are ideal for ${faceAnalysis.faceShape.toLowerCase()} faces`)
    } else if (compatibility.good.includes(product.frameShape)) {
      shapeScore = 75
      matchReasons.push(`${product.frameShape} frames complement ${faceAnalysis.faceShape.toLowerCase()} faces well`)
    } else if (compatibility.avoid.includes(product.frameShape)) {
      shapeScore = 25
      warnings.push(`${product.frameShape} frames may not be the best choice for ${faceAnalysis.faceShape.toLowerCase()} faces`)
    }
  }

  // Size scoring
  const optimalDimensions = faceAnalysis.optimalDimensions

  if (product.lensWidth && optimalDimensions.frameWidth) {
    const estimatedFrameWidth = product.lensWidth * 2 + (product.bridgeWidth || 18) + 8
    const widthDiff = Math.abs(estimatedFrameWidth - optimalDimensions.frameWidth)

    if (widthDiff <= 3) {
      sizeScore = 95
      matchReasons.push('Frame width is a perfect fit for your face')
    } else if (widthDiff <= 6) {
      sizeScore = 80
      matchReasons.push('Frame width is a good fit for your face')
    } else if (widthDiff <= 10) {
      sizeScore = 60
      warnings.push('Frame may be slightly ' + (estimatedFrameWidth > optimalDimensions.frameWidth ? 'wide' : 'narrow'))
    } else {
      sizeScore = 35
      warnings.push('Frame width may not be ideal for your face measurements')
    }
  }

  if (product.bridgeWidth && optimalDimensions.bridgeWidth) {
    const bridgeDiff = Math.abs(product.bridgeWidth - optimalDimensions.bridgeWidth)
    if (bridgeDiff > 3) {
      sizeScore -= 10
      warnings.push('Bridge width may need adjustment')
    }
  }

  // Material scoring (contributes to style)
  if (product.frameMaterial) {
    const recommendedMaterials = MATERIAL_RECOMMENDATIONS[faceAnalysis.faceShape]
    if (recommendedMaterials.includes(product.frameMaterial)) {
      styleScore = 80
      matchReasons.push(`${product.frameMaterial} is a recommended material for your face shape`)
    }
  }

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    shapeScore * 0.35 +
    sizeScore * 0.35 +
    colorScore * 0.15 +
    styleScore * 0.15
  )

  return {
    productId: product.id,
    overallScore,
    shapeScore,
    sizeScore,
    colorScore,
    styleScore,
    matchReasons,
    warnings,
  }
}

// ==================== Full Analysis Pipeline ====================

export function performFaceAnalysis(
  measurements: FacialMeasurements,
  colorAnalysis?: ColorAnalysis
): FaceAnalysisResult {
  // Classify face shape
  const { shape, confidence } = classifyFaceShape(measurements)

  // Get frame recommendations
  const recommendations = getFrameRecommendations(shape)

  // Calculate optimal dimensions
  const optimalDimensions = calculateOptimalDimensions(measurements)

  // Calculate proportions
  const proportions = {
    widthToLengthRatio: measurements.faceWidth / measurements.faceLength,
    foreheadToJawRatio: measurements.foreheadWidth / measurements.jawWidth,
  }

  return {
    faceShape: shape,
    confidence,
    measurements,
    proportions,
    colorAnalysis,
    recommendedFrameShapes: recommendations.recommendedShapes,
    recommendedMaterials: recommendations.recommendedMaterials,
    optimalDimensions,
  }
}

// ==================== PD (Pupillary Distance) Calculation ====================

/**
 * Calculate pupillary distance from eye positions
 * Used when customer uploads a photo for remote PD measurement
 */
export function calculatePD(
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  referenceObjectWidthMm: number,
  referenceObjectWidthPx: number
): { pdMm: number; confidence: number } {
  // Calculate pixel distance between eyes
  const eyeDistancePx = Math.sqrt(
    Math.pow(rightEye.x - leftEye.x, 2) +
    Math.pow(rightEye.y - leftEye.y, 2)
  )

  // Convert to mm using reference object
  const pxToMm = referenceObjectWidthMm / referenceObjectWidthPx
  const pdMm = eyeDistancePx * pxToMm

  // Confidence based on reasonable PD range (50-75mm for adults)
  let confidence = 1
  if (pdMm < 50 || pdMm > 75) {
    confidence = 0.5  // Outside normal range
  } else if (pdMm < 55 || pdMm > 70) {
    confidence = 0.8  // Edge of normal range
  }

  return {
    pdMm: Math.round(pdMm * 10) / 10,  // Round to 0.1mm
    confidence,
  }
}
