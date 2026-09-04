import { create } from "zustand";

type UploadStore = {
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
};

export const useUploadStore = create<UploadStore>((set) => ({
  uploading: false,
  setUploading: (uploading) => set({ uploading }),
}));
