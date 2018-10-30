import { Router, Request, Response } from 'express';
import { TokenUtil } from '../Token/Token';
import PathDetailUtil from '../utils/PathDetail';
import Roles from '../Token/Roles';
const config = require('config')
const algorithm = 'aes-256-ctr';
const passwordForBody = config.token.passwordForBody


const router: Router = Router();

PathDetailUtil.registerRoute('/decryptDataToken/:dataToken', 'get', Roles.ALL)
router.get('/decryptDataToken/:dataToken', (req: Request, res: Response) => {
    const dataToken = req.params.dataToken
    const decryptedToken = TokenUtil.decrypt(dataToken, passwordForBody)
    res.send(decryptedToken)
});

PathDetailUtil.registerRoute('/routes', 'post', Roles.ALL)
router.get('/routes', (_: Request, res: Response) => {
    res.set('Content-Type', 'text/csv');
    res.send(PathDetailUtil.listRoute())
});

export default router