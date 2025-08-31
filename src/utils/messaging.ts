import type { BgRequest, BgResponse } from "./types";

export function sendToBg<T extends BgRequest>(msg: T): Promise<BgResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (res: BgResponse) => resolve(res));
  });
}
