import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Ticket, 
  ClipboardList,
  User as UserIcon,
  X,
  CalendarDays,
  DoorOpen,
  UsersRound,
  ChevronRight,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import logo from '@/assets/images/logo_white.png'; // Using the white logo for better contrast
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navigationMenu = [
  { name: "Dashboard", href: "/", icon: Home },
  {
    name: "Bookings",
    icon: ClipboardList,
    subItems: [
      { name: "Onsite Booking", href: "/onsite-booking", icon: Store },
      { name: "Bookings", href: "/bookings", icon: ClipboardList },
    ],
  },
  { name: "Users", href: "/users", icon: Users },
];

const masterDataItems = [
    { name: "Ticket Prices", href: "/ticket-prices", icon: Ticket },
    { name: "Day Types", href: "/day-types", icon: CalendarDays },
    { name: "Gates", href: "/gates", icon: DoorOpen },
    { name: "Visitor Categories", href: "/visitor-categories", icon: UsersRound },
]

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();
  
  const defaultOpenMenu = navigationMenu.find(item => 
    item.subItems?.some(sub => location.startsWith(sub.href))
  )?.name || null;
  const [openMenu, setOpenMenu] = useState<string | null>(defaultOpenMenu);


  const { data: getMeResponse } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false,
  });

  const user = getMeResponse?.data;

  const SidebarContent = () => (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-sidebar">
      <div className="flex items-center flex-shrink-0 px-8">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="AdminPanel Logo" />
        </div>
      </div>
      
      <div className="mt-6 flex-1 flex flex-col justify-between">
        <div>
          {/* FIX: Removed flex-1 from both <nav> elements to remove the large space */}
          <nav className="px-2 space-y-1">
            <h3 className="px-3 text-xs font-semibold text-sidebar-foreground tracking-wider uppercase">Main</h3>
            {navigationMenu.map((item) => {
              const Icon = item.icon;
              const isParentActive = item.subItems?.some(sub => location === sub.href);

              if (item.subItems) {
                return (
                  <Collapsible key={item.name} open={openMenu === item.name} onOpenChange={() => setOpenMenu(openMenu === item.name ? null : item.name)}>
                    <CollapsibleTrigger className={cn("sidebar-nav-item group w-full", isParentActive && "active")}>
                       <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-3" />
                          <span>{item.name}</span>
                       </div>
                       <ChevronRight className={cn("w-4 h-4 transition-transform", openMenu === item.name && "rotate-90")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 space-y-1">
                      {item.subItems.map(subItem => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location === subItem.href;
                          return (
                               <Link key={subItem.name} href={subItem.href} className={cn("sidebar-nav-item group is-subitem", isSubActive && "active")} onClick={isMobile ? onClose : undefined}>
                                  <SubIcon className="w-4 h-4 mr-3" />
                                  <span>{subItem.name}</span>
                              </Link>
                          )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )
              }

              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href} className={cn("sidebar-nav-item group", isActive && "active")} onClick={isMobile ? onClose : undefined}>
                  <Icon className="w-4 h-4 mr-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <nav className="mt-4 px-2 space-y-1">
            <h3 className="px-3 text-xs font-semibold text-sidebar-foreground tracking-wider uppercase">Master Data</h3>
            {masterDataItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href} className={cn("sidebar-nav-item group", isActive && "active")} onClick={isMobile ? onClose : undefined}>
                  <Icon className="w-4 h-4 mr-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex flex-col border-t border-sidebar-border p-4 space-y-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-sidebar-foreground">{user?.full_name || 'Admin User'}</p>
                <p className="text-xs font-medium text-sidebar-foreground">{user?.email || 'Loading...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className={cn("fixed inset-0 bg-gray-900/80 z-40 md:hidden", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={onClose} aria-hidden="true" />
        <div className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transform md:hidden", isOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="absolute top-2 right-0 -mr-14">
             <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-white" onClick={onClose}>
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6" />
              </button>
          </div>
          <SidebarContent />
        </div>
      </>
    );
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <SidebarContent />
    </div>
  );
}
