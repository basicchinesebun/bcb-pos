'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Plus, Trash2, Edit2, ChevronRight, Scale, X, Search } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface RecipeIngredient {
  id: string
  raw_material_id: string
  name: string
  qty: number
  unit: string
  cost_per_unit: number
}

interface Recipe {
  id: string
  menu_item_id: string
  menu_item_name: string
  emoji: string
  portion_size: number
  portion_unit: string
  notes: string
  ingredients: RecipeIngredient[]
}

interface RawMaterial {
  id: string
  name: string
  unit: string
  cost_per_unit: number
}

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_RAW_MATERIALS: RawMaterial[] = [
  { id: 'rm1',  name: 'All-Purpose Flour',    unit: 'kg',  cost_per_unit: 0.80 },
  { id: 'rm2',  name: 'Sugar',                unit: 'kg',  cost_per_unit: 0.60 },
  { id: 'rm3',  name: 'Yeast',                unit: 'g',   cost_per_unit: 0.03 },
  { id: 'rm4',  name: 'Beef (Sliced)',         unit: 'kg',  cost_per_unit: 8.50 },
  { id: 'rm5',  name: 'Rice Noodles',          unit: 'kg',  cost_per_unit: 1.20 },
  { id: 'rm6',  name: 'Beef Broth',            unit: 'L',   cost_per_unit: 1.00 },
  { id: 'rm7',  name: 'Cocoa Powder',          unit: 'kg',  cost_per_unit: 4.00 },
  { id: 'rm8',  name: 'Eggs',                  unit: 'pcs', cost_per_unit: 0.25 },
  { id: 'rm9',  name: 'Butter',                unit: 'kg',  cost_per_unit: 5.00 },
  { id: 'rm10', name: 'Jasmine Rice',          unit: 'kg',  cost_per_unit: 0.90 },
  { id: 'rm11', name: 'Tapioca Pearls',        unit: 'kg',  cost_per_unit: 2.50 },
  { id: 'rm12', name: 'Black Tea Leaves',      unit: 'kg',  cost_per_unit: 3.00 },
  { id: 'rm13', name: 'Condensed Milk',        unit: 'L',   cost_per_unit: 2.00 },
  { id: 'rm14', name: 'Mango (Fresh)',         unit: 'kg',  cost_per_unit: 2.00 },
  { id: 'rm15', name: 'Glutinous Rice',        unit: 'kg',  cost_per_unit: 1.10 },
  { id: 'rm16', name: 'Coconut Milk',          unit: 'L',   cost_per_unit: 1.80 },
  { id: 'rm17', name: 'Garlic',               unit: 'kg',  cost_per_unit: 1.50 },
  { id: 'rm18', name: 'Soy Sauce',            unit: 'L',   cost_per_unit: 1.20 },
  { id: 'rm19', name: 'Cooking Oil',          unit: 'L',   cost_per_unit: 1.40 },
  { id: 'rm20', name: 'Green Onion',          unit: 'kg',  cost_per_unit: 0.80 },
]

const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r1',
    menu_item_id: '1',
    menu_item_name: 'Steamed Bun',
    emoji: '🥟',
    portion_size: 4,
    portion_unit: 'buns',
    notes: 'Steam for 15 minutes at medium heat. Rest 2 minutes before serving.',
    ingredients: [
      { id: 'i1', raw_material_id: 'rm1', name: 'All-Purpose Flour', qty: 0.25, unit: 'kg', cost_per_unit: 0.80 },
      { id: 'i2', raw_material_id: 'rm2', name: 'Sugar',             qty: 0.02, unit: 'kg', cost_per_unit: 0.60 },
      { id: 'i3', raw_material_id: 'rm3', name: 'Yeast',             qty: 3,    unit: 'g',  cost_per_unit: 0.03 },
    ],
  },
  {
    id: 'r2',
    menu_item_id: '2',
    menu_item_name: 'Beef Noodle',
    emoji: '🍜',
    portion_size: 1,
    portion_unit: 'bowl',
    notes: 'Simmer broth 4+ hours for best flavor. Add hoisin and chili to taste.',
    ingredients: [
      { id: 'i4', raw_material_id: 'rm4', name: 'Beef (Sliced)',  qty: 0.15,  unit: 'kg', cost_per_unit: 8.50 },
      { id: 'i5', raw_material_id: 'rm5', name: 'Rice Noodles',  qty: 0.10,  unit: 'kg', cost_per_unit: 1.20 },
      { id: 'i6', raw_material_id: 'rm6', name: 'Beef Broth',    qty: 0.50,  unit: 'L',  cost_per_unit: 1.00 },
      { id: 'i7', raw_material_id: 'rm20', name: 'Green Onion', qty: 0.01,  unit: 'kg', cost_per_unit: 0.80 },
    ],
  },
  {
    id: 'r3',
    menu_item_id: '7',
    menu_item_name: 'Chocolate Cake',
    emoji: '🍰',
    portion_size: 8,
    portion_unit: 'slices',
    notes: 'Bake at 175°C for 30 minutes. Let cool completely before frosting.',
    ingredients: [
      { id: 'i8',  raw_material_id: 'rm1',  name: 'All-Purpose Flour', qty: 0.20, unit: 'kg',  cost_per_unit: 0.80 },
      { id: 'i9',  raw_material_id: 'rm7',  name: 'Cocoa Powder',      qty: 0.05, unit: 'kg',  cost_per_unit: 4.00 },
      { id: 'i10', raw_material_id: 'rm2',  name: 'Sugar',             qty: 0.20, unit: 'kg',  cost_per_unit: 0.60 },
      { id: 'i11', raw_material_id: 'rm8',  name: 'Eggs',              qty: 3,    unit: 'pcs', cost_per_unit: 0.25 },
      { id: 'i12', raw_material_id: 'rm9',  name: 'Butter',            qty: 0.10, unit: 'kg',  cost_per_unit: 5.00 },
    ],
  },
  {
    id: 'r4',
    menu_item_id: '4',
    menu_item_name: 'Fried Rice',
    emoji: '🍳',
    portion_size: 1,
    portion_unit: 'plate',
    notes: 'Use day-old rice for best texture. High heat throughout.',
    ingredients: [
      { id: 'i13', raw_material_id: 'rm10', name: 'Jasmine Rice',  qty: 0.20,  unit: 'kg', cost_per_unit: 0.90 },
      { id: 'i14', raw_material_id: 'rm8',  name: 'Eggs',          qty: 2,     unit: 'pcs', cost_per_unit: 0.25 },
      { id: 'i15', raw_material_id: 'rm17', name: 'Garlic',        qty: 0.01,  unit: 'kg', cost_per_unit: 1.50 },
      { id: 'i16', raw_material_id: 'rm18', name: 'Soy Sauce',     qty: 0.02,  unit: 'L',  cost_per_unit: 1.20 },
      { id: 'i17', raw_material_id: 'rm19', name: 'Cooking Oil',   qty: 0.02,  unit: 'L',  cost_per_unit: 1.40 },
      { id: 'i18', raw_material_id: 'rm20', name: 'Green Onion',   qty: 0.01,  unit: 'kg', cost_per_unit: 0.80 },
    ],
  },
  {
    id: 'r5',
    menu_item_id: '6',
    menu_item_name: 'Bubble Tea',
    emoji: '🧋',
    portion_size: 1,
    portion_unit: 'cup',
    notes: 'Cook pearls 25 min, soak in sugar syrup. Shake with ice for 20 seconds.',
    ingredients: [
      { id: 'i19', raw_material_id: 'rm11', name: 'Tapioca Pearls',  qty: 0.05, unit: 'kg', cost_per_unit: 2.50 },
      { id: 'i20', raw_material_id: 'rm12', name: 'Black Tea Leaves', qty: 0.008, unit: 'kg', cost_per_unit: 3.00 },
      { id: 'i21', raw_material_id: 'rm13', name: 'Condensed Milk',  qty: 0.04, unit: 'L',  cost_per_unit: 2.00 },
      { id: 'i22', raw_material_id: 'rm2',  name: 'Sugar',           qty: 0.02, unit: 'kg', cost_per_unit: 0.60 },
    ],
  },
  {
    id: 'r6',
    menu_item_id: '8',
    menu_item_name: 'Mango Sticky Rice',
    emoji: '🥭',
    portion_size: 1,
    portion_unit: 'serving',
    notes: 'Soak glutinous rice 1 hour before steaming. Serve with warm coconut sauce.',
    ingredients: [
      { id: 'i23', raw_material_id: 'rm15', name: 'Glutinous Rice', qty: 0.15, unit: 'kg', cost_per_unit: 1.10 },
      { id: 'i24', raw_material_id: 'rm16', name: 'Coconut Milk',   qty: 0.15, unit: 'L',  cost_per_unit: 1.80 },
      { id: 'i25', raw_material_id: 'rm14', name: 'Mango (Fresh)',  qty: 0.20, unit: 'kg', cost_per_unit: 2.00 },
      { id: 'i26', raw_material_id: 'rm2',  name: 'Sugar',          qty: 0.03, unit: 'kg', cost_per_unit: 0.60 },
    ],
  },
]

const MOCK_MENU_ITEMS = [
  { id: '1', name: 'Steamed Bun',       emoji: '🥟' },
  { id: '2', name: 'Beef Noodle',       emoji: '🍜' },
  { id: '3', name: 'Chicken Pasta',     emoji: '🍝' },
  { id: '4', name: 'Fried Rice',        emoji: '🍳' },
  { id: '5', name: 'Iced Latte',        emoji: '☕' },
  { id: '6', name: 'Bubble Tea',        emoji: '🧋' },
  { id: '7', name: 'Chocolate Cake',    emoji: '🍰' },
  { id: '8', name: 'Mango Sticky Rice', emoji: '🥭' },
]

function newIngredientRow(): RecipeIngredient {
  return { id: `new-${Date.now()}-${Math.random()}`, raw_material_id: '', name: '', qty: 0, unit: '', cost_per_unit: 0 }
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function RecipePage() {
  const [recipes, setRecipes]               = useState<Recipe[]>(MOCK_RECIPES)
  const [selectedId, setSelectedId]         = useState<string | null>(null)
  const [search, setSearch]                 = useState('')
  const [showModal, setShowModal]           = useState(false)
  const [editingRecipe, setEditingRecipe]   = useState<Recipe | null>(null)

  // Right-panel edit state
  const [detailIngredients, setDetailIngredients] = useState<RecipeIngredient[]>([])
  const [detailNotes, setDetailNotes]             = useState('')
  const [detailDirty, setDetailDirty]             = useState(false)

  const selected = useMemo(
    () => recipes.find(r => r.id === selectedId) ?? null,
    [recipes, selectedId],
  )

  function selectRecipe(recipe: Recipe) {
    setSelectedId(recipe.id)
    setDetailIngredients(recipe.ingredients.map(i => ({ ...i })))
    setDetailNotes(recipe.notes)
    setDetailDirty(false)
  }

  const filtered = useMemo(
    () => recipes.filter(r => r.menu_item_name.toLowerCase().includes(search.toLowerCase())),
    [recipes, search],
  )

  const totalCost = (ingredients: RecipeIngredient[]) =>
    ingredients.reduce((sum, i) => sum + i.qty * i.cost_per_unit, 0)

  // ── Detail panel actions ──
  function handleDetailIngredientChange(id: string, field: keyof RecipeIngredient, value: string | number) {
    setDetailIngredients(prev =>
      prev.map(i => {
        if (i.id !== id) return i
        if (field === 'raw_material_id') {
          const mat = MOCK_RAW_MATERIALS.find(m => m.id === value)
          if (mat) return { ...i, raw_material_id: mat.id, name: mat.name, unit: mat.unit, cost_per_unit: mat.cost_per_unit }
        }
        return { ...i, [field]: value }
      }),
    )
    setDetailDirty(true)
  }

  function handleDetailAddIngredient() {
    setDetailIngredients(prev => [...prev, newIngredientRow()])
    setDetailDirty(true)
  }

  function handleDetailDeleteIngredient(id: string) {
    setDetailIngredients(prev => prev.filter(i => i.id !== id))
    setDetailDirty(true)
  }

  function handleDetailSave() {
    if (!selected) return
    setRecipes(prev =>
      prev.map(r =>
        r.id === selected.id ? { ...r, ingredients: detailIngredients, notes: detailNotes } : r,
      ),
    )
    setDetailDirty(false)
  }

  // ── Modal ──
  function openAddModal() {
    setEditingRecipe({
      id: '',
      menu_item_id: '',
      menu_item_name: '',
      emoji: '🍽️',
      portion_size: 1,
      portion_unit: 'serving',
      notes: '',
      ingredients: [newIngredientRow()],
    })
    setShowModal(true)
  }

  function openEditModal() {
    if (!selected) return
    setEditingRecipe({ ...selected, ingredients: selected.ingredients.map(i => ({ ...i })) })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingRecipe(null)
  }

  function handleModalMenuChange(menuItemId: string) {
    if (!editingRecipe) return
    const item = MOCK_MENU_ITEMS.find(m => m.id === menuItemId)
    setEditingRecipe({ ...editingRecipe, menu_item_id: menuItemId, menu_item_name: item?.name ?? '', emoji: item?.emoji ?? '🍽️' })
  }

  function handleModalIngredientChange(id: string, field: keyof RecipeIngredient, value: string | number) {
    if (!editingRecipe) return
    const updated = editingRecipe.ingredients.map(i => {
      if (i.id !== id) return i
      if (field === 'raw_material_id') {
        const mat = MOCK_RAW_MATERIALS.find(m => m.id === value)
        if (mat) return { ...i, raw_material_id: mat.id, name: mat.name, unit: mat.unit, cost_per_unit: mat.cost_per_unit }
      }
      return { ...i, [field]: value }
    })
    setEditingRecipe({ ...editingRecipe, ingredients: updated })
  }

  function handleModalAddRow() {
    if (!editingRecipe) return
    setEditingRecipe({ ...editingRecipe, ingredients: [...editingRecipe.ingredients, newIngredientRow()] })
  }

  function handleModalDeleteRow(id: string) {
    if (!editingRecipe) return
    setEditingRecipe({ ...editingRecipe, ingredients: editingRecipe.ingredients.filter(i => i.id !== id) })
  }

  function handleModalSave() {
    if (!editingRecipe || !editingRecipe.menu_item_id) return
    if (editingRecipe.id) {
      // editing existing
      setRecipes(prev => prev.map(r => r.id === editingRecipe.id ? editingRecipe : r))
      if (selectedId === editingRecipe.id) {
        setDetailIngredients(editingRecipe.ingredients.map(i => ({ ...i })))
        setDetailNotes(editingRecipe.notes)
        setDetailDirty(false)
      }
    } else {
      // new
      const newRecipe: Recipe = { ...editingRecipe, id: `r${Date.now()}` }
      setRecipes(prev => [...prev, newRecipe])
      selectRecipe(newRecipe)
    }
    closeModal()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full gap-4 p-4" style={{ color: 'var(--text-col)' }}>

      {/* ── Left panel ── */}
      <aside
        className="w-72 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-col)' }}>
          <div className="flex items-center gap-2">
            <BookOpen size={18} style={{ color: 'var(--cta-primary)' }} />
            <span className="font-semibold text-sm">Recipes</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--active-bg)', color: 'var(--cta-primary)' }}
            >
              {recipes.length}
            </span>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--cta-primary)', color: '#fff' }}
          >
            <Plus size={13} />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--border-col)' }}>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted-col)' }} />
            <input
              type="text"
              placeholder="Search recipes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--main-bg)',
                border: '1px solid var(--border-col)',
                color: 'var(--text-col)',
              }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted-col)' }}>No recipes found</p>
          ) : (
            filtered.map(recipe => {
              const isActive = recipe.id === selectedId
              return (
                <button
                  key={recipe.id}
                  onClick={() => selectRecipe(recipe)}
                  className="w-full text-left px-3 py-2.5 mx-0 flex items-center gap-3 transition-colors"
                  style={isActive
                    ? { background: 'var(--active-bg)', borderLeft: '3px solid var(--cta-primary)', paddingLeft: '9px' }
                    : { borderLeft: '3px solid transparent' }
                  }
                >
                  <span className="text-xl leading-none">{recipe.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{recipe.menu_item_name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted-col)' }}>
                      {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''} · {recipe.portion_size} {recipe.portion_unit}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted-col)', flexShrink: 0 }} />
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main
        className="flex-1 flex flex-col rounded-xl overflow-hidden"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
      >
        {selected ? (
          <>
            {/* Detail header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-col)' }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selected.emoji}</span>
                <div>
                  <h2 className="font-semibold text-lg">{selected.menu_item_name}</h2>
                  <p className="text-sm flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-muted-col)' }}>
                    <Scale size={13} />
                    Makes {selected.portion_size} {selected.portion_unit}
                  </p>
                </div>
              </div>
              <button
                onClick={openEditModal}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--active-bg)', color: 'var(--cta-primary)', border: '1px solid var(--border-col)' }}
              >
                <Edit2 size={14} />
                Edit
              </button>
            </div>

            {/* Ingredients table */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              <div>
                <h3 className="text-sm font-semibold mb-3">Ingredients</h3>
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-col)' }}>
                  {/* Table head */}
                  <div
                    className="grid text-xs font-medium px-3 py-2"
                    style={{
                      gridTemplateColumns: '1fr 80px 70px 90px 90px 40px',
                      background: 'var(--main-bg)',
                      color: 'var(--text-muted-col)',
                      borderBottom: '1px solid var(--border-col)',
                    }}
                  >
                    <span>Ingredient</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Unit</span>
                    <span className="text-right">Cost/unit</span>
                    <span className="text-right">Total</span>
                    <span />
                  </div>

                  {/* Rows */}
                  {detailIngredients.map(ing => (
                    <div
                      key={ing.id}
                      className="grid items-center px-3 py-2 text-sm"
                      style={{
                        gridTemplateColumns: '1fr 80px 70px 90px 90px 40px',
                        borderBottom: '1px solid var(--border-col)',
                      }}
                    >
                      <span className="font-medium">{ing.name || <span style={{ color: 'var(--text-muted-col)' }}>—</span>}</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={ing.qty}
                        onChange={e => handleDetailIngredientChange(ing.id, 'qty', parseFloat(e.target.value) || 0)}
                        className="text-right w-full bg-transparent outline-none rounded px-1 py-0.5 hover:bg-black/10 focus:bg-black/10"
                        style={{ color: 'var(--text-col)' }}
                      />
                      <span className="text-right text-xs" style={{ color: 'var(--text-muted-col)' }}>{ing.unit}</span>
                      <span className="text-right text-xs" style={{ color: 'var(--text-muted-col)' }}>${ing.cost_per_unit.toFixed(2)}</span>
                      <span className="text-right font-medium">${(ing.qty * ing.cost_per_unit).toFixed(2)}</span>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDetailDeleteIngredient(ing.id)}
                          className="p-1 rounded transition-opacity hover:opacity-70"
                          style={{ color: 'var(--cta-danger)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total row */}
                  <div
                    className="grid items-center px-3 py-2.5 text-sm font-semibold"
                    style={{
                      gridTemplateColumns: '1fr 80px 70px 90px 90px 40px',
                      background: 'var(--main-bg)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted-col)' }}>Total raw material cost</span>
                    <span />
                    <span />
                    <span />
                    <span className="text-right" style={{ color: 'var(--cta-primary)' }}>
                      ${totalCost(detailIngredients).toFixed(2)}
                    </span>
                    <span />
                  </div>
                </div>

                {/* Add ingredient */}
                <button
                  onClick={handleDetailAddIngredient}
                  className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--cta-primary)', border: '1px dashed var(--cta-primary)' }}
                >
                  <Plus size={13} />
                  Add Ingredient
                </button>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Notes / Instructions</h3>
                <textarea
                  rows={4}
                  value={detailNotes}
                  onChange={e => { setDetailNotes(e.target.value); setDetailDirty(true) }}
                  placeholder="Add preparation notes or instructions…"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--main-bg)',
                    border: '1px solid var(--border-col)',
                    color: 'var(--text-col)',
                  }}
                />
              </div>
            </div>

            {/* Footer save */}
            <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-col)' }}>
              {detailDirty ? (
                <span className="text-xs" style={{ color: 'var(--text-muted-col)' }}>Unsaved changes</span>
              ) : (
                <span className="text-xs" style={{ color: 'var(--cta-success)' }}>All saved</span>
              )}
              <button
                onClick={handleDetailSave}
                disabled={!detailDirty}
                className="text-sm px-4 py-2 rounded-lg font-medium transition-opacity"
                style={{
                  background: detailDirty ? 'var(--cta-primary)' : 'var(--active-bg)',
                  color: detailDirty ? '#fff' : 'var(--text-muted-col)',
                  cursor: detailDirty ? 'pointer' : 'default',
                }}
              >
                Save Recipe
              </button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted-col)' }}>
            <BookOpen size={48} strokeWidth={1} />
            <p className="text-base font-medium">Select a recipe to view details</p>
            <p className="text-sm">Or add a new recipe using the button on the left.</p>
          </div>
        )}
      </main>

      {/* ── Add / Edit Modal ── */}
      {showModal && editingRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border-col)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-col)' }}>
              <h3 className="font-semibold text-base">
                {editingRecipe.id ? 'Edit Recipe' : 'Add New Recipe'}
              </h3>
              <button onClick={closeModal} className="p-1 rounded-lg hover:opacity-70" style={{ color: 'var(--text-muted-col)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Menu item + portion */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>
                    Menu Item
                  </label>
                  <select
                    value={editingRecipe.menu_item_id}
                    onChange={e => handleModalMenuChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', color: 'var(--text-col)' }}
                  >
                    <option value="">— Select item —</option>
                    {MOCK_MENU_ITEMS.map(m => (
                      <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>Portion size</label>
                    <input
                      type="number"
                      min={1}
                      value={editingRecipe.portion_size}
                      onChange={e => setEditingRecipe({ ...editingRecipe, portion_size: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', color: 'var(--text-col)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>Unit</label>
                    <input
                      type="text"
                      placeholder="serving"
                      value={editingRecipe.portion_unit}
                      onChange={e => setEditingRecipe({ ...editingRecipe, portion_unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', color: 'var(--text-col)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Ingredients</h4>
                <div className="space-y-2">
                  {/* Table head */}
                  <div
                    className="grid text-xs font-medium px-2 py-1.5 rounded-lg"
                    style={{ gridTemplateColumns: '1fr 80px 70px 32px', background: 'var(--main-bg)', color: 'var(--text-muted-col)' }}
                  >
                    <span>Raw Material</span>
                    <span className="text-center">Qty</span>
                    <span className="text-center">Unit</span>
                    <span />
                  </div>

                  {editingRecipe.ingredients.map(ing => (
                    <div key={ing.id} className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr 80px 70px 32px' }}>
                      <select
                        value={ing.raw_material_id}
                        onChange={e => handleModalIngredientChange(ing.id, 'raw_material_id', e.target.value)}
                        className="px-2 py-1.5 rounded-lg text-sm outline-none"
                        style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', color: 'var(--text-col)' }}
                      >
                        <option value="">— Select —</option>
                        {MOCK_RAW_MATERIALS.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={ing.qty}
                        onChange={e => handleModalIngredientChange(ing.id, 'qty', parseFloat(e.target.value) || 0)}
                        className="px-2 py-1.5 rounded-lg text-sm outline-none text-center"
                        style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', color: 'var(--text-col)' }}
                      />
                      <div
                        className="px-2 py-1.5 rounded-lg text-sm text-center"
                        style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', color: 'var(--text-muted-col)' }}
                      >
                        {ing.unit || '—'}
                      </div>
                      <button
                        onClick={() => handleModalDeleteRow(ing.id)}
                        className="flex items-center justify-center p-1 rounded-lg hover:opacity-70"
                        style={{ color: 'var(--cta-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={handleModalAddRow}
                    className="mt-1 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-70"
                    style={{ color: 'var(--cta-primary)', border: '1px dashed var(--cta-primary)' }}
                  >
                    <Plus size={13} />
                    Add Row
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted-col)' }}>
                  Notes / Instructions
                </label>
                <textarea
                  rows={3}
                  value={editingRecipe.notes}
                  onChange={e => setEditingRecipe({ ...editingRecipe, notes: e.target.value })}
                  placeholder="Add preparation notes…"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: 'var(--main-bg)', border: '1px solid var(--border-col)', color: 'var(--text-col)' }}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border-col)' }}>
              <button
                onClick={closeModal}
                className="text-sm px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-70"
                style={{ background: 'var(--active-bg)', color: 'var(--text-col)', border: '1px solid var(--border-col)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={!editingRecipe.menu_item_id}
                className="text-sm px-4 py-2 rounded-lg font-medium transition-opacity"
                style={{
                  background: editingRecipe.menu_item_id ? 'var(--cta-primary)' : 'var(--active-bg)',
                  color: editingRecipe.menu_item_id ? '#fff' : 'var(--text-muted-col)',
                  cursor: editingRecipe.menu_item_id ? 'pointer' : 'default',
                }}
              >
                {editingRecipe.id ? 'Save Changes' : 'Add Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
