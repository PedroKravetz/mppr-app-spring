/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type Request, type Response } from 'express'
import { AppDataSource } from '../data-source.js'
import { Paciente } from './pacienteEntity.js'
import { AppError, Status } from '../error/ErrorHandler.js'
import { Imagem } from '../imagem/imagemEntity.js'
import { unlinkSync } from 'node:fs'
import { extname, resolve, dirname } from 'path'
import mime from 'mime-types';
import { lookup } from 'node:dns'
import fs from 'fs';

const __filename = import.meta.url.substring(7)
const __dirname = dirname(__filename)

export const criaImagem = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params

    const paciente = await AppDataSource.manager.findOne(Paciente, {
      where: { id },
      relations: {
        imagem: true
      }
    })
    if (paciente == null) {
      return res.status(400).json({ error: 'Paciente não encontrado' })
    }

    if (paciente.imagem != null) {
      throw new AppError('Este paciente já possui uma imagem', Status.BAD_REQUEST)
    }

    if (!req.file) {
      throw new AppError('Arquivo de imagem não fornecido', Status.BAD_REQUEST);
    }

    console.log(req.file)
    const { originalname: nome, size: tamanho, filename: key, url = '' } = req.file

    const acceptedMimeTypes = ['image/jpeg', 'image/png']
    const maxSize = 20 * 1024 * 1024 //20MB

    const ext = extname(req.file.originalname).slice(1).toLocaleLowerCase();
    const mimetype = mime.lookup(ext);

    if(!mimetype || !acceptedMimeTypes.includes(mimetype)){
      return res.status(400).json({ error: 'Insira uma imagem válida.' })
    }

    const imageContent = fs.readFileSync(req.file.path, 'utf8');

    if(/\<script[\s\S]*?\>/s.test(imageContent)){
      return res.status(400).json({ error: 'Imagem contém scripts não permitidos!' })
    }

    if(tamanho > maxSize) {
      return res.status(400).json({ error: 'Imagem excede o tamanho permitido!' })
    }
    
    const imagem = new Imagem()

    imagem.nome = nome
    imagem.tamanho = tamanho
    imagem.key = key
    imagem.url = url

    await AppDataSource.manager.save(Imagem, imagem)

    if (imagem.url === '') {
      imagem.url = resolve(__dirname, ".." , ".." ,"tmp", "uploads", key)
    }

    paciente.imagem = imagem
    await AppDataSource.manager.save(Paciente, paciente)

    const {url: _url, ...imagemSemCaminho} = imagem;

    return res.json(imagemSemCaminho)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

export const listaImagemPaciente = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params
  const paciente = await AppDataSource.manager.findOne(Paciente, {
    where: { id },
    relations: {
      imagem: true
    }
  })
  if (paciente == null) {
    throw new AppError('Paciente não encontrado ou não possui imagem', Status.NOT_FOUND)
  }
  return res.json(paciente.imagem)
}

export const destroiImagem = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { pacienteId } = req.params
    const paciente = await AppDataSource.manager.findOne(Paciente, {
      where: { id: pacienteId },
      relations: {
        imagem: true
      }
    })

    if (paciente == null) {
      return res.status(400).json({ error: 'Paciente não encontrado' })
    }

    const imagem = paciente.imagem
    if (!imagem) {
      return res.status(400).json({ error: "Image doesn't exist" })
    }

    unlinkSync(
      resolve(
        __dirname,
        '..',
        '..',
        'tmp',
        'uploads',
          `${imagem.key}`
      )
    )

    await AppDataSource.manager.delete(Imagem, imagem)

    return res.json('Image deleted').status(200)
  } catch (error) {
    return res.status(404).json({ error: error.message })
  }
}
