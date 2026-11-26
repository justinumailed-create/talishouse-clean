import { describe, expect, it } from "vitest";
import {
  AISHA_INTERNAL_TESTERS,
  matchInternalTester,
} from "@/lib/aisha-internal-testers";
import {
  AISHA_RISHAV_ROUTING_CUTOFF_ISO,
  AISHA_RISHAV_ROUTING_CUTOFF_UNIX,
  evaluateAishaTranscriptRouting,
  hasHumanCallerSpeech,
  isEndedAishaCallStatus,
  meetingToRoutingInput,
  type AishaRoutingInput,
} from "@/lib/aisha-transcript-routing";

const AFTER = AISHA_RISHAV_ROUTING_CUTOFF_UNIX + 60;
const BEFORE = AISHA_RISHAV_ROUTING_CUTOFF_UNIX - 60;

function spoken(overrides: Partial<AishaRoutingInput> = {}): AishaRoutingInput {
  return {
    bot: "aisha",
    conversationId: "conv_real_1",
    status: "done",
    startUnix: AFTER,
    transcript: [
      { role: "agent", message: "Hi, this is Aisha." },
      { role: "user", message: "I would like to register my market." },
    ],
    callerName: "Sam Cole",
    email: "sam@example.com",
    phone: "+1 (416) 555-0199",
    ...overrides,
  };
}

describe("Aisha transcript routing cutoff and call quality", () => {
  it("uses a documented cutoff at 5:00 PM IST on 26 Nov 2026", () => {
    expect(AISHA_RISHAV_ROUTING_CUTOFF_ISO).toBe("2026-11-26T17:00:00+05:30");
    expect(AISHA_RISHAV_ROUTING_CUTOFF_UNIX).toBe(Math.floor(Date.parse(AISHA_RISHAV_ROUTING_CUTOFF_ISO) / 1000));
  });

  it("excludes transcripts that started before the cutoff", () => {
    const decision = evaluateAishaTranscriptRouting(spoken({ startUnix: BEFORE }));
    expect(decision.route).toBe(false);
    expect(decision.exclusion).toBe("pre-cutoff");
  });

  it("excludes a call that sits exactly on the cutoff only if start is missing, and includes the cutoff instant", () => {
    expect(evaluateAishaTranscriptRouting(spoken({ startUnix: AISHA_RISHAV_ROUTING_CUTOFF_UNIX })).route).toBe(true);
    expect(evaluateAishaTranscriptRouting(spoken({ startUnix: null })).exclusion).toBe("missing-start");
  });

  it("excludes silent, dropped, bot-only, and unended calls", () => {
    expect(hasHumanCallerSpeech([{ role: "agent", message: "Hello?" }])).toBe(false);
    expect(hasHumanCallerSpeech([{ role: "user", message: "   " }])).toBe(false);
    expect(isEndedAishaCallStatus("in-progress")).toBe(false);
    expect(isEndedAishaCallStatus("initiated")).toBe(false);
    expect(isEndedAishaCallStatus("done")).toBe(true);

    expect(evaluateAishaTranscriptRouting(spoken({ status: "in-progress" })).exclusion).toBe("not-ended");
    expect(
      evaluateAishaTranscriptRouting(spoken({ transcript: [{ role: "agent", message: "Anyone there?" }] })).exclusion,
    ).toBe("no-human-speech");
  });
});

describe("internal tester and test-call exclusion", () => {
  it("excludes Aritri, Enanko, and other internal testers by name, email, phone, or login", () => {
    expect(evaluateAishaTranscriptRouting(spoken({ callerName: "Aritri", email: null, phone: null })).exclusion).toBe(
      "internal-tester",
    );
    expect(evaluateAishaTranscriptRouting(spoken({ callerName: "Enanko", email: null, phone: null })).exclusion).toBe(
      "internal-tester",
    );
    expect(
      evaluateAishaTranscriptRouting(spoken({ callerName: "Ralf Meyer", email: null, phone: null })).exclusion,
    ).toBe("internal-tester");
    expect(
      evaluateAishaTranscriptRouting(
        spoken({ callerName: "Someone", email: "remecom@mac.com", phone: null }),
      ).exclusion,
    ).toBe("internal-tester");
    expect(
      evaluateAishaTranscriptRouting(
        spoken({ callerName: "Someone", email: null, phone: "902-317-2223" }),
      ).exclusion,
    ).toBe("internal-tester");
    expect(
      evaluateAishaTranscriptRouting(
        spoken({ callerName: "Someone", email: null, phone: null, loginId: "arun" }),
      ).exclusion,
    ).toBe("internal-tester");
  });

  it("does not treat a real caller named Jonathan or Arun as a tester without more evidence", () => {
    expect(matchInternalTester({ callerName: "Jonathan Smith" }, AISHA_INTERNAL_TESTERS)).toBeNull();
    expect(matchInternalTester({ callerName: "Arun Patel" }, AISHA_INTERNAL_TESTERS)).toBeNull();
    expect(evaluateAishaTranscriptRouting(spoken({ callerName: "Jonathan Smith", email: null, phone: null })).route).toBe(
      true,
    );
  });

  it("excludes explicit test markers even when the caller is otherwise unknown", () => {
    expect(evaluateAishaTranscriptRouting(spoken({ callerName: "QA Tester" })).exclusion).toBe("test-marker");
    expect(
      evaluateAishaTranscriptRouting(spoken({ callerName: "Sam Cole", fields: { is_test: true } })).exclusion,
    ).toBe("test-marker");
    expect(
      evaluateAishaTranscriptRouting(spoken({ title: "Internal test call", callerName: "Sam Cole" })).exclusion,
    ).toBe("test-marker");
  });

  it("keeps the tester list centralized and easy to inspect", () => {
    expect(AISHA_INTERNAL_TESTERS.map((t) => t.id)).toEqual([
      "aritri",
      "enanko",
      "arun",
      "ralf",
      "jonathan",
    ]);
  });
});

describe("real callers — registered and unregistered — are included", () => {
  it("routes a real unregistered caller with no internal tester match", () => {
    const decision = evaluateAishaTranscriptRouting(
      spoken({ callerName: "Priya Shah", email: "priya@newmarket.example", phone: "+1 647 555 0101" }),
    );
    expect(decision.route).toBe(true);
    expect(decision.exclusion).toBeNull();
  });

  it("routes a real registered or post-registration caller too", () => {
    const decision = evaluateAishaTranscriptRouting(
      spoken({
        conversationId: "conv_registered",
        callerName: "Chris Wood",
        email: "chris@brokerage.example",
        fields: { account_type_interest: "Agent", fast_code: "dc06" },
      }),
    );
    expect(decision.route).toBe(true);
  });

  it("maps a parsed Meeting into routing input", () => {
    const input = meetingToRoutingInput({
      id: "conv_m",
      bot: "aisha",
      status: "done",
      startUnix: AFTER,
      callerName: "Sam Cole",
      validContact: { kind: "email", value: "sam@example.com" },
      transcript: [{ role: "user", message: "Hello" }],
      fields: {},
    });
    expect(evaluateAishaTranscriptRouting(input).route).toBe(true);
    expect(input.email).toBe("sam@example.com");
  });
});
