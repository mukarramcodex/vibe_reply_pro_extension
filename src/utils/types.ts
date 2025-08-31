export type BgRequest =
    | { type: "GET_SESSION" }
    | { type: "SET_SESSION"; payload: any }
    | { type: "CHECK_SUBSCRIPTION" }
    | { type: "LOAD_TEMPLATES" }
    | {
        type: "GENERATE_REPLY";
        payload: { platform: string; context: string; tone?: string };
    }
    | {
        type: "SAVE_REPLY";
        payload: { platform: string; sourceText: string; reply: string };
    };
export type BgResponse =
    | { ok: true; data?: any }
    | { ok: false; error: string };
