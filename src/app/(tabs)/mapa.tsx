import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { MapaRestaurantes } from '@/components/mapa-restaurantes';
import { RestauranteCard } from '@/components/restaurante-card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLocalizacao } from '@/lib/location';
import {
  aplicarFiltros,
  buscarCategorias,
  buscarRestaurantesProximos,
  FILTROS_VAZIOS,
  type Categoria,
  type Filtros,
  type RestauranteProximo,
} from '@/lib/restaurantes';
import { BarraFiltros } from '@/components/barra-filtros';

const RAIOS = [
  { label: '1 km', metros: 1000 },
  { label: '2 km', metros: 2000 },
  { label: '5 km', metros: 5000 },
  { label: '10 km', metros: 10_000 },
];

type Visao = 'lista' | 'mapa';
type Resultado = { chave: string; dados: RestauranteProximo[]; erro: string | null };

export default function MapaScreen() {
  const theme = useTheme();
  const { coords, estado: estadoLocalizacao, localizar } = useLocalizacao();
  const [raio, setRaio] = useState(RAIOS[2].metros);
  const [visao, setVisao] = useState<Visao>('lista');
  // O resultado guarda a chave (posição + raio) com que foi buscado; enquanto a chave
  // atual for diferente, a tela está carregando. Evita setState síncrono em efeitos.
  const chave = `${coords.latitude},${coords.longitude},${raio}`;
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarCategorias()
      .then((c) => ativo && setCategorias(c))
      .catch(() => {}); // sem categorias, os chips de categoria só não aparecem
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    // Espera a localização resolver (ok, negada ou erro) antes de buscar.
    if (estadoLocalizacao === 'carregando') return;
    let ativo = true;
    buscarRestaurantesProximos(coords.latitude, coords.longitude, raio)
      .then((dados) => ativo && setResultado({ chave, dados, erro: null }))
      .catch(
        () =>
          ativo &&
          setResultado({ chave, dados: [], erro: 'Não foi possível carregar os restaurantes. Verifique sua conexão.' }),
      );
    return () => {
      ativo = false;
    };
  }, [chave, coords.latitude, coords.longitude, raio, estadoLocalizacao, tentativa]);

  const carregar = useCallback(() => {
    setResultado(null);
    setTentativa((t) => t + 1);
  }, []);

  const carregando = resultado?.chave !== chave;
  const restaurantes = carregando ? [] : aplicarFiltros(resultado.dados, filtros);
  const erro = carregando ? null : resultado.erro;
  const filtrosAtivos = filtros.categoriaId !== null || filtros.faixasPreco.length > 0;

  const avisoLocalizacao =
    estadoLocalizacao === 'negado'
      ? 'Sem permissão de localização. Mostrando o centro de Paulo Afonso.'
      : estadoLocalizacao === 'erro'
        ? 'Não foi possível obter sua localização. Mostrando o centro de Paulo Afonso.'
        : null;

  const cabecalho = (
    <View style={styles.cabecalho}>
      <View style={styles.titulo}>
        <ThemedText type="title">Perto de você</ThemedText>
        <View style={[styles.alternador, { backgroundColor: theme.backgroundElement }]}>
          {(['lista', 'mapa'] as Visao[]).map((v) => (
            <Ionicons
              key={v}
              name={v === 'lista' ? 'list' : 'map'}
              size={22}
              color={visao === v ? theme.onPrimary : theme.textSecondary}
              accessibilityRole="button"
              accessibilityLabel={v === 'lista' ? 'Ver em lista' : 'Ver no mapa'}
              style={[styles.alternadorBotao, visao === v && { backgroundColor: theme.primary }]}
              onPress={() => setVisao(v)}
            />
          ))}
        </View>
      </View>
      <View style={styles.chips}>
        {RAIOS.map((r) => (
          <Chip key={r.metros} label={r.label} selected={raio === r.metros} onPress={() => setRaio(r.metros)} />
        ))}
        <Ionicons
          name={filtrosAtivos ? 'options' : 'options-outline'}
          size={24}
          color={theme.primaryDark}
          accessibilityRole="button"
          accessibilityLabel={mostrarFiltros ? 'Esconder filtros' : 'Mostrar filtros'}
          accessibilityState={{ expanded: mostrarFiltros }}
          style={styles.botaoFiltros}
          onPress={() => setMostrarFiltros((m) => !m)}
        />
      </View>
      {mostrarFiltros ? <BarraFiltros categorias={categorias} filtros={filtros} onChange={setFiltros} /> : null}
      {avisoLocalizacao ? (
        <View style={[styles.aviso, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="location-outline" size={18} color={theme.primaryDark} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.avisoTexto}>
            {avisoLocalizacao}
          </ThemedText>
          <Button title="Tentar" variant="ghost" onPress={localizar} style={styles.avisoBotao} />
        </View>
      ) : null}
    </View>
  );

  let conteudo;
  if (carregando || estadoLocalizacao === 'carregando') {
    conteudo = (
      <View style={styles.centro}>
        <ActivityIndicator color={theme.primary} size="large" />
        <ThemedText themeColor="textSecondary">Procurando restaurantes…</ThemedText>
      </View>
    );
  } else if (erro) {
    conteudo = (
      <View style={styles.centro}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textMuted} />
        <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
          {erro}
        </ThemedText>
        <Button title="Tentar de novo" variant="secondary" onPress={carregar} />
      </View>
    );
  } else if (visao === 'mapa') {
    conteudo = (
      <MapaRestaurantes
        centro={coords}
        raioMetros={raio}
        restaurantes={restaurantes}
        onSelecionar={(r) => router.push(`/restaurante/${r.id}`)}
      />
    );
  } else {
    conteudo = (
      <FlatList
        data={restaurantes}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <RestauranteCard restaurante={item} onPress={() => router.push(`/restaurante/${item.id}`)} />
        )}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        refreshControl={<RefreshControl refreshing={false} onRefresh={carregar} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.centro}>
            <Ionicons name="restaurant-outline" size={48} color={theme.textMuted} />
            <ThemedText themeColor="textSecondary" style={styles.centroTexto}>
              {filtrosAtivos
                ? 'Nenhum restaurante com esses filtros. Tente outra categoria ou preço.'
                : `Nenhum restaurante em ${raio / 1000} km. Tente aumentar o raio.`}
            </ThemedText>
            {filtrosAtivos ? (
              <Button title="Limpar filtros" variant="secondary" onPress={() => setFiltros(FILTROS_VAZIOS)} />
            ) : null}
          </View>
        }
      />
    );
  }

  return (
    <Screen>
      {cabecalho}
      <View style={styles.conteudo}>{conteudo}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alternador: {
    flexDirection: 'row',
    borderRadius: Radius.small,
    padding: Spacing.half,
  },
  alternadorBotao: {
    padding: Spacing.two,
    borderRadius: Radius.small - 2,
    overflow: 'hidden',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.two,
  },
  botaoFiltros: {
    marginLeft: 'auto',
    padding: Spacing.one,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.small,
  },
  avisoTexto: {
    flex: 1,
  },
  avisoBotao: {
    minHeight: 36,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  conteudo: {
    flex: 1,
  },
  lista: {
    paddingBottom: Spacing.four,
    flexGrow: 1,
  },
  separador: {
    height: Spacing.two,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centroTexto: {
    textAlign: 'center',
  },
});
