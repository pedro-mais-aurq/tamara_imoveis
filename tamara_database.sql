create DATABASE tamara_imoveis;
use tamara_imoveis;

create table imoveis(
id int auto_increment not null primary key,
codigo varchar(20) unique,
titulo varchar(250),
slug varchar(100) unique,
descricao text not null,
tipo ENUM ('apartamento',
'cobertura',
'casa', 
'lote',
'comercial') Not Null,
status ENUM (
'disponivel',
'reservado',
'vendido',
'alugado') NOT NULL,
finalidade ENUM (
'venda',
'aluguel'),
preco decimal(10, 2) not null,
condominio decimal(10, 2),
iptu decimal(10, 2) not null,
area_privativa decimal(8, 2),
area_total int,
quartos int not null,
vagas int default 0,
suites int default 0,
andar int default 0,
banheiros int not null,
ano_construcao year,
mobiliado boolean not null default FALSE,
aceita_financiamento boolean not null default FALSE,
aceita_permuta boolean not null default FALSE,
destaque boolean not null default FALSE,
bairro_id int,
foreign key (bairro_id) references bairro(id), 
created_at datetime default current_timestamp,
updated_at datetime default current_timestamp ON update current_timestamp);

create table bairro (
id int auto_increment not null primary key,
nome varchar(100) not null,
cidade varchar(100) not null,
estado char(2) not null,
slug varchar(100) unique not null,
descricao text,
imagem varchar(255),
created_at datetime default current_timestamp,
updated_at datetime default current_timestamp ON update current_timestamp);
