// import { verify } from "jsonwebtoken";
// import { AppError } from "../../errors/errors.helper";

// interface RefreshTokenPayload {
//   id: string;
//   tokenVersion: number;
// }

// interface Response {
//   newToken: string;
//   refreshToken: string;
// }

// export const RefreshTokenService = async (token: string): Promise<Response> => {
//   let decoded;

//   if (!token) {
//     throw new AppError("ERR_COOKIE_NO_FOUND", 401);
//   }
//   try {
//     decoded = verify(token, authConfig.refreshSecret);
//   } catch (err) {
//     throw new AppError("ERR_SESSION_EXPIRED", 403);
//   }

//   const { id, tokenVersion } = decoded as RefreshTokenPayload;

//   // const user = await ShowUserService(id, 1);

//   if (user.tokenVersion !== tokenVersion) {
//     throw new AppError("ERR_SESSION_EXPIRED", 403);
//   }

//   const newToken = createAccessToken(user);
//   const refreshToken = createRefreshToken(user);
//   return { newToken, refreshToken };
// };
