import * as bcrypt from 'bcryptjs';
import * as JWT from 'jsonwebtoken';
import { FastifyReply, FastifyRequest } from 'fastify';



export const utils = {
  isJSON: (data: string) => {
    try {
      JSON.parse(data);
    } catch (e) {
      return false;
    }
    return true;
  },

  getTime: (): number => {
    return new Date().getTime();
  },

//   genSalt: (saltRounds: number, value: string): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       bcrypt.genSalt(saltRounds, (err, salt) => {
//         if (err) return reject(err);
//         bcrypt.hash(value, salt, (err, hash) => {
//           if (err) return reject(err);
//           resolve(hash);
//         });
//       });
//     });
//   },

//   compareHash: (hash: string, value: string): Promise<boolean> => {
//     return new Promise((resolve, reject) => {
//       bcrypt.compare(value, hash, (err, result) => {
//         if (err) return reject(err);
//         resolve(result);
//       });
//     });
//   },



  getTokenFromHeader: (
    authorizationHeader: string | undefined,
  ): string | null => {
    
    if (!authorizationHeader) return null;
    const token = authorizationHeader.replace('Bearer ', '');
    return token || null;
  },




};