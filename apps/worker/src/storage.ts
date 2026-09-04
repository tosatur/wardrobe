import { LocalStorageDriver } from "@wardrobe/storage";

export const storage = new LocalStorageDriver(process.env.STORAGE_DIR ?? "./.data/photos");
