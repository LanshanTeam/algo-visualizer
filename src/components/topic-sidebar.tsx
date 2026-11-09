import { Activity } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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
import { TOPIC_GROUPS_VIEW } from "../topics/registry";

export function TopicSidebar({
  topic,
  onNavigate,
}: {
  topic: string;
  onNavigate: (next: string) => void;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar aria-label="专题导航">
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <div className="app-brand-mark" aria-hidden="true"><Activity /></div>
          <div className="flex flex-col">
            <span className="text-[0.95rem] font-semibold leading-tight tracking-tight">数据结构与算法</span>
          </div>
        </div>
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
                          onClick={(event) => {
                            event.preventDefault();
                            onNavigate(item.id);
                            setOpenMobile(false);
                          }}
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
    </Sidebar>
  );
}
