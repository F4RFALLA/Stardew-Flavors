import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';

import {
  CabecalhoComponent,
} from '../components/cabecalho/cabecalho.component';

import {
  Receita,
  ReceitasService,
} from '../services/receitas';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
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
export class HomePage {
  private readonly receitasService =
    inject(ReceitasService);

  receitas: Receita[] = [];

  busca = '';
  carregando = true;
  mensagemErro = '';

  async ionViewWillEnter(): Promise<void> {
    await this.carregarReceitas();
  }

  async carregarReceitas(): Promise<void> {
    this.carregando = true;
    this.mensagemErro = '';

    try {
      this.receitas =
        await this.receitasService.listar(
          this.busca,
        );
    } catch (erro: unknown) {
      if (
        erro instanceof HttpErrorResponse
        && erro.status === 0
      ) {
        this.mensagemErro =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemErro =
          'Não foi possível carregar as receitas.';
      }

      this.receitas = [];
    } finally {
      this.carregando = false;
    }
  }

  async pesquisar(): Promise<void> {
    await this.carregarReceitas();
  }

  async limparBusca(): Promise<void> {
    this.busca = '';

    await this.carregarReceitas();
  }
}