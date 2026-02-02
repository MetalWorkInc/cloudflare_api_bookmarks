
export interface SesionEnv {
    success: boolean;
    token: string;
    data: string;
    message: string;
}

export function validateSesionEnv(value: unknown): string[] {
    const errors: string[] = [];
    if (typeof value !== 'object' || value === null) {
        return ['SesionEnv must be an object'];
    }

    const record = value as Record<string, unknown>;

    if (typeof record.success !== 'boolean') {
        errors.push('success must be boolean');
    }

    if (typeof record.token !== 'string') {
        errors.push('token must be string');
    }

    if (typeof record.data !== 'string') {
        errors.push('data must be string');
    }

    if (typeof record.message !== 'string') {
        errors.push('message must be string');
    }

    if (record.success === true && typeof record.token === 'string' && record.token.trim().length === 0) {
        errors.push('token is required when success is true');
    }

    return errors;
}