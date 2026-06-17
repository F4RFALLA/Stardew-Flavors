import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { HomePage } from './home.page';

import {
  Receita,
  ReceitasService,
} from '../services/receitas';


describe('HomePage', () => {
  let componente: HomePage;
  let fixture: ComponentFixture<HomePage>;

  let receitasServiceMock:
    jasmine.SpyObj<ReceitasService>;

  const receitaTeste: Receita = {
    id: 1,
    titulo: 'Bolo rosa',
    descricao: 'Receita de teste',
    origem: 'Pelican Town',
    imagem: null,
    imagem_url: '',
    imagem_exibicao: null,
    ingredientes: 'Farinha\nAçúcar',
    modo_preparo: 'Misture e asse.',
    autor: 'gigi',
    media_avaliacoes: 5,
    total_avaliacoes: 1,
    data_publicacao:
      '2026-06-17T12:00:00Z',
    data_atualizacao:
      '2026-06-17T12:00:00Z',
    favoritada_pelo_usuario: false,
  };

  beforeEach(async () => {
    receitasServiceMock =
      jasmine.createSpyObj<
        ReceitasService
      >(
        'ReceitasService',
        [
          'listar',
        ],
      );

    receitasServiceMock.listar
      .and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [
        HomePage,
      ],
      providers: [
        provideRouter([]),

        {
          provide: ReceitasService,
          useValue: receitasServiceMock,
        },
      ],
    })
      .overrideComponent(
        HomePage,
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
        HomePage,
      );

    componente =
      fixture.componentInstance;

    fixture.detectChanges();
  });

  it('deve criar a página Home', () => {
    expect(componente).toBeTruthy();
  });

  it(
    'deve carregar as receitas usando o texto da busca',
    async () => {
      receitasServiceMock.listar
        .and.resolveTo([
          receitaTeste,
        ]);

      componente.busca = 'bolo';

      await componente.carregarReceitas();

      expect(
        receitasServiceMock.listar,
      ).toHaveBeenCalledWith(
        'bolo',
      );

      expect(
        componente.receitas,
      ).toEqual([
        receitaTeste,
      ]);

      expect(
        componente.carregando,
      ).toBeFalse();

      expect(
        componente.mensagemErro,
      ).toBe('');
    },
  );

  it(
    'deve limpar a busca e carregar todas as receitas',
    async () => {
      componente.busca = 'bolo';

      receitasServiceMock.listar
        .and.resolveTo([]);

      await componente.limparBusca();

      expect(
        componente.busca,
      ).toBe('');

      expect(
        receitasServiceMock.listar,
      ).toHaveBeenCalledWith('');
    },
  );

  it(
    'deve mostrar erro quando não conseguir conectar ao Django',
    async () => {
      receitasServiceMock.listar
        .and.returnValue(
          Promise.reject(
            new HttpErrorResponse({
              status: 0,
              statusText:
                'Unknown Error',
            }),
          ),
        );

      await componente.carregarReceitas();

      expect(
        componente.receitas,
      ).toEqual([]);

      expect(
        componente.mensagemErro,
      ).toBe(
        'Não foi possível conectar ao servidor Django.',
      );

      expect(
        componente.carregando,
      ).toBeFalse();
    },
  );
});