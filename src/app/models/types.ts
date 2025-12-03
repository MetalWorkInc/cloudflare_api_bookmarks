/**
 * TypeScript models for type safety and validation
 */

// Bookmark Schema
export function bookmarkSchema() {
  return {
    id: 'string',
    title: 'string',
    url: 'string',
    icon: 'string',
    description: 'string',
    tags: 'array',
    createdAt: 'string',
    updatedAt: 'string',
  };
}


// CurriculumVitae Schema
export function curriculumVitaeSchema() {
  return {
    id: 'string',
    fullName: 'string',
    email: 'string',
    phone: 'string',
    address: 'string',
    summary: 'string',
    education: 'array',
    experience: 'array',
    skills: 'array',
    languages: 'array',
    certifications: 'array',
    createdAt: 'string',
    updatedAt: 'string',
  };
}
