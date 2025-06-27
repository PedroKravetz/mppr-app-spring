# Versão do NodeJS

- Nesse projeto estamos usando a versão **16.0.0** do NodeJS

# Iniciando o projeto

## Executar o docker-compose
- Será feito a subida do Redis e do MySQL

``` 
docker compose up -d 
```

- Acesse o terminal do MySQL através do container
1) 
``` 
mysql -uroot -p12345 
```
2) 
``` 
use testemed; 
```
3) Insira os os pacientes: 
``` 
INSERT INTO paciente (id, cpf, nome, email, estaAtivo, senha, telefone, possuiPlanoSaude, planosSaude, historico, imagemUrl, role)
VALUES 
  (uuid(), '78160552002', 'Emerson Laranja', 'emerson@email.com', true, 'Senh@forte123', '34999335522', true, '[2]', "['sinusite,moderado']", 'https://img.freepik.com/fotos-gratis/designer-trabalhando-no-modelo-3d_23-2149371896.jpg', 'PACIENTE'),
  (uuid(), '12345678904', 'Joana Silva', 'joana@email.com', true, 'MinhaSenha123', '34999887766', true, '[1, 3]', "['rinite,leve', 'asma,médio']", 'https://img.freepik.com/fotos-premium/retrato-de-uma-jovem-brasileira-sorridente-em-um-vestido-mexicano-ai-gerado_632984-139.jpg', 'PACIENTE');
```

## Crie o arquivo .env

```
DB_TYPE="mysql"
DB_HOST="localhost"
DB_PORT=3307
DB_USER=root
DB_PASSWORD=12345
DB_DATABASE=testemed
SERVER_PORT=3000
SECRET_JWT=qualquercoisa
SECRET_KEY_CRYPTO=senha32bits
```

## Executar a aplicação através do terminal
```
npm install
```

```
npm start
```

## Acessar o Postman ou Insomnia
Exportar as chamadas de API através do link: https://cdn3.gnarususercontent.com.br/3156-desenvolvimento-seguro/Insomnia_VollMed.json

Você pode abrir o navegador e acessar o endereço: http://localhost:3000/paciente
Deverá ser apresentado dois pacientes.