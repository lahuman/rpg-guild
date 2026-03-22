import { getErrorMessage } from './errors';

export function notify(message: string) {
    alert(message);
}

export function notifySuccess(message: string) {
    notify(message);
}

export function notifyError(error: unknown, fallback?: string) {
    notify(getErrorMessage(error, fallback));
}

export function confirmAction(message: string) {
    return confirm(message);
}
