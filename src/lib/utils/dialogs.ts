import { getErrorMessage } from './errors';

let bodyScrollLockCount = 0;
let lockedScrollY = 0;
let previousBodyOverflow = '';
let previousBodyPosition = '';
let previousBodyTop = '';
let previousBodyLeft = '';
let previousBodyRight = '';
let previousBodyWidth = '';
let previousBodyPaddingRight = '';
let previousBodyTouchAction = '';
let previousHtmlOverflow = '';
let previousHtmlOverscrollBehavior = '';

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

export function lockBodyScroll() {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return () => {};
    }

    bodyScrollLockCount += 1;

    if (bodyScrollLockCount === 1) {
        const { body, documentElement } = document;
        const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

        lockedScrollY = window.scrollY;
        previousBodyOverflow = body.style.overflow;
        previousBodyPosition = body.style.position;
        previousBodyTop = body.style.top;
        previousBodyLeft = body.style.left;
        previousBodyRight = body.style.right;
        previousBodyWidth = body.style.width;
        previousBodyPaddingRight = body.style.paddingRight;
        previousBodyTouchAction = body.style.touchAction;
        previousHtmlOverflow = documentElement.style.overflow;
        previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;

        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${lockedScrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
        body.style.touchAction = 'none';

        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        documentElement.style.overflow = 'hidden';
        documentElement.style.overscrollBehavior = 'none';
    }

    let released = false;

    return () => {
        if (released || typeof document === 'undefined' || typeof window === 'undefined') {
            return;
        }

        released = true;
        bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);

        if (bodyScrollLockCount > 0) {
            return;
        }

        const { body, documentElement } = document;

        body.style.overflow = previousBodyOverflow;
        body.style.position = previousBodyPosition;
        body.style.top = previousBodyTop;
        body.style.left = previousBodyLeft;
        body.style.right = previousBodyRight;
        body.style.width = previousBodyWidth;
        body.style.paddingRight = previousBodyPaddingRight;
        body.style.touchAction = previousBodyTouchAction;
        documentElement.style.overflow = previousHtmlOverflow;
        documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;

        window.scrollTo({ top: lockedScrollY, behavior: 'auto' });
    };
}
