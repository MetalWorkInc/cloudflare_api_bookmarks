import { jsonResponse } from '../../../lib/utils.js';
import { CurriculumVitae, CurriculumVitaeInput } from '../../models/CurriculumVitae';
import type { Env } from '../../types/interface.ts';

const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

const ERR_FAILED_RETRIEVE_CURRICULUM_VITAE = 'Failed to retrieve curriculum vitae';
const ERR_CURRICULUM_VITAE_NOT_FOUND = 'Curriculum vitae not found';
const ERR_FAILED_CREATE_CURRICULUM_VITAE = 'Failed to create curriculum vitae';
const ERR_FAILED_UPDATE_CURRICULUM_VITAE = 'Failed to update curriculum vitae';
const ERR_FAILED_DELETE_CURRICULUM_VITAE = 'Failed to delete curriculum vitae';
const ERR_FAILED_RETRIEVE_PERSONAL_CARDS = 'Failed to retrieve personal cards';

const MSG_CURRICULUM_VITAE_CREATED = 'Curriculum vitae created successfully';
const MSG_CURRICULUM_VITAE_UPDATED = 'Curriculum vitae updated successfully';
const MSG_CURRICULUM_VITAE_DELETED = 'Curriculum vitae deleted successfully';

interface CurriculumVitaeService {
  list(): Promise<CurriculumVitae[]>;
  getById(id: string): Promise<CurriculumVitae | null>;
  //create(data: CurriculumVitaeInput): Promise<CurriculumVitae>;
  //update(id: string, data: CurriculumVitaeInput): Promise<CurriculumVitae | null>;
  //remove(id: string): Promise<CurriculumVitae | null>;
  validateCurriculumVitae(data: unknown): Promise<string[]>;
  getPersonalCards(): Promise<Array<{id: string, fullName: string, email: string, phone: string}>>;
}

export default function makeCurriculumVitaeController(service: CurriculumVitaeService) {
  async function list(req: Request, env: Env): Promise<Response> {
    try {
      const items = await service.list();
      return jsonResponse({ success: true, data: items, count: items.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_RETRIEVE_CURRICULUM_VITAE, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async function get(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const item = await service.getById(id);
      if (!item) return jsonResponse({ success: false, error: ERR_CURRICULUM_VITAE_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, data: item });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_RETRIEVE_CURRICULUM_VITAE, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   *  Note: The create function validates the incoming data before attempting to create a new curriculum vitae. If the validation fails, it returns a 400 Bad Request response with the validation errors. This ensures that only valid data is processed and provides clear feedback to clients about any issues with their request.
   */
  /*
  async function create(req: Request, env: Env): Promise<Response> {
    try {
      const data = await req.json() as unknown;
      const errors = await service.validateCurriculumVitae(data);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);
      const created = await service.create(data as CurriculumVitaeInput);
      return jsonResponse({ success: true, data: created, message: MSG_CURRICULUM_VITAE_CREATED }, HTTP_STATUS_CREATED);
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_CREATE_CURRICULUM_VITAE, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }
  */
 
  /**
   * Note: The update function first checks if the curriculum vitae with the given ID exists. If it doesn't, it returns a 404 Not Found response. This prevents unnecessary validation and update attempts on non-existent records, ensuring that clients receive accurate feedback about the resource they are trying to update.
   */
  /*
  async function update(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const exists = await service.getById(id);
      if (!exists) return jsonResponse({ success: false, error: ERR_CURRICULUM_VITAE_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      const data = await req.json() as unknown;
      const errors = await service.validateCurriculumVitae(data);
      if (errors.length) return jsonResponse({ success: false, errors }, HTTP_STATUS_BAD_REQUEST);
      const updated = await service.update(id, data as CurriculumVitaeInput);
      return jsonResponse({ success: true, data: updated, message: MSG_CURRICULUM_VITAE_UPDATED });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_UPDATE_CURRICULUM_VITAE, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }
  */

  /**
   * Note: The remove function attempts to delete the curriculum vitae with the specified ID. If the record doesn't exist, it returns a 404 Not Found response. This ensures that clients are informed when they try to delete a resource that doesn't exist, providing clear feedback about the outcome of their request.
   */
  /*
  async function remove(req: Request, env: Env, id: string): Promise<Response> {
    try {
      const deleted = await service.remove(id);
      if (!deleted) return jsonResponse({ success: false, error: ERR_CURRICULUM_VITAE_NOT_FOUND }, HTTP_STATUS_NOT_FOUND);
      return jsonResponse({ success: true, message: MSG_CURRICULUM_VITAE_DELETED, data: deleted });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_DELETE_CURRICULUM_VITAE, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }
  */

  async function getPersonalCards(req: Request, env: Env): Promise<Response> {
    try {
      const cards = await service.getPersonalCards();
      return jsonResponse({ success: true, data: cards, count: cards.length });
    } catch (err) {
      const error = err as Error;
      return jsonResponse({ success: false, error: ERR_FAILED_RETRIEVE_PERSONAL_CARDS, message: error.message }, HTTP_STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  return { list, get, /*create, update, remove,*/ getPersonalCards };
}
