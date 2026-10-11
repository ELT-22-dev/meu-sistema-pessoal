'use client';

import * as React from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { Icons } from '@/components/icons';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { useDebounce } from '@/hooks/use-debounce';

/** Busca com debounce sincronizada com `?search=` na URL. */
export function useSearchParam() {
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [value, setValue] = React.useState(search);
  const debounced = useDebounce(value, 350);

  React.useEffect(() => {
    if (debounced !== search) void setSearch(debounced || null);
  }, [debounced, search, setSearch]);

  return { search, value, setValue };
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Buscar...'
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <InputGroup className='w-full sm:max-w-xs'>
      <InputGroupAddon>
        <Icons.search />
      </InputGroupAddon>
      <InputGroupInput
        type='search'
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
    </InputGroup>
  );
}

/** Filtro de seleção sincronizado com um parâmetro da URL. */
export function useSelectParam(key: string) {
  return useQueryState(key, parseAsString.withDefault(''));
}

export function SelectFilter({
  label,
  value,
  onChange,
  options,
  allLabel = 'Todos'
}: {
  label: string;
  value: string;
  onChange: (v: string | null) => void;
  options: readonly { value: string; label: string }[];
  allLabel?: string;
}) {
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
      className='w-full sm:w-auto'
    >
      <NativeSelectOption value=''>{allLabel}</NativeSelectOption>
      {options.map((o) => (
        <NativeSelectOption key={o.value} value={o.value}>
          {o.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap'>{children}</div>;
}
