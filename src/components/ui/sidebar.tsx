import * as React from "react";
import { PanelLeft } from "lucide-react";
import { cn } from "../../lib/utils";

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("Sidebar components must be used inside <SidebarProvider>");
  return context;
}

export const SidebarProvider = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SidebarProvider({ className, children, ...props }, ref) {
    const [open, setOpen] = React.useState(true);
    const [openMobile, setOpenMobile] = React.useState(false);
    const toggleSidebar = React.useCallback(() => {
      if (typeof window !== "undefined" && window.innerWidth <= 900) {
        setOpenMobile((value) => !value);
      } else {
        setOpen((value) => !value);
      }
    }, []);
    const value = React.useMemo<SidebarContextValue>(
      () => ({
        state: open ? "expanded" : "collapsed",
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile: false,
        toggleSidebar,
      }),
      [open, openMobile, toggleSidebar],
    );
    return (
      <SidebarContext.Provider value={value}>
        <div
          ref={ref}
          className={cn("av-shell", !open && "is-collapsed", openMobile && "has-mobile-nav", className)}
          {...props}
        >
          {children}
          <div
            className="av-sidebar-scrim"
            aria-hidden="true"
            onClick={() => setOpenMobile(false)}
          />
        </div>
      </SidebarContext.Provider>
    );
  },
);

export const Sidebar = React.forwardRef<HTMLElement, React.ComponentProps<"aside">>(
  function Sidebar({ className, children, ...props }, ref) {
    const { openMobile } = useSidebar();
    return (
      <aside ref={ref} className={cn("av-sidebar", openMobile && "is-open", className)} {...props}>
        {children}
      </aside>
    );
  },
);

export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  function SidebarTrigger({ className, onClick, ...props }, ref) {
    const { toggleSidebar } = useSidebar();
    return (
      <button
        ref={ref}
        type="button"
        className={cn("av-trigger", className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) toggleSidebar();
        }}
        {...props}
      >
        <PanelLeft />
      </button>
    );
  },
);

export const SidebarInset = React.forwardRef<HTMLElement, React.ComponentProps<"main">>(
  function SidebarInset({ className, ...props }, ref) {
    return <main ref={ref} className={cn("av-main", className)} {...props} />;
  },
);

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SidebarHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-sidebar-header", className)} {...props} />;
  },
);

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SidebarFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-sidebar-footer", className)} {...props} />;
  },
);

export const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SidebarContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-sidebar-content", className)} {...props} />;
  },
);

export const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SidebarGroup({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-sidebar-group", className)} {...props} />;
  },
);

export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SidebarGroupLabel({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-sidebar-group-label", className)} {...props} />;
  },
);

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SidebarGroupContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-sidebar-group-content", className)} {...props} />;
  },
);

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  function SidebarMenu({ className, ...props }, ref) {
    return <ul ref={ref} className={cn("av-sidebar-menu", className)} {...props} />;
  },
);

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  function SidebarMenuItem({ className, ...props }, ref) {
    return <li ref={ref} className={cn("av-sidebar-menu-item", className)} {...props} />;
  },
);

export const SidebarMenuButton = React.forwardRef<
  HTMLElement,
  React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean }
>(function SidebarMenuButton({ className, asChild = false, isActive = false, children, ...props }, ref) {
  const classes = cn("av-nav-item", isActive && "is-active", className);
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, { className: cn(classes, child.props.className) });
  }
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type="button" className={classes} {...props}>
      {children}
    </button>
  );
});

export const SidebarMenuBadge = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  function SidebarMenuBadge({ className, ...props }, ref) {
    return <span ref={ref} className={cn("av-nav-badge", className)} {...props} />;
  },
);

export const SidebarSeparator = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function SidebarSeparator({ className, ...props }, ref) {
    return <div ref={ref} className={cn("av-separator", className)} {...props} />;
  },
);

export const SidebarInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function SidebarInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn("av-input", className)} {...props} />;
  },
);
