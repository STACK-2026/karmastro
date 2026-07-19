/**
 * Streaming replaces the content of the current assistant bubble many times.
 * Only a new bubble should reposition the viewport; content deltas must leave
 * the reader's scroll position untouched.
 */
export function shouldAutoScrollOracle(previousMessageCount: number, nextMessageCount: number): boolean {
  return nextMessageCount > previousMessageCount;
}
