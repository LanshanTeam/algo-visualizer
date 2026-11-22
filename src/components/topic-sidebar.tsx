import type { MouseEvent } from "react";
import { Info } from "lucide-react";
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

  function navigateTo(event: MouseEvent<HTMLAnchorElement>, next: string) {
    event.preventDefault();
    onNavigate(next);
    setOpenMobile(false);
  }

  return (
    <Sidebar aria-label="专题导航">
      <SidebarHeader className="p-4 font-semibold">
        数据结构与算法
      </SidebarHeader>
      <SidebarContent>
        {TOPIC_GROUPS_VIEW.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
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
                          {item.status === "planned" ? "WIP" : item.badge}
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
