const bcrypt = require('bcrypt');

export const hashedPassword = (password:string):string => {
    const hashed = bcrypt.hashSync(password, 10)
    return hashed
}

export const verifyPassowrd = (password:string, hashed:string):Promise<boolean> => new Promise((resolve, reject) => {
    bcrypt.compare(password, hashed, function(err:Error, result:boolean) {
        if(err) return reject(err)
        resolve(result)
    });
})