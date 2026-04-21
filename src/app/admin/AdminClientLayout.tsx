'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabaseBrowser as supabase } from '@/lib/supabase-browser'
import { supabaseBrowser } from '@/lib/supabase-browser'
import NotificationBell from '@/components/admin/NotificationBell'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Users,
  Image as ImageIcon,
  Grid3X3,
  Star,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Zap,
  Menu,
  X,
  LogOut,
  ClipboardList,
  MessageSquare,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/urunler', label: 'Ürünler', icon: Package },
  { href: '/admin/siparisler', label: 'Siparişler', icon: ShoppingCart },
  { href: '/admin/teklif', label: 'Teklifler', icon: ClipboardList },
  { href: '/admin/kategoriler', label: 'Kategoriler', icon: FolderTree },
  { href: '/admin/bayiler', label: 'Bayiler', icon: Users },
  { href: '/admin/slider', label: 'Hero Slider', icon: ImageIcon },
  { href: '/admin/koleksiyonlar', label: 'Koleksiyonlar', icon: Grid3X3 },
  { href: '/admin/yorumlar', label: 'Yorumlar', icon: Star },
  { href: '/admin/mesajlar', label: 'Mesajlar', icon: MessageSquare },
  { href: '/admin/sayfalar', label: 'Sayfalar', icon: FileText },
  { href: '/admin/ayarlar', label: 'Ayarlar', icon: Settings },
]

export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    async function checkAdmin() {
      // Session check is already handled server-side by proxy.ts.
      // Here we only verify the admin role via a DB query.
      const { data: { session } } = await supabaseBrowser.auth.getSession()
      if (!session) return // proxy should have redirected, fallback guard

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (data?.role !== 'admin') {
        window.location.href = '/'
        return
      }

      setIsAdmin(true)
    }

    checkAdmin()
  }, [pathname])

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-center animate-pulse">
           <Zap className="w-12 h-12 text-primary-500 mx-auto mb-4" />
           <p className="text-neutral-500 font-medium">Yetki Kontrolü Yapılıyor...</p>
        </div>
      </div>
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex w-full max-w-[100vw] overflow-x-hidden relative">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#0f172a] text-white z-50 flex flex-col transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-white/10 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="block text-sm font-bold truncate">Enerji Dükkanı</span>
              <span className="block text-[10px] text-slate-400">Yönetim Paneli</span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : ''}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 w-full max-w-[100vw] lg:max-w-none transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-neutral-600 hover:text-primary-600 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-bold text-neutral-800 font-heading hidden sm:block">
              {navItems.find(i => isActive(i.href))?.label || 'Yönetim Paneli'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-primary-600 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Siteye Git</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 w-full max-w-full overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
