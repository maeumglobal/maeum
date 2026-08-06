import { initClientChat } from './src/actions/chatActions';

async function test() {
  console.log('Testing initClientChat...');
  const res = await initClientChat({
    name: 'Teste',
    email: 'teste@teste.com',
    message: 'Hello World',
  });
  console.log('Result:', res);
}

test().catch(console.error);
