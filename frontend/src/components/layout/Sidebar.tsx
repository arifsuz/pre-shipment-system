// frontend/src/components/layout/Sidebar.tsx
import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Building2, Users, ChevronDown } from 'lucide-react';

type NavItem = {
  name: string;
  href?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children?: NavItem[];
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [openShipments, setOpenShipments] = useState<boolean>(false);

  // open shipments group automatically when route matches
  useMemo(() => {
    if (location.pathname.startsWith('/shipments')) setOpenShipments(true);
  }, [location.pathname]);

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    {
      name: 'Shipments',
      icon: Package,
      children: [
        { name: 'Data Shipment', href: '/shipments' },
        { name: 'Data Memo', href: '/shipments/memos' } // buat route list memo nanti
      ]
    },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Users', href: '/users', icon: Users }
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600">PSE System</h1>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          if (item.children && item.children.length > 0) {
            const Icon = item.icon;
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => setOpenShipments(v => !v)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname.startsWith('/shipments')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {Icon && <Icon className="h-5 w-5 mr-3" />}
                  <span className="flex-1 text-left">{item.name}</span>
                  <ChevronDown className={`h-4 w-4 transform transition-transform ${openShipments ? 'rotate-180' : ''}`} />
                </button>

                {openShipments && (
                  <div className="pl-8 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.name}
                        to={child.href || '#'}
                        className={({ isActive }) =>
                          `block px-3 py-2 text-sm rounded-lg ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`
                        }
                      >
                        {child.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href!}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {Icon && <Icon className="h-5 w-5 mr-3" />}
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};