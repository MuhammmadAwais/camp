import { create } from "zustand";

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  expandedGroups: Record<string, boolean>;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleGroup: (groupKey: string) => void;
  setGroupExpanded: (groupKey: string, expanded: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  expandedGroups: {
    dashboard: true,
    vehicles: false,
    bids: false,
    valuations: false,
    compliance: false,
    settings: false,
  },

  toggleSidebar: () =>
    set((state) => ({
      isCollapsed: !state.isCollapsed,
    })),

  setCollapsed: (collapsed: boolean) =>
    set(() => ({
      isCollapsed: collapsed,
    })),

  toggleGroup: (groupKey: string) =>
    set((state) => ({
      expandedGroups: {
        ...state.expandedGroups,
        [groupKey]: !state.expandedGroups[groupKey],
      },
    })),

  setGroupExpanded: (groupKey: string, expanded: boolean) =>
    set((state) => ({
      expandedGroups: {
        ...state.expandedGroups,
        [groupKey]: expanded,
      },
    })),

  toggleMobile: () =>
    set((state) => ({
      isMobileOpen: !state.isMobileOpen,
    })),

  closeMobile: () =>
    set(() => ({
      isMobileOpen: false,
    })),
}));
