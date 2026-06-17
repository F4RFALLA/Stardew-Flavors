import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
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
  Receita,
  ReceitasService,
} from '../../services/receitas';


@Component({
  selector: 'app-favoritos',
  templateUrl: './favoritos.page.html',
  styleUrls: ['./favoritos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonSpinner,
    CabecalhoComponent,
  ],
})
export class FavoritosPage {
  private readonly receitasService =
    inject(ReceitasService);

  private readonly autenticacaoService =
    inject(AutenticacaoService);

  private readonly router =
    inject(Router);

  receitas: Receita[] = [];

  carregando = true;
  removendoReceitaId: number | null = null;

  mensagemErro = '';
  mensagemAcao = '';
  mensagemAcaoErro = false;

  async ionViewWillEnter(): Promise<void> {
    const autenticado =
      await this.autenticacaoService.estaAutenticado();

    if (!autenticado) {
      await this.irParaLogin();

      return;
    }

    await this.carregarFavoritos();
  }

  async carregarFavoritos(): Promise<void> {
    this.carregando = true;
    this.mensagemErro = '';

    try {
      this.receitas =
        await this.receitasService.listarFavoritos();
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
        this.mensagemErro =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemErro =
          'Não foi possível carregar seus favoritos.';
      }

      this.receitas = [];
    } finally {
      this.carregando = false;
    }
  }

  async removerFavorito(
    receita: Receita,
  ): Promise<void> {
    if (this.removendoReceitaId !== null) {
      return;
    }

    this.mensagemAcao = '';
    this.mensagemAcaoErro = false;

    this.removendoReceitaId =
      receita.id;

    try {
      const resposta =
        await this.receitasService.alternarFavorito(
          receita.id,
        );

      if (!resposta.favoritada) {
        this.receitas =
          this.receitas.filter(
            (item) => item.id !== receita.id,
          );
      }

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
          'Não foi possível remover a receita dos favoritos.';
      }

      this.mensagemAcaoErro = true;
    } finally {
      this.removendoReceitaId = null;
    }
  }

  private async irParaLogin(): Promise<void> {
    await this.router.navigate(
      ['/login'],
      {
        queryParams: {
          retorno: '/favoritos',
        },
      },
    );
  }

  private async encerrarSessaoEIrParaLogin():
    Promise<void> {
    await this.autenticacaoService.sair();

    await this.irParaLogin();
  }
}