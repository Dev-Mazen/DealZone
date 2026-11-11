import {
    LayoutDashboard,
    Package,
    FileText,
    DollarSign,
    Handshake,
    Truck,
    ShieldCheck,
    Building2,
    Inbox,
    Send,
    Scale,
    BarChart3,
    Home,
    Info,
    Gavel,
} from 'lucide-react'

export const getPublicLinks = (isAr) => [
    { label: isAr ? 'الرئيسية' : 'Home', path: '/', icon: Home },
    { label: isAr ? 'عن المنصة' : 'About', path: '/about', icon: Info },
    { label: isAr ? 'الكتالوج الصناعي' : 'Catalog', path: '/catalog', icon: Package },
    { label: isAr ? 'دليل الموردين' : 'Suppliers', path: '/suppliers', icon: Building2 },
]

export function getRoleKey({ isSystemAdmin, isSupplierOnly, isBuyerOnly }) {
    if (isSystemAdmin) return 'admin'
    if (isSupplierOnly) return 'supplier'
    if (isBuyerOnly) return 'buyer'
    return 'dual'
}

export function getRoleLabel(roleKey, isAr) {
    const labels = {
        admin: isAr ? 'مدير المنصة' : 'Platform Admin',
        supplier: isAr ? 'مورد خامات' : 'Raw Material Supplier',
        buyer: isAr ? 'مشتري (مصنع)' : 'Manufacturer Buyer',
        dual: isAr ? 'مشتري ومورد' : 'Buyer & Supplier',
    }
    return labels[roleKey]
}

/**
 * `match` = مسارات إضافية تخلي العنصر يظهر Active (مثلاً صفحات المناقصات).
 * عدّلها لو مسارات المناقصات/العطاءات عندك مختلفة.
 */
export function getNavSections(roleKey, isAr) {
    const dashboard = {
        key: 'dashboard',
        label: isAr ? 'لوحة التحكم' : 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
    }
    const shipments = (label) => ({
        key: 'shipments',
        label,
        icon: Truck,
        path: '/shipments',
    })

    switch (roleKey) {
        case 'admin':
            return [
                {
                    key: 'overview',
                    title: isAr ? 'نظرة عامة' : 'Overview',
                    items: [
                        { key: 'analytics', label: isAr ? 'لوحة التحليلات' : 'Analytics', icon: BarChart3, path: '/admin/analytics' },
                    ],
                },
                {
                    key: 'review',
                    title: isAr ? 'المراجعة' : 'Review',
                    items: [
                        { key: 'verification', label: isAr ? 'طلبات التوثيق' : 'Verification Queue', icon: ShieldCheck, path: '/admin/verification' },
                        { key: 'disputes', label: isAr ? 'فض النزاعات' : 'Disputes', icon: Scale, path: '/admin/disputes' },
                    ],
                },
                {
                    key: 'operations',
                    title: isAr ? 'العمليات' : 'Operations',
                    items: [
                        { key: 'admin-catalog', label: isAr ? 'إدارة الكتالوج' : 'Catalog Management', icon: Package, path: '/admin/catalog' },
                        { key: 'admin-shipping', label: isAr ? 'الشحن ومزوّدوه' : 'Shipping', icon: Truck, path: '/admin/shipping' },
                    ],
                },
            ]

        case 'supplier':
            return [
                { key: 'main', items: [dashboard] },
                {
                    key: 'sourcing',
                    title: isAr ? 'السوق' : 'Market',
                    items: [
                        { key: 'catalog', label: isAr ? 'الكتالوج' : 'Catalog', icon: Package, path: '/catalog' },
                        { key: 'rfqs', label: isAr ? 'طلبات الأسعار المفتوحة' : 'Open Market RFQs', icon: FileText, path: '/rfqs' },
                        { key: 'tenders', label: isAr ? 'المناقصات والمزايدات' : 'Open Tenders & Bidding', icon: Gavel, path: '/tenders' },
                        { key: 'offers', label: isAr ? 'عروضي ومزايداتي' : 'My Bids', icon: Send, path: '/offers', match: ['/tenders/bids/mine'] },
                    ],
                },
                {
                    key: 'operations',
                    title: isAr ? 'العمليات' : 'Operations',
                    items: [
                        { key: 'deals', label: isAr ? 'عقود البيع' : 'Sales Deals', icon: Handshake, path: '/deals' },
                        shipments(isAr ? 'تتبع الشحنات' : 'Shipment Tracking'),
                    ],
                },
            ]

        case 'buyer':
            return [
                { key: 'main', items: [dashboard] },
                {
                    key: 'sourcing',
                    title: isAr ? 'التوريد' : 'Sourcing',
                    items: [
                        { key: 'catalog', label: isAr ? 'كتالوج الخامات' : 'Materials Catalog', icon: Package, path: '/catalog' },
                        { key: 'suppliers', label: isAr ? 'دليل الموردين' : 'Supplier Directory', icon: Building2, path: '/suppliers' },
                        { key: 'rfqs', label: isAr ? 'طلبات الأسعار (RFQs)' : 'Direct Quotes (RFQs)', icon: FileText, path: '/rfqs' },
                        { key: 'tenders', label: isAr ? 'المناقصات الكبرى' : 'Industrial Tenders', icon: Gavel, path: '/tenders' },
                        { key: 'offers', label: isAr ? 'العروض المستلمة' : 'Received Quotes', icon: Inbox, path: '/offers', match: ['/tenders/bids/mine'] },
                    ],
                },
                {
                    key: 'operations',
                    title: isAr ? 'العمليات' : 'Operations',
                    items: [
                        { key: 'deals', label: isAr ? 'عقود الشراء' : 'Purchasing Deals', icon: Handshake, path: '/deals' },
                        shipments(isAr ? 'تتبع الشحنات' : 'Shipment Tracking'),
                    ],
                },
            ]

        default:
            return [
                { key: 'main', items: [dashboard] },
                {
                    key: 'sourcing',
                    title: isAr ? 'التوريد والسوق' : 'Sourcing & Market',
                    items: [
                        { key: 'catalog', label: isAr ? 'الكتالوج الصناعي' : 'Industrial Catalog', icon: Package, path: '/catalog' },
                        { key: 'suppliers', label: isAr ? 'دليل الموردين' : 'Supplier Directory', icon: Building2, path: '/suppliers' },
                        { key: 'rfqs', label: isAr ? 'طلبات الأسعار (RFQs)' : 'Direct Quotes (RFQs)', icon: FileText, path: '/rfqs' },
                        { key: 'tenders', label: isAr ? 'المناقصات الكبرى' : 'Industrial Tenders', icon: Gavel, path: '/tenders' },
                        { key: 'offers', label: isAr ? 'العروض والمزايدات' : 'Offers & Bids', icon: DollarSign, path: '/offers', match: ['/tenders/bids/mine'] },
                    ],
                },
                {
                    key: 'operations',
                    title: isAr ? 'العمليات' : 'Operations',
                    items: [
                        { key: 'deals', label: isAr ? 'الصفقات التجارية' : 'Commercial Deals', icon: Handshake, path: '/deals' },
                        shipments(isAr ? 'تتبع الشحنات' : 'Shipment Tracking'),
                    ],
                },
            ]
    }
}

export function isPathActive(pathname, item) {
    const paths = [item.path, ...(item.match || [])]
    return paths.some((p) =>
        p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')
    )
}