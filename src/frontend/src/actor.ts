import type { backendInterface } from "./backend";
import { createActorWithConfig } from "./config";

// Single actor instance — initialized once, reused everywhere.
// Never call _initializeAccessControlWithSecret or any auth-related function here.
let _actorInstance: backendInterface | null = null;
let _initPromise: Promise<backendInterface> | null = null;

export async function getActor(): Promise<backendInterface> {
  if (_actorInstance) return _actorInstance;
  if (!_initPromise) {
    _initPromise = createActorWithConfig().then((a) => {
      _actorInstance = a;
      return a;
    });
  }
  return _initPromise;
}
