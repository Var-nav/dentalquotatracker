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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Add Case", url: "/add-case", icon: Plus },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Case History", url: "/history", icon: List },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple via-primary to-teal flex items-center justify-center shadow-lg shrink-0">
              <Target className="h-5 w-5 text-white" />
            </div>
            {open && (
              <div className="overflow-hidden">
                <h2 className="font-semibold text-sm truncate bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
                  Clinical Quota
                </h2>
                <p className="text-xs text-muted-foreground">Tracker</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={open ? "" : "sr-only"}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50 transition-all duration-200"
                      activeClassName="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className={`h-5 w-5 ${open ? "mr-3" : ""}`} />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {open && (
          <div className="mt-auto p-4 border-t border-border/50 animate-fade-in">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Quick Stats</p>
              <p>8 Departments</p>
              <p>Track your progress</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
