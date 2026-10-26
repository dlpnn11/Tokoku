"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PosShift } from "@/types/database";
import {
  shiftService,
  OpenShiftParams,
  CloseShiftParams,
  CloseShiftResult,
} from "@/services/shiftService";

interface ShiftState {
  activeShift: PosShift | null;
  isOpenModalOpen: boolean;
  isCloseModalOpen: boolean;
  isSummaryModalOpen: boolean;
  lastReconciliationResult: CloseShiftResult | null;
  isLoading: boolean;

  setOpenModalOpen: (open: boolean) => void;
  setCloseModalOpen: (open: boolean) => void;
  setSummaryModalOpen: (open: boolean) => void;

  initShift: (userId?: string) => Promise<PosShift | null>;
  openShift: (params: OpenShiftParams) => Promise<PosShift>;
  closeShift: (params: CloseShiftParams) => Promise<CloseShiftResult>;
  refreshActiveShift: () => Promise<void>;
}

export const useShiftStore = create<ShiftState>()(
  persist(
    (set, get) => ({
      activeShift: null,
      isOpenModalOpen: false,
      isCloseModalOpen: false,
      isSummaryModalOpen: false,
      lastReconciliationResult: null,
      isLoading: false,

      setOpenModalOpen: (open: boolean) => set({ isOpenModalOpen: open }),
      setCloseModalOpen: (open: boolean) => set({ isCloseModalOpen: open }),
      setSummaryModalOpen: (open: boolean) => set({ isSummaryModalOpen: open }),

      initShift: async (userId?: string) => {
        set({ isLoading: true });
        try {
          const shift = await shiftService.getCurrentShift(userId);
          set({ activeShift: shift, isLoading: false });
          return shift;
        } catch {
          set({ isLoading: false });
          return get().activeShift;
        }
      },

      openShift: async (params: OpenShiftParams) => {
        set({ isLoading: true });
        try {
          const newShift = await shiftService.openShift(params);
          set({
            activeShift: newShift,
            isOpenModalOpen: false,
            isLoading: false,
          });
          return newShift;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      closeShift: async (params: CloseShiftParams) => {
        set({ isLoading: true });
        try {
          const result = await shiftService.closeShift(params);
          set({
            activeShift: null,
            isCloseModalOpen: false,
            lastReconciliationResult: result,
            isSummaryModalOpen: true,
            isLoading: false,
          });
          return result;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshActiveShift: async () => {
        const { activeShift } = get();
        if (activeShift) {
          const fresh = await shiftService.getCurrentShift(activeShift.user_id);
          set({ activeShift: fresh });
        }
      },
    }),
    {
      name: "tokoku_shift_store",
      partialize: (state) => ({
        activeShift: state.activeShift,
        lastReconciliationResult: state.lastReconciliationResult,
      }),
    }
  )
);
