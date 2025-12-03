import { generateId } from '../../lib/utils.js';
import { CurriculumVitae, CurriculumVitaeInput } from '../models/CurriculumVitae.js';
import type { Env } from '../types/interface.js';

interface CurriculumVitaeRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  summary: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null;
  languages: string | null;
  certifications: string | null;
  created_at: string;
  updated_at: string;
}

export default function makeCurriculumVitaeService(env: Env) {
  const db = env.datastoraged01;

  async function list(): Promise<CurriculumVitae[]> {
    const { results } = await db.prepare(
      'SELECT * FROM curriculum_vitae ORDER BY created_at DESC'
    ).all<CurriculumVitaeRow>();
    
    return results.map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone || '',
      address: row.address || '',
      summary: row.summary || '',
      education: row.education ? JSON.parse(row.education) : [],
      experience: row.experience ? JSON.parse(row.experience) : [],
      skills: row.skills ? JSON.parse(row.skills) : [],
      languages: row.languages ? JSON.parse(row.languages) : [],
      certifications: row.certifications ? JSON.parse(row.certifications) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async function getById(id: string): Promise<CurriculumVitae | null> {
    const result = await db.prepare(
      'SELECT * FROM curriculum_vitae WHERE id = ?'
    ).bind(id).first<CurriculumVitaeRow>();
    
    if (!result) return null;
    
    return {
      id: result.id,
      fullName: result.full_name,
      email: result.email,
      phone: result.phone || '',
      address: result.address || '',
      summary: result.summary || '',
      education: result.education ? JSON.parse(result.education) : [],
      experience: result.experience ? JSON.parse(result.experience) : [],
      skills: result.skills ? JSON.parse(result.skills) : [],
      languages: result.languages ? JSON.parse(result.languages) : [],
      certifications: result.certifications ? JSON.parse(result.certifications) : [],
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  async function create(data: CurriculumVitaeInput): Promise<CurriculumVitae> {
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.prepare(
      'INSERT INTO curriculum_vitae (id, full_name, email, phone, address, summary, education, experience, skills, languages, certifications, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      data.fullName.trim(),
      data.email.trim(),
      data.phone ? data.phone.trim() : '',
      data.address ? data.address.trim() : '',
      data.summary ? data.summary.trim() : '',
      JSON.stringify(data.education || []),
      JSON.stringify(data.experience || []),
      JSON.stringify(data.skills || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.certifications || []),
      now,
      now
    ).run();
    
    return {
      id,
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone ? data.phone.trim() : '',
      address: data.address ? data.address.trim() : '',
      summary: data.summary ? data.summary.trim() : '',
      education: data.education || [],
      experience: data.experience || [],
      skills: data.skills || [],
      languages: data.languages || [],
      certifications: data.certifications || [],
      createdAt: now,
      updatedAt: now,
    };
  }

  async function update(id: string, data: CurriculumVitaeInput): Promise<CurriculumVitae | null> {
    const existing = await getById(id);
    if (!existing) return null;
    
    const now = new Date().toISOString();
    
    await db.prepare(
      'UPDATE curriculum_vitae SET full_name = ?, email = ?, phone = ?, address = ?, summary = ?, education = ?, experience = ?, skills = ?, languages = ?, certifications = ?, updated_at = ? WHERE id = ?'
    ).bind(
      data.fullName.trim(),
      data.email.trim(),
      data.phone ? data.phone.trim() : existing.phone,
      data.address ? data.address.trim() : existing.address,
      data.summary ? data.summary.trim() : existing.summary,
      JSON.stringify(data.education || existing.education || []),
      JSON.stringify(data.experience || existing.experience || []),
      JSON.stringify(data.skills || existing.skills || []),
      JSON.stringify(data.languages || existing.languages || []),
      JSON.stringify(data.certifications || existing.certifications || []),
      now,
      id
    ).run();
    
    return {
      id,
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone ? data.phone.trim() : existing.phone,
      address: data.address ? data.address.trim() : existing.address,
      summary: data.summary ? data.summary.trim() : existing.summary,
      education: data.education || existing.education || [],
      experience: data.experience || existing.experience || [],
      skills: data.skills || existing.skills || [],
      languages: data.languages || existing.languages || [],
      certifications: data.certifications || existing.certifications || [],
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  }

  async function remove(id: string): Promise<CurriculumVitae | null> {
    const existing = await getById(id);
    if (!existing) return null;
    
    await db.prepare(
      'DELETE FROM curriculum_vitae WHERE id = ?'
    ).bind(id).run();
    
    return existing;
  }

  async function validateCurriculumVitae(data: unknown): Promise<string[]> {
    const errors: string[] = [];
    console.log('Validating curriculum vitae data:', data);
    
    if (!data || typeof data !== 'object') {
      errors.push('Invalid payload');
      return errors;
    }

    const cv = data as Partial<CurriculumVitaeInput>;

    if (!cv.fullName || typeof cv.fullName !== 'string' || cv.fullName.trim() === '') {
      errors.push('Full name is required and must be a non-empty string');
    }

    if (!cv.email || typeof cv.email !== 'string' || cv.email.trim() === '') {
      errors.push('Email is required and must be a non-empty string');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cv.email)) {
        errors.push('Email must be a valid email address');
      }
    }

    return errors;
  }

  return { list, getById, create, update, remove, validateCurriculumVitae };
}
