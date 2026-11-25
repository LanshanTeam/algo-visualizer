import { useState, type MouseEvent } from "react";
import { Info, Search } from "lucide-react";
import { Input } from "./ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { ABOUT_ROUTE } from "./about-page";
import { TOPIC_GROUPS_VIEW } from "../topics/registry";

export function TopicSidebar({
  topic,
  onNavigate,
}: {
  topic: string;
  onNavigate: (next: string) => void;
}) {
  const { setOpenMobile } = useSidebar();
  const isAbout = topic === ABOUT_ROUTE;
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const groups = TOPIC_GROUPS_VIEW.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      `${item.title} ${item.id} ${group.label}`.toLocaleLowerCase().includes(normalizedQuery),
    ),
  })).filter((group) => group.items.length > 0);

  function navigateTo(event: MouseEvent<HTMLAnchorElement>, next: string) {
    event.preventDefault();
    onNavigate(next);
    setOpenMobile(false);
  }

  return (
    <Sidebar aria-label="专题导航" className="topic-sidebar">
      <SidebarHeader className="sidebar-heading">
        <div className="sidebar-search">
          <Search size={15} aria-hidden="true" />
          <Input type="search" aria-label="搜索专题" placeholder="搜索专题…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.length === 0 && <p className="sidebar-empty" role="status">未找到相关专题，请尝试其他关键词。</p>}
        {groups.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>{group.label}<span className="ml-auto">{group.items.length}</span></SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = topic === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild isActive={active}>
                        <a
                          href={`#/${item.id}`}
                          aria-current={active ? "page" : undefined}
                          className={
                            item.status === "planned"
                              ? "text-muted-foreground"
                              : undefined
                          }
                          onClick={(event) => navigateTo(event, item.id)}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                      {(item.status === "planned" || item.badge) && (
                        <SidebarMenuBadge>
                          {item.status === "planned" ? "待上线" : item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isAbout}>
              <a
                href={`#/${ABOUT_ROUTE}`}
                aria-current={isAbout ? "page" : undefined}
                onClick={(event) => navigateTo(event, ABOUT_ROUTE)}
              >
                <Info />
                <span>关于</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
