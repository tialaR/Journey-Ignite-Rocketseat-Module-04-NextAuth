import { ReactNode } from "react";
import { useCan } from "../hooks/useCan";

interface CanProps {
    children: ReactNode;
    permissions?: string[];
    roles?: string[];
}

/* Componente que vai encapsular outro componente e determinar 
se ele poderá ser mostrado para o usuário ou não de acordo com suas permisões */

export function Can({ children, permissions, roles }: CanProps) {
    const userCanSeeComponent = useCan({ permissions, roles });

    if(!userCanSeeComponent) {
        return null;
    }

    return(
        <>
            {children}
        </>
    );
}