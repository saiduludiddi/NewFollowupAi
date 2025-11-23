import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FileStack, CheckCircle, XCircle, Filter, Eye } from 'lucide-react'
import type { Database } from '../types/database'

type DocumentMatch = Database['public']['Tables']['document_matches']['Row']

export function DocumentMatches() {
  const { profile } = useAuth()
  const [matches, setMatches] = useState<DocumentMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadMatches()
  }, [profile, statusFilter])

  const loadMatches = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('document_matches')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (statusFilter !== 'all') {
        query = query.eq('match_status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setMatches(data || [])
    } catch (error) {
      console.error('Error loading document matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: DocumentMatch['match_status']) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Document Matches</h2>
          <p className="text-slate-600 mt-1">
            View AI-powered document matching and smart document re-use suggestions
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <div className="flex space-x-2">
              {['all', 'matched', 'pending', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
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

      {matches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileStack className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No document matches found</h3>
          <p className="text-slate-600">Document matches will appear here when AI finds similar documents</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Match Confidence: {(match.match_confidence * 100).toFixed(0)}%
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        match.match_status
                      )}`}
                    >
                      {match.match_status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Request Item: {match.request_checklist_item_id}</p>
                    <p>Document: {match.matched_document_id}</p>
                  </div>
                </div>
                <button className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

