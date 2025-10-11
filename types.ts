declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PrismaJson {
    type PlacementType = { x: number; y: number; value: number };
  }
}

// This file must be a module.
export {};
