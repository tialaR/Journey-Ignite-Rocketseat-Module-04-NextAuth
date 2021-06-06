import axios, { AxiosError } from 'axios';
import { request } from 'http';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../context/AuthContext';
import { AuthTokenError } from '../errors/AuthTokenError';

//Variavel q/ identifica se o token está sendo atualizando ou não
let isRefreshing = false;
//Fila de todas as requisições que aconteceram e q/ deram falha por causa do token expirado
let failedRequestQueue = [];

export function setupApiClient(ctx = undefined) {
    //parseCookies -> devolve uma lista de todos os cookies q/ tenho salvo
    let cookies = parseCookies(ctx);

    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
            /* 
                Adicionando cabeçalho de autenticação para todas as requisições da aplicação
                quando o usuário já está autenticado.
                Setando os headers default - headers que virão configurados desde o primeiro
                momento da inicialização da aplicação.
            */
        }
    });

    // Lógica de Refresh Token
    /* Quem devolve a informação de um token caso ele esteja expirado ou não é o back-end
        então para que o front tome conhecimento disso eu preciso interceptar a resposta
        do back-end para então realizar algum tipo de ação */
    api.interceptors.response.use(response => {
        return response;
    }, (error: AxiosError) => {
        //Erro 401 - Erro de autenticação
        if (error.response.status === 401) {

            //Processo de refresh token:
            if(error.response.data?.code === 'token.expired') {
                //Renovar token
                cookies = parseCookies(ctx);
                // O interceptador pode ser executado várias vezes durante a sessão do usuário, por isso é necessário atualizar o valor dos cookies
                
                //Recuperando cookie da aplicação
                const { 'nextauth.refreshToken': refreshToken } = cookies;

                /* config -> É toda a configiração da requisição q/ foi realizada p/ o back-end
                    Dentro do config terá todas as informações necessárias p/ repetir uma requisição
                    para o back-end (rotas chamadas, parametros enviados, qual era o callback, etc...)*/
                const originalConfig = error.config;

                /* 
                    Definindo que a requisição de refresh do token só vai acontecer
                    uma única vez independente de quantas chamadas a api aconteçam ao mesmo
                    tempo enquanto o token não está válido - Evita que resisições com o token
                    expirado deixem de ser realizadas novamente
                */
                if(!isRefreshing) {
                    isRefreshing = true;

                    //Refresh token (renovar token)
                    api.post('/refresh', {
                        refreshToken
                    }).then(response => {
                        const { token } = response.data;

                        //Salvando novo token  e refreshToken nos cookies
                        //Usando a biblioteca "nookie" p/ salvar informações do usuário nos cookies toda vez que ele realiza a autenticação
                        setCookie(ctx, 'nextauth.token', token, {
                            maxAge: 60 * 60 * 24 * 30, //1 mês - Qto tempo quero manter esse cookie salvo no navegador (não é responsábilidade do front remover um token dos cookies se ele expirar e sim do back-end realizar o refresh desse token caso ele espire)
                            path: '/', //Caminhos da aplicação q/ terão acesso aos cookies ("/" especifica q/ qualuqer endereço conseguirá ter acesso aos cookies)
                        });
                        setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                            maxAge: 60 * 60 * 24 * 30, //1 mês 
                            path: '/',
                        });

                        //Atualizando token JWT que está sendo enviado nas requisições a api
                        api.defaults.headers['Authorization'] = `Bearer ${token}`;

                        failedRequestQueue.forEach(request => request.onSucces(token));
                        failedRequestQueue = [];
                    }).catch(err => {
                        failedRequestQueue.forEach(request => request.onFalure(err));
                        failedRequestQueue = [];

                        //Executando signOut somente qdo estou do lado do browser
                        //Retira a autenticação do usuário caso ele esteja no browser
                        //Deslogar usuário e devolver para home
                        if (process.browser) {
                            signOut();
                        }
                    }).finally(() => {
                        isRefreshing = false;
                    });
                } 

                //Else - Token em estado de atualização
                return new Promise((resolve, reject) => {
                    failedRequestQueue.push({
                        onSucces: (token: string) => { //Qdo o processo de refresh token da certo
                            originalConfig.headers['Authorization'] = `Bearer ${token}`;

                            //Realizando uma chamada a api novamente c/ o token atualizado
                            resolve(api(originalConfig));
                        }, 
                        onFalure: (error: AxiosError) => { //Qdo o processo de refresh token da errado
                            reject(error);
                        }, 
                    });
                });
            } else {
                /* Deslogar usuário - caso não seja um erro de token expirado 
                (seja qualquer outro erro de 401 - não autorizado - o usuário está 
                tentando acessar alguma coisa que ele não deveria acessar) */

                //Executando signOut somente qdo estou do lado do browser
                //Retira a autenticação do usuário caso ele esteja no browser
                //Deslogar usuário e devolver para home
                if (process.browser) {
                    signOut();
                } else {
                    //Código executado quando estou do lado do servidor next
                    return Promise.reject(new AuthTokenError());
                }
            }
        }

        /* Caso o interceptor não caia em nenhuma das condições dos ifs devo 
        deixar que erro q/ aconteceu continue acontecendo para que as proprias 
        chamadas consigam tratar daquele erro nos seus catchs */
        return Promise.reject(error);
    });
    /* Interceptors (funcionalidade do axios) -> Permite a interceptação de 
        requisições e respostas.
        Interceptar requisições -> Quer dizer que quero executar algum código 
        antes de alguma requisição ser feita para o back-end
        Interceptar respostas -> Quer dizer que quero fazer algum tipo de funcionalidade
        depois de receber alguma resposta do back-end */

    return api;
}