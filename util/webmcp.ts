export type GoToDestination =
  | 'home'
  | 'apply'
  | 'sign-in'
  | 'profile'
  | 'edit'
  | 'uploads'
  | 'pay-registration';

export const GO_TO_PATHS: Record<GoToDestination, string> = {
  home: '/',
  apply: '/apply#registration',
  'sign-in': '/apply#registration',
  profile: '/profile',
  edit: '/profile/edit',
  uploads: '/profile/upload',
  'pay-registration': '/payment/registration',
};

export const PROFILE_FILL_FIELDS = [
  'first_name',
  'last_name',
  'company_name',
  'website',
  'email',
  'phone',
  'phone2',
  'address',
  'city',
  'state',
  'zipcode',
  'category',
  'description',
] as const;

export type ProfileFillField = (typeof PROFILE_FILL_FIELDS)[number];

export function isGoToDestination(value: string): value is GoToDestination {
  return Object.prototype.hasOwnProperty.call(GO_TO_PATHS, value);
}

export function parseToolInput(input: unknown): Record<string, unknown> {
  if (input == null || input === '') return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

export interface ModelContextTool {
  name: string;
  description: string;
  inputSchema?: object;
  execute: (input?: unknown) => Promise<unknown> | unknown;
}

export interface ModelContextApi {
  registerTool: (
    tool: ModelContextTool,
    options?: {signal?: AbortSignal}
  ) => Promise<unknown> | unknown;
}

export function getModelContext(): ModelContextApi | undefined {
  if (typeof document === 'undefined') return undefined;
  const fromDocument = (document as Document & {modelContext?: ModelContextApi}).modelContext;
  const fromNavigator = (navigator as Navigator & {modelContext?: ModelContextApi}).modelContext;
  const context = fromDocument || fromNavigator;
  if (!context || typeof context.registerTool !== 'function') return undefined;
  return context;
}
