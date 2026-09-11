import { useEffect, useState } from 'react';

interface CityFieldProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function CityField({ value, onChange, id = 'french-cities' }: CityFieldProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const helpId = `${id}-help`;

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom&limit=20`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`La recherche de villes a échoué (${response.status}).`);
        }
        const communes = await response.json() as Array<{ nom: string }>;
        setSuggestions([...new Set(communes.map((commune) => commune.nom))]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
    if (nextValue.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  return (
    <label>
      Ville
      <input
        value={value}
        required
        list={id}
        placeholder="Rechercher une ville"
        autoComplete="address-level2"
        onChange={(event) => handleChange(event.target.value)}
        aria-describedby={helpId}
      />
      <datalist id={id}>
        {suggestions.map((suggestion) => <option value={suggestion} key={suggestion} />)}
      </datalist>
      <small id={helpId} className="form-hint">
        {isLoading ? 'Recherche des communes…' : 'Saisissez au moins deux lettres pour rechercher une ville française.'}
      </small>
    </label>
  );
}
