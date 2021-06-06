import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../errors/AuthTokenError";
import decode from 'jwt-decode';
import { validateUserPermissions } from "./validateUserPermissions";

type WithSSAuthOptions = {
    permissions?: string[];
    roles: string[];
}

/* 
    VALIDANDO NÃO VISITANTE:
    Função q/ determina as páginas q/ poderão ser acessadas se o usuário estiver logado 
*/

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSAuthOptions) {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        //console.log(ctx.req.cookies);

        /* ctx = contexto -> É possível recuperar os cookies salvos através do contexto da requisição da aplicação next (GetServerSideContext)*/
        const cookies = parseCookies(ctx);
        const token = cookies['nextauth.token'];

        if(!cookies['nextauth.token']) {
            //Caso não exista o cookie 'nextauth.token' salvo nos cookies direciono o usuário p/ a página de login
            return {
                redirect: {
                    destination: '/',
                    permanent: false, //Dizendo p/ o browser q/ não é um redirecionamento permanente (q/ esse redirecionamento só vai acontecer dessa vez)
                }
            }
        }

        if (options) {
            //Só acontece se o usuário tiver enviado alguma opção de permisão para ser validado
            const user = decode<{ permissions: string[], roles: string[] }>(token);
            const { permissions, roles } = options;
            const userHasValidPermissions = validateUserPermissions({
                user,
                permissions,
                roles,
            });

            //Caso o usuário não tenha permisões válidas p/ acessar determinada página redirecionar p/ alguma página q todos usuários tem permisão p acessar
            if(!userHasValidPermissions) {
                return {
                    redirect: {
                        destination: '/dashboard',
                        permanent: false,
                    }
                }
            }
        }

        try {
            //Caso não exista o cookie 'nextauth.token' salvo nos cookies vou executar a função original (getServerSideProps)
            return await fn(ctx);
        } catch(err) {
            if (err instanceof AuthTokenError) {
                destroyCookie(ctx, 'nextauth.token');
                destroyCookie(ctx, 'nextauth.refreshToken');
        
                return {
                    redirect: {
                        destination: '/',
                        permanent: false,
                    }
                }
            }
        }
    }
}
