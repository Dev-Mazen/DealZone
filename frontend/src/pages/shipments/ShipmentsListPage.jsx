import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Phone,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/format'

const statusVariant = {
  Pending: 'warning',
  Dispatched: 'info',
  InTransit: 'cyan',
  Delivered: 'success',
  Failed: 'error',
}

const SAMPLE_SHIPMENTS = [
  {
    id: 'shp-001',
    shipmentNumber: 'SHP-2026-0412',
    dealNumber: 'DEAL-2026-0891',
    materialTitle: 'Prime Structural Steel Billets 150x150mm (50 MT)',
    buyerName: 'Cairo Metal Fabricators SAE',
    supplierName: 'Al Ezz Dekheila Steel Co.',
    carrierName: 'El Sewedy Industrial Logistics',
    driverPhone: '+20 100 234 5678',
    trackingNumber: 'ESW-EGY-90214',
    origin: 'Dekheila Port Industrial Complex, Alexandria',
    destination: '10th of Ramadan Industrial Zone B3, Sharkia',
    status: 'InTransit',
    role: 'buyer',
    estimatedArrival: new Date(Date.now() + 1 * 86400000).toISOString(),
    dispatchedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'shp-002',
    shipmentNumber: 'SHP-2026-0398',
    dealNumber: 'DEAL-2026-0845',
    materialTitle: 'HDPE Injection Molding Resin HMA016 (25 MT)',
    buyerName: 'Cairo Metal Fabricators SAE',
    supplierName: 'Sidi Kerir Petrochemicals (SIDPEC)',
    carrierName: 'Nile Express Heavy Haulage',
    driverPhone: '+20 102 888 1234',
    trackingNumber: 'NLX-88231',
    origin: 'SIDPEC Plant, Amreya, Alexandria',
    destination: 'Borg El Arab Industrial Area 2, Alexandria',
    status: 'Dispatched',
    role: 'buyer',
    estimatedArrival: new Date(Date.now() + 2 * 86400000).toISOString(),
    dispatchedAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
  },
  {
    id: 'shp-003',
    shipmentNumber: 'SHP-2026-0355',
    dealNumber: 'DEAL-2026-0792',
    materialTitle: 'Caustic Soda Flakes 99% (10 MT in 25kg bags)',
    buyerName: 'Misr Rayon & Textile Mills',
    supplierName: 'Cairo Metal Fabricators SAE (Trading Div)',
    carrierName: 'Direct Fleet Carrier #4',
    driverPhone: '+20 111 555 4321',
    trackingNumber: 'DIR-44102',
    origin: 'Abu Qir Chemical Hub, Alexandria',
    destination: 'Kafr El Dawar Industrial Complex, Beheira',
    status: 'Delivered',
    role: 'supplier',
    estimatedArrival: new Date(Date.now() - 5 * 86400000).toISOString(),
    dispatchedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'shp-004',
    shipmentNumber: 'SHP-2026-0320',
    dealNumber: 'DEAL-2026-0710',
    materialTitle: '5-Ply Heavy Corrugated Packing Sheets (15,000 Pcs)',
    buyerName: 'Cairo Metal Fabricators SAE',
    supplierName: 'Modern Nile Packaging Co.',
    carrierName: 'DealZone Verified Carrier Network',
    driverPhone: '+20 109 777 6543',
    trackingNumber: 'DZ-CAR-1082',
    origin: 'Obour City Industrial Zone Block 12, Qalyubia',
    destination: '6th of October Industrial Zone 4, Giza',
    status: 'Pending',
    role: 'buyer',
    estimatedArrival: new Date(Date.now() + 4 * 86400000).toISOString(),
    dispatchedAt: null,
  },
]

export default function ShipmentsListPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const { isBuyerOnly, isSupplierOnly, hasBothCapabilities } = usePermissions()

  const [filterRole, setFilterRole] = useState(
    isSupplierOnly ? 'supplier' : isBuyerOnly ? 'buyer' : 'all'
  )
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredShipments = useMemo(() => {
    return SAMPLE_SHIPMENTS.filter((shp) => {
      if (filterRole === 'buyer' && shp.role !== 'buyer') return false
      if (filterRole === 'supplier' && shp.role !== 'supplier') return false
      if (statusFilter && shp.status !== statusFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = shp.materialTitle.toLowerCase().includes(q)
        const matchNum = shp.shipmentNumber.toLowerCase().includes(q)
        const matchDest = shp.destination.toLowerCase().includes(q)
        const matchCarrier = shp.carrierName.toLowerCase().includes(q)
        if (!matchTitle && !matchNum && !matchDest && !matchCarrier) return false
      }
      return true
    })
  }, [filterRole, statusFilter, searchQuery])

  return (
    <div className="space-y-6">
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
              {filteredShipments.length} {isAr ? 'شحنات' : 'shipments'}
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
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterRole === 'all'
                  ? 'bg-white text-[#06245B] shadow-sm'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'جميع الشحنات' : 'All Shipments'}
            </button>
            <button
              onClick={() => setFilterRole('buyer')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                filterRole === 'buyer'
                  ? 'bg-white text-[#06245B] shadow-sm'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'الواردة (مشتري)' : 'Inbound (Buyer)'}
            </button>
            <button
              onClick={() => setFilterRole('supplier')}
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1266D6] bg-white text-slate-800"
            >
              <option value="">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="InTransit">{isAr ? 'في الطريق' : 'In Transit'}</option>
              <option value="Dispatched">{isAr ? 'تم التحميل والشحن' : 'Dispatched'}</option>
              <option value="Delivered">{isAr ? 'تم التسليم' : 'Delivered'}</option>
              <option value="Pending">{isAr ? 'قيد التجهيز' : 'Pending'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments List */}
      {filteredShipments.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={isAr ? 'لا توجد شحنات مطابقة' : 'No Shipments Found'}
          description={
            isAr
              ? 'يتم إصدار أمر الشحن تلقائياً بمجرد تأكيد الصفقة وتحديد تفاصيل الاستلام.'
              : 'Shipment manifests are automatically scheduled upon deal confirmation.'
          }
        />
      ) : (
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-[#1266D6] bg-blue-50 px-2 py-0.5 rounded-md">
                        {shp.shipmentNumber}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {shp.dealNumber}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#06245B] text-base group-hover:text-[#1266D6] transition-colors">
                      {shp.materialTitle}
                    </h3>
                  </div>

                  <Badge variant={statusVariant[shp.status] || 'info'}>
                    {shp.status === 'InTransit'
                      ? isAr ? 'في الطريق 🚚' : 'In Transit'
                      : shp.status === 'Delivered'
                      ? isAr ? 'تم التسليم ✓' : 'Delivered'
                      : shp.status}
                  </Badge>
                </div>

                {/* Logistics details */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-2 mb-4 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-rose-500 shrink-0" />
                    <span className="text-slate-400">{isAr ? 'وجهة التسليم:' : 'Destination:'}</span>
                    <strong className="text-slate-800 truncate">{shp.destination}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-[#1266D6] shrink-0" />
                    <span className="text-slate-400">{isAr ? 'الناقل:' : 'Carrier:'}</span>
                    <span className="text-slate-700 font-semibold">{shp.carrierName}</span>
                    <span className="text-slate-400 font-mono">({shp.trackingNumber})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-emerald-600 shrink-0" />
                    <span className="text-slate-400">{isAr ? 'السائق:' : 'Driver:'}</span>
                    <span className="text-slate-700 font-mono">{shp.driverPhone}</span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-[#1266D6]" />
                    <span>
                      {isAr ? 'الوصول المتوقع: ' : 'ETA: '}
                      <strong className="text-[#06245B]">{formatDate(shp.estimatedArrival)}</strong>
                    </span>
                  </div>

                  {shp.dispatchedAt && (
                    <span className="text-[11px] text-slate-400">
                      {isAr ? 'تاريخ التحميل: ' : 'Dispatched: '}
                      {formatDate(shp.dispatchedAt)}
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
      )}
    </div>
  )
}

