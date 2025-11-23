import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FolderOpen, FileText, CheckCircle, AlertCircle, Clock, Filter, Upload } from 'lucide-react'
import type { Database } from '../types/database'

type Document = Database['public']['Tables']['documents']['Row']

export function Documents() {
  const { profile } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [verificationFilter, setVerificationFilter] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [profile, statusFilter, verificationFilter])

  const loadDocuments = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (verificationFilter !== 'all') {
        query = query.eq('verification_status', verificationFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVerificationColor = (status: Document['verification_status']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'flagged':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getVerificationIcon = (status: Document['verification_status']) => {
    switch (status) {
      case 'verified':
        return CheckCircle
      case 'rejected':
        return AlertCircle
      case 'flagged':
        return AlertCircle
      default:
        return Clock
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
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
          <h2 className="text-2xl font-bold text-slate-900">Documents Management</h2>
          <p className="text-slate-600 mt-1">Manage all documents across your organization</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <div className="flex space-x-2">
              {['all', 'active', 'archived', 'deleted'].map((status) => (
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
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Verification:</span>
            <div className="flex space-x-2">
              {['all', 'pending', 'verified', 'rejected', 'flagged'].map((status) => (
                <button
                  key={status}
                  onClick={() => setVerificationFilter(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    verificationFilter === status
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

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No documents found</h3>
          <p className="text-slate-600">Upload documents to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((document) => {
            const VerificationIcon = getVerificationIcon(document.verification_status)
            return (
              <div
                key={document.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {document.name}
                      </h3>
                      <p className="text-xs text-slate-500">{document.document_type}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getVerificationColor(
                      document.verification_status
                    )}`}
                  >
                    <VerificationIcon className="w-3 h-3" />
                    <span>{document.verification_status}</span>
                  </span>
                  {document.is_expired && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Expired
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Size: {formatFileSize(document.file_size)}</p>
                  {document.expiry_date && (
                    <p>Expires: {new Date(document.expiry_date).toLocaleDateString()}</p>
                  )}
                  {document.ai_classification_type && (
                    <p>AI Type: {document.ai_classification_type}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setSelectedDocument(document)}
                    className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">
                Drag and drop files here, or click to browse
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Select Files
              </button>
              <p className="text-xs text-slate-500 mt-4">
                Supported: PDF, Images, Word, Excel (Max 10MB per file)
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Document Details</h3>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Document Name</span>
                  <p className="text-sm font-medium text-slate-900">{selectedDocument.name}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Type</span>
                  <p className="text-sm font-medium text-slate-900">{selectedDocument.document_type}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Size</span>
                  <p className="text-sm font-medium text-slate-900">
                    {formatFileSize(selectedDocument.file_size)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Verification Status</span>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedDocument.verification_status}
                  </p>
                </div>
              </div>
              {selectedDocument.extracted_data &&
                Object.keys(selectedDocument.extracted_data).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Extracted Data</h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedDocument.extracted_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedDocument(null)}
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

