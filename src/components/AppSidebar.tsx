import { LayoutDashboard, Plus, TrendingUp, List, Target, UserCircle2, Layers3, Calendar, Shield, MessageSquare } from "lucide-react";
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
import { useUserMeta } from "@/hooks/useUserMeta";

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    gradient: "from-blue-500 to-cyan-500",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Add Case",
    url: "/add-case",
    icon: Plus,
    gradient: "from-pink-500 to-rose-500",
    color: "text-pink-600 dark:text-pink-400",
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
    gradient: "from-green-500 to-emerald-500",
    color: "text-green-600 dark:text-green-400",
  },
  {
    title: "Assessments",
    url: "/assessments",
    icon: Calendar,
    gradient: "from-teal-500 to-emerald-500",
    color: "text-teal-600 dark:text-teal-400",
  },
  {
    title: "Case History",
    url: "/history",
    icon: List,
    gradient: "from-purple-500 to-violet-500",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    title: "My Account",
    url: "/account",
    icon: UserCircle2,
    gradient: "from-slate-500 to-slate-700",
    color: "text-muted-foreground",
  },
  {
    title: "Batches",
    url: "/batches",
    icon: Layers3,
    gradient: "from-amber-500 to-orange-500",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageSquare,
    gradient: "from-indigo-500 to-purple-500",
    color: "text-indigo-600 dark:text-indigo-400",
  },
];

const adminNavItems = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: Shield,
    gradient: "from-red-500 to-rose-500",
    color: "text-red-600 dark:text-red-400",
    adminOnly: true,
  },
  {
    title: "User Management",
    url: "/admin-panel",
    icon: Shield,
    gradient: "from-violet-500 to-purple-500",
    color: "text-violet-600 dark:text-violet-400",
    adminOnly: true,
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { meta } = useUserMeta();

  const isActive = (path: string) => currentPath === path;

  // Combine nav items, show admin items only if user is admin
  const visibleItems = [
    ...navItems,
    ...(meta.role === "admin" ? adminNavItems : []),
  ];

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
                <h2 className="font-cursive font-bold text-base truncate bg-clip-text text-transparent bg-gradient-to-r from-purple via-primary to-teal">
                  Varshify
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
              {visibleItems.map((item) => {
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
            <UserContextSection />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function UserContextSection() {
  const { meta, loading } = useUserMeta();

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-xs text-muted-foreground px-2">
        <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
        <div className="space-y-1 flex-1">
          <div className="h-2 w-20 rounded bg-muted animate-pulse" />
          <div className="h-2 w-16 rounded bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!meta.role && !meta.batchName) {
    return (
      <div className="text-xs text-muted-foreground px-2 space-y-1">
        <p className="font-semibold flex items-center gap-2">
          <UserCircle2 className="h-4 w-4 text-muted-foreground" />
          Not set up yet
        </p>
        <p className="text-[11px]">
          Finish onboarding to link your role and batch.
        </p>
      </div>
    );
  }

  const roleLabel = meta.role
    ? meta.role === "student"
      ? "Learner"
      : meta.role === "instructor"
      ? "Senior learner"
      : meta.role === "co-admin"
      ? "Co-Admin"
      : "Admin"
    : "";

  return (
    <div className="flex items-center gap-3 text-xs px-2">
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground shadow-md">
        <UserCircle2 className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold text-foreground truncate">
          {roleLabel || "Role not set"}
          {meta.yearOfStudy && ` · ${meta.yearOfStudy}`}
          {meta.batchName && ` · ${meta.batchName}`}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {(meta.intakeLabel || meta.academicYear)
            ? `Viewing ${[meta.intakeLabel, meta.academicYear].filter(Boolean).join(" ")}`
            : "Viewing progress for your batch"}
        </p>
      </div>
    </div>
  );
}
