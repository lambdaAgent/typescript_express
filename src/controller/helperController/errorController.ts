import { Response } from 'express'


export const error400 = (res:Response,message) => res.status(400).json({message})
export const errorContentType = (res:Response) => res.status(400).json({message: 'wrong content type'})
