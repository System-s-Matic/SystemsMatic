import "@testing-library/jest-dom";
import "whatwg-fetch";

// --- Mock Next.js Router (next/navigation) ---
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// --- Mock Next.js Image Component ---
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ""} />;
  },
}));

// --- Mock window.matchMedia (responsive) ---
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // obsolète mais requis
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// --- Mock ResizeObserver (évite erreurs React Hook Form) ---
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;

// --- Variables d'environnement globales ---
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// --- Global cleanup ---
beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  document.body.innerHTML = "";
});
