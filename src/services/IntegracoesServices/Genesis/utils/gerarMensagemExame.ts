type Canal = "whatsapp" | "telegram";

interface MensagemInfo {
  texto: string;
  opcoes: { id: string; texto: string; description: string }[];
}

export function gerarMensagemExame(
  precoExame: string,
  perguntarPreferencia: boolean
): MensagemInfo {
  const isValid = parseFloat(precoExame.replace(",", ".")) !== 0;

  if (isValid && perguntarPreferencia) {
    return {
      texto: `💰 O exame possui um custo de R$ ${precoExame}.\n👨‍⚕️ Deseja selecionar um médico de sua preferência antes de prosseguirmos?`,
      opcoes: [
        {
          id: "selecionarMedico",
          texto: "Selecionar Médico",
          description: "Tenho preferência por médico",
        },
        {
          id: "naoSelecionar",
          texto: "Não Selecionar Médico",
          description: "Não tenho preferência por médico.",
        },
        { id: "cancelar", texto: "Cancelar", description: "Desejo cancelar" },
      ],
    };
  }

  if (isValid && !perguntarPreferencia) {
    return {
      texto: `💰 O exame selecionado possui um custo de R$ ${precoExame}.\n✅ Assim que confirmado, daremos continuidade ao agendamento.`,
      opcoes: [
        {
          id: "continuar",
          texto: "Continuar",
          description: "Desejo continuar.",
        },
        { id: "cancelar", texto: "Cancelar", description: "Desejo cancelar" },
      ],
    };
  }

  if (!isValid && perguntarPreferencia) {
    return {
      texto: `👨‍⚕️ Deseja selecionar um médico de sua preferência antes de prosseguirmos?`,
      opcoes: [
        {
          id: "selecionarMedico",
          texto: "Selecionar Médico",
          description: "Tenho preferência por médico",
        },
        {
          id: "naoSelecionar",
          texto: "Não Selecionar Médico",
          description: "Não tenho preferência por médico.",
        },
        { id: "cancelar", texto: "Cancelar", description: "Desejo cancelar" },
      ],
    };
  }

  return {
    texto: `Podemos prosseguir com o seu agendamento?`,
    opcoes: [
      { id: "continuar", texto: "Continuar", description: "Desejo continuar." },
      { id: "cancelar", texto: "Cancelar", description: "Desejo cancelar" },
    ],
  };
}

export function gerarMensagemListaMedicos(exames: any[]) {
  return {
    texto: `Selecione o médico de sua preferência:`,
    opcoes: exames.map((medico, index) => ({
      id: `medico_${medico.cd_medico}`, // ou `${medico.cd_medico}`
      texto: medico.ds_medico,
      description: `Exame: ${medico.ds_procedimento}`,
    })),
  };
}
export function gerarMensagemLoopProcedimento() {
  return {
    texto: "Perfeito! Você deseja agendar mais algum outro exame?",
    opcoes: [
      {
        id: "sim",
        texto: "Agendar outro exame",
        description: "Tenho mais exames para agendar",
      },
      {
        id: "nao",
        texto: "Somente esse exame",
        description: "Não tenho outro exame.",
      },
    ],
  };
}

export function gerarMensagemExameComPreparo() {
  return {
    texto:
      "📄 Segue orientações a serem seguidas para realização do seu exame.",
    opcoes: [
      {
        id: "1",
        texto: "Podemos prosseguir",
        description: "Continuar com o processo de agendamento.",
      },
      {
        id: "2",
        texto: "Menu anterior",
        description: "Desejo voltar ao menu anterior.",
      },
      {
        id: "3",
        texto: "Cancelar",
        description: "Desejo cancelar.",
      },
    ],
  };
}

export function gerarMensagemExameSemPreparo() {
  return {
    texto: "📄 Procedimento não tem preparo.",
    opcoes: [
      {
        id: "1",
        texto: "Podemos prosseguir",
        description: "Continuar com o processo de agendamento.",
      },
      {
        id: "2",
        texto: "Voltar ao menu anterior",
        description: "Desejo voltar ao menu anterior.",
      },
      {
        id: "3",
        texto: "Cancelar",
        description: "Desejo cancelar.",
      },
    ],
  };
}
