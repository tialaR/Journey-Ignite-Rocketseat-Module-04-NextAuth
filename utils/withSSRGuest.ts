import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies } from "nookies";

/* 
    VALIDANDO VISITANTE:
    Função q/ determina as páginas q/ poderão ser acessadas se o usuário não estiver logado 
*/

export function withSSRGuest<P>(fn: GetServerSideProps<P>) {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        //console.log(ctx.req.cookies);

        /* ctx = contexto -> É possível recuperar os cookies salvos através do contexto da requisição da aplicação next (GetServerSideContext)*/
        const cookies = parseCookies(ctx);

        if(cookies['nextauth.token']) {
            //Caso exista o cookie 'nextauth.token' salvo nos cookies direciono o usuário p/ a página dashboard
            return {
                redirect: {
                    destination: '/dashboard',
                    permanent: false, //Dizendo p/ o browser q/ não é um redirecionamento permanente (q/ esse redirecionamento só vai acontecer dessa vez)
                }
            }
        }

        //Caso não exista o cookie 'nextauth.token' salvo nos cookies vou executar a função original (getServerSideProps)
        return await fn(ctx);
    }
}
