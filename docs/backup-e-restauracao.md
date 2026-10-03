# Procedimento de backup e restauração — RecebeAi

**Uso interno.** Revisar e executar por uma pessoa autorizada. Este roteiro não substitui o procedimento de resposta a incidentes nem garante RPO/RTO ainda não contratados.

## Escopo e limites

- O banco PostgreSQL do Supabase contém os dados operacionais do RecebeAi. O projeto está hospedado no Supabase e o frontend/API na Vercel.
- Backups do banco não incluem os objetos armazenados pelo Supabase Storage. Se Storage for usado, os arquivos precisam de rotina de backup própria.
- A aplicação mantém dados fictícios de demonstração no navegador; isso não é um backup dos dados da empresa.
- A retenção de backup depende do plano Supabase. A documentação atual informa backups diários automáticos para planos Pro, Team e Enterprise, com retenções diferentes por plano. Confirme plano, política e disponibilidade no painel antes de contar com essa cobertura. PITR é um adicional e também deve ser confirmado no projeto.
- Migrations versionadas em `supabase/migrations` descrevem o schema, mas não substituem cópia dos dados.
- Definir e registrar antes do lançamento: responsável titular e substituto, periodicidade de exportações independentes, local de armazenamento cifrado, RPO (perda máxima tolerável) e RTO (tempo máximo para recuperar).

## Retenção após encerramento de conta

Aplicar os prazos publicados na Política de Privacidade:

- Manter os dados operacionais enquanto a conta estiver ativa.
- Disponibilizar, mediante solicitação do titular da conta, uma exportação durante os 30 dias após o encerramento. Conferir o escopo e entregar por canal seguro, sem incluir credenciais ou segredos.
- Excluir ou anonimizar dados da conta e dados operacionais identificáveis dos sistemas ativos em até 90 dias após o encerramento, exceto os dados sujeitos a retenção legal, prevenção a fraude ou exercício regular de direitos.
- Manter registros de suporte por até 2 anos após o encerramento do chamado e documentos fiscais/transacionais pelo prazo legal aplicável.
- Backups gerenciados seguem a retenção efetivamente configurada pelo provedor e expiram de forma rotativa; não prometer eliminação imediata de cópias de backup. Se uma restauração trouxer de volta dados com solicitação de exclusão pendente, reaplicar a exclusão após validar a recuperação.
- Para exportações independentes deste runbook, manter cópias cifradas por até 30 dias após a verificação de integridade, salvo retenção legal ou investigação de incidente; eliminar cópias expiradas de forma segura e registrar a execução sem registrar os dados exportados.

Pedidos de exportação ou exclusão devem ser autenticados, registrados com data, escopo e responsável, e concluídos dentro dos prazos acima. Antes da exclusão, verificar se existe obrigação legal ou necessidade documentada de preservação.

## A. Conferência de backups automáticos

1. Entre no projeto correto no Supabase Dashboard.
2. Abra **Database → Backups** (ou **Database → Backups → Scheduled backups**, conforme a interface).
3. Confirme a data/hora do backup mais recente, o período de retenção e se a restauração está disponível.
4. Registre a verificação no controle operacional sem incluir credenciais.
5. Antes de uma migration de risco, alteração de plano ou intervenção estrutural, confirme que há um ponto de recuperação recente. Se não houver, adie a intervenção e faça uma exportação independente.

## B. Exportação lógica independente

Fazer pelo menos antes de cada intervenção relevante e na periodicidade aprovada pelo responsável:

1. Em estação administrativa confiável, atualize o Supabase CLI. Use a referência do CLI para o comando `supabase db dump`.
2. Vincule o CLI ao projeto Supabase correto com `supabase link` usando um token de acesso restrito. Confirme o `project ref` antes de exportar.
3. Execute `supabase db dump -f <caminho-fora-do-repositorio>\schema.sql` para exportar o schema incluído pelo CLI.
4. Execute `supabase db dump --data-only -f <caminho-fora-do-repositorio>\dados.sql` para exportar os dados incluídos pelo CLI. Use caminhos reais e timestamp UTC; não salve as saídas dentro do repositório.
5. A saída padrão do Supabase CLI exclui schemas gerenciados como `auth`, `storage` e schemas de extensões; o dump padrão é de schema e não inclui linhas. Mesmo schema + `--data-only` não é um backup integral restaurável do projeto e não substitui os backups gerenciados do Supabase. Verifique a versão do CLI e seus avisos.
6. Armazene cada arquivo em armazenamento cifrado, com acesso restrito e MFA. Nomeie com projeto, data UTC e tipo de cópia; nunca inclua senhas ou connection strings no nome ou nos metadados.
7. Registre data, operador, tamanho, resultado e hash SHA-256 dos arquivos. Não registre tokens ou credenciais.
8. Verifique a integridade por tamanho/hash e faça periodicamente um ensaio usando os backups oficiais em projeto Supabase separado, nunca sobre produção.
9. Aplique uma regra de retenção documentada e elimine cópias expiradas de modo seguro.

O CLI usa um container para executar `pg_dump`; uma exportação pode precisar de privilégios de banco e não reproduz todas as configurações gerenciadas externas ao PostgreSQL. Não considere as exportações lógicas acima suficientes para recuperação completa.

## C. Recuperação de backup automático do Supabase

> Restaurar pode deixar o projeto indisponível e descartar alterações feitas depois do ponto escolhido. Faça uma janela de manutenção e obtenha aprovação explícita antes de confirmar.

1. Abra incidente, indique um responsável e registre a hora de detecção e o último momento em que os dados eram conhecidos como íntegros.
2. Avise os usuários afetados e suspenda novas gravações por procedimento operacional aprovado. Não tente alterar policies ou chaves para simular manutenção.
3. No Dashboard do projeto correto, abra **Database → Backups** e identifique um backup anterior ao incidente. Confira cuidadosamente projeto, data/hora e fuso.
4. Selecione a restauração e leia a confirmação do painel. Confirme somente após aprovação do responsável e entendimento da perda potencial de dados posteriores.
5. Aguarde a conclusão e a mensagem de sucesso do Supabase. Não faça deploy de migrations concorrente durante a restauração.
6. Verifique saúde do projeto e do banco; autenticação; migrations; policies RLS; constraints; criação e leitura de fixtures de teste; APIs essenciais; pagamentos/webhooks sem reenviar eventos antigos indevidamente.
7. Se houver roles próprios, redefina suas senhas quando necessário: backups automáticos podem não incluir senhas de roles customizados.
8. Se o projeto usa Storage, recupere separadamente os objetos da cópia correspondente e valide a integridade dos arquivos. O backup do banco cobre metadados, não o conteúdo binário dos objetos.
9. Reabra gravações apenas após aprovação e teste funcional; informe usuários e registre duração, perda de dados, verificações e ações pendentes.
10. Depois, faça uma análise de causa-raiz e atualize este procedimento.

## D. Recuperação pontual (PITR)

Use apenas se PITR estiver habilitado e disponível no plano/projeto. No Dashboard, confirme o horário-alvo, o fuso, a cobertura de WAL e a janela de manutenção. PITR também pode sobrescrever estado posterior e causar indisponibilidade; aplique as mesmas aprovações, validações e comunicação da seção C. Não execute chamadas de restauração por API/CLI sem procedimento aprovado e conferência independente do `project ref` e do horário UTC.

## E. Ensaio de restauração

1. Use um projeto de recuperação separado, com acesso restrito e sem domínio de produção.
2. Restaure uma cópia recente ou aplique migrations e os dados sintéticos de teste.
3. Execute o teste de isolamento entre duas empresas (`supabase/tests/tenant_isolation.sql`) e os testes/build da aplicação.
4. Verifique funções críticas, autenticação, importações/exportações e relatórios.
5. Apague o projeto de ensaio apenas após aprovação, observando retenção e necessidade de evidências.
6. Registre resultado, duração, divergências e correções; repita após alterações relevantes no esquema ou infraestrutura.

## Checklist antes de usar dados reais

- [ ] Confirmar os backups automáticos e retenção do plano atual no painel Supabase.
- [ ] Definir responsáveis, canal de incidentes, periodicidade de exportação, RPO e RTO; cumprir os prazos de retenção desta seção.
- [ ] Configurar uma cópia independente cifrada e fora do repositório.
- [ ] Completar um ensaio documentado de restauração em projeto separado.
- [ ] Validar o isolamento com duas contas independentes em teste controlado, sem dados reais de terceiros.
- [ ] Definir rotina própria para arquivos se Supabase Storage for habilitado.

## Referências operacionais

- [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase CLI — `db dump`](https://supabase.com/docs/reference/cli/supabase-db-dump)
- Teste local de isolamento: [`supabase/tests/tenant_isolation.sql`](../supabase/tests/tenant_isolation.sql)
