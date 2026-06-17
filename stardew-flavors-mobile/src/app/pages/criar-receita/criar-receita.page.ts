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
  ReceitasService,
} from '../../services/receitas';


@Component({
  selector: 'app-criar-receita',
  templateUrl: './criar-receita.page.html',
  styleUrls: ['./criar-receita.page.scss'],
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
export class CriarReceitaPage implements OnDestroy {
  @ViewChild('entradaGaleria')
  private entradaGaleria?:
    ElementRef<HTMLInputElement>;

  private readonly receitasService =
    inject(ReceitasService);

  private readonly autenticacaoService =
    inject(AutenticacaoService);

  private readonly router =
    inject(Router);

  private readonly tamanhoMaximoImagem =
    10 * 1024 * 1024;

  private readonly tiposImagemPermitidos =
    new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);

  formulario: DadosCriacaoReceita = {
    titulo: '',
    descricao: '',
    origem: '',
    imagem_url: '',
    ingredientes: '',
    modo_preparo: '',
  };

  arquivoImagem: File | null = null;

  urlPrevisualizacaoArquivo: string | null =
    null;

  falhaPrevisualizacao = false;

  salvando = false;

  mensagemErro = '';
  mensagemErroImagem = '';

  get imagemPrevisualizacao(): string {
    return (
      this.urlPrevisualizacaoArquivo
      ?? this.formulario.imagem_url.trim()
    );
  }

  get tamanhoArquivoFormatado(): string {
    if (!this.arquivoImagem) {
      return '';
    }

    const tamanhoEmMegabytes =
      this.arquivoImagem.size
      / (1024 * 1024);

    if (tamanhoEmMegabytes >= 1) {
      return `${tamanhoEmMegabytes.toFixed(2)} MB`;
    }

    const tamanhoEmKilobytes =
      this.arquivoImagem.size / 1024;

    return `${tamanhoEmKilobytes.toFixed(0)} KB`;
  }

  async ionViewWillEnter(): Promise<void> {
    const autenticado =
      await this.autenticacaoService
        .estaAutenticado();

    if (!autenticado) {
      await this.irParaLogin();
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

    const mensagemValidacao =
      this.validarImagem(arquivo);

    if (mensagemValidacao) {
      this.mensagemErroImagem =
        mensagemValidacao;

      entrada.value = '';

      return;
    }

    this.definirArquivoImagem(arquivo);
  }

  alterarUrlImagem(): void {
    if (this.arquivoImagem) {
      return;
    }

    this.falhaPrevisualizacao = false;
    this.mensagemErroImagem = '';
  }

  removerImagem(): void {
    this.liberarUrlPrevisualizacao();

    this.arquivoImagem = null;
    this.formulario.imagem_url = '';

    this.falhaPrevisualizacao = false;
    this.mensagemErroImagem = '';

    this.limparEntradaArquivo();
  }

  previsualizacaoCarregada(): void {
    this.falhaPrevisualizacao = false;
  }

  previsualizacaoFalhou(): void {
    this.falhaPrevisualizacao = true;

    if (this.arquivoImagem) {
      this.mensagemErroImagem =
        'Não foi possível visualizar o arquivo selecionado.';
    } else {
      this.mensagemErroImagem =
        'Não foi possível carregar essa URL de imagem.';
    }
  }

  async enviarFormulario(): Promise<void> {
    if (this.salvando) {
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
      this.formulario.modo_preparo.trim();

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
      const receita =
        await this.receitasService.criarReceita(
          {
            titulo,
            descricao,
            origem:
              this.formulario.origem.trim(),
            imagem_url:
              this.arquivoImagem
                ? ''
                : this.formulario
                    .imagem_url
                    .trim(),
            ingredientes,
            modo_preparo: modoPreparo,
          },
          this.arquivoImagem,
        );

      this.liberarUrlPrevisualizacao();

      await this.router.navigate(
        ['/receitas', receita.id],
      );
    } catch (erro: unknown) {
      await this.tratarErro(erro);
    } finally {
      this.salvando = false;
    }
  }

  ngOnDestroy(): void {
    this.liberarUrlPrevisualizacao();
  }

  private definirArquivoImagem(
    arquivo: File,
  ): void {
    this.liberarUrlPrevisualizacao();

    this.arquivoImagem = arquivo;

    this.urlPrevisualizacaoArquivo =
      URL.createObjectURL(arquivo);

    this.formulario.imagem_url = '';

    this.falhaPrevisualizacao = false;
    this.mensagemErroImagem = '';
  }

  private validarImagem(
    arquivo: File,
  ): string {
    if (arquivo.size <= 0) {
      return 'O arquivo selecionado está vazio.';
    }

    const extensaoValida =
      /\.(jpe?g|png|webp)$/i.test(
        arquivo.name,
      );

    const tipoValido =
      this.tiposImagemPermitidos.has(
        arquivo.type,
      );

    if (!tipoValido && !extensaoValida) {
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
    if (!this.urlPrevisualizacaoArquivo) {
      return;
    }

    URL.revokeObjectURL(
      this.urlPrevisualizacaoArquivo,
    );

    this.urlPrevisualizacaoArquivo = null;
  }

  private limparEntradaArquivo(): void {
    if (this.entradaGaleria) {
      this.entradaGaleria.nativeElement.value =
        '';
    }
  }

  private async tratarErro(
    erro: unknown,
  ): Promise<void> {
    if (!(erro instanceof HttpErrorResponse)) {
      this.mensagemErro =
        'Não foi possível criar a receita.';

      return;
    }

    if (erro.status === 401) {
      await this.autenticacaoService.sair();
      await this.irParaLogin();

      return;
    }

    if (erro.status === 403) {
      this.mensagemErro =
        'Você não possui permissão para criar receitas.';

      return;
    }

    if (erro.status === 400) {
      this.mensagemErro =
        this.extrairMensagemErro(erro.error);

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
      'Não foi possível criar a receita.';
  }

  private extrairMensagemErro(
    resposta: unknown,
  ): string {
    if (
      !resposta
      || typeof resposta !== 'object'
    ) {
      return 'Verifique os dados informados.';
    }

    const mensagens: string[] = [];

    for (
      const valor
      of Object.values(
        resposta as Record<string, unknown>,
      )
    ) {
      if (Array.isArray(valor)) {
        mensagens.push(
          ...valor.map(
            (item) => String(item),
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
          retorno: '/receitas/criar',
        },
      },
    );
  }
}