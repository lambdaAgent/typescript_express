import { Role } from "../Token/Roles";

type MethodAndPermission = {
    method: string
    role: string
    permissions: string[]
}
export class RouteDetail {
    pathname: string
    methodPermissions: MethodAndPermission[] = [] // pathname, permissions

    constructor(pathname:string, method, role:Role){
        this[pathname] = pathname
        const {name:rolename, permissions} = role;
        const methodPermission = {method, role: rolename, permissions} as MethodAndPermission
        this.methodPermissions.push(methodPermission)
    }
}

export class PathDetailUtil {
    static pathDetail = {}
    static getRouteDetail(pathname){
        return this.pathDetail[pathname]
    }
    static registerRoute(pathname, method, role){
        if(!this.pathDetail.hasOwnProperty(pathname)){
            const routeDetail = new RouteDetail(pathname, method, role)
            this.pathDetail[pathname] = routeDetail
        } else {
            //if exists, update the route
            const {name:rolename, permissions} = role;
            const methodPermission = {method, role: rolename, permissions} as MethodAndPermission
            this.pathDetail[pathname].methodPermissions.push(methodPermission)
        }
    }
    static listRoute(){
        const header = 'pathname, methods, role, permissions'
        let body = '\n'
        Object.keys(this.pathDetail).forEach(pathname => {
            this.pathDetail[pathname].methodPermissions.forEach(methodPermission => {
                const {method, permissions, role} = methodPermission
                const row = `${pathname}, ${method}, ${role}, ${permissions}\n`
                body += row
            })
        })
        return header + body
    }
}

export default PathDetailUtil