import { setupApiClient } from './api';

export const api = setupApiClient();

/* Quando eu for chamar a api a partir do cliente eu vou usar o objeto 'api' para 
não precisar declarar 'setupApiClient' em todo lugar do código q/ eu precisar usar api.
Porém quando eu for usar ela no servidor eu vou chamar o método setupApiClient novamente 
podrém passando o contexto como parâmetro.
Assim terei 2 comportamentos diferentes a depender de que local estou rodando a minha 
aplicação (servidor ou cliente) */