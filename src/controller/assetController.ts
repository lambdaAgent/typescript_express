import { Router, Request, Response } from 'express';
import authorizeUser, { validateToken } from './helperController/authorizeUser';
import PathDetailUtil from '../utils/PathDetail';
import Roles from '../Token/Roles';

const router:Router = Router()
const url = '/assets'

const getAssetUrl = `${url}/get`
PathDetailUtil.registerRoute(getAssetUrl, 'post', Roles.User)
router.post(getAssetUrl, validateToken, authorizeUser(getAssetUrl),
(req:Request, res: Response, next) => {
    //find and check if user is the owner of the asset
    const 
})

const addAssetUrl = `${url}/add`
PathDetailUtil.registerRoute(addAssetUrl, 'post', Roles.User)
router.post(addAssetUrl, validateToken, authorizeUser(addAssetUrl),
(req:Request, res:Response, next) => {
    //find and check if user is the owner of the asset

})

const editAssetUrl = `${url}/edit`
PathDetailUtil.registerRoute(editAssetUrl, 'post', Roles.User)
router.post(editAssetUrl, validateToken, authorizeUser(editAssetUrl), 
(req:Request, res:Response, next) => {

})

// update isDelete instead of deleting
const deleteAssetUrl = `${url}/delete`
PathDetailUtil.registerRoute(deleteAssetUrl, 'delete', Roles.User)
router.delete(deleteAssetUrl, validateToken, authorizeUser(deleteAssetUrl), 
(req:Request, res:Response, next) => {

})


export default router