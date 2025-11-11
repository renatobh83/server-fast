import { AppError } from "../../errors/errors.helper";
import User from "../../models/User";

interface Request {
  payload: {
    id: string; // Assumindo que o ID do usuário está no payload
  };
  newPassword: string;
}
/**
 * Atualiza a senha do usuário de forma segura e retorna o e-mail do usuário.
 * @param payload Contém o ID do usuário.
 * @param newPassword A nova senha em texto simples.
 * @returns O e-mail do usuário.
 */
export const UpdatePasswortResetServices = async ({
  payload,
  newPassword,
}: Request): Promise<any> => {
  try {
    const user = await User.findByPk(payload.id);
    if (!user) {
      throw new AppError("Usuário não encontrado para o ID fornecido.", 404);
    }
    user.password = newPassword;
    await user.save();
    return user.email;
  } catch (error: any) {
    // 7. Tratamento de erros: relançar o erro para ser tratado pelo chamador
    if (error instanceof AppError) {
      throw error;
    }
    // Para outros erros (ex: erro de banco de dados)
    throw new AppError(`Erro ao atualizar a senha: ${error.message}`, 500);
  }
};
