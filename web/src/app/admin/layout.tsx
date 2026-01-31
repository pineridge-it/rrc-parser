'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Database, Settings, Users, BarChart3 } from 'lucide-react'

const adminNavItems = [
  { href: '/admin/ingestion', label: 'Ingestion', icon: Database },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <Link href="/admin" className="flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <span className="text-xl font-bold">Admin</span>
          </Link>
        </div>
        <nav className="mt-6">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white border-r-2 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
