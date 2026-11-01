import { ArrowDownUp, GitBranch } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import type { Topic } from "../trace";

const topics = [
  { id: "linked-list", group: "数据结构", title: "单链表", icon: GitBranch },
  { id: "quick-sort", group: "算法", title: "快速排序", icon: ArrowDownUp },
] as const;

export function TopicSidebar({
  topic,
  onNavigate,
}: {
  topic: Topic;
  onNavigate: (next: Topic) => void;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar aria-label="专题导航">
      <SidebarHeader className="p-4 font-semibold">
        数据结构与算法
      </SidebarHeader>
      <SidebarContent>
        {topics.map((entry) => (
          <SidebarGroup key={entry.id}>
            <SidebarGroupLabel>{entry.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={topic === entry.id}>
                    <a
                      href={`#/${entry.id}`}
                      aria-current={topic === entry.id ? "page" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        onNavigate(entry.id);
                        setOpenMobile(false);
                      }}
                    >
                      <entry.icon />
                      <span>{entry.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
