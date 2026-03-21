'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  TEACHER: 'Enseignant',
  STAFF: 'Personnel',
};

// ----------------------------------------------------------------------

export function InstituteFicheTeam({ memberships, searchQuery, onSearch }) {
  const dataFiltered = applyFilter({ inputData: memberships || [], query: searchQuery });

  const notFound = !dataFiltered.length && !!searchQuery;

  return (
    <>
      <Box
        sx={{
          my: 5,
          gap: 2,
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Typography variant="h4">Equipe pedagogique</Typography>

        <TextField
          value={searchQuery}
          onChange={onSearch}
          placeholder="Rechercher un membre..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: { xs: 1, sm: 260 } }}
        />
      </Box>

      {notFound ? (
        <SearchNotFound query={searchQuery} sx={{ py: 10 }} />
      ) : (
        <Box
          sx={{
            gap: 3,
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
          }}
        >
          {dataFiltered.map((membership) => (
            <MemberCard key={membership.id || membership['@id']} membership={membership} />
          ))}
        </Box>
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function MemberCard({ membership }) {
  const user = membership.user || {};
  const firstname = user.firstname || '';
  const lastname = user.lastname || '';
  const fullName = [firstname, lastname].filter(Boolean).join(' ') || '—';
  const roleLabel = ROLE_LABELS[membership.role] || membership.role || '—';

  return (
    <Card
      sx={{
        py: 5,
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Avatar
        alt={fullName}
        src={user.avatar || undefined}
        sx={{ width: 64, height: 64, mb: 3 }}
      >
        {fullName.charAt(0).toUpperCase()}
      </Avatar>

      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        {fullName}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {roleLabel}
      </Typography>
    </Card>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, query }) {
  if (!query) return inputData;

  return inputData.filter((membership) => {
    const user = membership.user || {};
    const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');
    const role = ROLE_LABELS[membership.role] || membership.role || '';

    return [fullName, role].some((field) =>
      field?.toLowerCase().includes(query.toLowerCase())
    );
  });
}
