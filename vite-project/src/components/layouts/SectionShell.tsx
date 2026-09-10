import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface SectionNavChild {
  title: string;
  to: string;
  /** Match this route exactly, so a parent link isn't active on child routes. */
  end?: boolean;
}

export interface SectionNavItem {
  title: string;
  icon: LucideIcon;
  /** Every route under this group, used to decide when it should be open. */
  basePaths: string[];
  items: SectionNavChild[];
}

interface SectionShellProps {
  title: string;
  description?: string;
  items: SectionNavItem[];
}

function SectionNavGroup({ group }: { group: SectionNavItem }) {
  const { pathname } = useLocation();
  const isGroupActive = group.basePaths.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
  const [open, setOpen] = useState(isGroupActive);

  // The index route redirects (/tests -> /tests/collections) after this mounts,
  // so the active group has to be re-opened once the final path resolves.
  // Only forces it open — a group the user collapsed by hand stays collapsed.
  useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isGroupActive && "text-primary"
        )}
      >
        <group.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-right">{group.title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ul className="mt-1 mr-4 space-y-1 border-r pr-3">
          {group.items.map((child) => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                end={child.end}
                className={({ isActive }) =>
                  cn(
                    "block rounded-md px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                {child.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Public-facing section page: a heading plus a collapsible side menu that
 * switches between the section's sub-pages. The menu is first in the DOM so it
 * lands on the right under the site's RTL direction.
 */
export function SectionShell({ title, description, items }: SectionShellProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        {description ? (
          <p className="mt-2 text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <nav className="space-y-1 lg:sticky lg:top-28">
            {items.map((group) => (
              <SectionNavGroup key={group.title} group={group} />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
