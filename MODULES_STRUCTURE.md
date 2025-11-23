# FollowUp AI - Application Modules Structure

Based on the database schema, here's a comprehensive module structure organized by user role and functionality.

## 📋 Module Organization

### **CLIENT-FACING MODULES** (For `client` role)

#### 1. **Dashboard** ✅ (Already exists)
- Overview of pending requests, completed items, active tasks, overdue items
- Recent activity feed
- Upcoming due dates

#### 2. **My Requests** ✅ (Already exists)
- View all data requests sent to client
- Filter by status (sent, in_progress, completed, cancelled)
- View request details and checklist items
- Submit documents for each request item
- Track submission status

#### 3. **My Documents** ✅ (Already exists)
- View all uploaded documents
- Organize by folders (KYC, Legal, Finance, HR, Project, Custom)
- Upload new documents (local, mobile camera, Gmail, WhatsApp, Google Drive)
- View document versions
- Share documents via shareable links
- Filter by document type, status, verification status

#### 4. **My Tasks** ✅ (Already exists)
- View assigned tasks
- Filter by status (not_started, in_progress, waiting_on_client, completed, overdue)
- View task checklist items
- Submit required documents for tasks
- Track task progress

#### 5. **Notifications** (New module)
- View all notifications
- Mark as read/unread
- Filter by type
- Click to navigate to related item

---

### **ADMIN/TEAM MODULES** (For `admin`, `manager`, `team_member` roles)

#### 6. **Templates Management** ✅ (Already exists)
- Create/edit/delete templates
- Organize by categories (GST, Income Tax, KYC, HR, Vendor, Loan)
- Configure template checklist items
- Set scheduler configuration (frequency, day rules, start/end dates)
- Configure reminders (pre-due reminders)
- Set default assignees and priorities
- Version control for templates

#### 7. **Tasks Management** ✅ (Already exists - Admin view)
- View all tasks (organization-wide)
- Create one-time and recurring tasks
- Assign tasks to team members or clients
- View task occurrences for recurring tasks
- Track task checklist items
- Filter by status, priority, assignee, client
- Bulk operations

#### 8. **Requests Management** (New module)
- View all data requests (organization-wide)
- Create new requests from templates
- Send requests to clients
- Track request status and checklist items
- View document submissions
- Approve/reject submitted documents
- Re-request missing documents
- Filter by status, client, priority, due date

#### 9. **Documents Management** (New module)
- View all documents (organization-wide)
- Organize by client folders
- View AI classification and extraction results
- Verify documents
- Flag mismatches and issues
- View document versions
- Track document expiry dates
- Filter by client, type, verification status, expiry status

#### 10. **Approvals** (New module)
- View pending approvals
- Approve/reject document submissions
- Approve/reject request items
- Approve/reject tasks
- View approval history
- Filter by type, status, reviewer

#### 11. **Clients Management** (New module)
- View all clients
- Create/edit client profiles
- View client folders
- View client documents
- View client requests and tasks
- Manage client access

#### 12. **Reminders** (New module)
- View all scheduled reminders
- Create custom reminders
- Configure reminder rules
- View reminder history
- Retry failed reminders
- Filter by channel (email, WhatsApp, SMS, voice, in-app)

#### 13. **Voice Calls** (New module)
- View voice call logs
- View call transcripts
- Track call outcomes
- View follow-up actions
- Filter by status, recipient, date

---

### **SYSTEM MODULES** (For `super_admin`, `admin` roles)

#### 14. **Integrations** (New module)
- Configure Gmail integration
- Configure Google Drive integration
- Configure WhatsApp integration
- Configure voice providers (Twilio, Exotel, Kaleyra)
- View integration status
- Test integrations
- View last sync times

#### 15. **Webhooks** (New module)
- Create/edit webhook endpoints
- Configure webhook types (voice_call, document_upload, approval, reminder, custom)
- View webhook trigger history
- Test webhooks

#### 16. **AI Verification** (New module)
- View AI verification results
- Review flagged issues
- View data consistency checks
- Review expiry checks
- View format validations
- Review completeness checks

#### 17. **Document Matches** (New module)
- View smart document matches
- Review auto-linked documents
- Approve/reject AI suggestions
- View match confidence scores

#### 18. **Upload Sessions** (New module)
- View all upload sessions
- Track multi-source uploads
- View upload progress
- Retry failed uploads
- View session metadata

#### 19. **Shareable Links** (New module)
- Create shareable links for documents, requests, folders, tasks
- Set expiry dates and access limits
- Configure permissions
- View link access history
- Revoke links

#### 20. **Users Management** (New module)
- View all users
- Create/edit user profiles
- Assign roles (super_admin, admin, manager, team_member, client)
- Manage user access
- View user activity

#### 21. **Organizations** (New module - Super Admin only)
- View all organizations
- Create/edit organizations
- Configure organization settings
- Manage organization users

#### 22. **Audit Trail** (New module)
- View all system activities
- Filter by entity type, action, user, date
- View change history
- Export audit logs

#### 23. **Notifications Center** (New module)
- View all notifications (organization-wide)
- Send notifications to users
- Configure notification preferences
- View notification history

---

## 🎯 Recommended Navigation Structure

### **For Clients:**
```
Dashboard
├── My Requests
├── My Documents
│   ├── All Documents
│   ├── By Folder (KYC, Legal, Finance, HR, Project)
│   └── Upload New
├── My Tasks
└── Notifications
```

### **For Admin/Team:**
```
Dashboard
├── Templates
│   ├── All Templates
│   ├── Categories
│   └── Create New
├── Tasks
│   ├── All Tasks
│   ├── Recurring Tasks
│   └── Create New
├── Requests
│   ├── All Requests
│   ├── Pending Approvals
│   └── Create New
├── Documents
│   ├── All Documents
│   ├── Pending Verification
│   └── Expiring Soon
├── Approvals
│   ├── Pending
│   └── History
├── Clients
│   ├── All Clients
│   └── Client Details
├── Reminders
│   ├── Scheduled
│   └── History
└── Voice Calls
    ├── Recent Calls
    └── Call Logs
```

### **For Super Admin/Admin:**
```
All Admin/Team modules +
├── Integrations
│   ├── Gmail
│   ├── Google Drive
│   ├── WhatsApp
│   └── Voice Providers
├── Webhooks
├── AI Verification
├── Document Matches
├── Upload Sessions
├── Shareable Links
├── Users
├── Organizations (Super Admin only)
├── Audit Trail
└── Notifications Center
```

---

## 📝 Implementation Priority

### **Phase 1: Core Client Features** (High Priority)
1. ✅ Dashboard
2. ✅ My Requests
3. ✅ My Documents
4. ✅ My Tasks
5. Notifications

### **Phase 2: Core Admin Features** (High Priority)
6. ✅ Templates Management
7. ✅ Tasks Management
8. Requests Management
9. Documents Management
10. Approvals
11. Clients Management

### **Phase 3: Advanced Features** (Medium Priority)
12. Reminders
13. Voice Calls
14. AI Verification
15. Document Matches

### **Phase 4: System Features** (Lower Priority)
16. Integrations
17. Webhooks
18. Upload Sessions
19. Shareable Links
20. Audit Trail

---

## 🔐 Role-Based Access Control

- **Client**: Can only access client-facing modules
- **Team Member**: Can access admin modules but limited permissions
- **Manager**: Can access admin modules with more permissions
- **Admin**: Can access all admin and system modules
- **Super Admin**: Can access everything including organization management

---

## 📊 Key Features per Module

### **Requests Management**
- Create requests from templates
- Send via email/WhatsApp/voice
- Track submission status
- Approve/reject submissions
- Re-request missing items

### **Documents Management**
- AI classification and extraction
- Verification workflow
- Expiry tracking
- Version control
- Smart document matching

### **Approvals**
- Maker-checker workflow
- Document approvals
- Request item approvals
- Task approvals
- Full audit trail

### **Reminders**
- Multi-channel reminders (email, WhatsApp, SMS, voice, in-app)
- Retry logic
- Scheduled reminders
- Custom reminder rules

### **Voice Calls**
- Call initiation
- Transcript viewing
- Outcome tracking
- Follow-up actions
- Preferred reminder channel capture

---

This structure provides a comprehensive view of all modules needed based on your database schema.

