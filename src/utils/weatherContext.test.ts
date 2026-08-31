import { describe, it, expect } from 'vitest';
import { buildWeatherContext } from './weatherContext';

describe('buildWeatherContext', () => {
  it('retourne null si la météo actuelle est absente', () => {
    expect(buildWeatherContext(null, 24)).toBeNull();
    expect(buildWeatherContext(undefined, 24)).toBeNull();
  });

  it('ajoute la température max quand elle est notablement plus élevée', () => {
    const result = buildWeatherContext('12°C, ciel dégagé, à Paris', 24);
    expect(result).toBe('12°C, ciel dégagé, à Paris (jusqu\'à 24°C prévus aujourd\'hui)');
  });

  it("n'ajoute rien si l'écart est faible (< 3°C)", () => {
    const result = buildWeatherContext('20°C, ciel dégagé, à Paris', 21);
    expect(result).toBe('20°C, ciel dégagé, à Paris');
  });

  it("n'ajoute rien si le max prévu n'est pas disponible", () => {
    const result = buildWeatherContext('12°C, ciel dégagé, à Paris', null);
    expect(result).toBe('12°C, ciel dégagé, à Paris');
  });

  it("n'ajoute rien si le max prévu est inférieur ou égal à l'actuel", () => {
    const result = buildWeatherContext('24°C, ciel dégagé, à Paris', 20);
    expect(result).toBe('24°C, ciel dégagé, à Paris');
  });

  it('gère un format météo inattendu sans planter (température non parsable)', () => {
    const result = buildWeatherContext('Météo indisponible', 24);
    expect(result).toBe('Météo indisponible');
  });
});
