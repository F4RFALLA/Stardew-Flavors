import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
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


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage {
  private readonly autenticacaoService =
    inject(AutenticacaoService);

  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  nomeUsuario = '';
  senha = '';
  carregando = false;
  mensagemErro = '';

  async entrar(): Promise<void> {
    this.mensagemErro = '';

    const nomeUsuario = this.nomeUsuario.trim();

    if (!nomeUsuario || !this.senha) {
      this.mensagemErro =
        'Informe o nome de usuário e a senha.';

      return;
    }

    this.carregando = true;

    try {
      await this.autenticacaoService.entrar(
        nomeUsuario,
        this.senha,
      );

      const retorno =
        this.rota.snapshot.queryParamMap.get(
          'retorno',
        );

      const destino =
        this.obterDestinoSeguro(retorno);

      await this.router.navigateByUrl(
        destino,
        {
          replaceUrl: true,
        },
      );
    } catch (erro: unknown) {
      if (
        erro instanceof HttpErrorResponse
        && erro.status === 400
      ) {
        this.mensagemErro =
          'Nome de usuário ou senha inválidos.';
      } else if (
        erro instanceof HttpErrorResponse
        && erro.status === 0
      ) {
        this.mensagemErro =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemErro =
          'Não foi possível realizar o login.';
      }
    } finally {
      this.carregando = false;
    }
  }

  private obterDestinoSeguro(
    retorno: string | null,
  ): string {
    if (
      retorno
      && retorno.startsWith('/')
      && !retorno.startsWith('//')
      && retorno !== '/login'
    ) {
      return retorno;
    }

    return '/home';
  }
}