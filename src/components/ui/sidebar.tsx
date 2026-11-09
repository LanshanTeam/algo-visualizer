import * as React from "react";
import { PanelLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH = "var(--ui-sidebar-width, 16rem)";

type SidebarContextProps = {
  open: boolean;
  setOpen: (next: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (next: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};
const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar(): SidebarContextProps {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar 必须在 SidebarProvider 内使用");
  return ctx;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { defaultOpen?: boolean; open?: boolean; onOpenChange?: (next: boolean) => void }
>(({ defaultOpen = true, open: openProp, onOpenChange, className, style, children, ...props }, ref) => {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolled;
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v);
    else setOpen(!open);
  }, [isMobile, open, setOpen]);
  React.useEffect(() => {
    if (!isMobile) setOpenMobile(false);
  }, [isMobile]);
  const ctx = React.useMemo<SidebarContextProps>(
    () => ({ open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar }),
    [open, setOpen, openMobile, isMobile, toggleSidebar],
  );
  return (
    <SidebarContext.Provider value={ctx}>
      <div
        ref={ref}
        className={cn("ui-sidebar-provider", className)}
        style={{ ["--ui-sidebar-width" as string]: open && !isMobile ? "16rem" : "0px", ...style }}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
});
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { side?: "left" | "right"; variant?: string; collapsible?: string }
>(({ className, children, ...props }, ref) => {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const content = (
    <div ref={ref} data-state="expanded" className={cn("ui-sidebar", className)} {...props}>
      {children}
    </div>
  );
  if (isMobile) {
    if (!openMobile) return null;
    return (
      <>
        <div className="ui-sidebar-sheet-backdrop" onClick={() => setOpenMobile(false)} />
        <div className="ui-sidebar-sheet">
          <button
            type="button"
            aria-label="关闭导航"
            className="ui-button ui-button--ghost ui-button--icon"
            style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}
            onClick={() => setOpenMobile(false)}
          >
            <X />
          </button>
          {content}
        </div>
      </>
    );
  }
  return content;
});
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (
      <button
        ref={ref}
        type="button"
        aria-label="切换导航"
        className={cn("ui-button", "ui-button--ghost", "ui-button--icon", className)}
        onClick={(event) => {
          toggleSidebar();
          onClick?.(event);
        }}
        {...props}
      >
        <PanelLeft />
      </button>
    );
  },
);
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarInset = React.forwardRef<HTMLElement, React.ComponentProps<"main">>(
  ({ className, ...props }, ref) => (
    <main ref={ref} className={cn("ui-sidebar-inset", className)} {...props} />
  ),
);
SidebarInset.displayName = "SidebarInset";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="header" className={cn("ui-sidebar-header", className)} {...props} />
  ),
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="content" className={cn("ui-sidebar-content", className)} {...props} />
  ),
);
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="group" className={cn("ui-sidebar-group", className)} {...props} />
  ),
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="group-label" className={cn("ui-sidebar-group-label", className)} {...props} />
  ),
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="group-content" className={cn("ui-sidebar-group-content", className)} {...props} />
  ),
);
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} data-sidebar="menu" className={cn("ui-sidebar-menu", className)} {...props} />
  ),
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} data-sidebar="menu-item" className={cn("ui-sidebar-menu-item", className)} {...props} />
  ),
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & { isActive?: boolean; asChild?: boolean; variant?: string; size?: string; tooltip?: string }
>(({ className, isActive = false, asChild, children, ...props }, ref) => {
  const cls = cn("ui-sidebar-menu-button", className);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      ref,
      className: cn(cls, (children as React.ReactElement<{ className?: string }>).props.className),
      "data-active": isActive ? "true" : undefined,
    } as React.Attributes & { className?: string });
  }
  return (
    <a ref={ref} className={cls} data-active={isActive ? "true" : undefined} {...props}>
      {children}
    </a>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="menu-badge" className={cn("ui-sidebar-menu-badge", className)} {...props} />
  ),
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="footer" className={cn("p-3", className)} {...props} />
  ),
);
SidebarFooter.displayName = "SidebarFooter";
const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => <button ref={ref} className={className} {...props} />,
);
SidebarRail.displayName = "SidebarRail";
const SidebarInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn("ui-input", className)} {...props} />,
);
SidebarInput.displayName = "SidebarInput";
const SidebarSeparator = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("ui-separator ui-separator--horizontal", className)} {...props} />,
);
SidebarSeparator.displayName = "SidebarSeparator";
const SidebarGroupAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => <button ref={ref} className={className} {...props} />,
);
SidebarGroupAction.displayName = "SidebarGroupAction";
const SidebarMenuAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => <button ref={ref} className={className} {...props} />,
);
SidebarMenuAction.displayName = "SidebarMenuAction";
const SidebarMenuSkeleton = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => <div ref={ref} className={className} {...props} />,
);
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";
const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => <ul ref={ref} className={className} {...props} />,
);
SidebarMenuSub.displayName = "SidebarMenuSub";
const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => <li ref={ref} className={className} {...props} />,
);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";
const SidebarMenuSubButton = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>(
  ({ className, ...props }, ref) => <a ref={ref} className={className} {...props} />,
);
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
