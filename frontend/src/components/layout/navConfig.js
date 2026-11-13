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
    Store,
} from 'lucide-react'

export const getPublicLinks = (isAr) => [
    { label: isAr ? 'الرئيسية' : 'Home', path: '/', icon: Home },
    { label: isAr ? 'عن المنصة' : 'About', path: '/about', icon: Info },
    { label: isAr ? 'السوق التجاري' : 'Marketplace', path: '/marketplace', icon: Store },
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
                        { key: 'admin-catalog', label: isAr ? 'إدارة السوق والكتالوج' : 'Marketplace Management', icon: Package, path: '/admin/catalog' },
                        { key: 'admin-shipping', label: isAr ? 'الشحن ومزوّدوه' : 'Shipping', icon: Truck, path: '/admin/shipping' },
                    ],
                },
            ]

        case 'supplier':
            return [
                { key: 'main', items: [dashboard] },
                {
                    key: 'sourcing',
                    title: isAr ? 'السوق والتوريد' : 'Market & Sourcing',
                    items: [
                        { key: 'marketplace', label: isAr ? 'السوق التجاري' : 'Marketplace', icon: Store, path: '/marketplace', match: ['/catalog'] },
                        { key: 'my-products', label: isAr ? 'منتجاتي المعروضة' : 'My Listed Products', icon: Package, path: '/catalog/my-products' },
                        { key: 'negotiations', label: isAr ? 'مفاوضات الأسعار' : 'Price Negotiations', icon: Handshake, path: '/negotiations' },
                        { key: 'rfqs', label: isAr ? 'طلبات الأسعار المفتوحة' : 'Open Market RFQs', icon: FileText, path: '/rfqs', match: ['/tenders'] },
                        { key: 'offers', label: isAr ? 'عروضي ومزايداتي' : 'My Bids & Offers', icon: Send, path: '/offers', match: ['/tenders/bids/mine'] },
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
                    title: isAr ? 'التوريد والسوق' : 'Sourcing & Market',
                    items: [
                        { key: 'marketplace', label: isAr ? 'السوق التجاري' : 'Marketplace', icon: Store, path: '/marketplace', match: ['/catalog'] },
                        { key: 'my-products', label: isAr ? 'منتجاتي المعروضة' : 'My Listed Products', icon: Package, path: '/catalog/my-products' },
                        { key: 'negotiations', label: isAr ? 'مفاوضات الأسعار' : 'Price Negotiations', icon: Handshake, path: '/negotiations' },
                        { key: 'suppliers', label: isAr ? 'دليل الموردين' : 'Supplier Directory', icon: Building2, path: '/suppliers' },
                        { key: 'rfqs', label: isAr ? 'طلبات التوريد (RFQs)' : 'Procurement RFQs', icon: FileText, path: '/rfqs', match: ['/tenders'] },
                        { key: 'offers', label: isAr ? 'العروض المستلمة' : 'Received Offers', icon: Inbox, path: '/offers', match: ['/tenders/bids/mine'] },
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
                        { key: 'marketplace', label: isAr ? 'السوق التجاري' : 'Marketplace', icon: Store, path: '/marketplace', match: ['/catalog'] },
                        { key: 'my-products', label: isAr ? 'منتجاتي المعروضة' : 'My Listed Products', icon: Package, path: '/catalog/my-products' },
                        { key: 'negotiations', label: isAr ? 'مفاوضات الأسعار' : 'Price Negotiations', icon: Handshake, path: '/negotiations' },
                        { key: 'suppliers', label: isAr ? 'دليل الموردين' : 'Supplier Directory', icon: Building2, path: '/suppliers' },
                        { key: 'rfqs', label: isAr ? 'طلبات التوريد والأسعار' : 'RFQs & Bidding', icon: FileText, path: '/rfqs', match: ['/tenders'] },
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
