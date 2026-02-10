
export interface SesionEnv {
    success: boolean;
    token: string;
    data: string;
    message: string;
}

export function validateSesionEnv(value: unknown): string[] {
    const errors: string[] = [];
    if (typeof value !== 'object' || value === null) {
        return ['invalid value'];
    }

    const record = value as Record<string, unknown>;
    let isValid = true;
    const allowedKeys = new Set(['success', 'token', 'data', 'message']);
    const hasUnknownKey = Object.keys(record).some((key) => !allowedKeys.has(key));
    if (hasUnknownKey) {
        isValid = false;
    }

    if (typeof record.success !== 'boolean') {
        isValid = false;
    }

    if (typeof record.token !== 'string') {
        isValid = false;
    }

    if (typeof record.data !== 'string') {
        isValid = false;
    }

    if (typeof record.message !== 'string') {
        isValid = false;
    }

    if (record.success === true && typeof record.token === 'string' && record.token.trim().length === 0) {
        isValid = false;
    }

    if (!isValid) {
        errors.push('invalid value');
    }

    return errors;
}