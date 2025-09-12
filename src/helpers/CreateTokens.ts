// export const createAccessToken = (user: User): string => {
// 	const { secret } = authConfig;

// 	return sign(
// 		{
// 			usarname: user.name,
// 			tenantId: user.tenantId,
// 			profile: user.profile,
// 			id: user.id,
// 		},
// 		secret,
// 		{ expiresIn: "3d" }
// 	);
// };

// export const createRefreshToken = (user: User): string => {
// 	const { refreshSecret } = authConfig;

// 	return sign({ id: user.id, tokenVersion: user.tokenVersion }, refreshSecret, {
// 		expiresIn: "7d",
// 	});
// };
