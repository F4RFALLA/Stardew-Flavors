import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import {
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';

import {
  CabecalhoComponent,
} from '../../components/cabecalho/cabecalho.component';

import {
  AutenticacaoService,
} from '../../services/autenticacao';

import {
  Comentario,
  Receita,
  ReceitasService,
} from '../../services/receitas';


@Component({
  selector: 'app-detalhes-receita',
  templateUrl: './detalhes-receita.page.html',
  styleUrls: ['./detalhes-receita.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonSpinner,
    CabecalhoComponent,
  ],
})
export class DetalhesReceitaPage {
  private readonly rota =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly receitasService =
    inject(ReceitasService);

  private readonly autenticacaoService =
    inject(AutenticacaoService);

  readonly estrelas = [
    1,
    2,
    3,
    4,
    5,
  ];

  receita: Receita | null = null;
  comentarios: Comentario[] = [];

  carregando = true;
  carregandoComentarios = false;
  alterandoFavorito = false;
  enviandoComentario = false;

  autenticado = false;
  administrador = false;

  nomeUsuarioAtual: string | null = null;

  textoComentario = '';
  notaComentario = 0;

  comentarioEmEdicaoId: number | null = null;
  textoEdicaoComentario = '';
  notaEdicaoComentario = 0;
  salvandoComentarioId: number | null = null;

  confirmandoExclusaoId: number | null = null;
  excluindoComentarioId: number | null = null;

  confirmandoExclusaoReceita = false;
  excluindoReceita = false;

  mensagemErro = '';

  mensagemAcao = '';
  mensagemAcaoErro = false;

  mensagemErroComentarios = '';

  mensagemComentario = '';
  mensagemComentarioErro = false;

  mensagemGerenciamentoComentario = '';
  mensagemGerenciamentoErro = false;

  mensagemGerenciamentoReceita = '';
  mensagemGerenciamentoReceitaErro = false;

  async ionViewWillEnter():
    Promise<void> {
    this.autenticado =
      await this.autenticacaoService
        .estaAutenticado();

    if (this.autenticado) {
      const [
        nomeUsuario,
        administrador,
      ] = await Promise.all([
        this.autenticacaoService
          .obterNomeUsuario(),

        this.autenticacaoService
          .ehAdministrador(),
      ]);

      this.nomeUsuarioAtual =
        nomeUsuario;

      this.administrador =
        administrador;
    } else {
      this.nomeUsuarioAtual = null;
      this.administrador = false;
    }

    await this.carregarPagina();
  }

  async carregarPagina():
    Promise<void> {
    const id =
      this.obterIdReceita();

    if (!id) {
      await this.router.navigateByUrl(
        '/home',
        {
          replaceUrl: true,
        },
      );

      return;
    }

    this.carregando = true;
    this.mensagemErro = '';

    this.confirmandoExclusaoReceita = false;
    this.mensagemGerenciamentoReceita = '';
    this.mensagemGerenciamentoReceitaErro =
      false;

    try {
      this.receita =
        await this.receitasService
          .obterPorId(id);
    } catch (erro: unknown) {
      if (
        erro instanceof HttpErrorResponse
        && erro.status === 404
      ) {
        this.mensagemErro =
          'A receita não foi encontrada.';
      } else if (
        erro instanceof HttpErrorResponse
        && erro.status === 0
      ) {
        this.mensagemErro =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemErro =
          'Não foi possível carregar a receita.';
      }

      this.receita = null;
    } finally {
      this.carregando = false;
    }

    if (this.receita) {
      await this.carregarComentarios();
    }
  }

  async carregarComentarios():
    Promise<void> {
    const id =
      this.receita?.id
      ?? this.obterIdReceita();

    if (!id) {
      return;
    }

    this.carregandoComentarios = true;
    this.mensagemErroComentarios = '';

    try {
      this.comentarios =
        await this.receitasService
          .listarComentarios(id);
    } catch (erro: unknown) {
      if (
        erro instanceof HttpErrorResponse
        && erro.status === 0
      ) {
        this.mensagemErroComentarios =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemErroComentarios =
          'Não foi possível carregar os comentários.';
      }

      this.comentarios = [];
    } finally {
      this.carregandoComentarios = false;
    }
  }

  selecionarNota(
    nota: number,
  ): void {
    if (
      nota >= 1
      && nota <= 5
      && !this.enviandoComentario
    ) {
      this.notaComentario = nota;
    }
  }

  selecionarNotaEdicao(
    nota: number,
  ): void {
    if (
      nota >= 1
      && nota <= 5
      && this.salvandoComentarioId === null
    ) {
      this.notaEdicaoComentario = nota;
    }
  }

  podeGerenciarComentario(
    comentario: Comentario,
  ): boolean {
    const usuarioEhAutor =
      Boolean(
        this.nomeUsuarioAtual
        && comentario.autor
          === this.nomeUsuarioAtual,
      );

    return Boolean(
      this.autenticado
      && (
        this.administrador
        || usuarioEhAutor
      )
    );
  }

  iniciarEdicao(
    comentario: Comentario,
  ): void {
    if (
      !this.podeGerenciarComentario(comentario)
      || this.salvandoComentarioId !== null
      || this.excluindoComentarioId !== null
    ) {
      return;
    }

    this.confirmandoExclusaoId = null;

    this.comentarioEmEdicaoId =
      comentario.id;

    this.textoEdicaoComentario =
      comentario.texto;

    this.notaEdicaoComentario =
      comentario.nota;

    this.limparMensagemGerenciamento();
  }

  cancelarEdicao(): void {
    if (
      this.salvandoComentarioId !== null
    ) {
      return;
    }

    this.comentarioEmEdicaoId = null;
    this.textoEdicaoComentario = '';
    this.notaEdicaoComentario = 0;
  }

  async salvarEdicaoComentario():
    Promise<void> {
    const comentarioId =
      this.comentarioEmEdicaoId;

    if (
      comentarioId === null
      || this.salvandoComentarioId !== null
    ) {
      return;
    }

    if (!this.autenticado) {
      await this.irParaLogin();

      return;
    }

    const comentario =
      this.comentarios.find(
        (item) =>
          item.id === comentarioId,
      );

    if (
      !comentario
      || !this.podeGerenciarComentario(
        comentario,
      )
    ) {
      return;
    }

    const texto =
      this.textoEdicaoComentario.trim();

    this.limparMensagemGerenciamento();

    if (!texto) {
      this.mensagemGerenciamentoComentario =
        'O comentário não pode ficar vazio.';

      this.mensagemGerenciamentoErro = true;

      return;
    }

    if (
      this.notaEdicaoComentario < 1
      || this.notaEdicaoComentario > 5
    ) {
      this.mensagemGerenciamentoComentario =
        'Escolha uma nota de 1 a 5 estrelas.';

      this.mensagemGerenciamentoErro = true;

      return;
    }

    this.salvandoComentarioId =
      comentarioId;

    try {
      await this.receitasService
        .atualizarComentario(
          comentarioId,
          texto,
          this.notaEdicaoComentario,
        );

      await this.atualizarReceitaEComentarios();

      this.comentarioEmEdicaoId = null;
      this.textoEdicaoComentario = '';
      this.notaEdicaoComentario = 0;

      this.mensagemGerenciamentoComentario =
        'Comentário atualizado com sucesso.';
    } catch (erro: unknown) {
      await this.tratarErroGerenciamento(
        erro,
        'atualizar',
      );
    } finally {
      this.salvandoComentarioId = null;
    }
  }

  solicitarExclusao(
    comentario: Comentario,
  ): void {
    if (
      !this.podeGerenciarComentario(comentario)
      || this.excluindoComentarioId !== null
      || this.salvandoComentarioId !== null
    ) {
      return;
    }

    this.cancelarEdicao();

    this.confirmandoExclusaoId =
      comentario.id;

    this.limparMensagemGerenciamento();
  }

  cancelarExclusao(): void {
    if (
      this.excluindoComentarioId !== null
    ) {
      return;
    }

    this.confirmandoExclusaoId = null;
  }

  async confirmarExclusaoComentario(
    comentarioId: number,
  ): Promise<void> {
    if (
      this.excluindoComentarioId !== null
      || this.confirmandoExclusaoId
        !== comentarioId
    ) {
      return;
    }

    if (!this.autenticado) {
      await this.irParaLogin();

      return;
    }

    const comentario =
      this.comentarios.find(
        (item) =>
          item.id === comentarioId,
      );

    if (
      !comentario
      || !this.podeGerenciarComentario(
        comentario,
      )
    ) {
      return;
    }

    this.limparMensagemGerenciamento();

    this.excluindoComentarioId =
      comentarioId;

    try {
      await this.receitasService
        .excluirComentario(
          comentarioId,
        );

      await this.atualizarReceitaEComentarios();

      this.confirmandoExclusaoId = null;

      this.mensagemGerenciamentoComentario =
        'Comentário excluído com sucesso.';
    } catch (erro: unknown) {
      await this.tratarErroGerenciamento(
        erro,
        'excluir',
      );
    } finally {
      this.excluindoComentarioId = null;
    }
  }

  async publicarComentario():
    Promise<void> {
    if (
      !this.receita
      || this.enviandoComentario
    ) {
      return;
    }

    this.mensagemComentario = '';
    this.mensagemComentarioErro = false;

    if (!this.autenticado) {
      await this.irParaLogin();

      return;
    }

    const texto =
      this.textoComentario.trim();

    if (!texto) {
      this.mensagemComentario =
        'Escreva um comentário antes de publicar.';

      this.mensagemComentarioErro = true;

      return;
    }

    if (
      this.notaComentario < 1
      || this.notaComentario > 5
    ) {
      this.mensagemComentario =
        'Escolha uma nota de 1 a 5 estrelas.';

      this.mensagemComentarioErro = true;

      return;
    }

    this.enviandoComentario = true;

    try {
      await this.receitasService
        .criarComentario(
          this.receita.id,
          texto,
          this.notaComentario,
        );

      await this.atualizarReceitaEComentarios();

      this.textoComentario = '';
      this.notaComentario = 0;

      this.mensagemComentario =
        'Comentário publicado com sucesso.';
    } catch (erro: unknown) {
      if (
        erro instanceof HttpErrorResponse
        && erro.status === 401
      ) {
        await this.encerrarSessaoEIrParaLogin();

        return;
      }

      if (
        erro instanceof HttpErrorResponse
        && erro.status === 400
      ) {
        this.mensagemComentario =
          'Confira o texto e a nota informados.';
      } else if (
        erro instanceof HttpErrorResponse
        && erro.status === 0
      ) {
        this.mensagemComentario =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemComentario =
          'Não foi possível publicar o comentário.';
      }

      this.mensagemComentarioErro = true;
    } finally {
      this.enviandoComentario = false;
    }
  }

  async alternarFavorito():
    Promise<void> {
    if (
      !this.receita
      || this.alterandoFavorito
    ) {
      return;
    }

    this.mensagemAcao = '';
    this.mensagemAcaoErro = false;

    if (!this.autenticado) {
      await this.irParaLogin();

      return;
    }

    this.alterandoFavorito = true;

    try {
      const resposta =
        await this.receitasService
          .alternarFavorito(
            this.receita.id,
          );

      this.receita = {
        ...this.receita,
        favoritada_pelo_usuario:
          resposta.favoritada,
      };

      this.mensagemAcao =
        resposta.mensagem;
    } catch (erro: unknown) {
      if (
        erro instanceof HttpErrorResponse
        && erro.status === 401
      ) {
        await this.encerrarSessaoEIrParaLogin();

        return;
      }

      if (
        erro instanceof HttpErrorResponse
        && erro.status === 0
      ) {
        this.mensagemAcao =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemAcao =
          'Não foi possível alterar o favorito.';
      }

      this.mensagemAcaoErro = true;
    } finally {
      this.alterandoFavorito = false;
    }
  }

  podeGerenciarReceita(): boolean {
    const usuarioEhAutor =
      Boolean(
        this.receita
        && this.nomeUsuarioAtual
        && this.receita.autor
          === this.nomeUsuarioAtual,
      );

    return Boolean(
      this.autenticado
      && this.receita
      && (
        this.administrador
        || usuarioEhAutor
      )
    );
  }

  async irParaEdicaoReceita():
    Promise<void> {
    if (
      !this.receita
      || !this.podeGerenciarReceita()
    ) {
      return;
    }

    await this.router.navigate(
      [
        '/receitas',
        this.receita.id,
        'editar',
      ],
    );
  }

  solicitarExclusaoReceita(): void {
    if (
      !this.podeGerenciarReceita()
      || this.excluindoReceita
    ) {
      return;
    }

    this.confirmandoExclusaoReceita = true;

    this.mensagemGerenciamentoReceita = '';
    this.mensagemGerenciamentoReceitaErro =
      false;
  }

  cancelarExclusaoReceita(): void {
    if (this.excluindoReceita) {
      return;
    }

    this.confirmandoExclusaoReceita = false;
  }

  async confirmarExclusaoReceita():
    Promise<void> {
    if (
      !this.receita
      || !this.podeGerenciarReceita()
      || this.excluindoReceita
    ) {
      return;
    }

    this.excluindoReceita = true;

    this.mensagemGerenciamentoReceita = '';
    this.mensagemGerenciamentoReceitaErro =
      false;

    try {
      await this.receitasService
        .excluirReceita(
          this.receita.id,
        );

      await this.router.navigateByUrl(
        '/home',
        {
          replaceUrl: true,
        },
      );
    } catch (erro: unknown) {
      if (
        erro instanceof HttpErrorResponse
        && erro.status === 401
      ) {
        await this.encerrarSessaoEIrParaLogin();

        return;
      }

      if (
        erro instanceof HttpErrorResponse
        && erro.status === 403
      ) {
        this.mensagemGerenciamentoReceita =
          'Você não possui permissão para excluir esta receita.';
      } else if (
        erro instanceof HttpErrorResponse
        && erro.status === 404
      ) {
        this.mensagemGerenciamentoReceita =
          'A receita não foi encontrada.';
      } else if (
        erro instanceof HttpErrorResponse
        && erro.status === 0
      ) {
        this.mensagemGerenciamentoReceita =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemGerenciamentoReceita =
          'Não foi possível excluir a receita.';
      }

      this.mensagemGerenciamentoReceitaErro =
        true;
    } finally {
      this.excluindoReceita = false;
    }
  }

  async irParaLogin(): Promise<void> {
    await this.router.navigate(
      ['/login'],
      {
        queryParams: {
          retorno: this.router.url,
        },
      },
    );
  }

  private async atualizarReceitaEComentarios():
    Promise<void> {
    if (!this.receita) {
      return;
    }

    const receitaId =
      this.receita.id;

    const [
      receitaAtualizada,
      comentariosAtualizados,
    ] = await Promise.all([
      this.receitasService.obterPorId(
        receitaId,
      ),

      this.receitasService.listarComentarios(
        receitaId,
      ),
    ]);

    this.receita =
      receitaAtualizada;

    this.comentarios =
      comentariosAtualizados;
  }

  private limparMensagemGerenciamento():
    void {
    this.mensagemGerenciamentoComentario = '';
    this.mensagemGerenciamentoErro = false;
  }

  private async tratarErroGerenciamento(
    erro: unknown,
    acao: 'atualizar' | 'excluir',
  ): Promise<void> {
    if (
      erro instanceof HttpErrorResponse
      && erro.status === 401
    ) {
      await this.encerrarSessaoEIrParaLogin();

      return;
    }

    if (
      erro instanceof HttpErrorResponse
      && erro.status === 403
    ) {
      this.mensagemGerenciamentoComentario =
        'Você não tem permissão para alterar este comentário.';
    } else if (
      erro instanceof HttpErrorResponse
      && erro.status === 404
    ) {
      this.mensagemGerenciamentoComentario =
        'O comentário não foi encontrado.';
    } else if (
      erro instanceof HttpErrorResponse
      && erro.status === 400
    ) {
      this.mensagemGerenciamentoComentario =
        'Confira o texto e a nota informados.';
    } else if (
      erro instanceof HttpErrorResponse
      && erro.status === 0
    ) {
      this.mensagemGerenciamentoComentario =
        'Não foi possível conectar ao servidor Django.';
    } else {
      this.mensagemGerenciamentoComentario =
        acao === 'atualizar'
          ? 'Não foi possível atualizar o comentário.'
          : 'Não foi possível excluir o comentário.';
    }

    this.mensagemGerenciamentoErro = true;
  }

  private async encerrarSessaoEIrParaLogin():
    Promise<void> {
    await this.autenticacaoService.sair();

    this.autenticado = false;
    this.administrador = false;
    this.nomeUsuarioAtual = null;

    await this.irParaLogin();
  }

  private obterIdReceita():
    number | null {
    const idTexto =
      this.rota.snapshot.paramMap.get('id');

    const id =
      Number(idTexto);

    if (
      !idTexto
      || Number.isNaN(id)
      || id <= 0
    ) {
      return null;
    }

    return id;
  }
}