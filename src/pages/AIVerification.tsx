import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Activity, CheckCircle, XCircle, AlertTriangle, Filter, Eye } from 'lucide-react'
import type { Database } from '../types/database'

type AIVerificationResult = Database['public']['Tables']['ai_verification_results']['Row']
type Document = Database['public']['Tables']['documents']['Row']

export function AIVerification() {
  const { profile } = useAuth()
  const [results, setResults] = useState<AIVerificationResult[]>([])
  const [documents, setDocuments] = useState<Record<string, Document>>({})
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [matchFilter, setMatchFilter] = useState<string>('all')
  const [selectedResult, setSelectedResult] = useState<AIVerificationResult | null>(null)

  useEffect(() => {
    loadResults()
  }, [profile, typeFilter, matchFilter])

  const loadResults = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('ai_verification_results')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (typeFilter !== 'all') {
        query = query.eq('verification_type', typeFilter)
      }

      if (matchFilter !== 'all') {
        query = query.eq('match_status', matchFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setResults(data || [])

      // Load related documents
      const docIds = [...new Set(data?.map((r) => r.document_id).filter(Boolean) || [])]
      if (docIds.length > 0) {
        const { data: docsData } = await supabase
          .from('documents')
          .select('id, name, document_type')
          .in('id', docIds)

        if (docsData) {
          const docsMap: Record<string, Document> = {}
          docsData.forEach((doc) => {
            docsMap[doc.id] = doc as Document
          })
          setDocuments(docsMap)
        }
      }
    } catch (error) {
      console.error('Error loading verification results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: AIVerificationResult['verification_type']) => {
    switch (type) {
      case 'expiry_check':
        return 'bg-red-100 text-red-700'
      case 'data_consistency':
        return 'bg-blue-100 text-blue-700'
      case 'format_validation':
        return 'bg-purple-100 text-purple-700'
      case 'completeness_check':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getMatchColor = (status: AIVerificationResult['match_status']) => {
    switch (status) {
      case 'match':
        return 'bg-green-100 text-green-700'
      case 'mismatch':
        return 'bg-red-100 text-red-700'
      case 'missing':
        return 'bg-amber-100 text-amber-700'
      case 'invalid':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getMatchIcon = (status: AIVerificationResult['match_status']) => {
    switch (status) {
      case 'match':
        return CheckCircle
      case 'mismatch':
        return XCircle
      case 'missing':
        return AlertTriangle
      case 'invalid':
        return XCircle
      default:
        return Activity
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = {
    total: results.length,
    matches: results.filter((r) => r.match_status === 'match').length,
    mismatches: results.filter((r) => r.match_status === 'mismatch').length,
    missing: results.filter((r) => r.match_status === 'missing').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Verification Results</h2>
          <p className="text-slate-600 mt-1">
            Review AI-powered document verification and data consistency checks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Checks</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Matches</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.matches}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Mismatches</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.mismatches}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Missing</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.missing}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Type:</span>
            <div className="flex space-x-2">
              {['all', 'expiry_check', 'data_consistency', 'format_validation', 'completeness_check'].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === type
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Match Status:</span>
            <div className="flex space-x-2">
              {['all', 'match', 'mismatch', 'missing', 'invalid'].map((status) => (
                <button
                  key={status}
                  onClick={() => setMatchFilter(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    matchFilter === status
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No verification results</h3>
          <p className="text-slate-600">AI verification results will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => {
            const MatchIcon = getMatchIcon(result.match_status)
            const document = result.document_id ? documents[result.document_id] : null

            return (
              <div
                key={result.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedResult(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {result.field_name || 'Verification Check'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                          result.verification_type
                        )}`}
                      >
                        {result.verification_type.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getMatchColor(
                          result.match_status
                        )}`}
                      >
                        <MatchIcon className="w-3 h-3" />
                        <span>{result.match_status}</span>
                      </span>
                      {result.confidence_score && (
                        <span className="text-xs text-slate-500">
                          Confidence: {(result.confidence_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    {document && (
                      <p className="text-sm text-slate-600 mb-2">
                        Document: <span className="font-medium">{document.name}</span> (
                        {document.document_type})
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      {result.expected_value && (
                        <div>
                          <span className="text-slate-500">Expected:</span>{' '}
                          <span className="text-slate-900 font-medium">{result.expected_value}</span>
                        </div>
                      )}
                      {result.actual_value && (
                        <div>
                          <span className="text-slate-500">Actual:</span>{' '}
                          <span className="text-slate-900 font-medium">{result.actual_value}</span>
                        </div>
                      )}
                    </div>
                    {result.flagged_issues && Array.isArray(result.flagged_issues) && result.flagged_issues.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-3 mb-2">
                        <p className="text-sm font-medium text-red-900 mb-1">Flagged Issues:</p>
                        <ul className="list-disc list-inside text-sm text-red-700">
                          {result.flagged_issues.map((issue: string, idx: number) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      Verified: {new Date(result.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Verification Details</h3>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Verification Type</span>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedResult.verification_type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Match Status</span>
                  <p className="text-sm font-medium text-slate-900">{selectedResult.match_status}</p>
                </div>
                {selectedResult.field_name && (
                  <div>
                    <span className="text-sm text-slate-500">Field Name</span>
                    <p className="text-sm font-medium text-slate-900">{selectedResult.field_name}</p>
                  </div>
                )}
                {selectedResult.confidence_score && (
                  <div>
                    <span className="text-sm text-slate-500">Confidence Score</span>
                    <p className="text-sm font-medium text-slate-900">
                      {(selectedResult.confidence_score * 100).toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
              {selectedResult.expected_value && selectedResult.actual_value && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Value Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Expected</p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedResult.expected_value}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Actual</p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedResult.actual_value}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {selectedResult.verification_details &&
                Object.keys(selectedResult.verification_details).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Verification Details</h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedResult.verification_details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
