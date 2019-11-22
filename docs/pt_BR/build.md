# Build

Esta página também está disponível em [Japônes](https://github.com/BoostIO/Boostnote/blob/master/docs/jp/build.md), [Coreano](https://github.com/BoostIO/Boostnote/blob/master/docs/ko/build.md), [Russo](https://github.com/BoostIO/Boostnote/blob/master/docs/ru/build.md), [Chinês simplificado](https://github.com/BoostIO/Boostnote/blob/master/docs/zh_CN/build.md), [Francês](https://github.com/BoostIO/Boostnote/blob/master/docs/fr/build.md) e [Alemão](https://github.com/BoostIO/Boostnote/blob/master/docs/de/build.md).

## Ambiente

- npm: 6.x
- node: 8.x

## Desenvolvimento

Nós usamos o Webpack HMR para desenvolver o Boostnote.
Ao executar os seguintes comandos no diretório raiz do projeto, o Boostnote será iniciado com as configurações padrão.

Instala os pacotes necessários usando o yarn.

```
$ yarn
```

Gerar e iniciar.

```
$ yarn run dev
```

> ### Notice
>
> Existe alguns casos onde você precisa atualizar o app manualmente.
>
> 1. Quando editar um método construtor de um componente
> 2. Quando adicionar uma nova classe de css (similiar ao 1: a classe do css é reescrita por cada componente. Esse processo ocorre através do método construtor)

## Deploy

Nós usamos o Grunt para automatizar o desenvolvimento.
Você pode gerar o programa usando `grunt`. Contudo, nós não recomendamos isso porque a tarefa padrão inclui _codedesign_ e _authenticode_.

Então nós preparamos um _script_ separado, o qual somente cria um executável.

```
grunt pre-build
```

Você irá encontrar o executável na pasta `dist`. 

**Nota:** o atualizador automático não funciona porque o app não está certificado.

Se você achar isto necessário, você pode usar o _codesign_ ou o _authenticode_ com esse executável.

## Faça seus próprios pacotes de distribuição (deb, rpm)

Pacotes de distribuição são gerados através do comando `grunt build` em plataforma Linux (e.g. Ubuntu, Fedora).

**Nota:** você pode criar `.deb` e `.rpm` em um mesmo ambiente.

Depois de instalar uma versão suportada do `node` e do `npm`, deve-se instalar as dependências para gerar os pacotes.

Ubuntu/Debian:

```
$ sudo apt-get install -y rpm fakeroot
```

Fedora:

```
$ sudo dnf install -y dpkg dpkg-dev rpm-build fakeroot
```

Então execute `grunt build`.

```
$ grunt build
```

Você vai encontrar o `.deb` e o `.rpm` na pasta`dist`.
