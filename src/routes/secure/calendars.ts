import type { Env } from '../../app/types/interface.js';
import makeUserSesionTknService from '../../app/services/userSesionTknService';
import {
  makeCalendarsService,
  makeCalendarEventsService,
  makeEventParticipantsService,
  makeEventChangeRequestsService,
  makePaymentsService,
  makeEventPaymentsService,
} from '../../app/services/calendars/index.js';
import makeCalendarsController from '../../app/controllers/secure/calendarsController';

export default function makeCalendarsRouter(env: Env) {
  const calendarsService = makeCalendarsService(env);
  const eventsService = makeCalendarEventsService(env);
  const participantsService = makeEventParticipantsService(env);
  const changeRequestsService = makeEventChangeRequestsService(env);
  const paymentsService = makePaymentsService(env);
  const eventPaymentsService = makeEventPaymentsService(env);
  const userSesionService = makeUserSesionTknService(env);

  const controller = makeCalendarsController(
    calendarsService,
    eventsService,
    participantsService,
    changeRequestsService,
    paymentsService,
    eventPaymentsService,
    userSesionService
  );

  return async function route(request: Request, path: string, method: string): Promise<Response | null> {
    const parts = path.split('/').filter(Boolean);

    if (parts[0] !== 'calendars') {
      return null;
    }

    if (parts.length >= 2 && parts[1] === 'payments') {
      if (parts.length === 2) {
        if (method === 'GET') return controller.listPayments(request);
        if (method === 'POST') return controller.createPayment(request);
        return null;
      }

      if (parts.length === 3) {
        const paymentId = parts[2];
        if (method === 'GET') return controller.getPayment(request, paymentId);
        if (method === 'PUT') return controller.updatePayment(request, paymentId);
        if (method === 'DELETE') return controller.removePayment(request, paymentId);
      }

      return null;
    }

    if (parts.length === 1) {
      if (method === 'GET') return controller.listCalendars(request);
      if (method === 'POST') return controller.createCalendar(request);
      return null;
    }

    const calendarId = parts[1];

    if (parts.length === 2) {
      if (method === 'GET') return controller.getCalendar(request, calendarId);
      if (method === 'PUT') return controller.updateCalendar(request, calendarId);
      if (method === 'DELETE') return controller.removeCalendar(request);
      return null;
    }

    if (parts[2] !== 'events') {
      return null;
    }

    if (parts.length === 3) {
      if (method === 'GET') return controller.listEvents(request, calendarId);
      if (method === 'POST') return controller.createEvent(request, calendarId);
      return null;
    }

    const eventId = parts[3];

    if (parts.length === 4) {
      if (method === 'GET') return controller.getEvent(request, calendarId, eventId);
      if (method === 'PUT') return controller.updateEvent(request, calendarId, eventId);
      if (method === 'DELETE') return controller.removeEvent(request, calendarId, eventId);
      return null;
    }

    const nestedResource = parts[4];

    if (nestedResource === 'participants') {
      if (parts.length === 5) {
        if (method === 'GET') return controller.listParticipants(request, calendarId, eventId);
        if (method === 'POST') return controller.createParticipant(request, calendarId, eventId);
        return null;
      }

      if (parts.length === 6) {
        const participantId = parts[5];
        if (method === 'GET') return controller.getParticipant(request, calendarId, eventId, participantId);
        if (method === 'PUT') return controller.updateParticipant(request, calendarId, eventId, participantId);
        if (method === 'DELETE') return controller.removeParticipant(request, calendarId, eventId, participantId);
      }

      return null;
    }

    if (nestedResource === 'payments') {
      if (parts.length === 5) {
        if (method === 'GET') return controller.listEventPayments(request, calendarId, eventId);
        if (method === 'POST') return controller.createEventPayment(request, calendarId, eventId);
        return null;
      }

      if (parts.length === 6) {
        const eventPaymentId = parts[5];
        if (method === 'GET') return controller.getEventPayment(request, calendarId, eventId, eventPaymentId);
        if (method === 'PUT') return controller.updateEventPayment(request, calendarId, eventId, eventPaymentId);
        if (method === 'DELETE') return controller.removeEventPayment(request, calendarId, eventId, eventPaymentId);
      }

      return null;
    }

    if (nestedResource === 'change-requests') {
      if (parts.length === 5) {
        if (method === 'GET') return controller.listChangeRequests(request, calendarId, eventId);
        if (method === 'POST') return controller.createChangeRequest(request, calendarId, eventId);
        return null;
      }

      if (parts.length === 6) {
        const changeRequestId = parts[5];
        if (method === 'GET') return controller.getChangeRequest(request, calendarId, eventId, changeRequestId);
        if (method === 'PUT') return controller.updateChangeRequest(request, calendarId, eventId, changeRequestId);
        if (method === 'DELETE') return controller.removeChangeRequest(request, calendarId, eventId, changeRequestId);
      }

      return null;
    }

    return null;
  };
}
