
//an enum
interface Role {
    name: string,
    permissions: string[]
}

class Roles {
    static Admin:Role = {name: 'admin', permissions: []}
    static User:Role = {name: 'user', permissions: []}
    static ALL:Role = {name: 'all', permissions:['*']}
}

export default Roles
export {
    Role, Roles
}