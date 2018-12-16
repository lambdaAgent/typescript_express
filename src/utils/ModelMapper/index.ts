import { Sequelize } from 'sequelize-typescript';
export default class ServiceMapper{
    static of(Model:any){
       Model.findByCriteria = () => {
           
       }
    }
}


