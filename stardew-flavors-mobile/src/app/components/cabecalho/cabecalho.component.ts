import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
} from '@angular/core';
import {
  Router,
  RouterLink,
} from '@angular/router';
import {
  IonHeader,
  IonToolbar,
} from '@ionic/angular/standalone';

import {
  AutenticacaoService,
} from '../../services/autenticacao';


@Component({
  selector: 'app-cabecalho',
  templateUrl: './cabecalho.component.html',
  styleUrls: ['./cabecalho.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
  ],
})
export class CabecalhoComponent {
  private readonly autenticacaoService =
    inject(AutenticacaoService);

  private readonly router = inject(Router);

  readonly estadoSessao$ =
    this.autenticacaoService.estadoSessao$;

  menuAberto = false;

  alternarMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  async sair(): Promise<void> {
    this.fecharMenu();

    await this.autenticacaoService.sair();

    await this.router.navigateByUrl(
      '/home',
      {
        replaceUrl: true,
      },
    );
  }
}