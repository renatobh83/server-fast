const IsContactTest = async (
	celularContato: string | undefined,
	celularTeste: string | undefined | null,
	channel: undefined | string,
): Promise<boolean> => {
	// Verificar se rotina em teste e contato informado é compatível
	if (channel !== "whatsapp") return false;
	if (
		(celularTeste && celularContato?.indexOf(celularTeste.substring(1)) === -1) ||
		!celularContato
	) {
		return true;
	}
	return false;
};

export default IsContactTest;
