'use client'

/**
 * OpticaVision™ Face Analyzer Component
 *
 * Allows users to input facial measurements or use guided measurement
 * to get personalized frame recommendations.
 */

import { useState } from 'react'
import {
  Camera,
  Ruler,
  Sparkles,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface FacialMeasurements {
  faceWidth: number
  faceLength: number
  foreheadWidth: number
  cheekboneWidth: number
  jawWidth: number
  noseBridgeWidth?: number
}

interface ColorAnalysis {
  skinTone: 'WARM' | 'COOL' | 'NEUTRAL'
  hairColor?: string
  eyeColor?: string
}

interface AnalysisResult {
  analysisId: string
  faceShape: string
  confidence: number
  optimalDimensions: {
    frameWidth: number
    bridgeWidth: number
    templeLength: number
  }
  recommendedFrameShapes: string[]
  recommendedMaterials: string[]
  colorRecommendations?: string[]
  topRecommendations: Array<{
    id: string
    name: string
    slug: string
    price: number
    image?: string
    brand?: string
    score: number
    matchReasons: string[]
  }>
}

const FACE_SHAPE_DESCRIPTIONS: Record<string, string> = {
  OVAL: 'Balanced proportions with a gently curved jawline. The most versatile face shape for eyewear.',
  ROUND: 'Similar width and length with soft, curved features. Full cheeks and a rounded chin.',
  SQUARE: 'Strong, angular jawline with similar face width and length. Defined forehead.',
  HEART: 'Wider forehead that narrows to a smaller chin. Prominent cheekbones.',
  OBLONG: 'Face length is notably longer than width. Long, straight cheeks.',
  DIAMOND: 'Narrow forehead and jawline with wide, high cheekbones.',
  TRIANGLE: 'Narrow forehead with a wider jawline. Prominent jaw.',
}

const SKIN_TONES = [
  { value: 'WARM', label: 'Warm', description: 'Golden, peachy, or yellow undertones', colors: ['#F5D0C5', '#D4A574', '#8B5A2B'] },
  { value: 'COOL', label: 'Cool', description: 'Pink, red, or blue undertones', colors: ['#FFC0CB', '#E6B8B8', '#B87B8B'] },
  { value: 'NEUTRAL', label: 'Neutral', description: 'Mix of warm and cool undertones', colors: ['#E8D5C4', '#C4A484', '#8B7355'] },
]

export default function FaceAnalyzer() {
  const [step, setStep] = useState<'intro' | 'measurements' | 'colors' | 'analyzing' | 'results'>('intro')
  const [measurements, setMeasurements] = useState<FacialMeasurements>({
    faceWidth: 140,
    faceLength: 180,
    foreheadWidth: 130,
    cheekboneWidth: 135,
    jawWidth: 120,
    noseBridgeWidth: 14,
  })
  const [colorAnalysis, setColorAnalysis] = useState<ColorAnalysis>({
    skinTone: 'NEUTRAL',
  })
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMeasurementChange = (field: keyof FacialMeasurements, value: number) => {
    setMeasurements(prev => ({ ...prev, [field]: value }))
  }

  const handleAnalyze = async () => {
    setStep('analyzing')
    setError(null)

    try {
      const response = await fetch('/api/optica/face-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurements,
          colorAnalysis,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed')
      }

      setResult(data.data)
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStep('colors')
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-600">OpticaVision™ AI</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Your Perfect Frames
        </h1>
        <p className="text-gray-600">
          Our AI analyzes your face shape to recommend frames that complement your features
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {['Measurements', 'Colors', 'Results'].map((label, idx) => {
          const stepIndex = idx + 1
          const currentStepIndex = step === 'intro' ? 0 : step === 'measurements' ? 1 : step === 'colors' ? 2 : step === 'analyzing' ? 2 : 3
          const isActive = stepIndex <= currentStepIndex
          const isCurrent = stepIndex === currentStepIndex

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                } ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}
              >
                {isActive && stepIndex < currentStepIndex ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  stepIndex
                )}
              </div>
              <span className={`text-sm ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {label}
              </span>
              {idx < 2 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Intro Step */}
        {step === 'intro' && (
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Camera className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left mb-8">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <Ruler className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-medium mb-1">1. Enter Measurements</h3>
                <p className="text-sm text-gray-600">Provide your facial measurements or use our guided process</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-medium mb-1">2. AI Analysis</h3>
                <p className="text-sm text-gray-600">Our AI determines your face shape and optimal frame dimensions</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-medium mb-1">3. Get Recommendations</h3>
                <p className="text-sm text-gray-600">Receive personalized frame suggestions ranked by fit</p>
              </div>
            </div>
            <button
              onClick={() => setStep('measurements')}
              className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              Start Analysis
            </button>
          </div>
        )}

        {/* Measurements Step */}
        {step === 'measurements' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Facial Measurements</h2>
            <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-xl mb-6">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                For best results, measure in millimeters. Use a soft measuring tape or ruler in front of a mirror.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Face Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Face Width (temple to temple)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="100"
                    max="180"
                    value={measurements.faceWidth}
                    onChange={(e) => handleMeasurementChange('faceWidth', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono">
                    {measurements.faceWidth}mm
                  </div>
                </div>
              </div>

              {/* Face Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Face Length (forehead to chin)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="120"
                    max="220"
                    value={measurements.faceLength}
                    onChange={(e) => handleMeasurementChange('faceLength', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono">
                    {measurements.faceLength}mm
                  </div>
                </div>
              </div>

              {/* Forehead Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forehead Width
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="80"
                    max="160"
                    value={measurements.foreheadWidth}
                    onChange={(e) => handleMeasurementChange('foreheadWidth', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono">
                    {measurements.foreheadWidth}mm
                  </div>
                </div>
              </div>

              {/* Cheekbone Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cheekbone Width
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="80"
                    max="160"
                    value={measurements.cheekboneWidth}
                    onChange={(e) => handleMeasurementChange('cheekboneWidth', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono">
                    {measurements.cheekboneWidth}mm
                  </div>
                </div>
              </div>

              {/* Jaw Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jaw Width
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="80"
                    max="160"
                    value={measurements.jawWidth}
                    onChange={(e) => handleMeasurementChange('jawWidth', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono">
                    {measurements.jawWidth}mm
                  </div>
                </div>
              </div>

              {/* Nose Bridge Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nose Bridge Width (optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="25"
                    value={measurements.noseBridgeWidth || 14}
                    onChange={(e) => handleMeasurementChange('noseBridgeWidth', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <div className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center font-mono">
                    {measurements.noseBridgeWidth || 14}mm
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep('colors')}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Colors Step */}
        {step === 'colors' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Color Analysis (Optional)</h2>
            <p className="text-gray-600 mb-6">
              Help us recommend frame colors that complement your natural coloring.
            </p>

            {error && (
              <div className="flex items-start gap-2 p-4 bg-red-50 rounded-xl mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Skin Undertone
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {SKIN_TONES.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setColorAnalysis(prev => ({ ...prev, skinTone: tone.value as ColorAnalysis['skinTone'] }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      colorAnalysis.skinTone === tone.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      {tone.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <h3 className="font-medium">{tone.label}</h3>
                    <p className="text-xs text-gray-500">{tone.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep('measurements')}
                className="px-6 py-3 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleAnalyze}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analyze My Face
              </button>
            </div>
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25" />
              <div className="relative w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Analyzing Your Face Shape</h2>
            <p className="text-gray-600">This will only take a moment...</p>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && result && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Analysis Complete
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Your Face Shape: {result.faceShape}
              </h2>
              <p className="text-gray-600 max-w-lg mx-auto">
                {FACE_SHAPE_DESCRIPTIONS[result.faceShape] || 'A unique face shape with its own frame recommendations.'}
              </p>
              <div className="mt-2 text-sm text-gray-500">
                Confidence: {Math.round(result.confidence * 100)}%
              </div>
            </div>

            {/* Optimal Dimensions */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold mb-4">Your Optimal Frame Dimensions</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.optimalDimensions.frameWidth}mm
                  </div>
                  <div className="text-sm text-gray-500">Frame Width</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.optimalDimensions.bridgeWidth}mm
                  </div>
                  <div className="text-sm text-gray-500">Bridge Width</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.optimalDimensions.templeLength}mm
                  </div>
                  <div className="text-sm text-gray-500">Temple Length</div>
                </div>
              </div>
            </div>

            {/* Recommended Shapes */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4">Recommended Frame Shapes</h3>
              <div className="flex flex-wrap gap-2">
                {result.recommendedFrameShapes.map((shape) => (
                  <span
                    key={shape}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {shape.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Top Recommendations */}
            {result.topRecommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Top Frame Recommendations</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.topRecommendations.slice(0, 4).map((product) => (
                    <a
                      key={product.id}
                      href={`/product/${product.slug}`}
                      className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      {product.image && (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            {product.brand && (
                              <p className="text-sm text-gray-500">{product.brand}</p>
                            )}
                          </div>
                          <div className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                            {product.score}%
                          </div>
                        </div>
                        <div className="mt-2 text-lg font-semibold">
                          ${Number(product.price).toFixed(2)}
                        </div>
                        {product.matchReasons.length > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            {product.matchReasons[0]}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  setStep('intro')
                  setResult(null)
                }}
                className="px-6 py-3 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
