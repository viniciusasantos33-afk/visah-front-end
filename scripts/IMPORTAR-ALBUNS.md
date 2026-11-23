# Importação em lote de álbuns

O script `import-albums.mjs` lê arquivos `.ts` ou `.txt` com blocos `export const nomeDoArtistaAlbums = [...]`, sem executar o código. Ele usa o `artistId` declarado em cada álbum, valida se ID e nome correspondem a um artista do backend e cadastra álbum e faixas pela API local. Também pode ser executado novamente: álbuns existentes são conferidos e faixas que faltarem são completadas. Sem `--file`, usa `albuns.ts` na raiz do projeto.

## Antes de importar

- Inicie o backend.
- Confira se os IDs em `albuns.ts` são os IDs do backend atual. Quando há ID, ele é a referência para associar o álbum; diferenças de nome entre a variável e o cadastro do backend são exibidas como aviso. Sem ID, o script tenta associar pelo nome.
- Cadastre no backend os gêneros e moods com os mesmos IDs usados em `albuns.ts`. O script valida todos esses IDs antes de enviar dados.
- As faixas entram com duração provisória de 3 minutos e sem arquivo de áudio. Assim elas aparecem no catálogo, mas não tocam até você associar um áudio autorizado.

## Prévia e execução no PowerShell

```powershell
node .\scripts\import-albums.mjs --preview
```

Confira a quantidade de álbuns, artistas e faixas. Depois, informe as credenciais do administrador sem colocar a senha no histórico do terminal e rode a importação:

```powershell
node .\scripts\import-albums.mjs
```

O terminal pede e-mail e senha; a senha é digitada sem aparecer. As faixas em `albuns.ts` carregam `genreId` e `moodId` próprios. `--genre` e `--mood` só são necessários como fallback para arquivos antigos com faixas no formato de lista de textos. Para uma API em outro endereço, use `--api http://localhost:5291` ou defina `VISAH_API_URL`.

## Capas

Como o arquivo aponta para imagens que não estão na pasta, o script cria capas SVG provisórias com cores e textos do artista/álbum em `public/albums-imported` e grava os caminhos no banco. Depois você pode substituir as capas pela tela de administração.

Uma API pública pode fornecer imagens sem exigir login, mas isso não torna a capa livre para qualquer uso. A API de busca da Apple, por exemplo, limita o uso de arte promocional a páginas que promovem o conteúdo na loja e exige proximidade com um selo/link da loja. Por isso, o script não copia capas automaticamente. Para publicar, use capas próprias/licenciadas ou uma fonte cujos termos permitam claramente esse uso.
