import {Request} from 'express';

declare module 'express' {
  interface Request {
    authenticatedUser: string;
  }
}