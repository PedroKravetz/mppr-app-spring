// import { type Request, type Response } from 'express'
import { Request, Response } from "express";
import { Paciente } from "./pacienteEntity.js";
import { AppDataSource } from "../data-source.js";
import { Endereco } from "../enderecos/enderecoEntity.js";
import { CPFValido } from "./validacaoCPF.js";
import { mapeiaPlano } from "../utils/planoSaudeUtils.js";
import { Consulta } from "../consultas/consultaEntity.js";
import { AppError, Status } from "../error/ErrorHandler.js";
import { encryptPassword } from "../utils/senhaUtils.js";
import { pacienteSchema } from "./pacienteYupSchema.js";
import { sanitizacaoPaciente } from "./pacienteSanitizations.js";

export const consultaPorPaciente = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userInput } = req.query;
  if (!userInput) {
    res.status(400).json({ message: "Nenhum usuário fornecido" });
  }

  let sanitizedUserInput;

  if (typeof userInput === "string") {
    sanitizedUserInput = userInput.replace(/[^a-zA-ZÀ-ú\s]/g, "").trim();
    if (sanitizedUserInput.length < 2) {
      res.status(400).json({ message: "String fornecida é muito curta" });
    } else if (sanitizedUserInput.length > 80) {
      res.status(400).json({ message: "String fornecida é muito longa" });
    }
  } else {
    res.status(400).json({ message: "Não foi fornecido uma string" });
  }

  const query = `SELECT * FROM paciente WHERE nome = ?`;
  try {
    const listaPacientes = await AppDataSource.manager.query(query, [
      sanitizedUserInput,
    ]);
    if (listaPacientes.length === 0) {
      res.status(404).json("Paciente não encontrado!");
    } else {
      const dadosLimpos = listaPacientes.map((paciente) => {
        const { cpf, senha, telefone, historico, enderecoId, ...dadosRestantes } = paciente;
        return dadosRestantes;
      });
      res.status(200).json(dadosLimpos);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const criarPaciente = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pacienteData = req.body;

    const pacienteSanitizado: Paciente = sanitizacaoPaciente(pacienteData);
    await pacienteSchema.validate(pacienteSanitizado);

    let {
      cpf,
      nome,
      email,
      senha,
      estaAtivo,
      possuiPlanoSaude,
      endereco,
      telefone,
      planosSaude,
      imagemUrl,
      imagem,
      historico,
    } = pacienteSanitizado;

    if (!CPFValido(cpf)) {
      throw new AppError("CPF Inválido!");
    }

    const existePacienteComCPF = await AppDataSource.getRepository(
      Paciente
    ).findOne({
      where: { cpf },
    });
    if (existePacienteComCPF != null) {
      res.status(409).json({ message: "Já existe um paciente com esse CPF!" });
    }

    if (possuiPlanoSaude === true && planosSaude !== undefined) {
      // transforma array de numbers em array de strings com os nomes dos planos definidos no enum correspondente
      planosSaude = mapeiaPlano(planosSaude);
    }

    const senhaCriptografada = encryptPassword(senha);
    const paciente = new Paciente(
      cpf,
      nome,
      email,
      senhaCriptografada,
      telefone,
      planosSaude,
      estaAtivo,
      imagemUrl,
      imagem,
      historico
    );
    paciente.possuiPlanoSaude = possuiPlanoSaude;
    const enderecoPaciente = new Endereco();

    if (endereco !== undefined) {
      enderecoPaciente.cep = endereco.cep;
      enderecoPaciente.rua = endereco.rua;
      enderecoPaciente.estado = endereco.estado;
      enderecoPaciente.numero = endereco.numero;
      enderecoPaciente.complemento = endereco.complemento;

      paciente.endereco = enderecoPaciente;

      await AppDataSource.manager.save(Endereco, enderecoPaciente);
    }

    await AppDataSource.manager.save(Paciente, paciente);

    const { senha: _senha, cpf: _cpf, ...pacienteSemDadosSensiveis } = paciente;

    res.status(202).json(pacienteSemDadosSensiveis);
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(400).json({ message: error.message });
    } else {
      res.status(502).json({ "Paciente não foi criado": error });
      console.log(error);
    }
  }
};

export const exibeTodosPacientes = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tabelaPaciente = AppDataSource.getRepository(Paciente);
  const allPacientes = await tabelaPaciente.find({ relations: ["imagem"] });
  if (allPacientes.length === 0) {
    res.status(200).json([]);
  } else {
    res.status(200).json(allPacientes);
  }
};

export const lerPaciente = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const paciente = await AppDataSource.manager.findOne(Paciente, {
    where: { id },
    relations: {
      endereco: true,
      imagem: true,
    },
  });

  if (paciente === null) {
    res.status(404).json("Paciente não encontrado!");
  } else {
    res.status(200).json(paciente);
  }
};

export const listaConsultasPaciente = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const paciente = await AppDataSource.manager.findOne(Paciente, {
    where: { id },
  });
  if (paciente == null) {
    throw new AppError("Paciente não encontrado!", Status.NOT_FOUND);
  }
  const consultas = await AppDataSource.manager.find(Consulta, {
    where: { paciente: { id: paciente.id } },
  });

  const consultadasTratadas = consultas.map((consulta) => {
    return {
      id: consulta.id,
      data: consulta.data,
      desejaLembrete: consulta.desejaLembrete,
      lembretes: consulta.lembretes,
      especialista: consulta.especialista,
    };
  });

  return res.json(consultadasTratadas);
};

// update
export const atualizarPaciente = async (
  req: Request,
  res: Response
): Promise<void> => {
  let {
    nome,
    email,
    senha,
    estaAtivo,
    telefone,
    possuiPlanoSaude,
    planosSaude,
    cpf,
    imagemUrl,
    imagem,
    historico,
  } = req.body;

  const { id } = req.params;

  if (!CPFValido(cpf)) {
    throw new AppError("CPF Inválido!", Status.BAD_REQUEST);
  }

  if (possuiPlanoSaude === true && planosSaude !== undefined) {
    // transforma array de numbers em array de strings com os nomes dos planos definidos no enum correspondente
    planosSaude = mapeiaPlano(planosSaude);
  }

  try {
    const paciente = await AppDataSource.manager.findOne(Paciente, {
      where: { id },
      relations: ["endereco"],
    });

    if (paciente === null) {
      res.status(404).json("Paciente não encontrado!");
    } else {
      paciente.cpf = cpf;
      paciente.nome = nome;
      paciente.email = email;
      paciente.possuiPlanoSaude = possuiPlanoSaude;
      paciente.telefone = telefone;
      paciente.planosSaude = planosSaude;
      paciente.estaAtivo = estaAtivo;
      paciente.imagemUrl = imagemUrl;
      paciente.imagem = imagem;
      paciente.historico = historico;

      await AppDataSource.manager.save(Paciente, paciente);
      res.status(200).json(paciente);
    }
  } catch (error) {
    res.status(502).json("Paciente não foi atualizado!");
  }
};

export const atualizarEnderecoPaciente = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { cep, rua, numero, estado, complemento } = req.body;
  const paciente = await AppDataSource.manager.findOne(Paciente, {
    where: { id },
    relations: ["endereco"],
  });

  if (paciente === null) {
    res.status(404).json("Paciente não encontrado!");
  } else {
    if (paciente.endereco === null) {
      const endereco = new Endereco();
      endereco.cep = cep;
      endereco.rua = rua;
      endereco.estado = estado;
      endereco.numero = numero;
      endereco.complemento = complemento;

      paciente.endereco = endereco;

      await AppDataSource.manager.save(Endereco, endereco);
    } else {
      paciente.endereco.cep = cep;
      paciente.endereco.rua = rua;
      paciente.endereco.estado = estado;
      paciente.endereco.numero = numero;
      paciente.endereco.complemento = complemento;
    }

    await AppDataSource.manager.save(Paciente, paciente);

    res.status(200).json(paciente);
  }
};

// Não deleta o paciente, fica inativo
export const desativaPaciente = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const paciente = await AppDataSource.manager.findOne(Paciente, {
    where: { id },
  });

  if (paciente === null) {
    res.status(404).json("Paciente não encontrado!");
  } else {
    paciente.estaAtivo = false;
    // await AppDataSource.manager.save(Paciente, paciente)

    //! Caso deseje deletar o paciente, basta descomentar a linha abaixo
    await AppDataSource.manager.delete(Paciente, { id: paciente.id });
    res.json({
      message: "Paciente desativado!",
    });
  }
};
