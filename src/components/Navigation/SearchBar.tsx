'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  TextField,
  Autocomplete,
  Box,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import type { SearchResult } from '~/lib/data';

function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setOptions(data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    fetchResults(inputValue);
  }, [inputValue, fetchResults]);

  const handleSelect = (
    _event: React.SyntheticEvent,
    value: SearchResult | null,
  ) => {
    if (value) {
      router.push(`/route/${value.id}`);
      setInputValue('');
      setOpen(false);
    }
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      inputValue={inputValue}
      onInputChange={(_, value) => setInputValue(value)}
      onChange={handleSelect}
      options={options}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      noOptionsText={
        inputValue.length < 2
          ? 'Tapez au moins 2 caractères'
          : 'Aucun résultat'
      }
      renderOption={(props, option) => {
        const { key: _, ...restProps } = props;
        return (
          <Box component="li" key={option.id} {...restProps}>
            <Box>
              <Typography variant="body1">{option.name ?? 'Sans nom'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {option.context}
              </Typography>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Rechercher une voie..."
          size="small"
          sx={{
            width: { xs: '100%', sm: 300 },
            bgcolor: 'rgba(255,255,255,0.15)',
            borderRadius: 1,
            '& .MuiOutlinedInput-root': {
              color: 'inherit',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'rgba(255,255,255,0.7)',
              opacity: 1,
            },
          }}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'inherit' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
