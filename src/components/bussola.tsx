import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Tocavel } from '@/components/tocavel';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatarDistancia } from '@/lib/formatacao';
import type { Coordenadas } from '@/lib/location';
import type { RestauranteProximo } from '@/lib/restaurantes';
import { anguloMaisProximo, pontoCardeal, rumo } from '@/lib/rumo';

type BussolaProps = {
  origem: Coordenadas;
  destino: RestauranteProximo;
  /** Só lê a bússola do aparelho quando a localização é real (não a posição padrão). */
  usarSensor: boolean;
  onPress: () => void;
};

const DIAMETRO = 112;
const AGULHA = DIAMETRO / 2 - 18;
/** Agulha de bússola de verdade: chega balançando e assenta. */
const MOLA_ENTRADA = { damping: 6, stiffness: 55, mass: 1 };
/** Ao girar o celular, segue firme sem oscilar. */
const MOLA_SEGUIR = { damping: 16, stiffness: 120 };
/** Ignora variações menores que isso (ruído do magnetômetro). */
const LIMIAR_GRAUS = 2;

/**
 * A bússola do app: a agulha aponta para o restaurante recomendado em 1º lugar.
 * Com sensor, o mostrador gira com o celular; sem sensor, o norte fica para cima.
 */
export function Bussola({ origem, destino, usarSensor, onPress }: BussolaProps) {
  const theme = useTheme();
  const alvo = rumo(origem, destino);

  const direcao = useRef(0); // para onde o topo do celular aponta (0 = norte)
  const agulha = useSharedValue(alvo - 200);
  const rosa = useSharedValue(0);
  const ultimoAgulha = useRef(alvo - 200);
  const ultimoRosa = useRef(0);
  const entrou = useRef(false);

  // Entrada (uma vez) e mudanças de destino: agulha gira até o rumo novo.
  useEffect(() => {
    const final = anguloMaisProximo(ultimoAgulha.current, alvo - direcao.current);
    ultimoAgulha.current = final;
    agulha.set(withSpring(final, entrou.current ? MOLA_SEGUIR : MOLA_ENTRADA));
    entrou.current = true;
  }, [alvo, agulha]);

  // Bússola do aparelho (via expo-location, que já corrige para o norte verdadeiro).
  useEffect(() => {
    if (!usarSensor) return;
    let assinatura: Location.LocationSubscription | null = null;
    let ativo = true;
    Location.watchHeadingAsync((leitura) => {
      const graus = leitura.trueHeading >= 0 ? leitura.trueHeading : leitura.magHeading;
      if (graus < 0 || Math.abs(anguloMaisProximo(direcao.current, graus) - direcao.current) < LIMIAR_GRAUS) return;
      direcao.current = graus;
      ultimoRosa.current = anguloMaisProximo(ultimoRosa.current, -graus);
      ultimoAgulha.current = anguloMaisProximo(ultimoAgulha.current, alvo - graus);
      rosa.set(withSpring(ultimoRosa.current, MOLA_SEGUIR));
      agulha.set(withSpring(ultimoAgulha.current, MOLA_SEGUIR));
    })
      .then((s) => {
        if (ativo) assinatura = s;
        else s.remove();
      })
      .catch(() => {}); // sem magnetômetro (emulador, Waydroid): norte fica para cima
    return () => {
      ativo = false;
      assinatura?.remove();
    };
  }, [usarSensor, alvo, agulha, rosa]);

  const estiloAgulha = useAnimatedStyle(() => ({ transform: [{ rotate: `${agulha.get()}deg` }] }));
  const estiloRosa = useAnimatedStyle(() => ({ transform: [{ rotate: `${rosa.get()}deg` }] }));

  const distancia = formatarDistancia(destino.distancia_m);

  return (
    <Tocavel
      escala={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Seu norte agora: ${destino.nome}, a ${distancia}, na direção ${pontoCardeal(alvo)}.`}
      accessibilityHint="Abre os detalhes do restaurante"
      style={[styles.cartao, { backgroundColor: theme.backgroundElement }]}>
      <View
        style={[styles.mostrador, { backgroundColor: theme.backgroundCard, borderColor: theme.primary }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <Animated.View style={[StyleSheet.absoluteFill, estiloRosa]}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((g) => (
            <View key={g} style={[StyleSheet.absoluteFill, styles.raio, { transform: [{ rotate: `${g}deg` }] }]}>
              {g === 0 ? (
                <ThemedText style={[styles.norte, { color: theme.primaryDark }]}>N</ThemedText>
              ) : (
                <View
                  style={[
                    styles.marca,
                    g % 90 === 0 ? styles.marcaGrande : null,
                    { backgroundColor: theme.borderStrong },
                  ]}
                />
              )}
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, styles.centro, estiloAgulha]}>
          <View style={[styles.pontaAlvo, { borderBottomColor: theme.star }]} />
          <View style={[styles.pontaCauda, { borderTopColor: theme.textMuted }]} />
        </Animated.View>
        <View style={[styles.eixo, { backgroundColor: theme.text, borderColor: theme.backgroundCard }]} />
      </View>

      <View style={styles.texto}>
        <ThemedText type="small" themeColor="textSecondary">
          Seu norte agora
        </ThemedText>
        <ThemedText style={styles.nome} numberOfLines={2}>
          {destino.nome}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {[destino.categoria, `a ${distancia}`].filter(Boolean).join(', ')}
        </ThemedText>
      </View>
    </Tocavel>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  mostrador: {
    width: DIAMETRO,
    height: DIAMETRO,
    borderRadius: DIAMETRO / 2,
    borderWidth: 2,
  },
  raio: {
    alignItems: 'center',
    paddingTop: 6,
  },
  norte: {
    fontFamily: Fonts.display,
    fontSize: 15,
    lineHeight: 18,
  },
  marca: {
    width: 2,
    height: 6,
    borderRadius: 1,
  },
  marcaGrande: {
    height: 10,
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Agulha feita de dois triângulos: ponta dourada (destino) e cauda neutra.
  pontaAlvo: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: AGULHA,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pontaCauda: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: AGULHA,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  eixo: {
    position: 'absolute',
    top: DIAMETRO / 2 - 2 - 7,
    left: DIAMETRO / 2 - 2 - 7,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  texto: {
    flex: 1,
    gap: Spacing.half,
  },
  nome: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 26,
  },
});
