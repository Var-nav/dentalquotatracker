import { LayoutDashboard, Plus, TrendingUp, List, Target } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: LayoutDashboard,
    gradient: "from-blue-500 to-cyan-500",
    color: "text-blue-600 dark:text-blue-400"
  },
  { 
    title: "Add Case", 
    url: "/add-case", 
    icon: Plus,
    gradient: "from-pink-500 to-rose-500",
    color: "text-pink-600 dark:text-pink-400"
  },
  { 
    title: "Analytics", 
    url: "/analytics", 
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-500",
    color: "text-green-600 dark:text-green-400"
  },
  { 
    title: "Case History", 
    url: "/history", 
    icon: List,
    gradient: "from-purple-500 to-violet-500",
    color: "text-purple-600 dark:text-purple-400"
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={open ? "w-72" : "w-20"} collapsible="icon">
      <SidebarContent className="bg-gradient-to-b from-card via-card/95 to-card border-r border-border/50">
        <div className="p-6 border-b border-border/50 bg-gradient-to-r from-purple/10 via-primary/10 to-teal/10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple via-primary to-teal flex items-center justify-center shadow-lg ring-4 ring-white/20 shrink-0 transition-all duration-300 hover:scale-110 hover:rotate-3">
              <Target className="h-6 w-6 text-white" />
            </div>
            {open && (
              <div className="overflow-hidden animate-fade-in">
                <h2 className="font-bold text-base truncate bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
                  Clinical Quota
                </h2>
                <p className="text-xs text-muted-foreground font-medium">Tracker Dashboard</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="mt-6 px-3">
          <SidebarGroupLabel className={`${open ? "text-xs font-semibold uppercase tracking-wider mb-3" : "sr-only"} text-muted-foreground px-2`}>
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-auto p-0">
                      <NavLink
                        to={item.url}
                        end
                        className={`
                          group relative overflow-hidden
                          ${open ? "px-4 py-3" : "px-3 py-3 justify-center"}
                          rounded-xl transition-all duration-300
                          ${active 
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-105` 
                            : 'hover:bg-muted/70 hover:scale-105 hover:shadow-md'
                          }
                        `}
                        activeClassName=""
                      >
                        {active && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse" />
                        )}
                        <div className="relative z-10 flex items-center gap-3">
                          <item.icon 
                            className={`
                              ${open ? "h-5 w-5" : "h-6 w-6"} 
                              shrink-0 transition-all duration-300
                              ${active ? 'text-white' : item.color}
                              group-hover:scale-110
                            `} 
                            strokeWidth={active ? 2.5 : 2}
                          />
                          {open && (
                            <span className={`font-semibold text-sm transition-all duration-300 ${active ? 'text-white' : 'text-foreground'}`}>
                              {item.title}
                            </span>
                          )}
                        </div>
                        {active && open && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white animate-pulse" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {open && (
          <div className="mt-auto p-4 border-t border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5 animate-fade-in">
            <div className="text-xs space-y-2">
              <div className="flex items-center gap-2 px-2">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <p className="font-semibold text-foreground">Quick Stats</p>
              </div>
              <div className="px-2 space-y-1 text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  8 Departments
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Track progress
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
