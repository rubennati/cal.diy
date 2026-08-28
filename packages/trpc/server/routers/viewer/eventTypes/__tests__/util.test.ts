import type { PrismaClient } from "@calcom/prisma";
import { MembershipRole } from "@calcom/prisma/enums";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { authedProcedure } from "../../../procedures/authedProcedure";
import { createEventPbacProcedure, ensureEmailOrPhoneNumberIsPresent } from "../util";

describe("createEventPbacProcedure", () => {
  const mockPrisma = {
    eventType: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient;

  const mockCtx = {
    user: { id: 1, profile: { upId: "user-1" } },
    session: { user: { id: 1 } },
    prisma: mockPrisma,
  };

  const mockNext = vi.fn().mockResolvedValue({ ctx: mockCtx });

  // Helper to get the custom middleware (after authedProcedure)
  const getMiddleware = (procedure: ReturnType<typeof authedProcedure>) => {
    // The last middleware is our custom one
    return procedure._def.middlewares[procedure._def.middlewares.length - 1];
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("personal events", () => {
    const personalEvent = {
      id: 1,
      userId: 1,
      teamId: null,
      users: [{ id: 1 }],
      team: null,
    };

    it("should allow owner to access their personal event", async () => {
      mockPrisma.eventType.findUnique = vi.fn().mockResolvedValue(personalEvent);

      const procedure = createEventPbacProcedure("eventType.update");
      const middleware = getMiddleware(procedure);

      await expect(
        middleware({
          ctx: mockCtx,
          input: { id: 1 },
          next: mockNext,
          path: "test",
          type: "mutation",
          getRawInput: async () => ({}),
          meta: undefined,
        })
      ).resolves.not.toThrow();
    });

    it("should allow assigned user to access personal event", async () => {
      mockPrisma.eventType.findUnique = vi
        .fn()
        .mockResolvedValue({ ...personalEvent, userId: 2, users: [{ id: 1 }, { id: 2 }] });

      const procedure = createEventPbacProcedure("eventType.update");
      const middleware = getMiddleware(procedure);

      await expect(
        middleware({
          ctx: mockCtx,
          input: { id: 1 },
          next: mockNext,
          path: "test",
          type: "mutation",
          getRawInput: async () => ({}),
          meta: undefined,
        })
      ).resolves.not.toThrow();
    });

    it("should deny non-owner/non-assigned user from accessing personal event", async () => {
      mockPrisma.eventType.findUnique = vi
        .fn()
        .mockResolvedValue({ ...personalEvent, userId: 2, users: [{ id: 2 }] });

      const procedure = createEventPbacProcedure("eventType.update");
      const middleware = getMiddleware(procedure);

      await expect(
        middleware({
          ctx: mockCtx,
          input: { id: 1 },
          next: mockNext,
          path: "test",
          type: "mutation",
          getRawInput: async () => ({}),
          meta: undefined,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should deny team member from accessing another user's personal event", async () => {
      // User 1 trying to access user 2's personal event
      mockPrisma.eventType.findUnique = vi
        .fn()
        .mockResolvedValue({ ...personalEvent, userId: 2, users: [{ id: 2 }] });

      const procedure = createEventPbacProcedure("eventType.update");
      const middleware = getMiddleware(procedure);

      const result = middleware({
        ctx: mockCtx,
        input: { id: 1 },
        next: mockNext,
        path: "test",
        type: "mutation",
        getRawInput: async () => ({}),
        meta: undefined,
      });

      await expect(result).rejects.toThrow(TRPCError);
      await expect(result).rejects.toThrow("Permission required: eventType.update");
    });

    it("should only allow assigning self to personal event", async () => {
      mockPrisma.eventType.findUnique = vi.fn().mockResolvedValue(personalEvent);

      const procedure = createEventPbacProcedure("eventType.update");
      const middleware = getMiddleware(procedure);

      await expect(
        middleware({
          ctx: mockCtx,
          input: { id: 1, users: [1] },
          next: mockNext,
          path: "test",
          type: "mutation",
          getRawInput: async () => ({}),
          meta: undefined,
        })
      ).resolves.not.toThrow();
    });

    it("should deny assigning other users to personal event", async () => {
      mockPrisma.eventType.findUnique = vi.fn().mockResolvedValue(personalEvent);

      const procedure = createEventPbacProcedure("eventType.update");
      const middleware = getMiddleware(procedure);

      const result = middleware({
        ctx: mockCtx,
        input: { id: 1, users: [1, 2] },
        next: mockNext,
        path: "test",
        type: "mutation",
        getRawInput: async () => ({}),
        meta: undefined,
      });

      await expect(result).rejects.toThrow(TRPCError);
      await expect(result).rejects.toThrow("Cannot assign event to users outside of team membership");
    });
  });

  // Issue #13 containment. These blocks previously asserted that team-event access was
  // GRANTED — one of them said so outright: "PermissionCheckService stub always returns
  // true, so org admin access is always granted". That encoded upstream's fail-open
  // placeholder as expected behaviour. While PBAC is unimplemented the placeholder denies,
  // so team events are refused and these assert that instead.
  //
  // The user-assignment validation that used to be exercised here now sits behind the
  // permission check and is unreachable for team events; it stays covered for personal
  // events in the "personal events" block above.
  describe("team events - denied while PBAC is unimplemented", () => {
    const teamEvent = {
      id: 2,
      userId: null,
      teamId: 10,
      users: [],
      team: {
        members: [{ userId: 1 }, { userId: 2 }, { userId: 3 }],
      },
    };

    const callWith = (input: Record<string, unknown>, fallbackRoles?: MembershipRole[]) => {
      mockPrisma.eventType.findUnique = vi.fn().mockResolvedValue(teamEvent);
      const procedure = createEventPbacProcedure("eventType.update", fallbackRoles);
      const middleware = getMiddleware(procedure);
      return middleware({
        ctx: mockCtx,
        input,
        next: mockNext,
        path: "test",
        type: "mutation",
        getRawInput: async () => ({}),
        meta: undefined,
      });
    };

    it("denies a team member rather than granting by placeholder", async () => {
      await expect(
        callWith({ id: 2 }, [MembershipRole.ADMIN, MembershipRole.OWNER])
      ).rejects.toThrow("Permission required: eventType.update");
    });

    it("denies an org admin who is not a team member", async () => {
      await expect(callWith({ id: 2 })).rejects.toThrow(TRPCError);
    });

    it("denies before reaching user-assignment validation", async () => {
      // Previously this combination was allowed through to the assignment check.
      await expect(callWith({ id: 2, users: [2, 3] })).rejects.toThrow(
        "Permission required: eventType.update"
      );
    });

    it("denies an empty users array on a team event", async () => {
      await expect(callWith({ id: 2, users: [] })).rejects.toThrow(TRPCError);
    });

    it("denies when users are not provided at all", async () => {
      await expect(callWith({ id: 2 })).rejects.toThrow(TRPCError);
    });

    it("does not call next() for a team event", async () => {
      await expect(callWith({ id: 2 })).rejects.toThrow(TRPCError);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  describe("event not found", () => {
    it("should throw NOT_FOUND when event does not exist", async () => {
      mockPrisma.eventType.findUnique = vi.fn().mockResolvedValue(null);

      const procedure = createEventPbacProcedure("eventType.update");
      const middleware = getMiddleware(procedure);

      const result = middleware({
        ctx: mockCtx,
        input: { id: 999 },
        next: mockNext,
        path: "test",
        type: "mutation",
        getRawInput: async () => ({}),
        meta: undefined,
      });

      await expect(result).rejects.toThrow(TRPCError);
      await expect(result).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("input validation", () => {
    it("should accept eventTypeId as alternative to id", async () => {
      const event = {
        id: 1,
        userId: 1,
        teamId: null,
        users: [{ id: 1 }],
        team: null,
      };
      mockPrisma.eventType.findUnique = vi.fn().mockResolvedValue(event);

      const procedure = createEventPbacProcedure("eventType.update");
      const middleware = getMiddleware(procedure);

      await expect(
        middleware({
          ctx: mockCtx,
          input: { eventTypeId: 1 },
          next: mockNext,
          path: "test",
          type: "mutation",
          getRawInput: async () => ({}),
          meta: undefined,
        })
      ).resolves.not.toThrow();

      expect(mockPrisma.eventType.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });
  });

  describe("different permissions and fallback roles (team events denied while PBAC is unimplemented)", () => {
    const teamEvent = {
      id: 2,
      userId: null,
      teamId: 10,
      users: [],
      team: {
        members: [{ userId: 1 }, { userId: 2 }, { userId: 3 }],
      },
    };

    it("denies a custom permission string on a team event", async () => {
      mockPrisma.eventType.findUnique = vi.fn().mockResolvedValue(teamEvent);

      const procedure = createEventPbacProcedure("eventType.delete");
      const middleware = getMiddleware(procedure);

      await expect(
        middleware({
          ctx: mockCtx,
          input: { id: 2 },
          next: mockNext,
          path: "test",
          type: "mutation",
          getRawInput: async () => ({}),
          meta: undefined,
        })
      ).rejects.toThrow("Permission required: eventType.delete");
    });

    it("denies regardless of the fallbackRoles argument, which the placeholder ignores", async () => {
      mockPrisma.eventType.findUnique = vi.fn().mockResolvedValue(teamEvent);

      const procedure = createEventPbacProcedure("eventType.update", [MembershipRole.MEMBER]);
      const middleware = getMiddleware(procedure);

      await expect(
        middleware({
          ctx: mockCtx,
          input: { id: 2 },
          next: mockNext,
          path: "test",
          type: "mutation",
          getRawInput: async () => ({}),
          meta: undefined,
        })
      ).rejects.toThrow(TRPCError);
    });
  });
  describe("ensureEmailOrPhoneNumberIsPresent", () => {
    it("should throw error when both email and phone are hidden", () => {
      const fields = [
        {
          name: "email",
          type: "email" as const,
          required: true,
          hidden: true,
        },
        {
          name: "attendeePhoneNumber",
          type: "phone" as const,
          required: true,
          hidden: true,
        },
      ];

      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).toThrow(TRPCError);
      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).toThrow(
        expect.objectContaining({
          code: "BAD_REQUEST",
          message: "booking_fields_email_and_phone_both_hidden",
        })
      );
    });

    it("should throw error when neither email nor phone is required", () => {
      const fields = [
        {
          name: "email",
          type: "email" as const,
          required: false,
          hidden: false,
        },
        {
          name: "attendeePhoneNumber",
          type: "phone" as const,
          required: false,
          hidden: false,
        },
      ];

      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).toThrow(TRPCError);
      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).toThrow(
        expect.objectContaining({
          code: "BAD_REQUEST",
          message: "booking_fields_email_or_phone_required",
        })
      );
    });

    it("should throw error when email is hidden and phone is not required", () => {
      const fields = [
        {
          name: "email",
          type: "email" as const,
          required: true,
          hidden: true,
        },
        {
          name: "attendeePhoneNumber",
          type: "phone" as const,
          required: false,
          hidden: false,
        },
      ];

      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).toThrow(TRPCError);
      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).toThrow(
        expect.objectContaining({
          code: "BAD_REQUEST",
          message: "booking_fields_phone_required_when_email_hidden",
        })
      );
    });

    it("should throw error when phone is hidden and email is not required", () => {
      const fields = [
        {
          name: "email",
          type: "email" as const,
          required: false,
          hidden: false,
        },
        {
          name: "attendeePhoneNumber",
          type: "phone" as const,
          required: true,
          hidden: true,
        },
      ];

      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).toThrow(TRPCError);
      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).toThrow(
        expect.objectContaining({
          code: "BAD_REQUEST",
          message: "booking_fields_email_required_when_phone_hidden",
        })
      );
    });

    it("should pass when email is visible and required while phone is hidden", () => {
      const fields = [
        {
          name: "email",
          type: "email" as const,
          required: true,
          hidden: false,
        },
        {
          name: "attendeePhoneNumber",
          type: "phone" as const,
          required: false,
          hidden: true,
        },
      ];

      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).not.toThrow();
    });

    it("should pass when phone is visible and required while email is hidden", () => {
      const fields = [
        {
          name: "email",
          type: "email" as const,
          required: false,
          hidden: true,
        },
        {
          name: "attendeePhoneNumber",
          type: "phone" as const,
          required: true,
          hidden: false,
        },
      ];

      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).not.toThrow();
    });

    it("should pass when both email and phone are visible and required", () => {
      const fields = [
        {
          name: "email",
          type: "email" as const,
          required: true,
          hidden: false,
        },
        {
          name: "attendeePhoneNumber",
          type: "phone" as const,
          required: true,
          hidden: false,
        },
      ];

      expect(() => ensureEmailOrPhoneNumberIsPresent(fields)).not.toThrow();
    });
  });
});
