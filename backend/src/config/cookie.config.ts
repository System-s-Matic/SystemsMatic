import { CookieOptions } from 'express';

export const getCookieOptions = (): CookieOptions => {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    path: '/',
  };
};

export const getClearCookieOptions = (): CookieOptions => {
  return {
    path: '/',
    secure: true,
    sameSite: 'none',
  };
};
