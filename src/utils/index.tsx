// src/utils/index.tsx
const pageRoutes: Record<string, string> = {
  LandingPage: "/",
  Dashboard: "/dashboard",
  Contact: "/contact",
  Auth: "/auth",
};

export const createPageUrl = (pageName: string): string =>
  pageRoutes[pageName] || `/${pageName.toLowerCase()}`;

function generateCaptcha(length: number = 6) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let captcha = "";
  for (let i = 0; i < length; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}
