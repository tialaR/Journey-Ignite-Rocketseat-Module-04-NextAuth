type User = {
    permissions: string[];
    roles: string [];
}

type ValidateUSerPermissionsParams = {
    user: User;
    permissions?: string[];
    roles?: string [];
}

export function validateUserPermissions({
    user,
    permissions,
    roles,
}: ValidateUSerPermissionsParams) {
    //Caso o usuário esteja autenticado:

    //Caso exista alguma permisão
    if (permissions?.length > 0) {
        //Verificando se o usuário tem todas as permisões
        //every -> Retorna true caso todas as condições da função estiverem satisfeitas
        const hasAllPermisions = permissions.every(permision => {
            return user.permissions.includes(permision);
        });

        if(!hasAllPermisions) {
            return false;
        }
    }

    //Caso exista alguma role
    if (roles?.length > 0) {
        //Verificando se o usuário tem todas as roles
        //every -> Retorna true caso pelo menos uma das condições da função estiver satisfeita
        const hasAllRoles = roles.some(role => {
            return user.roles.includes(role);
        });

        if(!hasAllRoles) {
            return false;
        }
    }

     //Caso passe por todas as condições o usuário terá permisão
     return true;
}