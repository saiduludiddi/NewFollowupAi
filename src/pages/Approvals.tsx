import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ShieldCheck, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'
import type { Database } from '../types/database'

type Approval = Database['public']['Tables']['approvals']['Row']

export function Approvals() {
  const { profile } = useAuth()
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadApprovals()
  }, [profile, filter])

  const loadApprovals = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('approvals')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.is('action', null)
      } else if (filter !== 'all') {
        query = query.eq('action', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setApprovals(data || [])
    } catch (error) {
      console.error('Error loading approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: Approval['action']) => {
    switch (action) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 're_request':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getActionIcon = (action: Approval['action']) => {
    switch (action) {
      case 'approved':
        return CheckCircle
      case 'rejected':
        return XCircle
      case 're_request':
        return Clock
      default:
        return ShieldCheck
    }
  }

  const handleApprove = async (id: string) => {
    if (!profile) return

    setProcessingId(id)
    try {
      const { error } = await supabase
        .from('approvals')
        .update({
          action: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewer_id: profile.id,
        })
        .eq('id', id)

      if (error) throw error
      loadApprovals()
    } catch (error) {
      console.error('Error approving:', error)
      alert('Failed to approve. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string, remarks?: string) => {
    if (!profile) return

    const rejectionRemarks = remarks || prompt('Please provide rejection remarks:')
    if (!rejectionRemarks) return

    setProcessingId(id)
    try {
      const { error } = await supabase
        .from('approvals')
        .update({
          action: 'rejected',
          remarks: rejectionRemarks,
          reviewed_at: new Date().toISOString(),
          reviewer_id: profile.id,
        })
        .eq('id', id)

      if (error) throw error
      loadApprovals()
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('Failed to reject. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const getTypeLabel = (type: Approval['approval_type']) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const pendingCount = approvals.filter((a) => !a.action).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Approvals</h2>
          <p className="text-slate-600 mt-1">Review and approve submissions</p>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg">
            <span className="font-medium">{pendingCount} Pending Approval{pendingCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filter:</span>
          </div>
          <div className="flex space-x-2">
            {['pending', 'all', 'approved', 'rejected', 're_request'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No approvals found</h3>
          <p className="text-slate-600">
            {filter === 'pending'
              ? 'No pending approvals at this time'
              : 'No approvals match the selected filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const ActionIcon = getActionIcon(approval.action)
            const isPending = !approval.action

            return (
              <div
                key={approval.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {getTypeLabel(approval.approval_type)}
                      </h3>
                      {approval.action && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getActionColor(
                            approval.action
                          )}`}
                        >
                          <ActionIcon className="w-3 h-3" />
                          <span>{approval.action.replace('_', ' ')}</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </div>
                    {approval.remarks && (
                      <p className="text-slate-600 mb-4">{approval.remarks}</p>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-slate-500">
                      <span>
                        Submitted: {new Date(approval.submitted_at).toLocaleDateString()}
                      </span>
                      {approval.reviewed_at && (
                        <span>
                          Reviewed: {new Date(approval.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {isPending && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        disabled={processingId === approval.id}
                        className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === approval.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        disabled={processingId === approval.id}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processingId === approval.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

