import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
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
  DadosCriacaoReceita,
  Receita,
  ReceitasService,
} from '../../services/receitas';


@Component({
  selector: 'app-editar-receita',
  templateUrl: './editar-receita.page.html',
  styleUrls: ['./editar-receita.page.scss'],
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
export class EditarReceitaPage
implements OnDestroy {
  @ViewChild('entradaGaleria')
  private entradaGaleria?:
    ElementRef<HTMLInputElement>;

  private readonly rota =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly receitasService =
    inject(ReceitasService);

  private readonly autenticacaoService =
    inject(AutenticacaoService);

  private readonly tamanhoMaximoImagem =
    10 * 1024 * 1024;

  private readonly tiposImagemPermitidos =
    new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);

  receita: Receita | null = null;
  receitaId: number | null = null;

  formulario: DadosCriacaoReceita = {
    titulo: '',
    descricao: '',
    origem: '',
    imagem_url: '',
    ingredientes: '',
    modo_preparo: '',
  };

  arquivoImagem: File | null = null;

  imagemAtual: string | null = null;

  receitaPossuiArquivoAtual = false;

  urlPrevisualizacaoArquivo:
    string | null = null;

  carregando = true;
  salvando = false;

  falhaPrevisualizacao = false;

  mensagemErro = '';
  mensagemErroImagem = '';

  get imagemPrevisualizacao(): string {
    if (this.urlPrevisualizacaoArquivo) {
      return this.urlPrevisualizacaoArquivo;
    }

    if (
      this.receitaPossuiArquivoAtual
      && this.imagemAtual
    ) {
      return this.imagemAtual;
    }

    return this.formulario
      .imagem_url
      .trim();
  }

  get tamanhoArquivoFormatado():
    string {
    if (!this.arquivoImagem) {
      return '';
    }

    const tamanhoMegabytes =
      this.arquivoImagem.size
      / (1024 * 1024);

    if (tamanhoMegabytes >= 1) {
      return `${
        tamanhoMegabytes.toFixed(2)
      } MB`;
    }

    return `${
      (
        this.arquivoImagem.size / 1024
      ).toFixed(0)
    } KB`;
  }

  async ionViewWillEnter():
    Promise<void> {
    const autenticado =
      await this.autenticacaoService
        .estaAutenticado();

    if (!autenticado) {
      await this.irParaLogin();

      return;
    }

    this.receitaId =
      this.obterIdReceita();

    if (!this.receitaId) {
      await this.router.navigateByUrl(
        '/home',
        {
          replaceUrl: true,
        },
      );

      return;
    }

    await this.carregarReceita();
  }

  async carregarReceita():
    Promise<void> {
    if (!this.receitaId) {
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';

    try {
      const receita =
        await this.receitasService
          .obterPorId(
            this.receitaId,
          );

      const [
        nomeUsuario,
        administrador,
      ] = await Promise.all([
        this.autenticacaoService
          .obterNomeUsuario(),

        this.autenticacaoService
          .ehAdministrador(),
      ]);

      const usuarioEhAutor =
        Boolean(
          nomeUsuario
          && receita.autor
            === nomeUsuario,
        );

      if (
        !usuarioEhAutor
        && !administrador
      ) {
        this.mensagemErro =
          'Você não possui permissão para editar esta receita.';

        this.receita = null;

        return;
      }

      this.receita = receita;

      this.receitaPossuiArquivoAtual =
        Boolean(receita.imagem);

      this.imagemAtual =
        this.receitaPossuiArquivoAtual
          ? receita.imagem_exibicao
          : null;

      this.formulario = {
        titulo:
          receita.titulo,

        descricao:
          receita.descricao,

        origem:
          receita.origem ?? '',

        imagem_url:
          receita.imagem_url ?? '',

        ingredientes:
          receita.ingredientes,

        modo_preparo:
          receita.modo_preparo,
      };
    } catch (erro: unknown) {
      await this.tratarErroCarregamento(
        erro,
      );
    } finally {
      this.carregando = false;
    }
  }

  selecionarImagem(
    evento: Event,
  ): void {
    const entrada =
      evento.target as HTMLInputElement;

    const arquivo =
      entrada.files?.[0] ?? null;

    if (!arquivo) {
      return;
    }

    const mensagem =
      this.validarImagem(arquivo);

    if (mensagem) {
      this.mensagemErroImagem =
        mensagem;

      entrada.value = '';

      return;
    }

    this.liberarUrlPrevisualizacao();

    this.arquivoImagem = arquivo;

    this.urlPrevisualizacaoArquivo =
      URL.createObjectURL(
        arquivo,
      );

    this.falhaPrevisualizacao = false;
    this.mensagemErroImagem = '';
  }

  removerNovaImagem(): void {
    this.liberarUrlPrevisualizacao();

    this.arquivoImagem = null;

    this.falhaPrevisualizacao = false;
    this.mensagemErroImagem = '';

    if (this.entradaGaleria) {
      this.entradaGaleria
        .nativeElement
        .value = '';
    }
  }

  alterarUrlImagem(): void {
    if (this.arquivoImagem) {
      return;
    }

    this.falhaPrevisualizacao = false;
    this.mensagemErroImagem = '';
  }

  previsualizacaoCarregada():
    void {
    this.falhaPrevisualizacao = false;
  }

  previsualizacaoFalhou():
    void {
    this.falhaPrevisualizacao = true;

    this.mensagemErroImagem =
      'Não foi possível carregar a imagem.';
  }

  async salvarAlteracoes():
    Promise<void> {
    if (
      this.salvando
      || !this.receitaId
      || !this.receita
    ) {
      return;
    }

    this.mensagemErro = '';

    const titulo =
      this.formulario.titulo.trim();

    const descricao =
      this.formulario.descricao.trim();

    const ingredientes =
      this.formulario.ingredientes.trim();

    const modoPreparo =
      this.formulario
        .modo_preparo
        .trim();

    if (
      !titulo
      || !descricao
      || !ingredientes
      || !modoPreparo
    ) {
      this.mensagemErro =
        'Preencha todos os campos obrigatórios.';

      return;
    }

    this.salvando = true;

    try {
      await this.receitasService
        .atualizarReceita(
          this.receitaId,
          {
            titulo,
            descricao,

            origem:
              this.formulario
                .origem
                .trim(),

            imagem_url:
              this.formulario
                .imagem_url
                .trim(),

            ingredientes,

            modo_preparo:
              modoPreparo,
          },

          this.arquivoImagem,

          !this.receitaPossuiArquivoAtual
            && !this.arquivoImagem,
        );

      this.liberarUrlPrevisualizacao();

      await this.router.navigate(
        [
          '/receitas',
          this.receitaId,
        ],
        {
          replaceUrl: true,
        },
      );
    } catch (erro: unknown) {
      await this.tratarErroSalvamento(
        erro,
      );
    } finally {
      this.salvando = false;
    }
  }

  ngOnDestroy(): void {
    this.liberarUrlPrevisualizacao();
  }

  private validarImagem(
    arquivo: File,
  ): string {
    if (arquivo.size <= 0) {
      return (
        'O arquivo selecionado está vazio.'
      );
    }

    const extensaoValida =
      /\.(jpe?g|png|webp)$/i.test(
        arquivo.name,
      );

    const tipoValido =
      this.tiposImagemPermitidos.has(
        arquivo.type,
      );

    if (
      !tipoValido
      && !extensaoValida
    ) {
      return (
        'Selecione uma imagem JPG, JPEG, PNG ou WEBP.'
      );
    }

    if (
      arquivo.size
      > this.tamanhoMaximoImagem
    ) {
      return (
        'A imagem deve possuir no máximo 10 MB.'
      );
    }

    return '';
  }

  private liberarUrlPrevisualizacao():
    void {
    if (
      !this.urlPrevisualizacaoArquivo
    ) {
      return;
    }

    URL.revokeObjectURL(
      this.urlPrevisualizacaoArquivo,
    );

    this.urlPrevisualizacaoArquivo =
      null;
  }

  private async tratarErroCarregamento(
    erro: unknown,
  ): Promise<void> {
    if (
      erro instanceof HttpErrorResponse
      && erro.status === 404
    ) {
      this.mensagemErro =
        'A receita não foi encontrada.';
    } else if (
      erro instanceof HttpErrorResponse
      && erro.status === 401
    ) {
      await this.autenticacaoService
        .sair();

      await this.irParaLogin();
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
  }

  private async tratarErroSalvamento(
    erro: unknown,
  ): Promise<void> {
    if (
      !(erro instanceof HttpErrorResponse)
    ) {
      this.mensagemErro =
        'Não foi possível atualizar a receita.';

      return;
    }

    if (erro.status === 401) {
      await this.autenticacaoService
        .sair();

      await this.irParaLogin();

      return;
    }

    if (erro.status === 403) {
      this.mensagemErro =
        'Você não possui permissão para editar esta receita.';

      return;
    }

    if (erro.status === 404) {
      this.mensagemErro =
        'A receita não foi encontrada.';

      return;
    }

    if (erro.status === 400) {
      this.mensagemErro =
        this.extrairMensagemErro(
          erro.error,
        );

      return;
    }

    if (erro.status === 413) {
      this.mensagemErro =
        'A imagem enviada é muito grande.';

      return;
    }

    if (erro.status === 0) {
      this.mensagemErro =
        'Não foi possível conectar ao servidor Django.';

      return;
    }

    this.mensagemErro =
      'Não foi possível atualizar a receita.';
  }

  private extrairMensagemErro(
    resposta: unknown,
  ): string {
    if (
      !resposta
      || typeof resposta !== 'object'
    ) {
      return (
        'Verifique os dados informados.'
      );
    }

    const mensagens: string[] = [];

    for (
      const valor
      of Object.values(
        resposta as Record<
          string,
          unknown
        >,
      )
    ) {
      if (Array.isArray(valor)) {
        mensagens.push(
          ...valor.map(
            (item) =>
              String(item),
          ),
        );
      } else if (
        typeof valor === 'string'
      ) {
        mensagens.push(valor);
      }
    }

    return mensagens.length > 0
      ? mensagens.join(' ')
      : 'Verifique os dados informados.';
  }

  private async irParaLogin():
    Promise<void> {
    await this.router.navigate(
      ['/login'],
      {
        queryParams: {
          retorno:
            this.router.url,
        },
      },
    );
  }

  private obterIdReceita():
    number | null {
    const idTexto =
      this.rota.snapshot
        .paramMap
        .get('id');

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