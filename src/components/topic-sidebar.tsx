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
    <Sidebar aria-label="专题导航" className="av-sidebar">
      <SidebarHeader className="av-sidebar-title p-4 font-semibold">
        数据结构与算法
      </SidebarHeader>
      <SidebarContent>
        {TOPIC_GROUPS_VIEW.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel className="av-group-label">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = topic === item.id;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild isActive={active} className={active ? "av-menu-active" : undefined}>
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
