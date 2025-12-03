
export interface CurriculumVitae {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  summary?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumVitaeInput {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  summary?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  skills?: string[];
  languages?: string[];
  certifications?: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface ExperienceItem {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  responsibilities?: string[];
}
