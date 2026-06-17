import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ActivatedRoute,
  convertToParamMap,
  Router,
} from '@angular/router';

import { LoginPage } from './login.page';

import {
  AutenticacaoService,
  RespostaLogin,
} from '../../services/autenticacao';


describe('LoginPage', () => {
  let componente: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  let autenticacaoServiceMock:
    jasmine.SpyObj<AutenticacaoService>;

  let routerMock:
    jasmine.SpyObj<Router>;

  const respostaLogin: RespostaLogin = {
    token: 'token-de-teste',
    usuario_id: 1,
    nome_usuario: 'gigi',
    administrador: false,
  };

  beforeEach(async () => {
    autenticacaoServiceMock =
      jasmine.createSpyObj<
        AutenticacaoService
      >(
        'AutenticacaoService',
        [
          'entrar',
        ],
      );

    routerMock =
      jasmine.createSpyObj<Router>(
        'Router',
        [
          'navigateByUrl',
        ],
      );

    routerMock.navigateByUrl
      .and.resolveTo(true);

    const rotaMock = {
      snapshot: {
        queryParamMap:
          convertToParamMap({
            retorno: '/favoritos',
          }),
      },
    };

    await TestBed.configureTestingModule({
      imports: [
        LoginPage,
      ],
      providers: [
        {
          provide:
            AutenticacaoService,
          useValue:
            autenticacaoServiceMock,
        },

        {
          provide: Router,
          useValue: routerMock,
        },

        {
          provide: ActivatedRoute,
          useValue: rotaMock,
        },
      ],
    })
      .overrideComponent(
        LoginPage,
        {
          set: {
            template: '',
            imports: [],
          },
        },
      )
      .compileComponents();

    fixture =
      TestBed.createComponent(
        LoginPage,
      );

    componente =
      fixture.componentInstance;

    fixture.detectChanges();
  });

  it('deve criar a página de login', () => {
    expect(componente).toBeTruthy();
  });

  it(
    'deve impedir o login quando os campos estiverem vazios',
    async () => {
      componente.nomeUsuario = '   ';
      componente.senha = '';

      await componente.entrar();

      expect(
        autenticacaoServiceMock.entrar,
      ).not.toHaveBeenCalled();

      expect(
        componente.mensagemErro,
      ).toBe(
        'Informe o nome de usuário e a senha.',
      );

      expect(
        componente.carregando,
      ).toBeFalse();
    },
  );

  it(
    'deve realizar o login e voltar para a página solicitada',
    async () => {
      autenticacaoServiceMock.entrar
        .and.resolveTo(
          respostaLogin,
        );

      componente.nomeUsuario =
        '  gigi  ';

      componente.senha =
        'senha-segura';

      await componente.entrar();

      expect(
        autenticacaoServiceMock.entrar,
      ).toHaveBeenCalledWith(
        'gigi',
        'senha-segura',
      );

      expect(
        routerMock.navigateByUrl,
      ).toHaveBeenCalledWith(
        '/favoritos',
        {
          replaceUrl: true,
        },
      );

      expect(
        componente.mensagemErro,
      ).toBe('');

      expect(
        componente.carregando,
      ).toBeFalse();
    },
  );

  it(
    'deve mostrar erro quando usuário ou senha forem inválidos',
    async () => {
      autenticacaoServiceMock.entrar
        .and.returnValue(
          Promise.reject(
            new HttpErrorResponse({
              status: 400,
              statusText:
                'Bad Request',
            }),
          ),
        );

      componente.nomeUsuario =
        'usuario';

      componente.senha =
        'senha-incorreta';

      await componente.entrar();

      expect(
        componente.mensagemErro,
      ).toBe(
        'Nome de usuário ou senha inválidos.',
      );

      expect(
        routerMock.navigateByUrl,
      ).not.toHaveBeenCalled();

      expect(
        componente.carregando,
      ).toBeFalse();
    },
  );
});