import { UserRepository } from "@calcom/features/users/repositories/UserRepository";
import type { PrismaClient } from "@calcom/prisma";
import { MembershipRole } from "@calcom/prisma/enums";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingRepository } from "../repositories/BookingRepository";
import { BookingAccessService } from "./BookingAccessService";

vi.mock("../repositories/BookingRepository");
vi.mock("@calcom/features/users/repositories/UserRepository");

vi.mock("@calcom/prisma", () => ({
  default: {},
  prisma: {},
}));

describe("BookingAccessService", () => {
  let service: BookingAccessService;
  let mockPrismaClient: PrismaClient;
  let mockBookingRepo: {
    findByUidIncludeEventType: ReturnType<typeof vi.fn>;
  };
  let mockUserRepo: {
    getUserOrganizationAndTeams: ReturnType<typeof vi.fn>;
  };
  let mockPermissionCheckService: {
    checkPermission: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaClient = {} as PrismaClient;

    mockBookingRepo = {
      findByUidIncludeEventType: vi.fn(),
    };

    mockUserRepo = {
      getUserOrganizationAndTeams: vi.fn(),
    };

    mockPermissionCheckService = {
      checkPermission: vi.fn(),
    };

    vi.mocked(BookingRepository).mockImplementation(function () {
      return mockBookingRepo as any;
    });
    vi.mocked(UserRepository).mockImplementation(function () {
      return mockUserRepo as any;
    });

    service = new BookingAccessService(mockPrismaClient);

    (service as any).permissionCheckService = mockPermissionCheckService;
  });

  // Issue #13 containment: these exercise the REAL in-file PermissionCheckService
  // placeholder, deliberately WITHOUT overriding `permissionCheckService`. While PBAC
  // is unimplemented the placeholder must deny, so that seeded or restored Team rows
  // cannot turn a missing implementation into granted access.
  describe("PBAC placeholder fails closed (issue #13)", () => {
    let containedService: BookingAccessService;

    beforeEach(() => {
      containedService = new BookingAccessService(mockPrismaClient);
    });

    it("case 1: still grants the booking organizer access to their own booking", async () => {
      mockBookingRepo.findByUidIncludeEventType.mockResolvedValue({
        id: 1,
        uid: "personal-booking",
        userId: 42,
        eventType: { teamId: null, hosts: [], users: [] },
      });

      await expect(
        containedService.doesUserIdHaveAccessToBooking({ userId: 42, bookingUid: "personal-booking" })
      ).resolves.toBe(true);
    });

    it("case 3: denies access to a team booking rather than granting it by placeholder", async () => {
      mockBookingRepo.findByUidIncludeEventType.mockResolvedValue({
        id: 2,
        uid: "team-booking",
        userId: 1,
        eventType: { teamId: 100, hosts: [], users: [] },
      });

      await expect(
        containedService.doesUserIdHaveAccessToBooking({ userId: 999, bookingUid: "team-booking" })
      ).resolves.toBe(false);
    });

    it("case 5: denies a co-member access to another user's PERSONAL booking", async () => {
      // The sharpest instance: before containment the placeholder returned true on the
      // first membership, so sharing any team with the organizer leaked their personal
      // bookings.
      mockBookingRepo.findByUidIncludeEventType.mockResolvedValue({
        id: 3,
        uid: "owner-personal-booking",
        userId: 1,
        eventType: { teamId: null, hosts: [], users: [] },
      });
      mockUserRepo.getUserOrganizationAndTeams.mockResolvedValue({
        id: 1,
        organizationId: null,
        teams: [{ teamId: 300 }, { teamId: 400 }],
      });

      await expect(
        containedService.doesUserIdHaveAccessToBooking({ userId: 999, bookingUid: "owner-personal-booking" })
      ).resolves.toBe(false);
    });

    it("case 4: denies an org-scoped claim over another user's personal booking", async () => {
      mockBookingRepo.findByUidIncludeEventType.mockResolvedValue({
        id: 4,
        uid: "org-personal-booking",
        userId: 1,
        eventType: { teamId: null, hosts: [], users: [] },
      });
      mockUserRepo.getUserOrganizationAndTeams.mockResolvedValue({
        id: 1,
        organizationId: 200,
        teams: [],
      });

      await expect(
        containedService.doesUserIdHaveAccessToBooking({ userId: 999, bookingUid: "org-personal-booking" })
      ).resolves.toBe(false);
    });
  });

  describe("doesUserIdHaveAccessToBooking", () => {
    describe("Case 1: Booking Organizer", () => {
      it("should return true when user is the booking organizer", async () => {
        const mockBooking = {
          userId: 123,
          eventType: null,
          attendees: [],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(true);
        expect(mockBookingRepo.findByUidIncludeEventType).toHaveBeenCalledWith({
          bookingUid: "test-booking-uid",
        });
      });

      it("should return false when user is not the organizer and booking has no team", async () => {
        const mockBooking = {
          userId: 456,
          eventType: null,
          attendees: [],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);
        mockUserRepo.getUserOrganizationAndTeams.mockResolvedValue(null);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(false);
      });
    });

    describe("Case 2: Booking Host", () => {
      it("should return true when user is a host in eventType.hosts", async () => {
        const mockBooking = {
          userId: 456,
          user: { id: 456, email: "organizer@example.com" },
          eventType: {
            hosts: [
              { userId: 123, user: { email: "host@example.com" } },
              { userId: 789, user: { email: "other-host@example.com" } },
            ],
            users: [],
          },
          attendees: [{ email: "host@example.com" }],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(true);
      });

      it("should return true when user is in eventType.users", async () => {
        const mockBooking = {
          userId: 456,
          user: { id: 456, email: "organizer@example.com" },
          eventType: {
            hosts: [],
            users: [
              { id: 123, email: "user@example.com" },
              { id: 789, email: "other-user@example.com" },
            ],
          },
          attendees: [{ email: "user@example.com" }],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(true);
      });

      it("should return false when user is not a host", async () => {
        const mockBooking = {
          userId: 456,
          user: { id: 456, email: "organizer@example.com" },
          eventType: {
            hosts: [{ userId: 789, user: { email: "host@example.com" } }],
            users: [],
          },
          attendees: [{ email: "host@example.com" }],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);
        mockUserRepo.getUserOrganizationAndTeams.mockResolvedValue(null);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(false);
      });
    });

    describe("Case 3: Team Event Access", () => {
      it("should return true when user has booking.readTeamBookings permission", async () => {
        const mockBooking = {
          userId: 456,
          eventType: {
            teamId: 100,
          },
          attendees: [],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);
        mockPermissionCheckService.checkPermission.mockResolvedValue(true);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(true);
        expect(mockPermissionCheckService.checkPermission).toHaveBeenCalledWith({
          userId: 123,
          teamId: 100,
          permission: "booking.readTeamBookings",
          fallbackRoles: [MembershipRole.OWNER, MembershipRole.ADMIN],
        });
      });

      it("should return false when user lacks booking.readTeamBookings permission", async () => {
        const mockBooking = {
          userId: 456,
          eventType: {
            teamId: 100,
          },
          attendees: [],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);
        mockPermissionCheckService.checkPermission.mockResolvedValue(false);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(false);
        expect(mockPermissionCheckService.checkPermission).toHaveBeenCalledWith({
          userId: 123,
          teamId: 100,
          permission: "booking.readTeamBookings",
          fallbackRoles: [MembershipRole.OWNER, MembershipRole.ADMIN],
        });
      });
    });

    describe("Case 4: Org Admin Access (Personal Bookings)", () => {
      it("should return true when user has booking.readOrgBookings permission", async () => {
        const mockBooking = {
          userId: 456,
          eventType: null,
          attendees: [],
        };

        const mockBookingOwner = {
          organizationId: 200,
          teams: [],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);
        mockUserRepo.getUserOrganizationAndTeams.mockResolvedValue(mockBookingOwner);
        mockPermissionCheckService.checkPermission.mockResolvedValue(true);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(true);
        expect(mockPermissionCheckService.checkPermission).toHaveBeenCalledWith({
          userId: 123,
          teamId: 200,
          permission: "booking.readOrgBookings",
          fallbackRoles: [MembershipRole.OWNER, MembershipRole.ADMIN],
        });
      });

      it("should return false when user lacks booking.readOrgBookings permission", async () => {
        const mockBooking = {
          userId: 456,
          eventType: null,
          attendees: [],
        };

        const mockBookingOwner = {
          organizationId: 200,
          teams: [],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);
        mockUserRepo.getUserOrganizationAndTeams.mockResolvedValue(mockBookingOwner);
        mockPermissionCheckService.checkPermission.mockResolvedValue(false);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(false);
      });
    });

    describe("Case 5: Team Admin Access (Personal Bookings)", () => {
      it("should return true when user has booking.readTeamBookings on ANY team", async () => {
        const mockBooking = {
          userId: 456,
          eventType: null,
          attendees: [],
        };

        const mockBookingOwner = {
          organizationId: null,
          teams: [{ teamId: 300 }, { teamId: 400 }],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);
        mockUserRepo.getUserOrganizationAndTeams.mockResolvedValue(mockBookingOwner);
        mockPermissionCheckService.checkPermission
          .mockResolvedValueOnce(false) // Team 300 - no permission
          .mockResolvedValueOnce(true); // Team 400 - has permission

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(true);
        expect(mockPermissionCheckService.checkPermission).toHaveBeenCalledTimes(2);
        expect(mockPermissionCheckService.checkPermission).toHaveBeenNthCalledWith(1, {
          userId: 123,
          teamId: 300,
          permission: "booking.readTeamBookings",
          fallbackRoles: [MembershipRole.OWNER, MembershipRole.ADMIN],
        });
        expect(mockPermissionCheckService.checkPermission).toHaveBeenNthCalledWith(2, {
          userId: 123,
          teamId: 400,
          permission: "booking.readTeamBookings",
          fallbackRoles: [MembershipRole.OWNER, MembershipRole.ADMIN],
        });
      });

      it("should return false when user lacks permission on all teams", async () => {
        const mockBooking = {
          userId: 456,
          eventType: null,
          attendees: [],
        };

        const mockBookingOwner = {
          organizationId: null,
          teams: [{ teamId: 300 }, { teamId: 400 }],
        };

        mockBookingRepo.findByUidIncludeEventType.mockResolvedValue(mockBooking);
        mockUserRepo.getUserOrganizationAndTeams.mockResolvedValue(mockBookingOwner);
        mockPermissionCheckService.checkPermission.mockResolvedValue(false);

        const result = await service.doesUserIdHaveAccessToBooking({
          userId: 123,
          bookingUid: "test-booking-uid",
        });

        expect(result).toBe(false);
        expect(mockPermissionCheckService.checkPermission).toHaveBeenCalledTimes(2);
      });
    });
  });
});
