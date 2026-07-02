import type { DemoManifest, ProgramCachePayload, StoreKey } from "../types";
import { enforceProgramRuntime } from "./enforce-program-runtime";
import { findAssetByReference, resolveProgramLineup } from "./resolve-asset";

export function applyProgramRuntimeEnforcement(
  response: ProgramCachePayload["response"],
  brief: string,
  manifest: DemoManifest,
  storeKey: StoreKey,
): ProgramCachePayload["response"] {
  const lineup = response.lineup ?? [];
  const assetDurationSec = (assetReference: string) => {
    const asset = findAssetByReference(manifest, assetReference, storeKey);
    return asset?.duration_sec;
  };

  const { lineup: enforcedLineup, total_runtime_minutes } = enforceProgramRuntime(
    lineup,
    brief,
    assetDurationSec,
  );

  return {
    ...response,
    lineup: enforcedLineup,
    total_runtime_minutes,
    programming_notes:
      response.programming_notes ??
      `${enforcedLineup.length} sequenced clips totaling ${total_runtime_minutes} minutes.`,
  };
}

export function finalizeProgramPayload(
  payload: ProgramCachePayload,
  brief: string,
  manifest: DemoManifest,
  storeKey: StoreKey,
): ProgramCachePayload {
  const response = applyProgramRuntimeEnforcement(payload.response, brief, manifest, storeKey);
  return {
    ...payload,
    response,
    resolved_clips: resolveProgramLineup(manifest, storeKey, response.lineup ?? []),
  };
}
