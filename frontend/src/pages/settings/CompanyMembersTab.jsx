import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Clock,
  Crown,
  Building2,
  Loader2,
  X,
} from 'lucide-react'
import { companyService } from '../../shared/api/services/companyService'
import { usePermissions } from '../../hooks/usePermissions'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'

const ROLE_OPTIONS = [
  {
    value: 'Owner',
    labelEn: 'Owner',
    labelAr: 'مالك المنشأة',
    descEn: 'Full control over company operations, commercial contracts, and member management.',
    descAr: 'صلاحيات كاملة تشمل إدارة العقود التجارية والصفقات وتعديل بيانات وفريق العمل.',
  },
  {
    value: 'Admin',
    labelEn: 'Admin',
    labelAr: 'مسؤول إداري',
    descEn: 'Can manage team members, update company details, and supervise commercial deals.',
    descAr: 'إدارة أعضاء الفريق وتحديث بيانات الشركة والموافقة على العمليات التجارية.',
  },
  {
    value: 'ProcurementManager',
    labelEn: 'Procurement Manager',
    labelAr: 'مدير المشتريات',
    descEn: 'Authorized to publish RFQs, review incoming bids, and accept supplier quotes.',
    descAr: 'إصدار ونشر طلبات عروض الأسعار، مراجعة عروض الموردين وقبول المناقصات.',
  },
  {
    value: 'SalesManager',
    labelEn: 'Sales Manager',
    labelAr: 'مدير المبيعات',
    descEn: 'Authorized to submit quotations on open tenders and manage dispatch milestones.',
    descAr: 'تقديم عروض الأسعار في مناقصات السوق المفتوحة ومتابعة مواعيد التوريد والشحن.',
  },
  {
    value: 'Member',
    labelEn: 'Member',
    labelAr: 'عضو فريق',
    descEn: 'Read-only visibility into company deals, catalog items, and shipment tracking.',
    descAr: 'اطلاع عام على الصفقات والشحنات وبيانات المنشأة دون صلاحيات تعاقدية.',
  },
]

const roleBadgeVariant = {
  Owner: 'purple',
  Admin: 'cyan',
  ProcurementManager: 'info',
  SalesManager: 'success',
  Member: 'navy',
}

export default function CompanyMembersTab() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()
  const qc = useQueryClient()
  const { isOwner, isAdmin, canManageCompanyMembers } = usePermissions()

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState('Member')
  const [addError, setAddError] = useState('')

  const [roleModalMember, setRoleModalMember] = useState(null)
  const [targetRole, setTargetRole] = useState('Member')

  const [deleteMember, setDeleteMember] = useState(null)

  // Query members
  const { data: members, isLoading, error, refetch } = useQuery({
    queryKey: ['company', 'members'],
    queryFn: companyService.getMembers,
  })

  // Add Member Mutation
  const addMutation = useMutation({
    mutationFn: (data) => companyService.addMember(data),
    onSuccess: () => {
      toast.success(isAr ? 'تمت إضافة عضو الفريق بنجاح' : 'Team member added successfully')
      setIsAddModalOpen(false)
      setAddEmail('')
      setAddRole('Member')
      setAddError('')
      qc.invalidateQueries({ queryKey: ['company', 'members'] })
    },
    onError: (err) => {
      const msg = err?.problem?.detail || err?.message || (isAr ? 'فشلت إضافة العضو' : 'Failed to add member')
      setAddError(msg)
      toast.error(msg)
    },
  })

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => companyService.updateMemberRole(userId, { role }),
    onSuccess: () => {
      toast.success(isAr ? 'تم تحديث صلاحية العضو' : 'Member role updated successfully')
      setRoleModalMember(null)
      qc.invalidateQueries({ queryKey: ['company', 'members'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || err?.message || (isAr ? 'فشل تحديث الصلاحية' : 'Failed to update role'))
    },
  })

  // Remove Member Mutation
  const removeMutation = useMutation({
    mutationFn: (userId) => companyService.removeMember(userId),
    onSuccess: () => {
      toast.success(isAr ? 'تمت إزالة العضو من الشركة' : 'Member removed from company')
      setDeleteMember(null)
      qc.invalidateQueries({ queryKey: ['company', 'members'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || err?.message || (isAr ? 'فشلت إزالة العضو' : 'Failed to remove member'))
    },
  })

  const handleAddSubmit = (e) => {
    e.preventDefault()
    setAddError('')
    if (!addEmail.trim()) {
      setAddError(isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required')
      return
    }
    addMutation.mutate({
      email: addEmail.trim(),
      role: addRole,
    })
  }

  const handleRoleChangeSubmit = (e) => {
    e.preventDefault()
    if (!roleModalMember) return
    updateRoleMutation.mutate({
      userId: roleModalMember.userId,
      role: targetRole,
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteMember) return
    removeMutation.mutate(deleteMember.userId)
  }

  // Count active owners to protect the sole owner from removal or demotion
  const ownerCount = members?.filter((m) => m.role === 'Owner').length || 0

  // Filter role options based on caller authority (Admins cannot assign Owner)
  const availableRoles = isOwner ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value !== 'Owner')

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-red-900">
          {isAr ? 'تعذر تحميل أعضاء الفريق' : 'Failed to load team members'}
        </h3>
        <p className="text-xs text-red-700 mt-1 mb-4">
          {error?.problem?.detail || error?.message}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    )
  }

  const memberList = members || []

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#06245B]">
              {isAr ? 'فريق عمل الشركة' : 'Company Team & Members'}
            </h2>
            <Badge variant="cyan">
              {memberList.length} {isAr ? 'أعضاء' : 'members'}
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            {isAr
              ? 'إدارة صلاحيات الموظفين ومسؤولي التوريد والمشتريات المخولين بالتعاقد نيابة عن الشركة'
              : 'Manage employee authorizations, procurement managers, and sales representatives'}
          </p>
        </div>

        {canManageCompanyMembers && (
          <Button
            variant="primary"
            size="sm"
            icon={<UserPlus size={16} />}
            onClick={() => {
              setAddEmail('')
              setAddRole('Member')
              setAddError('')
              setIsAddModalOpen(true)
            }}
          >
            {isAr ? 'إضافة عضو جديد' : 'Invite Team Member'}
          </Button>
        )}
      </div>

      {/* Member Cards Grid */}
      {memberList.length === 0 ? (
        <EmptyState
          icon={Users}
          title={isAr ? 'لا يوجد أعضاء مضافون' : 'No Team Members Yet'}
          description={
            isAr
              ? 'أضف زملاء العمل في مصنعك لإدارة المناقصات وعروض الأسعار معاً.'
              : 'Add your team members to collaborate on industrial procurement and sales.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memberList.map((member) => {
            const isTargetOwner = member.role === 'Owner'
            const isTargetOnlyOwner = isTargetOwner && ownerCount <= 1
            const canCallerEditTarget =
              canManageCompanyMembers && (isOwner || (isAdmin && !isTargetOwner))

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-blue-200 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Avatar & Name & Role */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#06245B] to-[#1266D6] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                        {member.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#06245B] text-base truncate">
                            {member.fullName}
                          </h3>
                          {member.isPrimary && (
                            <span
                              title={isAr ? 'جهة الاتصال الرئيسية' : 'Primary Contact'}
                              className="text-amber-500"
                            >
                              <Crown size={14} />
                            </span>
                          )}
                        </div>
                        <Badge variant={roleBadgeVariant[member.role] || 'navy'} className="mt-1">
                          {isAr
                            ? member.role === 'Owner'
                              ? 'مالك المنشأة'
                              : member.role === 'Admin'
                              ? 'مسؤول إداري'
                              : member.role === 'ProcurementManager'
                              ? 'مدير المشتريات'
                              : member.role === 'SalesManager'
                              ? 'مدير المبيعات'
                              : 'عضو فريق'
                            : member.role.replace(/([A-Z])/g, ' $1').trim()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span className="font-mono">{member.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={13} className="shrink-0" />
                      <span>
                        {isAr ? 'انضم بتاريخ: ' : 'Joined: '}
                        {formatDate(member.joinedAtUtc)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                {canCallerEditTarget && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Edit2 size={13} />}
                      onClick={() => {
                        setRoleModalMember(member)
                        setTargetRole(member.role)
                      }}
                      disabled={isTargetOnlyOwner}
                      title={
                        isTargetOnlyOwner
                          ? isAr
                            ? 'لا يمكن تغيير دور المالك الوحيد'
                            : 'Cannot change role of sole owner'
                          : undefined
                      }
                    >
                      {isAr ? 'تعديل الصلاحية' : 'Change Role'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      icon={<Trash2 size={13} />}
                      onClick={() => setDeleteMember(member)}
                      disabled={isTargetOnlyOwner}
                      title={
                        isTargetOnlyOwner
                          ? isAr
                            ? 'لا يمكن إزالة المالك الوحيد'
                            : 'Cannot remove sole owner'
                          : undefined
                      }
                    >
                      {isAr ? 'إزالة' : 'Remove'}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Member Modal ── */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={isAr ? 'إضافة عضو جديد لفريق الشركة' : 'Invite Team Member'}
          size="md"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              {isAr
                ? 'يجب أن يكون العضو مسجلاً مسبقاً بحساب في المنصة. أدخل البريد الإلكتروني الخاص به لتفويضه ضمن شركتك.'
                : 'The user must already have a registered DealZone account. Enter their email to grant them company access.'}
            </p>

            <Input
              label={isAr ? 'البريد الإلكتروني للعضو' : 'Member Email Address'}
              type="email"
              placeholder="user@example.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'صلاحية العضو في الشركة' : 'Company Role'}
              </label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1266D6]"
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {isAr ? r.labelAr : r.labelEn}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {isAr
                  ? ROLE_OPTIONS.find((r) => r.value === addRole)?.descAr
                  : ROLE_OPTIONS.find((r) => r.value === addRole)?.descEn}
              </p>
            </div>

            {addError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                disabled={addMutation.isPending}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={addMutation.isPending}
                icon={addMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              >
                {addMutation.isPending ? (isAr ? 'جاري الإضافة…' : 'Adding…') : isAr ? 'إضافة العضو' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Change Role Modal ── */}
      {roleModalMember && (
        <Modal
          isOpen={!!roleModalMember}
          onClose={() => setRoleModalMember(null)}
          title={isAr ? `تعديل صلاحية: ${roleModalMember.fullName}` : `Update Role: ${roleModalMember.fullName}`}
          size="md"
        >
          <form onSubmit={handleRoleChangeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isAr ? 'اختر الصلاحية الجديدة' : 'Select New Role'}
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1266D6]"
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {isAr ? r.labelAr : r.labelEn}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {isAr
                  ? ROLE_OPTIONS.find((r) => r.value === targetRole)?.descAr
                  : ROLE_OPTIONS.find((r) => r.value === targetRole)?.descEn}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRoleModalMember(null)}
                disabled={updateRoleMutation.isPending}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={updateRoleMutation.isPending}
                icon={updateRoleMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              >
                {updateRoleMutation.isPending ? (isAr ? 'جاري الحفظ…' : 'Saving…') : isAr ? 'حفظ الصلاحية' : 'Save Role'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteMember && (
        <Modal
          isOpen={!!deleteMember}
          onClose={() => setDeleteMember(null)}
          title={isAr ? 'تأكيد إزالة العضو' : 'Confirm Member Removal'}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              {isAr ? (
                <>
                  هل أنت متأكد من رغبتك في إزالة <strong>{deleteMember.fullName}</strong> من حساب الشركة؟ لن يتمكن من الوصول إلى الصفقات أو طرح الطلبات نيابة عن المنشأة.
                </>
              ) : (
                <>
                  Are you sure you want to remove <strong>{deleteMember.fullName}</strong> from the company? They will lose access to all company deals, bids, and RFQs.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteMember(null)}
                disabled={removeMutation.isPending}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
                disabled={removeMutation.isPending}
                icon={removeMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              >
                {removeMutation.isPending ? (isAr ? 'جاري الإزالة…' : 'Removing…') : isAr ? 'تأكيد الإزالة' : 'Remove Member'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
