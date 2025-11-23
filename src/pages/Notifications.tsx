import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Bell, CheckCircle, AlertCircle, Info, Filter } from 'lucide-react'
import type { Database } from '../types/database'

type Notification = Database['public']['Tables']['notifications']['Row']

export function Notifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadNotifications()
  }, [profile, filter])

  const loadNotifications = async () => {
    if (!profile) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (filter === 'unread') {
        query = query.eq('is_read', false)
      } else if (filter === 'read') {
        query = query.eq('is_read', true)
      }

      const { data, error } = await query

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds)

      if (error) throw error
      loadNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'error':
        return AlertCircle
      default:
        return Info
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
          <p className="text-slate-600 mt-1">View all your notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filter:</span>
          </div>
          <div className="flex space-x-2">
            {['all', 'unread', 'read'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <div className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No notifications</h3>
          <p className="text-slate-600">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getTypeIcon(notification.type)
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow ${
                  !notification.is_read ? 'border-blue-200 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`mt-1 ${getTypeColor(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>
                          {new Date(notification.created_at).toLocaleDateString()}{' '}
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </span>
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View Details →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Mark as read
                    </button>
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

