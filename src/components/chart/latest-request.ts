export interface LatestRequest {
  readonly id: number;
  readonly signal: AbortSignal;
}

export interface LatestRequestGate {
  /** Start a request, aborting the previous one. */
  begin: () => LatestRequest;
  /** Whether a response still belongs to the newest request. */
  isCurrent: (id: number) => boolean;
  /** Abort and invalidate the current request. */
  cancel: () => void;
}

/**
 * One-at-a-time request gate. Responses from older queries can arrive after
 * newer ones; only the newest id is allowed to update the UI.
 */
export function createLatestRequest(): LatestRequestGate {
  let id = 0;
  let controller: AbortController | null = null;

  return {
    begin: () => {
      controller?.abort();
      controller = new AbortController();
      id += 1;
      return { id, signal: controller.signal };
    },
    isCurrent: (candidate) => candidate === id,
    cancel: () => {
      id += 1;
      controller?.abort();
      controller = null;
    },
  };
}
