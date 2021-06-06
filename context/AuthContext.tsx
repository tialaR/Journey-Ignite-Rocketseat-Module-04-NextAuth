import Router from 'next/router';
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { api } from '../services/apiClient';

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn: (credentials: SignInCredentials) => Promise<void>;
    signOut: () => void;
    user: User;
    isAuthenticated: boolean;
}

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;
/* BroadcastChannel -> Serve p/ quando queremos realizar uma comunicação entre as 
abas de nossa aplicação. Ou seja, ter algum tipo de informação indo e vindo (de um lado 
para o outro) */

//Deslogar usuário e devolver para home
export function signOut() {
    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshToken');

    authChannel.postMessage('signOut');

    Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
    const[user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    //Fazendo as telas da aplicação deslogarem sozinhas quando estão abertas em outras abas do navegador 
    useEffect(() => {
        authChannel = new BroadcastChannel('auth');

        authChannel.onmessage = (message) => {
            switch (message.data) {
                case 'signOut':
                    signOut();
                    break;
                default: 
                    break;
            }
        }
    }, [authChannel]);

    /* 
        Toda vez q/ o usuário acessar a aplicação pela primeira vez devo carregar
        a informação do usuário novamente 
    */
    /* 
        Recarregando a informações do usuário toda vez q/ ele acessar a página da 
        aplicação pela primeira vez. 
        Isso gera uma requisição a mais toda vez que o usuário acessa
        a aplicação. Mas será garantido que a aplicação tenha as permisões e roles dos usuários
        atualizadas sempre que ele acessa a aplicação (será usado o token salvo nos cookies
        para realizar uma nova requisição em busca dessas informações)
    */
    useEffect(() => {
        /* Buscar o token e realizar uma requisição para o back-end e guardar as informações 
        do usuário que forem buscadas de dentro dessa api */
        const { 'nextauth.token': token } = parseCookies(); //parseCookies -> devolve uma lista de todos os cookies q/ tenho salvo
   
        //Caso tenha o token da aplicação salvo no storage
        if(token) {
            //Realizar uma requisição em busca das informações do usuário logado (token será enviado pelo header da requisição)
            //A rota 'me' precisa do token para devolver as informações do usuário logado
            api.get('/me').then(response =>{ 
                const { email, permissions, roles } = response.data;
                //Preenchendo novamente a variavel user qdo a aplicação for recarregada(F5)
                setUser({
                    email,
                    permissions,
                    roles,
                });
            }).catch(() => {
                /* Cai nesse catch quando acontece um erro nessa chamada quando não for um erro de 
                refresh token (os erros de refresh token já estão sendo tratados pelo interceptor do Axios) */
                //Cai aqui quando ocorrer qualquer outro tipo de erro q/ não seja de refresh do token
                
                //Deslogar usuário e devolver para home
                signOut();
            }); 
        }
    }, []);

    //Autenticação do usuário
    //Esse método sempre ocorrerá pelo lado do browser, pois depende de uma ação do usuário (nunca será server side)
    async function signIn({ email, password }: SignInCredentials) {
        try {
            //Autenticação
            const response = await api.post('sessions', {
                email,
                password,
            });

            const { token, refreshToken, permissions, roles } = response.data;

            //Usando a biblioteca "nookie" p/ salvar informações do usuário nos cookies toda vez que ele realiza a autenticação
            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, //1 mês - Qto tempo quero manter esse cookie salvo no navegador (não é responsábilidade do front remover um token dos cookies se ele expirar e sim do back-end realizar o refresh desse token caso ele espire)
                path: '/', //Caminhos da aplicação q/ terão acesso aos cookies ("/" especifica q/ qualuqer endereço conseguirá ter acesso aos cookies)
            });
            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, //1 mês 
                path: '/',
            });
    
            //Salvando informações do usuário no contexto
            setUser({
                email,
                permissions,
                roles,
            });

            //Atualizando header de autorização de todas as requisições quando o usuário entra deslogado pela primeira vez na aplicação
            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            //Redirecionando usuário p/ outra rota
            Router.push('/dashboard');
        } catch (err) {
            console.log(err);
        }
    }

    return(
        <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    );
}
