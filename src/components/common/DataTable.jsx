import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  Box,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  rows,
  onRowClick,
  searchPlaceholder = 'Rechercher...',
  searchFields = [],
  actions,
  defaultSort,
  defaultOrder = 'asc',
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState(defaultSort || '');
  const [order, setOrder] = useState(defaultOrder);

  const handleSort = (field) => {
    const isAsc = orderBy === field && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(field);
  };

  const filtered = useMemo(() => {
    let result = rows;
    if (search && searchFields.length > 0) {
      const s = search.toLowerCase();
      result = result.filter((row) =>
        searchFields.some((field) => String(row[field] || '').toLowerCase().includes(s))
      );
    }
    if (orderBy) {
      result = [...result].sort((a, b) => {
        const aVal = a[orderBy] ?? '';
        const bVal = b[orderBy] ?? '';
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [rows, search, searchFields, orderBy, order]);

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      {/* Search */}
      <Box sx={{ px: 3, py: 2 }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon sx={{ color: '#7E7E7E' }} /></InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 280 }}
        />
      </Box>

      {filtered.length === 0 ? (
        <EmptyState message="Aucun resultat" />
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.field || col.id}>
                      {col.sortable !== false ? (
                        <TableSortLabel
                          active={orderBy === col.field}
                          direction={orderBy === col.field ? order : 'asc'}
                          onClick={() => handleSort(col.field)}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                  {actions && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((row, idx) => (
                  <TableRow
                    key={row.id || idx}
                    hover
                    sx={onRowClick ? { cursor: 'pointer' } : {}}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.field || col.id}>
                        {col.render ? col.render(row) : row[col.field]}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        {actions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Lignes par page"
          />
        </>
      )}
    </Box>
  );
}
