'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, Package, BookOpen,
  ShoppingCart, CalendarClock, BarChart3, Users, Store, Settings,
} from 'lucide-react'

const NAV = [
  { href: '/pos',        icon: ShoppingCart,   label: 'POS' },
  { href: '/orders',     icon: LayoutDashboard, label: 'Orders' },
  { href: '/menu',       icon: UtensilsCrossed, label: 'Menu' },
  { href: '/inventory',  icon: Package,         label: 'Inventory' },
  { href: '/recipe',     icon: BookOpen,        label: 'Recipe' },
  { href: '/preorder',   icon: CalendarClock,   label: 'Pre-order' },
  { href: '/reports',    icon: BarChart3,       label: 'Reports' },
  { href: '/staff',      icon: Users,           label: 'Staff' },
  { href: '/branches',   icon: Store,           label: 'Branches' },
  { href: '/settings',   icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="sidebar flex flex-col w-52 min-h-screen shrink-0 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">P</div>
        <div>
          <p className="text-white text-xs font-bold leading-tight">The POS</p>
          <p className="text-orange-400 text-[10px] leading-tight">For You</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + '/')
          return (
            <Link key={href} href={href}>
              <div className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={17} className={active ? 'text-orange-400' : ''} />
                <span>{label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Shop info at bottom */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-bold">S</div>
          <div>
            <p className="text-white text-xs font-medium">My Shop</p>
            <p className="text-slate-500 text-[10px]">Basic plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
