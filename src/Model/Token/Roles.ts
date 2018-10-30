
//an enum
interface Role {
    name: string,
    roles: string[]
}

class Roles {
    static Admin:Role = {name: 'admin', roles: []}
}

export default Roles
export {
    Role, Roles
}