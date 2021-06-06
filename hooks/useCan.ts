/* Retorna se o usuário pode ou não pode fazer alguma coisa
    Verifica se o usuário tem determinadas permisões ou roles
*/

import { useContext } from "react"
import { AuthContext } from "../context/AuthContext";
import { validateUserPermissions } from "../utils/validateUserPermissions";

type UseCanParams = {
    permissions?: string[];
    roles?: string[];
}

export function useCan({ permissions, roles }: UseCanParams) {
    const { user, isAuthenticated } = useContext(AuthContext);

    //Verificando se o usuário está autenticado
    if(!isAuthenticated) {
        return false;
    }

    const userHasValidPermissions = validateUserPermissions({
        user,
        permissions,
        roles,
    })
    
    //Retorna se o usuário tem permisão ou não p/ acessar uma determinada página da aplicação
    return userHasValidPermissions;
}