export default function constructObjectFromRefUrl (refUrl:string):Object{
    let obj = {};
    refUrl.split('/').forEach((pathname, index) => {
        if(pathname.startsWith(':')){
            obj[pathname.substr(1)] = index-1;
        }
    })
 
    return obj;
}
