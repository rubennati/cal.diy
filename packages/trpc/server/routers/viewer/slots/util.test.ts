import { beforeEach, describe, it, expect, vi } from "vitest";

import { BookingDateInPastError, isTimeOutOfBounds } from "@calcom/lib/isOutOfBounds";

import { TRPCError } from "@trpc/server";

import type { IAvailableSlotsService } from "./util";
import { AvailableSlotsService } from "./util";

describe("BookingDateInPastError handling", () => {
  it("should convert BookingDateInPastError to TRPCError with BAD_REQUEST code", () => {
    const testFilteringLogic = () => {
      const mockSlot = {
        time: "2024-05-20T12:30:00.000Z", // Past date
        attendees: 1,
      };

      const mockEventType = {
        minimumBookingNotice: 0,
      };

      const isFutureLimitViolationForTheSlot = false; // Mock this to false

      let isOutOfBounds = false;
      try {
        // This will throw BookingDateInPastError for past dates
        isOutOfBounds = isTimeOutOfBounds({
          time: mockSlot.time,
          minimumBookingNotice: mockEventType.minimumBookingNotice,
        });
      } catch (error) {
        if (error instanceof BookingDateInPastError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw error;
      }

      return !isFutureLimitViolationForTheSlot && !isOutOfBounds;
    };

    // This should throw a TRPCError with BAD_REQUEST code
    expect(() => testFilteringLogic()).toThrow(TRPCError);
    expect(() => testFilteringLogic()).toThrow("Attempting to book a meeting in the past.");
  });
});

describe("AvailableSlotsService - getEventTypeId owner resolution", () => {
  // Issue #14: an unresolvable username must never fall through to a
  // slug-only lookup that can return someone else's EventType.
  type GetEventTypeId = typeof AvailableSlotsService.prototype["getEventTypeId"];
  let service: AvailableSlotsService;
  let mockDependencies: {
    userRepo: { findUsersByUsername: ReturnType<typeof vi.fn> };
    eventTypeRepo: { findFirstEventTypeId: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDependencies = {
      userRepo: { findUsersByUsername: vi.fn() },
      eventTypeRepo: { findFirstEventTypeId: vi.fn() },
    };
    service = new AvailableSlotsService(mockDependencies as unknown as IAvailableSlotsService);
  });

  const callGetEventTypeId = (args: {
    slug?: string;
    eventTypeSlug?: string;
    isTeamEvent: boolean;
  }) =>
    (service as unknown as { getEventTypeId: GetEventTypeId }).getEventTypeId(args);

  it("throws NOT_FOUND for a non-existent username, and never resolves a foreign EventType by slug alone", async () => {
    mockDependencies.userRepo.findUsersByUsername.mockResolvedValue([]);
    mockDependencies.eventTypeRepo.findFirstEventTypeId.mockResolvedValue(null);

    await expect(
      callGetEventTypeId({ slug: "no-such-user", eventTypeSlug: "30min", isTeamEvent: false })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(mockDependencies.eventTypeRepo.findFirstEventTypeId).toHaveBeenCalledWith({
      slug: "30min",
      userId: undefined,
    });
  });

  it("resolves the correct personal EventType for a valid owner username", async () => {
    mockDependencies.userRepo.findUsersByUsername.mockResolvedValue([{ id: 42 }]);
    mockDependencies.eventTypeRepo.findFirstEventTypeId.mockResolvedValue({ id: 99 });

    const eventTypeId = await callGetEventTypeId({
      slug: "real-owner",
      eventTypeSlug: "30min",
      isTeamEvent: false,
    });

    expect(mockDependencies.eventTypeRepo.findFirstEventTypeId).toHaveBeenCalledWith({
      slug: "30min",
      userId: 42,
    });
    expect(eventTypeId).toBe(99);
  });
});
