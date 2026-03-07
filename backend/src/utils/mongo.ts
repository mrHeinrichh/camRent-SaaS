import { Types } from 'mongoose';

export const toId = (value: string) => new Types.ObjectId(value);

export const serialize = <T extends Record<string, any>>(doc: T | null) => {
  if (!doc) return null;
  const plain = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : { ...doc };
  if (plain._id) plain.id = plain._id.toString();
  delete plain._id;
  delete plain.__v;
  return plain;
};

export const serializeMany = <T extends Record<string, any>>(docs: T[]) => docs.map((doc) => serialize(doc));
