import type { Types } from "mongoose";

type WithId = { _id: Types.ObjectId | string };

export function serializeLean<T extends WithId>(
  docs: T[],
): (Omit<T, "_id"> & { id: string })[] {
  return docs.map(({ _id, ...rest }) => ({
    ...rest,
    id: typeof _id === "string" ? _id : _id.toHexString(),
  }));
}
