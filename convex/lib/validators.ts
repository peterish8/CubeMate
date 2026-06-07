import { v } from "convex/values";

/** WCA event ids — keep in sync with src/domain/types.ts */
export const cubeEventValidator = v.union(
  v.literal("333"),
  v.literal("222"),
  v.literal("444"),
  v.literal("555"),
  v.literal("666"),
  v.literal("777"),
  v.literal("333bf"),
  v.literal("333fm"),
  v.literal("333oh"),
  v.literal("clock"),
  v.literal("minx"),
  v.literal("pyram"),
  v.literal("skewb"),
  v.literal("sq1"),
  v.literal("444bf"),
  v.literal("555bf"),
  v.literal("333mbf")
);

export const penaltyValidator = v.union(
  v.literal("OK"),
  v.literal("+2"),
  v.literal("DNF")
);