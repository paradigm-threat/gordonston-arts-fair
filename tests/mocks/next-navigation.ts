export function useRouter() {
    return {
        push: () => undefined,
        replace: () => undefined,
        refresh: () => undefined,
        back: () => undefined,
        forward: () => undefined,
        prefetch: async () => undefined,
    };
}

export function usePathname() {
    return '/profile/edit';
}

export function useSearchParams() {
    return new URLSearchParams();
}

export function redirect() {
    return undefined;
}

export function notFound() {
    return undefined;
}
