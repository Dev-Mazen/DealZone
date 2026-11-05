import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Package, Layers, Scale } from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../hooks/useToast'

export default function AdminCatalogPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('categories') // 'categories' | 'materials' | 'units'

  // Modals state
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCat, setNewCat] = useState({ nameEn: '', nameAr: '', code: '' })

  const [showAddUnit, setShowAddUnit] = useState(false)
  const [newUnit, setNewUnit] = useState({ nameEn: '', nameAr: '', code: '', symbolEn: '', symbolAr: '' })

  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [newMat, setNewMat] = useState({ nameEn: '', nameAr: '', code: '', categoryId: '', defaultUnitOfMeasureId: '' })

  // Queries
  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['admin', 'catalog', 'categories'],
    queryFn: catalogService.getCategories,
  })

  const { data: units, isLoading: loadingUnits } = useQuery({
    queryKey: ['admin', 'catalog', 'units'],
    queryFn: catalogService.getUnits,
  })

  const { data: materialsData, isLoading: loadingMats } = useQuery({
    queryKey: ['admin', 'catalog', 'materials'],
    queryFn: () => catalogService.getMaterials({ pageSize: 100 }),
  })

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data) => catalogService.createCategory(data),
    onSuccess: () => {
      toast.success('Category created successfully')
      setShowAddCategory(false)
      setNewCat({ nameEn: '', nameAr: '', code: '' })
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'categories'] })
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to create category'),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => catalogService.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'categories'] })
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to delete category'),
  })

  // Unit Mutations
  const createUnitMutation = useMutation({
    mutationFn: (data) => catalogService.createUnit(data),
    onSuccess: () => {
      toast.success('Unit created successfully')
      setShowAddUnit(false)
      setNewUnit({ nameEn: '', nameAr: '', code: '', symbolEn: '', symbolAr: '' })
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'units'] })
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to create unit'),
  })

  const deleteUnitMutation = useMutation({
    mutationFn: (id) => catalogService.deleteUnit(id),
    onSuccess: () => {
      toast.success('Unit deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'units'] })
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to delete unit'),
  })

  // Material Mutations
  const createMaterialMutation = useMutation({
    mutationFn: (data) => catalogService.createMaterial(data),
    onSuccess: () => {
      toast.success('Material created successfully')
      setShowAddMaterial(false)
      setNewMat({ nameEn: '', nameAr: '', code: '', categoryId: '', defaultUnitOfMeasureId: '' })
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'materials'] })
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to create material'),
  })

  const deleteMaterialMutation = useMutation({
    mutationFn: (id) => catalogService.deleteMaterial(id),
    onSuccess: () => {
      toast.success('Material deleted')
      queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'materials'] })
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to delete material'),
  })

  if (loadingCats || loadingUnits || loadingMats) return <PageSpinner />

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'categories'
              ? 'bg-[#06245B] text-white shadow-sm'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#EAF4FF]'
          }`}
        >
          <Layers size={16} />
          Categories ({categories?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'materials'
              ? 'bg-[#06245B] text-white shadow-sm'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#EAF4FF]'
          }`}
        >
          <Package size={16} />
          Materials ({materialsData?.totalCount || materialsData?.items?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'units'
              ? 'bg-[#06245B] text-white shadow-sm'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#EAF4FF]'
          }`}
        >
          <Scale size={16} />
          Units of Measure ({units?.length || 0})
        </button>
      </div>

      {/* Tab: Categories */}
      {activeTab === 'categories' && (
        <Card noPadding>
          <div className="p-4 border-b border-[rgba(6,36,91,0.06)] flex items-center justify-between">
            <h3 className="font-semibold text-[#06245B]">Industrial Material Categories</h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowAddCategory(true)}
            >
              Add Category
            </Button>
          </div>
          <div className="divide-y divide-[rgba(6,36,91,0.06)]">
            {categories?.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="font-semibold text-sm text-[#06245B]">{cat.nameEn} · {cat.nameAr}</p>
                  <span className="text-xs font-mono text-[#64748B]">Code: {cat.code}</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete category "${cat.nameEn}"?`)) {
                      deleteCategoryMutation.mutate(cat.id)
                    }
                  }}
                  className="p-1.5 rounded-lg text-[#EF4444] hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Materials */}
      {activeTab === 'materials' && (
        <Card noPadding>
          <div className="p-4 border-b border-[rgba(6,36,91,0.06)] flex items-center justify-between">
            <h3 className="font-semibold text-[#06245B]">Standard Raw Materials</h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowAddMaterial(true)}
            >
              Add Material
            </Button>
          </div>
          <div className="divide-y divide-[rgba(6,36,91,0.06)]">
            {materialsData?.items?.map((mat) => (
              <div key={mat.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="font-semibold text-sm text-[#06245B]">{mat.nameEn} · {mat.nameAr}</p>
                  <p className="text-xs text-[#64748B]">
                    Code: <span className="font-mono">{mat.code}</span> · Category: {mat.categoryNameEn || '—'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete material "${mat.nameEn}"?`)) {
                      deleteMaterialMutation.mutate(mat.id)
                    }
                  }}
                  className="p-1.5 rounded-lg text-[#EF4444] hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab: Units */}
      {activeTab === 'units' && (
        <Card noPadding>
          <div className="p-4 border-b border-[rgba(6,36,91,0.06)] flex items-center justify-between">
            <h3 className="font-semibold text-[#06245B]">Measurement Units</h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowAddUnit(true)}
            >
              Add Unit
            </Button>
          </div>
          <div className="divide-y divide-[rgba(6,36,91,0.06)]">
            {units?.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC]">
                <div>
                  <p className="font-semibold text-sm text-[#06245B]">{u.nameEn} ({u.symbolEn}) · {u.nameAr} ({u.symbolAr})</p>
                  <span className="text-xs font-mono text-[#64748B]">Code: {u.code}</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete unit "${u.nameEn}"?`)) {
                      deleteUnitMutation.mutate(u.id)
                    }
                  }}
                  className="p-1.5 rounded-lg text-[#EF4444] hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Category Modal */}
      <Modal open={showAddCategory} onClose={() => setShowAddCategory(false)} title="Add Category">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createCategoryMutation.mutate(newCat)
          }}
          className="space-y-4"
        >
          <Input
            label="Name (English)"
            value={newCat.nameEn}
            onChange={(e) => setNewCat({ ...newCat, nameEn: e.target.value })}
            required
          />
          <Input
            label="Name (Arabic)"
            value={newCat.nameAr}
            onChange={(e) => setNewCat({ ...newCat, nameAr: e.target.value })}
            dir="rtl"
            required
          />
          <Input
            label="Code (unique identifier)"
            value={newCat.code}
            onChange={(e) => setNewCat({ ...newCat, code: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowAddCategory(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createCategoryMutation.isPending}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Material Modal */}
      <Modal open={showAddMaterial} onClose={() => setShowAddMaterial(false)} title="Add Standard Material">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMaterialMutation.mutate(newMat)
          }}
          className="space-y-4"
        >
          <Input
            label="Name (English)"
            value={newMat.nameEn}
            onChange={(e) => setNewMat({ ...newMat, nameEn: e.target.value })}
            required
          />
          <Input
            label="Name (Arabic)"
            value={newMat.nameAr}
            onChange={(e) => setNewMat({ ...newMat, nameAr: e.target.value })}
            dir="rtl"
            required
          />
          <Input
            label="Code"
            value={newMat.code}
            onChange={(e) => setNewMat({ ...newMat, code: e.target.value })}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1E293B]">Category</label>
            <select
              value={newMat.categoryId}
              onChange={(e) => setNewMat({ ...newMat, categoryId: e.target.value })}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#00D9F5]"
              required
            >
              <option value="">Select category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#1E293B]">Default Unit</label>
            <select
              value={newMat.defaultUnitOfMeasureId}
              onChange={(e) => setNewMat({ ...newMat, defaultUnitOfMeasureId: e.target.value })}
              className="h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#00D9F5]"
            >
              <option value="">Select default unit (optional)</option>
              {units?.map((u) => (
                <option key={u.id} value={u.id}>{u.nameEn} ({u.symbolEn})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowAddMaterial(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createMaterialMutation.isPending}>
              Create Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Unit Modal */}
      <Modal open={showAddUnit} onClose={() => setShowAddUnit(false)} title="Add Unit of Measure">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createUnitMutation.mutate(newUnit)
          }}
          className="space-y-4"
        >
          <Input
            label="Name (English)"
            value={newUnit.nameEn}
            onChange={(e) => setNewUnit({ ...newUnit, nameEn: e.target.value })}
            required
          />
          <Input
            label="Name (Arabic)"
            value={newUnit.nameAr}
            onChange={(e) => setNewUnit({ ...newUnit, nameAr: e.target.value })}
            dir="rtl"
            required
          />
          <Input
            label="Code (e.g. KG, TON, M3)"
            value={newUnit.code}
            onChange={(e) => setNewUnit({ ...newUnit, code: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Symbol (EN)"
              value={newUnit.symbolEn}
              onChange={(e) => setNewUnit({ ...newUnit, symbolEn: e.target.value })}
            />
            <Input
              label="Symbol (AR)"
              value={newUnit.symbolAr}
              onChange={(e) => setNewUnit({ ...newUnit, symbolAr: e.target.value })}
              dir="rtl"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowAddUnit(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createUnitMutation.isPending}>
              Create Unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
