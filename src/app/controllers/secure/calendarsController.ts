import { jsonResponse } from '../../../lib/utils.js';
import type { Env } from '../../types/interface.js';
import type { PartnersEnvSession } from '../../models/PartnersEnv.js';
import type { Calendar, CalendarInput } from '../../models/calendars/Calendar.js';
import type { CalendarEvent, CalendarEventInput } from '../../models/calendars/CalendarEvent.js';
import type { EventParticipant, EventParticipantInput } from '../../models/calendars/EventParticipant.js';
import type { EventChangeRequest, EventChangeRequestInput } from '../../models/calendars/EventChangeRequest.js';
import type { Payment, PaymentInput, PaymentStatus } from '../../models/calendars/Payment.js';
import type { EventPayment, EventPaymentInput } from '../../models/calendars/EventPayment.js';
import makeSecureSessionGuard from './secureSessionGuard';

const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const ERR_INVALID_REQUEST = 'Invalid request';
const ERR_CALENDAR_NOT_FOUND = 'Calendar not found';
const ERR_EVENT_NOT_FOUND = 'Event not found';
const ERR_PARTICIPANT_NOT_FOUND = 'Event participant not found';
const ERR_CHANGE_REQUEST_NOT_FOUND = 'Event change request not found';
const ERR_PAYMENT_NOT_FOUND = 'Payment not found';
const ERR_EVENT_PAYMENT_NOT_FOUND = 'Event payment link not found';
const ERR_INTERNAL_ERROR = 'Internal server error';

const MSG_CALENDAR_CREATED = 'Calendar created successfully';
const MSG_CALENDAR_UPDATED = 'Calendar updated successfully';
const MSG_EVENT_CREATED = 'Event created successfully';
const MSG_EVENT_UPDATED = 'Event updated successfully';
const MSG_EVENT_CANCELLED = 'Event cancelled successfully';
const MSG_PARTICIPANT_CREATED = 'Event participant created successfully';
const MSG_PARTICIPANT_UPDATED = 'Event participant updated successfully';
const MSG_PARTICIPANT_REMOVED = 'Event participant removed successfully';
const MSG_CHANGE_REQUEST_CREATED = 'Event change request created successfully';
const MSG_CHANGE_REQUEST_UPDATED = 'Event change request updated successfully';
const MSG_CHANGE_REQUEST_CANCELLED = 'Event change request cancelled successfully';
const MSG_PAYMENT_CREATED = 'Payment created successfully';
const MSG_PAYMENT_UPDATED = 'Payment updated successfully';
const MSG_PAYMENT_CANCELLED = 'Payment cancelled successfully';
const MSG_EVENT_PAYMENT_CREATED = 'Event payment link created successfully';
const MSG_EVENT_PAYMENT_UPDATED = 'Event payment link updated successfully';
const MSG_EVENT_PAYMENT_CANCELLED = 'Event payment link cancelled successfully';

interface CalendarsService {
  list(ownerUserId?: string): Promise<Calendar[]>;
  getById(id: string): Promise<Calendar | null>;
  create(data: CalendarInput): Promise<Calendar>;
  update(id: string, data: Partial<CalendarInput>): Promise<Calendar | null>;
  validateCalendar(data: unknown): Promise<string[]>;
}

interface EventsService {
  listByCalendar(calendarId: string, includeCancelled?: boolean): Promise<CalendarEvent[]>;
  getById(id: string): Promise<CalendarEvent | null>;
  create(data: CalendarEventInput): Promise<CalendarEvent>;
  update(id: string, data: Partial<CalendarEventInput>): Promise<CalendarEvent | null>;
  remove(id: string): Promise<CalendarEvent | null>;
  validateEvent(data: unknown): Promise<string[]>;
}

interface ParticipantsService {
  listByEvent(eventId: string): Promise<EventParticipant[]>;
  getById(id: string): Promise<EventParticipant | null>;
  create(data: EventParticipantInput): Promise<EventParticipant>;
  update(id: string, data: Partial<EventParticipantInput>): Promise<EventParticipant | null>;
  remove(id: string): Promise<EventParticipant | null>;
  validateParticipant(data: unknown): Promise<string[]>;
}

interface ChangeRequestsService {
  listByEvent(eventId: string): Promise<EventChangeRequest[]>;
  getById(id: string): Promise<EventChangeRequest | null>;
  create(data: EventChangeRequestInput): Promise<EventChangeRequest>;
  update(id: string, data: Partial<EventChangeRequestInput>): Promise<EventChangeRequest | null>;
  remove(id: string): Promise<EventChangeRequest | null>;
  validateChangeRequest(data: unknown): Promise<string[]>;
}

interface PaymentsService {
  list(status?: PaymentStatus): Promise<Payment[]>;
  getById(id: string): Promise<Payment | null>;
  create(data: PaymentInput): Promise<Payment>;
  update(id: string, data: Partial<PaymentInput>): Promise<Payment | null>;
  remove(id: string): Promise<Payment | null>;
  validatePayment(data: unknown): Promise<string[]>;
}

interface EventPaymentsService {
  listByEvent(eventId: string): Promise<EventPayment[]>;
  getById(id: string): Promise<EventPayment | null>;
  create(data: EventPaymentInput): Promise<EventPayment>;
  update(id: string, data: Partial<EventPaymentInput>): Promise<EventPayment | null>;
  remove(id: string): Promise<EventPayment | null>;
  validateEventPayment(data: unknown): Promise<string[]>;
}

interface UserSesionService {
  getEmail(token: string): Promise<string | null>;
  getToken(email: string): Promise<string>;
  getSessionByToken(token: string): Promise<PartnersEnvSession | null>;
}

export default function makeCalendarsController(
  calendarsService: CalendarsService,
  eventsService: EventsService,
  participantsService: ParticipantsService,
  changeRequestsService: ChangeRequestsService,
  paymentsService: PaymentsService,
  eventPaymentsService: EventPaymentsService,
  userSesionService: UserSesionService
) {
  const validateSecureSession = makeSecureSessionGuard(userSesionService);

  async function listCalendars(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const owner = new URL(req.url).searchParams.get('owner_user_id') || undefined;
      const items = await calendarsService.list(owner);
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function getCalendar(req: Request, calendarId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const item = await calendarsService.getById(calendarId);
      if (!item) return jsonResponse({ success: false, error: ERR_CALENDAR_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, data: item });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function createCalendar(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const data = await req.json() as unknown;
      const errors = await calendarsService.validateCalendar(data);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);

      const created = await calendarsService.create(data as CalendarInput);
      return jsonResponse({ success: true, data: created, message: MSG_CALENDAR_CREATED }, HTTP_STATUS_CREATED);
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function updateCalendar(req: Request, calendarId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const existing = await calendarsService.getById(calendarId);
      if (!existing) return jsonResponse({ success: false, error: ERR_CALENDAR_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);

      const data = await req.json() as Partial<CalendarInput>;
      const updated = await calendarsService.update(calendarId, data);
      return jsonResponse({ success: true, data: updated, message: MSG_CALENDAR_UPDATED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function listEvents(req: Request, calendarId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const calendar = await calendarsService.getById(calendarId);
      if (!calendar) return jsonResponse({ success: false, error: ERR_CALENDAR_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);

      const includeCancelled = new URL(req.url).searchParams.get('include_cancelled') === 'true';
      const items = await eventsService.listByCalendar(calendarId, includeCancelled);
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function getEvent(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      return jsonResponse({ success: true, data: event });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function createEvent(req: Request, calendarId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const calendar = await calendarsService.getById(calendarId);
      if (!calendar) return jsonResponse({ success: false, error: ERR_CALENDAR_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);

      const rawData = await req.json() as Record<string, unknown>;
      const payload: CalendarEventInput = {
        ...(rawData as Partial<CalendarEventInput>),
        calendar_id: calendarId,
      } as CalendarEventInput;

      const errors = await eventsService.validateEvent(payload);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);

      const created = await eventsService.create(payload);
      return jsonResponse({ success: true, data: created, message: MSG_EVENT_CREATED }, HTTP_STATUS_CREATED);
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function updateEvent(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const existing = await eventsService.getById(eventId);
      if (!existing || existing.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const data = await req.json() as Partial<CalendarEventInput>;
      const payload: Partial<CalendarEventInput> = {
        ...data,
        calendar_id: calendarId,
      };
      const updated = await eventsService.update(eventId, payload);
      return jsonResponse({ success: true, data: updated, message: MSG_EVENT_UPDATED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function removeEvent(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const existing = await eventsService.getById(eventId);
      if (!existing || existing.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const removed = await eventsService.remove(eventId);
      return jsonResponse({ success: true, data: removed, message: MSG_EVENT_CANCELLED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function listParticipants(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const items = await participantsService.listByEvent(eventId);
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function getParticipant(req: Request, calendarId: string, eventId: string, participantId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const item = await participantsService.getById(participantId);
      if (!item || item.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_PARTICIPANT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      return jsonResponse({ success: true, data: item });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function createParticipant(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const rawData = await req.json() as Record<string, unknown>;
      const payload: EventParticipantInput = {
        ...(rawData as Partial<EventParticipantInput>),
        event_id: eventId,
      } as EventParticipantInput;

      const errors = await participantsService.validateParticipant(payload);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);

      const created = await participantsService.create(payload);
      return jsonResponse({ success: true, data: created, message: MSG_PARTICIPANT_CREATED }, HTTP_STATUS_CREATED);
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function updateParticipant(req: Request, calendarId: string, eventId: string, participantId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const existing = await participantsService.getById(participantId);
      if (!existing || existing.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_PARTICIPANT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const data = await req.json() as Partial<EventParticipantInput>;
      const payload: Partial<EventParticipantInput> = {
        ...data,
        event_id: eventId,
      };

      const updated = await participantsService.update(participantId, payload);
      return jsonResponse({ success: true, data: updated, message: MSG_PARTICIPANT_UPDATED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function removeParticipant(req: Request, calendarId: string, eventId: string, participantId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const existing = await participantsService.getById(participantId);
      if (!existing || existing.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_PARTICIPANT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const removed = await participantsService.remove(participantId);
      return jsonResponse({ success: true, data: removed, message: MSG_PARTICIPANT_REMOVED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function listChangeRequests(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const items = await changeRequestsService.listByEvent(eventId);
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function getChangeRequest(req: Request, calendarId: string, eventId: string, changeRequestId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const item = await changeRequestsService.getById(changeRequestId);
      if (!item || item.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_CHANGE_REQUEST_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      return jsonResponse({ success: true, data: item });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function createChangeRequest(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const rawData = await req.json() as Record<string, unknown>;
      const payload: EventChangeRequestInput = {
        ...(rawData as Partial<EventChangeRequestInput>),
        event_id: eventId,
      } as EventChangeRequestInput;

      const errors = await changeRequestsService.validateChangeRequest(payload);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);

      const created = await changeRequestsService.create(payload);
      return jsonResponse({ success: true, data: created, message: MSG_CHANGE_REQUEST_CREATED }, HTTP_STATUS_CREATED);
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function updateChangeRequest(req: Request, calendarId: string, eventId: string, changeRequestId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const existing = await changeRequestsService.getById(changeRequestId);
      if (!existing || existing.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_CHANGE_REQUEST_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const data = await req.json() as Partial<EventChangeRequestInput>;
      const payload: Partial<EventChangeRequestInput> = {
        ...data,
        event_id: eventId,
      };

      const updated = await changeRequestsService.update(changeRequestId, payload);
      return jsonResponse({ success: true, data: updated, message: MSG_CHANGE_REQUEST_UPDATED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function removeChangeRequest(req: Request, calendarId: string, eventId: string, changeRequestId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const existing = await changeRequestsService.getById(changeRequestId);
      if (!existing || existing.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_CHANGE_REQUEST_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const removed = await changeRequestsService.remove(changeRequestId);
      return jsonResponse({ success: true, data: removed, message: MSG_CHANGE_REQUEST_CANCELLED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function listPayments(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const statusParam = new URL(req.url).searchParams.get('status');
      const status = (statusParam || undefined) as PaymentStatus | undefined;
      const items = await paymentsService.list(status);
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function getPayment(req: Request, paymentId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const item = await paymentsService.getById(paymentId);
      if (!item) return jsonResponse({ success: false, error: ERR_PAYMENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, data: item });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function createPayment(req: Request): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const data = await req.json() as unknown;
      const errors = await paymentsService.validatePayment(data);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);

      const created = await paymentsService.create(data as PaymentInput);
      return jsonResponse({ success: true, data: created, message: MSG_PAYMENT_CREATED }, HTTP_STATUS_CREATED);
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function updatePayment(req: Request, paymentId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const existing = await paymentsService.getById(paymentId);
      if (!existing) return jsonResponse({ success: false, error: ERR_PAYMENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);

      const data = await req.json() as Partial<PaymentInput>;
      const updated = await paymentsService.update(paymentId, data);
      return jsonResponse({ success: true, data: updated, message: MSG_PAYMENT_UPDATED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function removePayment(req: Request, paymentId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const existing = await paymentsService.getById(paymentId);
      if (!existing) return jsonResponse({ success: false, error: ERR_PAYMENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);

      const removed = await paymentsService.remove(paymentId);
      return jsonResponse({ success: true, data: removed, message: MSG_PAYMENT_CANCELLED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function listEventPayments(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const items = await eventPaymentsService.listByEvent(eventId);
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function getEventPayment(req: Request, calendarId: string, eventId: string, eventPaymentId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const item = await eventPaymentsService.getById(eventPaymentId);
      if (!item || item.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_EVENT_PAYMENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      return jsonResponse({ success: true, data: item });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function createEventPayment(req: Request, calendarId: string, eventId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const rawData = await req.json() as Record<string, unknown>;
      const payload: EventPaymentInput = {
        ...(rawData as Partial<EventPaymentInput>),
        event_id: eventId,
      } as EventPaymentInput;

      const errors = await eventPaymentsService.validateEventPayment(payload);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);

      const payment = await paymentsService.getById(payload.payment_id);
      if (!payment) {
        return jsonResponse({ success: false, error: ERR_PAYMENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const created = await eventPaymentsService.create(payload);
      return jsonResponse({ success: true, data: created, message: MSG_EVENT_PAYMENT_CREATED }, HTTP_STATUS_CREATED);
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function updateEventPayment(req: Request, calendarId: string, eventId: string, eventPaymentId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const existing = await eventPaymentsService.getById(eventPaymentId);
      if (!existing || existing.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_EVENT_PAYMENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const data = await req.json() as Partial<EventPaymentInput>;
      const payload: Partial<EventPaymentInput> = {
        ...data,
        event_id: eventId,
      };

      if (payload.payment_id) {
        const payment = await paymentsService.getById(payload.payment_id);
        if (!payment) {
          return jsonResponse({ success: false, error: ERR_PAYMENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
        }
      }

      const updated = await eventPaymentsService.update(eventPaymentId, payload);
      return jsonResponse({ success: true, data: updated, message: MSG_EVENT_PAYMENT_UPDATED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function removeEventPayment(req: Request, calendarId: string, eventId: string, eventPaymentId: string): Promise<Response> {
    try {
      const sessionError = await validateSecureSession(req);
      if (sessionError) return sessionError;

      const event = await eventsService.getById(eventId);
      if (!event || event.calendar_id !== calendarId) {
        return jsonResponse({ success: false, error: ERR_EVENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const existing = await eventPaymentsService.getById(eventPaymentId);
      if (!existing || existing.event_id !== eventId) {
        return jsonResponse({ success: false, error: ERR_EVENT_PAYMENT_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      }

      const removed = await eventPaymentsService.remove(eventPaymentId);
      return jsonResponse({ success: true, data: removed, message: MSG_EVENT_PAYMENT_CANCELLED });
    } catch (error) {
      const err = error as Error;
      return jsonResponse({ success: false, error: ERR_INTERNAL_ERROR, message: err.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function removeCalendar(req: Request): Promise<Response> {
    const sessionError = await validateSecureSession(req);
    if (sessionError) return sessionError;

    return jsonResponse(
      {
        success: false,
        error: ERR_INVALID_REQUEST,
        message: 'DELETE is not supported for calendars. Use PUT to update fields and keep historical data.',
      },
      HTTP_STATUS_BAD_REQUEST
    );
  }

  return {
    listPayments,
    getPayment,
    createPayment,
    updatePayment,
    removePayment,
    listCalendars,
    getCalendar,
    createCalendar,
    updateCalendar,
    removeCalendar,
    listEvents,
    getEvent,
    createEvent,
    updateEvent,
    removeEvent,
    listParticipants,
    getParticipant,
    createParticipant,
    updateParticipant,
    removeParticipant,
    listChangeRequests,
    getChangeRequest,
    createChangeRequest,
    updateChangeRequest,
    removeChangeRequest,
    listEventPayments,
    getEventPayment,
    createEventPayment,
    updateEventPayment,
    removeEventPayment,
  };
}
