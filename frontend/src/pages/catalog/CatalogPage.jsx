import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Package } from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { getLocalizedField } from '../../utils/format'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'

export default function CatalogPage() {
  const { t, language } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState()

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogService.getCategories(),
  })

  const { data: materialsPage, isLoading: materialsLoading } = useQuery({
    queryKey: ['catalog', 'materials', { categoryId: selectedCategoryId, searchTerm }],
    queryFn: () =>
      catalogService.getMaterials({
        categoryId: selectedCategoryId,
        searchTerm: searchTerm || undefined,
        pageNumber: 1,
        pageSize: 20,
      }),
  })

  if (categoriesLoading) return <PageSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#06245B] mb-4">{t('catalog.title')}</h1>
        <Input
          placeholder={t('catalog.search')}
          startIcon={<Search size={18} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Categories sidebar */}
        <aside className="lg:col-span-1">
          <Card noPadding className="p-4">
            <h3 className="font-semibold text-[#06245B] mb-3">
              {t('catalog.categories')}
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedCategoryId(undefined)}
                  className={[
                    'w-full text-start px-3 py-2 rounded-lg transition-colors text-sm',
                    !selectedCategoryId
                      ? 'bg-[#EAF4FF] text-[#06245B] font-semibold'
                      : 'text-[#64748B] hover:bg-[#F4F7FB]',
                  ].join(' ')}
                >
                  {t('catalog.allCategories')}
                </button>
              </li>
              {categories?.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={[
                      'w-full text-start px-3 py-2 rounded-lg transition-colors text-sm',
                      selectedCategoryId === cat.id
                        ? 'bg-[#EAF4FF] text-[#06245B] font-semibold'
                        : 'text-[#64748B] hover:bg-[#F4F7FB]',
                    ].join(' ')}
                  >
                    {getLocalizedField(cat, 'name', language)}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        {/* Materials grid */}
        <div className="lg:col-span-3">
          {materialsLoading ? (
            <PageSpinner />
          ) : !materialsPage?.items.length ? (
            <EmptyState
              icon={Package}
              title={t('catalog.noMaterials')}
              description={language === 'ar' ? 'جرّب البحث بكلمات مختلفة' : 'Try different search terms'}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materialsPage.items.map((material) => (
                <Card key={material.id} hoverable noPadding className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EAF4FF] flex items-center justify-center shrink-0">
                      <Package size={20} className="text-[#1266D6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#06245B] text-sm mb-1 truncate">
                        {getLocalizedField(material, 'name', language)}
                      </h3>
                      <p className="text-xs text-[#64748B] truncate">
                        {getLocalizedField(material, 'categoryName', language)}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Badge variant="navy" className="text-xs">
                          {material.code}
                        </Badge>
                        <Badge variant="cyan" className="text-xs">
                          {getLocalizedField(material, 'defaultUnitName', language)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {materialsPage && materialsPage.totalPages > 1 && (
            <div className="mt-6 text-center text-sm text-[#64748B]">
              Page {materialsPage.pageNumber} of {materialsPage.totalPages}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
