import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Tag,
  Globe,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { companyService } from '../../shared/api/services/companyService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { PageSpinner } from '../../components/ui/Spinner'

const INDUSTRY_SECTORS = [
  'Metals & Steel',
  'Polymers & Plastics',
  'Chemicals & Solvents',
  'Packaging & Film',
  'Building Materials',
  'Electrical & Electronics',
  'Textiles & Industrial Fibers',
  'Industrial Manufacturing',
]

const GOVERNORATES = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Sharqia',
  'Qalyubia',
  'Menoufia',
  'Beheira',
  'Suez',
  'Port Said',
  'Damietta',
  'Beni Suef',
  'Asyut',
]

export default function SupplierDirectoryPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const { isBuyer } = usePermissions()

  const [search, setSearch] = useState('')
  const [industrySector, setIndustrySector] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 12

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['suppliers', 'directory', { search, industrySector, governorate, pageNumber, pageSize }],
    queryFn: () =>
      companyService.getSuppliers({
        search: search.trim() || undefined,
        industrySector: industrySector || undefined,
        governorate: governorate || undefined,
        pageNumber,
        pageSize,
      }),
    keepPreviousData: true,
  })

  const suppliers = data?.items || []

  return (
    <div className="space-y-6">
      {/* Directory Hero Header */}
      <div className="bg-gradient-to-r from-[#06245B] via-[#0A327B] to-[#1266D6] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold mb-3">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>{isAr ? 'شبكة الموردين المعتمدين قانونياً' : 'Verified Industrial Suppliers Network'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {isAr ? 'دليل الموردين والمصانع المعتمدة' : 'Verified Supplier Directory'}
          </h1>
          <p className="text-sm md:text-base text-blue-100/90 mt-2 leading-relaxed">
            {isAr
              ? 'اكتشف كبرى مصانع الخامات والموردين الموثقين بالسجل التجاري والبطاقة الضريبية في مصر، واستعرض تقييمات الصفقات الحية.'
              : 'Discover verified raw material producers and industrial vendors with validated Commercial Registrations and Tax IDs across Egypt.'}
          </p>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -bottom-10 -end-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPageNumber(1)
            }}
            placeholder={
              isAr
                ? 'بحث باسم المصنع، الخامة، النشاط...'
                : 'Search by company, material, activity...'
            }
            className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1266D6] focus:bg-white transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Industry Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={industrySector}
              onChange={(e) => {
                setIndustrySector(e.target.value)
                setPageNumber(1)
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1266D6] bg-white text-slate-800"
            >
              <option value="">{isAr ? 'جميع القطاعات الصناعية' : 'All Industries'}</option>
              {INDUSTRY_SECTORS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Governorate Filter */}
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400" />
            <select
              value={governorate}
              onChange={(e) => {
                setGovernorate(e.target.value)
                setPageNumber(1)
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1266D6] bg-white text-slate-800"
            >
              <option value="">{isAr ? 'جميع المحافظات' : 'All Governorates'}</option>
              {GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {data?.totalCount ?? suppliers.length} {isAr ? 'مورد' : 'suppliers'}
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
                {isAr ? 'تعذر تحميل دليل الموردين' : 'Failed to load supplier directory'}
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                {error?.problem?.detail || error?.message}
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
      {!isLoading && !error && suppliers.length === 0 && (
        <EmptyState
          icon={Building2}
          title={isAr ? 'لا يوجد موردون يطابقون معايير البحث' : 'No Suppliers Found'}
          description={
            isAr
              ? 'جرّب تعديل مصطلحات البحث أو اختيار قطاع صناعي أو محافظة مختلفة.'
              : 'Try adjusting your search criteria or resetting the industry and governorate filters.'
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setIndustrySector('')
                setGovernorate('')
                setPageNumber(1)
              }}
            >
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </Button>
          }
        />
      )}

      {/* Suppliers Grid */}
      {!isLoading && !error && suppliers.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#06245B] to-[#1266D6] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {supplier.tradeName?.charAt(0).toUpperCase() || 'S'}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                        <ShieldCheck size={12} className="text-emerald-600" />
                        <span>{isAr ? 'موثق رسمياً' : 'Verified'}</span>
                      </span>

                      {supplier.companyType === 'Both' && (
                        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                          {isAr ? 'مورد ومصنع مشتري' : 'Buyer & Supplier'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company Name & Sector */}
                  <div className="mb-3">
                    <h3 className="font-bold text-[#06245B] text-base leading-snug group-hover:text-[#1266D6] transition-colors line-clamp-1">
                      {supplier.tradeName}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {supplier.legalName}
                    </p>
                  </div>

                  {/* Industry & Location Tags */}
                  <div className="flex items-center gap-2 flex-wrap text-xs mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1266D6] font-semibold text-[11px]">
                      <Tag size={11} />
                      <span className="truncate max-w-[140px]">{supplier.industrySector}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium text-[11px]">
                      <MapPin size={11} className="text-slate-400" />
                      <span>{supplier.city}{supplier.governorate ? `, ${supplier.governorate}` : ''}</span>
                    </span>
                  </div>

                  {/* Public Description */}
                  {supplier.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {supplier.description}
                    </p>
                  )}
                </div>

                {/* Card Footer: Rating & Action Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Reviews & Rating */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {supplier.reviewCount > 0 ? (
                      <>
                        <span className="flex items-center text-amber-500 font-bold gap-1">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span>{supplier.averageRating}</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          ({supplier.reviewCount} {isAr ? 'تقييم' : 'reviews'})
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium">
                        {isAr ? 'مورد معتمد جديد' : 'New Verified'}
                      </span>
                    )}
                  </div>

                  {/* View Profile Action */}
                  <span className="text-xs font-semibold text-[#1266D6] flex items-center gap-1 group-hover:underline">
                    <span>{isAr ? 'الملف التجاري' : 'Profile'}</span>
                    {isAr ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </span>
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
