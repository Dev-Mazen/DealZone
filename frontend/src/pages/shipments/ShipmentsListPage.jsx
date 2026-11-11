import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Truck,
  Package,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Building2,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  FileText,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { shipmentService } from '../../shared/api/services/dealService'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'

const statusVariant = {
  Pending: 'warning',
  Assigned: 'info',
  PickedUp: 'cyan',
  InTransit: 'cyan',
  OutForDelivery: 'info',
  Delivered: 'success',
  Failed: 'error',
  Cancelled: 'error',
}

const statusOptions = [
  { value: '', label: 'All Statuses', labelAr: 'جميع الحالات' },
  { value: 'Pending', label: 'Pending', labelAr: 'قيد التجهيز' },
  { value: 'Assigned', label: 'Assigned', labelAr: 'تم تعيين الناقل' },
  { value: 'PickedUp', label: 'Picked Up', labelAr: 'تم الاستلام' },
  { value: 'InTransit', label: 'In Transit', labelAr: 'في الطريق' },
  { value: 'OutForDelivery', label: 'Out for Delivery', labelAr: 'خارج للتسليم' },
  { value: 'Delivered', label: 'Delivered', labelAr: 'تم التسليم' },
  { value: 'Failed', label: 'Failed', labelAr: 'فشل التسليم' },
  { value: 'Cancelled', label: 'Cancelled', labelAr: 'ملغاة' },
]

const getStatusLabel = (status, isAr) => {
  const mapAr = {
    Pending: 'قيد التجهيز',
    Assigned: 'تم تعيين الناقل',
    PickedUp: 'تم الاستلام',
    InTransit: 'في الطريق 🚚',
    OutForDelivery: 'خارج للتسليم',
    Delivered: 'تم التسليم ✓',
    Failed: 'فشل التسليم',
    Cancelled: 'ملغاة',
  }
  const mapEn = {
    Pending: 'Pending',
    Assigned: 'Assigned',
    PickedUp: 'Picked Up',
    InTransit: 'In Transit',
    OutForDelivery: 'Out for Delivery',
    Delivered: 'Delivered',
    Failed: 'Failed',
    Cancelled: 'Cancelled',
  }
  return isAr ? (mapAr[status] || status) : (mapEn[status] || status)
}

export default function ShipmentsListPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const { isBuyerOnly, isSupplierOnly, hasBothCapabilities, hasCompany, isVerified } = usePermissions()

  const [filterRole, setFilterRole] = useState(
    isSupplierOnly ? 'supplier' : isBuyerOnly ? 'buyer' : 'all'
  )
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  useEffect(() => {
    if (isSupplierOnly && filterRole !== 'supplier') {
      setFilterRole('supplier')
    } else if (isBuyerOnly && filterRole !== 'buyer') {
      setFilterRole('buyer')
    }
  }, [isSupplierOnly, isBuyerOnly])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shipments', 'mine', { role: filterRole, status: statusFilter, pageNumber, pageSize }],
    queryFn: () => shipmentService.getMine({
      role: filterRole === 'all' ? undefined : filterRole,
      status: statusFilter || undefined,
      pageNumber,
      pageSize,
    }),
    enabled: hasCompany && isVerified,
    retry: 1,
  })

  const shipments = data?.items ?? []

  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return shipments
    const q = searchQuery.toLowerCase().trim()
    return shipments.filter((shp) => {
      const matchTitle = (shp.materialTitle || '').toLowerCase().includes(q)
      const matchNum = (shp.shipmentNumber || '').toLowerCase().includes(q)
      const matchDeal = (shp.dealNumber || '').toLowerCase().includes(q)
      const matchDest = (shp.destinationLocation || '').toLowerCase().includes(q)
      const matchOrigin = (shp.originLocation || '').toLowerCase().includes(q)
      const matchCarrier = (shp.carrierName || '').toLowerCase().includes(q)
      const matchTracking = (shp.trackingNumber || '').toLowerCase().includes(q)
      return matchTitle || matchNum || matchDeal || matchDest || matchOrigin || matchCarrier || matchTracking
    })
  }, [shipments, searchQuery])

  // Company onboarding wall check
  if (!hasCompany) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-blue-50 text-[#1266D6] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200">
          <Building2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'ملف الشركة مطلوب للوصول إلى الشحنات' : 'Company Profile Required'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          {isAr
            ? 'لمتابعة أذون الشحن وحركة النقل الثقيل للخامات الصناعية، يجب أولاً إنشاء وتوثيق ملف الشركة.'
            : 'To track heavy haulage material consignments, please register your company profile first.'}
        </p>
        <Button as={Link} to="/onboarding" variant="primary" size="md">
          {isAr ? 'إنشاء ملف الشركة الآن' : 'Create Company Profile'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Verification Notice Banner */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {isAr
                  ? 'حساب الشركة في وضع المعاينة — التوثيق مطلوب لإدارة وتتبع الشحنات الحية'
                  : 'Company Account in Preview Mode — Verification required to manage live shipments'}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {isAr
                  ? 'يرجى استكمال رفع السجل التجاري والبطاقة الضريبية لتفعيل خدمات النقل واللوجستيات.'
                  : 'Please complete legal verification with CR and Tax Card to unlock logistics tracking.'}
              </p>
            </div>
          </div>
          <Button as={Link} to="/onboarding/verification" size="xs" variant="primary" className="shrink-0">
            {isAr ? 'استكمال التوثيق' : 'Verify Account'}
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#06245B]">
              {filterRole === 'buyer'
                ? isAr ? 'الشحنات الواردة للمصنع' : 'Inbound Factory Consignments'
                : filterRole === 'supplier'
                ? isAr ? 'شحنات التوريد الصادرة' : 'Outbound Dispatches'
                : isAr ? 'الشحنات واللوجستيات الصناعية' : 'Industrial Shipments & Logistics'}
            </h1>
            <Badge variant="cyan">
              {isLoading ? '...' : `${filteredShipments.length} ${isAr ? 'شحنات' : 'shipments'}`}
            </Badge>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            {isAr
              ? 'متابعة حركة النقل الثقيل للخامات بين المناطق الصناعية وتأكيد الفحص والاستلام'
              : 'Track heavy haulage material transit between industrial zones and confirm delivery'}
          </p>
        </div>

        {/* Tab switch for dual roles */}
        {hasBothCapabilities && (
          <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 text-xs font-bold shrink-0">
            <button
              onClick={() => {
                setFilterRole('all')
                setPageNumber(1)
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterRole === 'all'
                  ? 'bg-white text-[#06245B] shadow-sm'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'جميع الشحنات' : 'All Shipments'}
            </button>
            <button
              onClick={() => {
                setFilterRole('buyer')
                setPageNumber(1)
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterRole === 'buyer'
                  ? 'bg-white text-[#06245B] shadow-sm'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'الواردة (مشتري)' : 'Inbound (Buyer)'}
            </button>
            <button
              onClick={() => {
                setFilterRole('supplier')
                setPageNumber(1)
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterRole === 'supplier'
                  ? 'bg-white text-[#06245B] shadow-sm'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'الصادرة (مورد)' : 'Outbound (Supplier)'}
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'بحث برقم الشحنة، الخامة، الناقل، المنطقة...'
                : 'Search by shipment #, material, carrier, destination...'
            }
            className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1266D6] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">
              {isAr ? 'الحالة:' : 'Status:'}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPageNumber(1)
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1266D6] bg-white text-slate-800"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isAr ? opt.labelAr : opt.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {isLoading ? '...' : `${filteredShipments.length} ${isAr ? 'شحنات' : 'shipments'}`}
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-red-900">
                {isAr ? 'تعذر تحميل بيانات الشحنات' : 'Failed to load shipments'}
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                {error?.problem?.detail || error?.message || (isAr ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later')}
              </p>
            </div>
          </div>
          <Button size="xs" variant="outline" onClick={() => refetch()}>
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <PageSpinner />}

      {/* Empty State */}
      {!isLoading && !error && filteredShipments.length === 0 && (
        <EmptyState
          icon={Truck}
          title={isAr ? 'لا توجد شحنات مطابقة' : 'No Shipments Found'}
          description={
            isAr
              ? 'يتم إصدار أمر الشحن تلقائياً بمجرد تأكيد الصفقة وتحديد تفاصيل الاستلام وجدولة النقل.'
              : 'Shipment manifests are automatically scheduled upon deal confirmation.'
          }
          action={
            <Button as={Link} to="/deals" variant="primary">
              {isAr ? 'استعراض الصفقات التجارية' : 'View Deals'}
            </Button>
          }
        />
      )}

      {/* Shipments Grid */}
      {!isLoading && !error && filteredShipments.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredShipments.map((shp) => (
              <div
                key={shp.id}
                onClick={() => navigate(`/shipments/${shp.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#1266D6] bg-blue-50 px-2 py-0.5 rounded-md">
                          {shp.shipmentNumber}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {shp.dealNumber}
                        </span>
                        {shp.arrangement && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {shp.arrangement === 'SupplierArranged'
                              ? isAr ? 'نقل المورد' : 'Supplier Logistics'
                              : isAr ? 'شحن ديل زون' : 'DealZone Logistics'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#06245B] text-base group-hover:text-[#1266D6] transition-colors">
                        {shp.materialTitle}
                      </h3>
                    </div>

                    <Badge variant={statusVariant[shp.status] || 'info'}>
                      {getStatusLabel(shp.status, isAr)}
                    </Badge>
                  </div>

                  {/* Logistics details */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-2 mb-4 text-xs text-slate-600">
                    {shp.originLocation && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="text-slate-400">{isAr ? 'نقطة الانطلاق:' : 'Origin:'}</span>
                        <span className="text-slate-700 truncate">{shp.originLocation}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-rose-500 shrink-0" />
                      <span className="text-slate-400">{isAr ? 'وجهة التسليم:' : 'Destination:'}</span>
                      <strong className="text-slate-800 truncate">{shp.destinationLocation}</strong>
                    </div>

                    {shp.carrierName && (
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-[#1266D6] shrink-0" />
                        <span className="text-slate-400">{isAr ? 'الناقل:' : 'Carrier:'}</span>
                        <span className="text-slate-700 font-semibold">{shp.carrierName}</span>
                        {shp.trackingNumber && (
                          <span className="text-slate-400 font-mono">({shp.trackingNumber})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#1266D6]" />
                      <span>
                        {isAr ? 'الوصول المتوقع: ' : 'ETA: '}
                        <strong className="text-[#06245B]">{formatDate(shp.estimatedDeliveryDateUtc)}</strong>
                      </span>
                    </div>

                    {shp.pickupDateUtc && (
                      <span className="text-[11px] text-slate-400">
                        {isAr ? 'تاريخ التحميل: ' : 'Picked up: '}
                        {formatDate(shp.pickupDateUtc)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1266D6] flex items-center gap-1 group-hover:underline">
                    <span>{isAr ? 'تتبع مسار الشحنة وبوليصة النقل' : 'Track Route & Waybill'}</span>
                    {isAr ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </span>

                  <Button size="xs" variant="primary">
                    {isAr ? 'تفاصيل الشحنة' : 'View Manifest'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={16} />}
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
              >
                {isAr ? 'السابق' : 'Previous'}
              </Button>
              <span className="text-xs text-slate-500 font-mono">
                {isAr ? `${pageNumber} من ${data.totalPages}` : `${pageNumber} / ${data.totalPages}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                iconEnd={<ChevronRight size={16} />}
                disabled={pageNumber >= data.totalPages}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                {isAr ? 'التالي' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
