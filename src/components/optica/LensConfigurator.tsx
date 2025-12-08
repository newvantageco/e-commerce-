'use client'

/**
 * OpticaLens™ Lens Configurator Component
 *
 * Helps users select optimal lens configuration based on their
 * prescription, lifestyle, and budget.
 */

import { useState } from 'react'
import {
  Glasses,
  Monitor,
  Book,
  Car,
  Dumbbell,
  Sparkles,
  Wallet,
  Award,
  Shield,
  Sun,
  Droplets,
  Eye,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react'

type UsageType = 'EVERYDAY' | 'COMPUTER' | 'READING' | 'DRIVING' | 'SPORTS' | 'FASHION'
type BudgetRange = 'BUDGET' | 'MID_RANGE' | 'PREMIUM'
type PriorityFactor = 'THIN_LIGHT' | 'DURABILITY' | 'CLARITY' | 'PROTECTION' | 'COST'

interface LensRecommendation {
  lensIndex: {
    id: string
    name: string
    description: string
    refractiveIndex: number
    thicknessReduction: string
    impactResistance: string
  }
  lensDesign: string
  coatings: Array<{
    id: string
    name: string
    description: string
    price: number
    benefits: string[]
  }>
  estimatedThickness: {
    center: string
    edge: string
  }
  estimatedWeight: string
  estimatedCost: {
    lensBase: number
    coatings: number
    total: number
    formatted: string
  }
}

interface ConfiguratorResult {
  recommendation: LensRecommendation
  explanations: Array<{
    category: string
    recommendation: string
    reason: string
  }>
  alternatives: Array<{
    lensIndex: { id: string; name: string }
    coatings: string[]
    priceDifference: number
    benefits: string[]
    tradeoffs: string[]
  }>
}

const USAGE_OPTIONS: Array<{ value: UsageType; label: string; icon: React.ReactNode; description: string }> = [
  { value: 'EVERYDAY', label: 'Everyday Wear', icon: <Glasses className="w-5 h-5" />, description: 'General daily use' },
  { value: 'COMPUTER', label: 'Computer/Screen', icon: <Monitor className="w-5 h-5" />, description: 'Digital screen work' },
  { value: 'READING', label: 'Reading', icon: <Book className="w-5 h-5" />, description: 'Books and close work' },
  { value: 'DRIVING', label: 'Driving', icon: <Car className="w-5 h-5" />, description: 'Day or night driving' },
  { value: 'SPORTS', label: 'Sports/Active', icon: <Dumbbell className="w-5 h-5" />, description: 'Physical activities' },
  { value: 'FASHION', label: 'Fashion', icon: <Sparkles className="w-5 h-5" />, description: 'Style-focused wear' },
]

const BUDGET_OPTIONS: Array<{ value: BudgetRange; label: string; description: string; priceRange: string }> = [
  { value: 'BUDGET', label: 'Budget-Friendly', description: 'Essential features', priceRange: '$50-100' },
  { value: 'MID_RANGE', label: 'Mid-Range', description: 'Balanced value', priceRange: '$100-200' },
  { value: 'PREMIUM', label: 'Premium', description: 'Best quality', priceRange: '$200+' },
]

const PRIORITY_OPTIONS: Array<{ value: PriorityFactor; label: string; icon: React.ReactNode }> = [
  { value: 'THIN_LIGHT', label: 'Thin & Light', icon: <Eye className="w-4 h-4" /> },
  { value: 'DURABILITY', label: 'Durability', icon: <Shield className="w-4 h-4" /> },
  { value: 'CLARITY', label: 'Optical Clarity', icon: <Sun className="w-4 h-4" /> },
  { value: 'PROTECTION', label: 'Eye Protection', icon: <Droplets className="w-4 h-4" /> },
  { value: 'COST', label: 'Cost Savings', icon: <Wallet className="w-4 h-4" /> },
]

export default function LensConfigurator() {
  const [step, setStep] = useState<'usage' | 'budget' | 'priorities' | 'result'>('usage')
  const [usageType, setUsageType] = useState<UsageType>('EVERYDAY')
  const [budgetRange, setBudgetRange] = useState<BudgetRange>('MID_RANGE')
  const [priorities, setPriorities] = useState<PriorityFactor[]>([])
  const [result, setResult] = useState<ConfiguratorResult | null>(null)
  const [loading, setLoading] = useState(false)

  const togglePriority = (priority: PriorityFactor) => {
    setPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : prev.length < 3
        ? [...prev, priority]
        : prev
    )
  }

  const handleGetRecommendation = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/optica/lens-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageType,
          budgetRange,
          priorityFactors: priorities.length > 0 ? priorities : ['CLARITY'],
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to get recommendations')
      }

      setResult(data.data)
      setStep('result')
    } catch (error) {
      console.error('Error getting recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full mb-4">
          <Award className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium text-green-600">OpticaLens™</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Lens Configuration Guide
        </h1>
        <p className="text-gray-600">
          Answer a few questions to get personalized lens recommendations
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['Usage', 'Budget', 'Priorities', 'Result'].map((label, idx) => {
          const steps = ['usage', 'budget', 'priorities', 'result']
          const currentIdx = steps.indexOf(step)
          const isActive = idx <= currentIdx
          const isCurrent = idx === currentIdx

          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}
              >
                {isActive && idx < currentIdx ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 3 && (
                <div className={`w-8 h-0.5 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        {/* Usage Step */}
        {step === 'usage' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">How will you use these glasses?</h2>
            <p className="text-gray-600 mb-6">Select your primary use case</p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {USAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setUsageType(option.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    usageType === option.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    usageType === option.value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.icon}
                  </div>
                  <h3 className="font-medium">{option.label}</h3>
                  <p className="text-sm text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep('budget')}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Budget Step */}
        {step === 'budget' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">What's your budget?</h2>
            <p className="text-gray-600 mb-6">Select your preferred price range for lenses</p>

            <div className="space-y-4 mb-8">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudgetRange(option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    budgetRange === option.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <h3 className="font-medium">{option.label}</h3>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    budgetRange === option.value
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.priceRange}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('usage')}
                className="px-6 py-3 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('priorities')}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Priorities Step */}
        {step === 'priorities' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">What matters most to you?</h2>
            <p className="text-gray-600 mb-6">Select up to 3 priorities</p>

            <div className="flex flex-wrap gap-3 mb-8">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => togglePriority(option.value)}
                  className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                    priorities.includes(option.value)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {option.icon}
                  {option.label}
                  {priorities.includes(option.value) && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-xl mb-8">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                {priorities.length === 0
                  ? 'Select at least one priority to continue'
                  : `You've selected ${priorities.length} priorit${priorities.length === 1 ? 'y' : 'ies'}. ${3 - priorities.length} more available.`}
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('budget')}
                className="px-6 py-3 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGetRecommendation}
                disabled={priorities.length === 0 || loading}
                className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Getting Recommendation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get Recommendation
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && result && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Recommendation Ready
              </div>
              <h2 className="text-2xl font-bold">Your Optimal Lens Configuration</h2>
            </div>

            {/* Main Recommendation */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{result.recommendation.lensIndex.name}</h3>
                  <p className="text-sm text-gray-600">{result.recommendation.lensIndex.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {result.recommendation.estimatedCost.formatted}
                  </div>
                  <div className="text-xs text-gray-500">estimated lens cost</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="bg-white/60 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Thickness Reduction</div>
                  <div className="font-semibold">{result.recommendation.lensIndex.thicknessReduction}</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Weight (per lens)</div>
                  <div className="font-semibold">{result.recommendation.estimatedWeight}</div>
                </div>
                <div className="bg-white/60 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Impact Resistance</div>
                  <div className="font-semibold">{result.recommendation.lensIndex.impactResistance}</div>
                </div>
              </div>

              <div className="bg-white/60 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-2">Lens Design</div>
                <div className="font-semibold">{result.recommendation.lensDesign.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Recommended Coatings */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Recommended Coatings</h3>
              <div className="space-y-2">
                {result.recommendation.coatings.map((coating) => (
                  <div
                    key={coating.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{coating.name}</div>
                      <div className="text-sm text-gray-500">{coating.description}</div>
                    </div>
                    <div className="text-green-600 font-medium">
                      +${coating.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanations */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Why We Recommend This</h3>
              <div className="space-y-3">
                {result.explanations.map((explanation, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm text-gray-500">{explanation.category}</div>
                      <div className="text-gray-800">{explanation.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternatives */}
            {result.alternatives.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Alternative Options</h3>
                <div className="space-y-3">
                  {result.alternatives.map((alt, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{alt.lensIndex.name}</div>
                        <div className={`text-sm font-medium ${
                          alt.priceDifference < 0 ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {alt.priceDifference < 0 ? '' : '+'}${alt.priceDifference}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Benefits: </span>
                          {alt.benefits.join(', ')}
                        </div>
                      </div>
                      {alt.tradeoffs.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          Trade-offs: {alt.tradeoffs.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setStep('usage')
                  setResult(null)
                  setPriorities([])
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
