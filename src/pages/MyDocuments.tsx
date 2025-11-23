import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FolderOpen, FileText, Calendar, Download } from 'lucide-react';
import type { Database } from '../types/database';

type Document = Database['public']['Tables']['documents']['Row'];

export function MyDocuments() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [profile]);

  const loadDocuments = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Documents</h2>
        <p className="text-slate-600 mt-1">Manage your uploaded documents</p>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-600">You haven't uploaded any documents yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{doc.name}</h3>
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                </div>
                {doc.expiry_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Expires: {new Date(doc.expiry_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Version {doc.version}
                </span>
                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

