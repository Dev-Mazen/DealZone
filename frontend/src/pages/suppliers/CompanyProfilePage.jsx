import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  ShieldCheck,
  MapPin,
  Globe,
  Tag,
  Star,
  Calendar,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Handshake,
  CheckCircle,
  ExternalLink,
  Package,
} from 'lucide-react'
import { companyService } from '../../shared/api/services/companyService'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Card, { CardHeader } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'

export default function CompanyProfilePage() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const { isBuyer, hasCompany, canActAsBuyer } = usePermissions()

  // Fetch Public Profile
  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['company', 'public-profile', companyId],
    queryFn: () => companyService.getPublicProfile(companyId),
    enabled: !!companyId,
    retry: 1,
  })

  // Fetch Verified Reviews
  const {
    data: reviewsData,
    isLoading: loadingReviews,
  } = useQuery({
    queryKey: ['company', 'reviews', companyId],
    queryFn: () => companyService.getCompanyReviews(companyId, { pageNumber: 1, pageSize: 20 }),
    enabled: !!companyId,
    retry: 1,
  })

  // Fetch Supplier Products if Company has Supplier capability
  const isSupplierEntity = profile?.companyType === 'Supplier'
  const isBuyerEntity = profile?.companyType === 'Buyer'
  const {
    data: productsData,
    isLoading: loadingProducts,
  } = useQuery({
    queryKey: ['company', 'products', companyId],
    queryFn: () => catalogService.getProducts({ supplierCompanyId: companyId, pageSize: 12 }),
    enabled: !!companyId && isSupplierEntity,
    retry: 1,
  })

  if (loadingProfile) return <PageSpinner />

  if (profileError || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'الملف التجاري غير متاح' : 'Company Profile Not Available'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          {isAr
            ? 'المنشأة المطلوبة غير معتمدة أو غير متاحة للعرض العام حالياً وفقاً لمعايير التوثيق.'
            : 'The requested enterprise is either unverified or not eligible for public display under DealZone verification policy.'}
        </p>
        <Button as={Link} to="/suppliers" variant="primary" size="md">
          {isAr ? 'العودة لدليل الموردين' : 'Back to Supplier Directory'}
        </Button>
      </div>
    )
  }

  const reviews = reviewsData?.reviews?.items || []
  const stats = reviewsData?.stats
  const products = productsData?.items || []

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to={isBuyerEntity ? "/rfqs" : "/suppliers"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1266D6] hover:underline"
        >
          {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isBuyerEntity ? (isAr ? 'العودة لطلبات التوريد' : 'Back to RFQs') : (isAr ? 'العودة لدليل الموردين المعتمدين' : 'Back to Verified Suppliers')}</span>
        </Link>
      </div>

      {/* Hero Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#06245B] via-[#0A327B] to-[#1266D6] text-white flex items-center justify-center font-extrabold text-2xl md:text-3xl shrink-0 shadow-md">
              {profile.tradeName?.charAt(0).toUpperCase() || 'S'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#06245B]">
                  {profile.tradeName}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>{isAr ? 'منشأة موثقة رسمياً' : 'Verified Enterprise'}</span>
                </span>
              </div>

              <p className="text-xs md:text-sm text-slate-500 font-medium">
                {profile.legalName}
              </p>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap pt-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1266D6] font-semibold">
                  <Tag size={12} />
                  <span>{profile.industrySector}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                  <MapPin size={12} className="text-slate-400" />
                  <span>{profile.city}{profile.governorate ? `, ${profile.governorate}` : ''}</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">
                  <Calendar size={12} />
                  <span>{isAr ? 'عضو منذ: ' : 'Member since: '} {formatDate(profile.memberSinceUtc)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {isSupplierEntity && canActAsBuyer && (
            <div className="shrink-0">
              <Button
                as={Link}
                to={`/rfqs/create?targetSupplierId=${profile.id}&targetSupplierName=${encodeURIComponent(profile.tradeName || profile.legalName)}`}
                variant="primary"
                size="md"
                icon={<FileText size={16} />}
              >
                {isAr ? 'طلب عرض سعر من هذا المورّد' : 'Request Quote from Supplier'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Overview & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Business Overview */}
          <Card>
            <CardHeader
              title={isAr ? 'نبذة عن المنشأة والنشاط' : 'Enterprise Overview'}
              subtitle={
                isAr
                  ? 'مجال العمل والتخصص الصناعي والقدرات الإنتاجية المعتمدة'
                  : 'Core capabilities, manufacturing focus, and supply scope'
              }
            />

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                {profile.description || (
                  <span className="text-slate-400 italic">
                    {isAr ? 'لا يوجد وصف مضاف حتى الآن.' : 'No description provided.'}
                  </span>
                )}
              </p>

              {profile.website && (
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
                  <Globe size={14} className="text-slate-400" />
                  <span className="text-slate-500">{isAr ? 'الموقع الإلكتروني الرسمي:' : 'Website:'}</span>
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#1266D6] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{profile.website}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Card 2: Active Listed Products (Only for Supplier capable companies) */}
          {isSupplierEntity && (
            <Card>
              <CardHeader
                title={isAr ? 'المنتجات المعروضة في السوق' : 'Active Listed Products'}
                subtitle={
                  isAr
                    ? 'الخامات والمنتجات الصناعية المتوفرة للتوريد المباشر أو التفاوض'
                    : 'Real-time available catalog products from this verified supplier'
                }
              />

              {loadingProducts ? (
                <PageSpinner />
              ) : products.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 p-6">
                  <Package size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#06245B]">
                    {isAr ? 'لا توجد منتجات معروضة حالياً' : 'No Listed Products Currently'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {isAr
                      ? 'لم يقم هذا المورد بإضافة منتجات متاحة للشراء المباشر حالياً، يمكنك طلب عرض سعر مخصص عبر زر طلب السعر أعلاه.'
                      : 'This supplier currently has no fixed-price inventory listed. You can request a custom quote via Request Quote.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#1266D6] transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {p.sku}
                          </span>
                          <span className="text-[10px] font-semibold text-[#1266D6] bg-blue-50 px-2 py-0.5 rounded">
                            {isAr ? p.categoryNameAr : p.categoryNameEn}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#06245B] line-clamp-1 mb-1">
                          {isAr ? p.nameAr : (p.nameEn || p.nameAr)}
                        </h4>
                        {p.specifications && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {p.specifications}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block">{isAr ? 'السعر:' : 'Price:'}</span>
                          <span className="text-sm font-extrabold text-[#06245B]">
                            {p.pricingMode === 2
                              ? (isAr ? 'قابل للتفاوض' : 'Negotiable')
                              : `${p.unitPrice?.toLocaleString()} ${p.currency} / ${p.unit}`}
                          </span>
                        </div>
                        <Button
                          as={Link}
                          to="/marketplace"
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          {isAr ? 'عرض بالسوق' : 'View'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Card 2.5: Open Public RFQs (Only for Buyer companies) */}
          {isBuyerEntity && (
            <Card>
              <CardHeader
                title={isAr ? 'طلبات التوريد المفتوحة' : 'Open Public RFQs'}
                subtitle={
                  isAr
                    ? 'طلبات عروض الأسعار العامة المتاحة حالياً للموردين لتقديم عروضهم'
                    : 'Public requests for quotation currently open for supplier offers'
                }
              />

              {!profile.openPublicRfqs || profile.openPublicRfqs.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 p-6">
                  <FileText size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#06245B]">
                    {isAr ? 'لا توجد طلبات توريد عامة مفتوحة حالياً' : 'No Open Public RFQs Currently'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.openPublicRfqs.map((rfq) => (
                    <div
                      key={rfq.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#1266D6] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {rfq.rfqNumber}
                          </span>
                          {rfq.categoryName && (
                            <span className="text-[10px] font-semibold text-[#1266D6] bg-blue-50 px-2 py-0.5 rounded">
                              {rfq.categoryName}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {isAr ? `${rfq.itemCount} بنود` : `${rfq.itemCount} items`}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#06245B]">{rfq.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isAr ? `ينتهي في: ${formatDate(rfq.closingDateUtc)}` : `Closes: ${formatDate(rfq.closingDateUtc)}`}
                        </p>
                      </div>
                      <Button
                        as={Link}
                        to={`/rfqs/${rfq.id}`}
                        variant="outline"
                        size="sm"
                      >
                        {isAr ? 'عرض الطلب' : 'View RFQ'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Card 3: Commercial Reviews */}
          <Card>
            <CardHeader
              title={isAr ? 'تقييمات الصفقات المبرمة' : 'Commercial Deal Reviews'}
              subtitle={
                isAr
                  ? 'تقييمات فعلية من المصانع والشركات المتعاقدة بعد إتمام عمليات الاستلام والشحن'
                  : 'Authentic reviews from counterparties following completed deal execution'
              }
            />

            {loadingReviews ? (
              <PageSpinner />
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 p-6">
                <Star size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#06245B]">
                  {isAr ? 'لا توجد تقييمات مسجلة حتى الآن' : 'No Commercial Reviews Yet'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {isAr
                    ? 'يتم إصدار التقييمات حصرياً عبر المنصة بعد تأكيد إتمام الصفقات واستلام الشحنات المطابقة للمواصفات.'
                    : 'Reviews can only be submitted after atomic completion of agreed deals and delivery verification.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-[#1266D6]" />
                        <span className="font-bold text-[#06245B] text-xs">
                          {rev.reviewerCompanyName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              className={
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }
                            />
                          ))}
                        </div>
                        <span className="ms-1">{rev.rating}/5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed ps-6">
                      {rev.comment}
                    </p>

                    <div className="text-[10px] text-slate-400 ps-6 font-mono">
                      {formatDate(rev.createdAtUtc)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Trust & Rating Summary */}
        <div className="space-y-6">
          {/* Reputation Summary Card */}
          <Card>
            <CardHeader title={isAr ? 'مؤشر السمعة والتقييم' : 'Reputation Score'} />

            <div className="text-center py-4">
              {profile.reviewCount > 0 ? (
                <>
                  <div className="text-4xl font-extrabold text-[#06245B]">
                    {profile.averageRating}
                  </div>
                  <div className="flex justify-center items-center gap-1 my-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={
                          i < Math.round(profile.averageRating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? `بناءً على ${profile.reviewCount} تقييم من صفقات مكتملة`
                      : `Based on ${profile.reviewCount} verified deal reviews`}
                  </p>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1266D6] flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck size={24} />
                  </div>
                  <p className="text-sm font-bold text-[#06245B]">
                    {isAr ? 'مورد معتمد حديثاً' : 'Newly Verified Vendor'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? 'تم التحقق من الوثائق القانونية وجاهز للتعاقد'
                      : 'Legal credentials verified and ready for contract execution'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <span>{isAr ? 'السجل التجاري ساري ومفحوص' : 'Valid Commercial Registration'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <span>{isAr ? 'البطاقة الضريبية معتمدة' : 'Verified Tax Identification'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                <span>{isAr ? 'مخول بالتعاقد التجاري الملزم' : 'Authorized for Binding Deals'}</span>
              </div>
            </div>
          </Card>

          {/* Commercial Capability Card */}
          <Card>
            <CardHeader title={isAr ? 'النشاط التجاري' : 'Trading Scope'} />
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500">{isAr ? 'نوع المنشأة:' : 'Entity Type:'}</span>
                <strong className="text-[#06245B]">
                  {profile.companyType === 'Supplier'
                    ? isAr ? 'مورد خامات صناعية' : 'Raw Materials Supplier'
                    : isAr ? 'مصنع مشتري' : 'Buyer Manufacturer'}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500">{isAr ? 'القطاع الأساسي:' : 'Primary Sector:'}</span>
                <strong className="text-[#06245B] truncate max-w-[150px]">
                  {profile.industrySector}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-slate-500">{isAr ? 'المقر المسجل:' : 'Location:'}</span>
                <strong className="text-[#06245B] truncate max-w-[150px]">
                  {profile.city}, {profile.governorate}
                </strong>
              </div>

              {profile.sectorsSourced && profile.sectorsSourced.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'القطاعات المطلوبة:' : 'Sectors Sourced:'}</span>
                  <div className="flex flex-wrap gap-1">
                    {profile.sectorsSourced.map((s, idx) => (
                      <span key={idx} className="bg-blue-50 text-[#1266D6] text-[10px] font-semibold px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.publishedRfqCount > 0 && (
                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex justify-between items-center">
                  <span className="text-slate-600">{isAr ? 'طلبات التوريد المنشورة:' : 'Active RFQs:'}</span>
                  <strong className="text-[#1266D6] font-bold">
                    {profile.publishedRfqCount}
                  </strong>
                </div>
              )}

              {profile.completedDealCount > 0 && (
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span className="text-slate-600">{isAr ? 'الصفقات التجارية المنجزة:' : 'Completed Deals:'}</span>
                  <strong className="text-emerald-700 font-bold">
                    {profile.completedDealCount}
                  </strong>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
