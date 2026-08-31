import { describe, it, expect } from 'vitest';
import {
  buildWeatherContext,
  buildReferenceWeatherInfo,
  computeMaxTemperatureToday,
  computeTomorrowForecast,
  getDefaultWeatherDay,
  getWeatherDayLabel,
  type ForecastListItem,
} from './weatherContext';

describe('getDefaultWeatherDay', () => {
  it("retourne 'today' avant le seuil du soir", () => {
    expect(getDefaultWeatherDay(new Date('2026-01-15T18:59:00'))).toBe('today');
  });

  it("retourne 'tomorrow' à partir du seuil du soir (19h)", () => {
    expect(getDefaultWeatherDay(new Date('2026-01-15T19:00:00'))).toBe('tomorrow');
    expect(getDefaultWeatherDay(new Date('2026-01-15T23:30:00'))).toBe('tomorrow');
  });
});

describe('getWeatherDayLabel', () => {
  it('donne le bon libellé pour chaque mode', () => {
    expect(getWeatherDayLabel('today')).toBe('Météo actuelle');
    expect(getWeatherDayLabel('tomorrow')).toBe('Demain matin');
  });
});

function makeForecastItem(isoDate: string, temp: number, description = 'ciel dégagé'): ForecastListItem {
  return {
    dt: new Date(isoDate).getTime() / 1000,
    main: { temp },
    weather: [{ description }],
  };
}

describe('computeMaxTemperatureToday', () => {
  const now = new Date('2026-01-15T10:00:00');

  it("calcule le max parmi les prévisions d'aujourd'hui", () => {
    const list = [
      makeForecastItem('2026-01-15T12:00:00', 18),
      makeForecastItem('2026-01-15T15:00:00', 22),
      makeForecastItem('2026-01-16T09:00:00', 14), // demain, ignoré
    ];
    expect(computeMaxTemperatureToday(list, now)).toBe(22);
  });

  it("retourne null si aucune prévision n'est pour aujourd'hui", () => {
    const list = [makeForecastItem('2026-01-16T09:00:00', 14)];
    expect(computeMaxTemperatureToday(list, now)).toBeNull();
  });
});

describe('computeTomorrowForecast', () => {
  const now = new Date('2026-01-15T20:00:00');

  it('choisit la prévision la plus proche de 8h et calcule le max du lendemain', () => {
    const list = [
      makeForecastItem('2026-01-16T06:00:00', 10, 'brumeux'),
      makeForecastItem('2026-01-16T09:00:00', 12, 'ciel dégagé'),
      makeForecastItem('2026-01-16T15:00:00', 24, 'ensoleillé'),
      makeForecastItem('2026-01-15T21:00:00', 8), // ce soir, ignoré
    ];
    const result = computeTomorrowForecast(list, now);
    expect(result).toEqual({ morningTemp: 12, maxTemp: 24, morningDescription: 'ciel dégagé' });
  });

  it("retourne null si aucune prévision n'est disponible pour demain", () => {
    const list = [makeForecastItem('2026-01-15T21:00:00', 8)];
    expect(computeTomorrowForecast(list, now)).toBeNull();
  });
});

describe('buildWeatherContext', () => {
  describe("mode 'today'", () => {
    it('retourne null si la météo actuelle est absente', () => {
      expect(buildWeatherContext('today', null, 24, null)).toBeNull();
      expect(buildWeatherContext('today', undefined, 24, null)).toBeNull();
    });

    it('ajoute la température max quand elle est notablement plus élevée', () => {
      const result = buildWeatherContext('today', '12°C, ciel dégagé, à Paris', 24, null);
      expect(result).toBe("12°C, ciel dégagé, à Paris (jusqu'à 24°C prévus aujourd'hui)");
    });

    it("n'ajoute rien si l'écart est faible (< 3°C)", () => {
      const result = buildWeatherContext('today', '20°C, ciel dégagé, à Paris', 21, null);
      expect(result).toBe('20°C, ciel dégagé, à Paris');
    });

    it("n'ajoute rien si le max prévu n'est pas disponible", () => {
      const result = buildWeatherContext('today', '12°C, ciel dégagé, à Paris', null, null);
      expect(result).toBe('12°C, ciel dégagé, à Paris');
    });

    it('gère un format météo inattendu sans planter (température non parsable)', () => {
      const result = buildWeatherContext('today', 'Météo indisponible', 24, null);
      expect(result).toBe('Météo indisponible');
    });
  });

  describe("mode 'tomorrow'", () => {
    it("retourne null si aucune prévision n'est disponible pour demain", () => {
      expect(buildWeatherContext('tomorrow', '20°C, ciel dégagé, à Paris', 24, null)).toBeNull();
    });

    it('construit la ligne à partir de la prévision du matin', () => {
      const result = buildWeatherContext('tomorrow', null, null, { morningTemp: 10, maxTemp: 12, morningDescription: 'brumeux' });
      expect(result).toBe('10°C, brumeux');
    });

    it("ajoute le max de la journée quand l'écart avec le matin est notable", () => {
      const result = buildWeatherContext('tomorrow', null, null, { morningTemp: 10, maxTemp: 24, morningDescription: 'brumeux' });
      expect(result).toBe("10°C, brumeux (jusqu'à 24°C dans la journée)");
    });

    it("ignore la météo actuelle et weatherMaxToday (n'utilise que tomorrowForecast)", () => {
      const result = buildWeatherContext('tomorrow', '99°C, canicule, à Paris', 99, { morningTemp: 10, maxTemp: 11, morningDescription: '' });
      expect(result).toBe('10°C');
    });
  });
});

describe('buildReferenceWeatherInfo', () => {
  it("mode 'today' : retourne la météo actuelle telle quelle", () => {
    expect(buildReferenceWeatherInfo('today', '18°C, ciel dégagé, à Paris', null)).toBe('18°C, ciel dégagé, à Paris');
    expect(buildReferenceWeatherInfo('today', null, null)).toBeNull();
  });

  it("mode 'tomorrow' : retourne un format parsable basé sur la prévision du matin", () => {
    const result = buildReferenceWeatherInfo('tomorrow', '18°C, ciel dégagé, à Paris', { morningTemp: 9, maxTemp: 20, morningDescription: '' });
    expect(result).toBe('9°C');
  });

  it("mode 'tomorrow' sans prévision disponible : retourne null (pas la météo actuelle)", () => {
    expect(buildReferenceWeatherInfo('tomorrow', '18°C, ciel dégagé, à Paris', null)).toBeNull();
  });
});
